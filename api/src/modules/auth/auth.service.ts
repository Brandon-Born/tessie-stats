/**
 * Auth Service
 *
 * @description Handles OAuth flow, token storage, retrieval, and validation
 */

import { Injectable, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { TeslaService } from '../tesla/tesla.service';
import { encrypt, decrypt } from '../../common/utils/encryption.util';
import { AuthStatusDto, StoreTokenResponseDto } from './dto/store-token.dto';
import { AuthUrlResponse } from './dto/callback.dto';
import { TESLA_AUTH_URLS, TESLA_SCOPES } from '../tesla/tesla.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly teslaService: TeslaService
  ) {}

  /**
   * Get the Tesla OAuth authorization URL
   */
  getAuthorizationUrl(): AuthUrlResponse {
    const clientId = this.configService.get<string>('TESLA_CLIENT_ID');
    const redirectUri = this.getCallbackUrl();
    const state = this.generateState();

    if (!clientId) {
      throw new HttpException('Tesla client ID not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: TESLA_SCOPES.join(' '),
      state: state,
    });

    return {
      url: `${TESLA_AUTH_URLS.AUTHORIZE}?${params.toString()}`,
    };
  }

  /**
   * Handle OAuth callback - exchange code for tokens and store
   */
  async handleCallback(code: string): Promise<void> {
    const redirectUri = this.getCallbackUrl();

    try {
      // Exchange authorization code for tokens
      const tokenPair = await this.teslaService.exchangeCodeForTokens(code, redirectUri);

      // Encrypt the refresh token
      const refreshTokenEncryption = encrypt(tokenPair.refreshToken);

      // Encrypt the access token for caching
      const accessTokenEncryption = encrypt(tokenPair.accessToken);

      // Calculate expiry time (subtract 5 minutes for safety buffer)
      const expiresAt = new Date(Date.now() + (tokenPair.expiresIn - 300) * 1000);

      // Check if config already exists
      const existingConfig = await this.prisma.userConfig.findFirst();

      if (existingConfig) {
        // Update existing config
        await this.prisma.userConfig.update({
          where: { id: existingConfig.id },
          data: {
            teslaRefreshTokenEncrypted: refreshTokenEncryption.encrypted,
            encryptionIv: refreshTokenEncryption.iv,
            encryptionTag: refreshTokenEncryption.tag,
            teslaAccessTokenEncrypted: accessTokenEncryption.encrypted,
            accessTokenIv: accessTokenEncryption.iv,
            accessTokenTag: accessTokenEncryption.tag,
            accessTokenExpiresAt: expiresAt,
          },
        });
      } else {
        // Create new config
        await this.prisma.userConfig.create({
          data: {
            teslaRefreshTokenEncrypted: refreshTokenEncryption.encrypted,
            encryptionIv: refreshTokenEncryption.iv,
            encryptionTag: refreshTokenEncryption.tag,
            teslaAccessTokenEncrypted: accessTokenEncryption.encrypted,
            accessTokenIv: accessTokenEncryption.iv,
            accessTokenTag: accessTokenEncryption.tag,
            accessTokenExpiresAt: expiresAt,
          },
        });
      }

      this.logger.log('Tesla OAuth completed successfully');
    } catch (error) {
      this.logger.error('OAuth callback failed', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to complete OAuth flow', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get the callback URL for OAuth redirects
   */
  private getCallbackUrl(): string {
    const baseUrl = this.configService.get<string>('API_BASE_URL') ?? 'http://localhost:3001';
    return `${baseUrl}/api/auth/callback`;
  }

  /**
   * Generate a random state string for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get decrypted refresh token
   */
  async getRefreshToken(): Promise<string> {
    const config = await this.prisma.userConfig.findFirst();

    if (!config) {
      throw new NotFoundException('No Tesla token configured');
    }

    try {
      return decrypt(config.teslaRefreshTokenEncrypted, config.encryptionIv, config.encryptionTag);
    } catch (error) {
      this.logger.error('Failed to decrypt refresh token', error);
      throw new HttpException('Failed to decrypt token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get fresh access token (uses cached token if still valid)
   */
  async getAccessToken(): Promise<string> {
    const config = await this.prisma.userConfig.findFirst();

    if (!config) {
      throw new NotFoundException('No Tesla token configured');
    }

    // Check if we have a cached access token that's still valid
    if (
      config.teslaAccessTokenEncrypted &&
      config.accessTokenIv &&
      config.accessTokenTag &&
      config.accessTokenExpiresAt &&
      config.accessTokenExpiresAt > new Date()
    ) {
      try {
        return decrypt(
          config.teslaAccessTokenEncrypted,
          config.accessTokenIv,
          config.accessTokenTag
        );
      } catch (error) {
        this.logger.warn('Failed to decrypt cached access token, will refresh', error);
        // Fall through to refresh
      }
    }

    // Cached token expired or invalid, refresh it
    const refreshToken = await this.getRefreshToken();
    const tokenPair = await this.teslaService.refreshAccessToken(refreshToken);

    // Encrypt and cache the new access token
    const accessTokenEncryption = encrypt(tokenPair.accessToken);
    const refreshTokenEncryption = encrypt(tokenPair.refreshToken);

    // Calculate expiry time (subtract 5 minutes for safety buffer)
    const expiresAt = new Date(Date.now() + (tokenPair.expiresIn - 300) * 1000);

    await this.prisma.userConfig.updateMany({
      data: {
        teslaRefreshTokenEncrypted: refreshTokenEncryption.encrypted,
        encryptionIv: refreshTokenEncryption.iv,
        encryptionTag: refreshTokenEncryption.tag,
        teslaAccessTokenEncrypted: accessTokenEncryption.encrypted,
        accessTokenIv: accessTokenEncryption.iv,
        accessTokenTag: accessTokenEncryption.tag,
        accessTokenExpiresAt: expiresAt,
      },
    });

    return tokenPair.accessToken;
  }

  /**
   * Check authentication status
   */
  async getAuthStatus(): Promise<AuthStatusDto> {
    const config = await this.prisma.userConfig.findFirst();

    if (!config) {
      return {
        authenticated: false,
        hasToken: false,
        message: 'No Tesla token configured',
      };
    }

    try {
      // Try to get a fresh access token to verify token is valid
      await this.getAccessToken();

      return {
        authenticated: true,
        hasToken: true,
        message: 'Tesla API authentication is active',
      };
    } catch (error) {
      this.logger.warn('Token validation failed', error);

      return {
        authenticated: false,
        hasToken: true,
        message: 'Token is invalid or expired',
      };
    }
  }

  /**
   * Delete stored token
   */
  async deleteToken(): Promise<StoreTokenResponseDto> {
    const config = await this.prisma.userConfig.findFirst();

    if (!config) {
      throw new NotFoundException('No token to delete');
    }

    await this.prisma.userConfig.delete({
      where: { id: config.id },
    });

    this.logger.log('Tesla refresh token deleted');

    return {
      success: true,
      message: 'Token deleted successfully',
    };
  }

  /**
   * Validate login password and generate JWT
   */
  login(password: string): { accessToken: string } {
    const appPassword = this.configService.get<string>('APP_PASSWORD');

    if (!appPassword) {
      this.logger.error('APP_PASSWORD not configured');
      throw new HttpException('Authentication not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (password !== appPassword) {
      this.logger.warn('Invalid login attempt');
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }

    // Generate JWT with a simple payload
    const accessToken = this.jwtService.sign({ sub: 'user', type: 'app' });

    this.logger.log('User logged in successfully');

    return { accessToken };
  }

  /**
   * Generate JWT for internal auth (if needed)
   */
  generateJwt(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}

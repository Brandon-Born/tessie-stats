/**
 * Auth Controller
 *
 * @description REST endpoints for Tesla OAuth and token management
 */

import {
  Controller,
  Get,
  Delete,
  Post,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthStatusDto, StoreTokenResponseDto } from './dto/store-token.dto';
import { AuthUrlResponse, CallbackQueryDto } from './dto/callback.dto';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { AuthScopesResponse } from './dto/scopes.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  /**
   * POST /api/auth/login
   * Authenticate with password and get JWT
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto): LoginResponse {
    const { accessToken } = this.authService.login(loginDto.password);
    return {
      accessToken,
      message: 'Login successful',
    };
  }

  /**
   * GET /api/auth/url
   * Get Tesla OAuth authorization URL (requires app authentication)
   */
  @Get('url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(): AuthUrlResponse {
    return this.authService.getAuthorizationUrl();
  }

  /**
   * GET /api/auth/callback
   * Handle Tesla OAuth callback (public endpoint for OAuth redirect)
   */
  @Get('callback')
  async handleCallback(@Query() query: CallbackQueryDto, @Res() res: Response): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    try {
      await this.authService.handleCallback(query.code);
      res.redirect(`${frontendUrl}/settings?auth=success`);
    } catch {
      res.redirect(`${frontendUrl}/settings?auth=error`);
    }
  }

  /**
   * GET /api/auth/status
   * Check Tesla authentication status (requires app authentication)
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(): Promise<AuthStatusDto> {
    return this.authService.getAuthStatus();
  }

  /**
   * GET /api/auth/scopes
   * Get Tesla OAuth scopes from access token
   */
  @Get('scopes')
  @UseGuards(JwtAuthGuard)
  async getScopes(): Promise<AuthScopesResponse> {
    return this.authService.getTeslaScopes();
  }

  /**
   * DELETE /api/auth/token
   * Disconnect Tesla (remove stored token)
   */
  @Delete('token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async deleteToken(): Promise<StoreTokenResponseDto> {
    return this.authService.deleteToken();
  }
}

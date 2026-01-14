/**
 * Auth Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { TeslaService } from '../tesla/tesla.service';
import * as encryptionUtil from '../../common/utils/encryption.util';

jest.mock('../../common/utils/encryption.util');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    userConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockTeslaService = {
    refreshAccessToken: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        TESLA_CLIENT_ID: 'test-client-id',
        API_BASE_URL: 'http://localhost:3001',
        FRONTEND_URL: 'http://localhost:3000',
        APP_PASSWORD: 'test-password-123',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TeslaService,
          useValue: mockTeslaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthorizationUrl', () => {
    it('should return Tesla OAuth URL', () => {
      const result = service.getAuthorizationUrl();

      expect(result.url).toContain('https://auth.tesla.com/oauth2/v3/authorize');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('redirect_uri=');
    });

    it('should throw if client ID not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => service.getAuthorizationUrl()).toThrow(HttpException);
    });
  });

  describe('handleCallback', () => {
    it('should exchange code for tokens and store them', async () => {
      const mockTokenPair = {
        accessToken: 'access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      mockTeslaService.exchangeCodeForTokens.mockResolvedValue(mockTokenPair);
      (encryptionUtil.encrypt as jest.Mock).mockReturnValue({
        encrypted: 'encrypted-data',
        iv: 'iv-data',
        tag: 'tag-data',
      });
      mockPrismaService.userConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.userConfig.create.mockResolvedValue({});

      await service.handleCallback('auth-code');

      expect(mockTeslaService.exchangeCodeForTokens).toHaveBeenCalledWith(
        'auth-code',
        expect.stringContaining('/api/auth/callback')
      );
      expect(mockPrismaService.userConfig.create).toHaveBeenCalledWith({
        data: {
          teslaRefreshTokenEncrypted: 'encrypted-data',
          encryptionIv: 'iv-data',
          encryptionTag: 'tag-data',
        },
      });
    });

    it('should update existing config if present', async () => {
      const mockTokenPair = {
        accessToken: 'access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      mockTeslaService.exchangeCodeForTokens.mockResolvedValue(mockTokenPair);
      (encryptionUtil.encrypt as jest.Mock).mockReturnValue({
        encrypted: 'encrypted-data',
        iv: 'iv-data',
        tag: 'tag-data',
      });
      mockPrismaService.userConfig.findFirst.mockResolvedValue({ id: 'existing-id' });
      mockPrismaService.userConfig.update.mockResolvedValue({});

      await service.handleCallback('auth-code');

      expect(mockPrismaService.userConfig.update).toHaveBeenCalledWith({
        where: { id: 'existing-id' },
        data: {
          teslaRefreshTokenEncrypted: 'encrypted-data',
          encryptionIv: 'iv-data',
          encryptionTag: 'tag-data',
        },
      });
    });

    it('should throw if code exchange fails', async () => {
      mockTeslaService.exchangeCodeForTokens.mockRejectedValue(
        new HttpException('Invalid code', 401)
      );

      await expect(service.handleCallback('invalid-code')).rejects.toThrow(HttpException);
    });
  });

  describe('getRefreshToken', () => {
    it('should return decrypted refresh token', async () => {
      mockPrismaService.userConfig.findFirst.mockResolvedValue({
        teslaRefreshTokenEncrypted: 'encrypted',
        encryptionIv: 'iv',
        encryptionTag: 'tag',
      });
      (encryptionUtil.decrypt as jest.Mock).mockReturnValue('decrypted-token');

      const result = await service.getRefreshToken();

      expect(result).toBe('decrypted-token');
      expect(encryptionUtil.decrypt).toHaveBeenCalledWith('encrypted', 'iv', 'tag');
    });

    it('should throw NotFoundException if no config exists', async () => {
      mockPrismaService.userConfig.findFirst.mockResolvedValue(null);

      await expect(service.getRefreshToken()).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAuthStatus', () => {
    it('should return authenticated status when token is valid', async () => {
      mockPrismaService.userConfig.findFirst.mockResolvedValue({
        teslaRefreshTokenEncrypted: 'encrypted',
        encryptionIv: 'iv',
        encryptionTag: 'tag',
      });
      (encryptionUtil.decrypt as jest.Mock).mockReturnValue('refresh-token');
      mockTeslaService.refreshAccessToken.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      const result = await service.getAuthStatus();

      expect(result.authenticated).toBe(true);
      expect(result.hasToken).toBe(true);
    });

    it('should return not authenticated if no config exists', async () => {
      mockPrismaService.userConfig.findFirst.mockResolvedValue(null);

      const result = await service.getAuthStatus();

      expect(result.authenticated).toBe(false);
      expect(result.hasToken).toBe(false);
    });
  });

  describe('deleteToken', () => {
    it('should delete stored token', async () => {
      mockPrismaService.userConfig.findFirst.mockResolvedValue({ id: 'config-id' });
      mockPrismaService.userConfig.delete.mockResolvedValue({});

      const result = await service.deleteToken();

      expect(result.success).toBe(true);
      expect(mockPrismaService.userConfig.delete).toHaveBeenCalledWith({
        where: { id: 'config-id' },
      });
    });

    it('should throw NotFoundException if no token exists', async () => {
      mockPrismaService.userConfig.findFirst.mockResolvedValue(null);

      await expect(service.deleteToken()).rejects.toThrow(NotFoundException);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      // Ensure APP_PASSWORD is set for login tests
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          TESLA_CLIENT_ID: 'test-client-id',
          API_BASE_URL: 'http://localhost:3001',
          FRONTEND_URL: 'http://localhost:3000',
          APP_PASSWORD: 'test-password-123',
        };
        return config[key];
      });
    });

    it('should return access token on successful login', () => {
      const mockToken = 'jwt-token-123';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = service.login('test-password-123');

      expect(result).toEqual({ accessToken: mockToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 'user', type: 'app' });
    });

    it('should throw HttpException on incorrect password', () => {
      expect(() => service.login('wrong-password')).toThrow(HttpException);
      expect(() => service.login('wrong-password')).toThrow('Invalid password');
    });

    it('should throw HttpException if APP_PASSWORD not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => service.login('any-password')).toThrow(HttpException);
      expect(() => service.login('any-password')).toThrow('Authentication not configured');
    });
  });
});

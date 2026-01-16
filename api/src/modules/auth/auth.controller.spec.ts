/**
 * Auth Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { HttpException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    getAuthorizationUrl: jest.fn(),
    handleCallback: jest.fn(),
    getAuthStatus: jest.fn(),
    deleteToken: jest.fn(),
    getTeslaScopes: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access token on successful login', () => {
      const loginDto: LoginDto = { password: 'correct-password' };
      const expectedToken = 'jwt-token-123';

      mockAuthService.login.mockReturnValue({ accessToken: expectedToken });

      const result = controller.login(loginDto);

      expect(result).toEqual({
        accessToken: expectedToken,
        message: 'Login successful',
      });
      expect(mockAuthService.login).toHaveBeenCalledWith('correct-password');
    });

    it('should throw HttpException on invalid password', () => {
      const loginDto: LoginDto = { password: 'wrong-password' };

      mockAuthService.login.mockImplementation(() => {
        throw new HttpException('Invalid password', 401);
      });

      expect(() => controller.login(loginDto)).toThrow(HttpException);
      expect(mockAuthService.login).toHaveBeenCalledWith('wrong-password');
    });
  });

  describe('getAuthUrl', () => {
    it('should return authorization URL', () => {
      const expectedUrl = 'https://auth.tesla.com/oauth2/v3/authorize?...';

      mockAuthService.getAuthorizationUrl.mockReturnValue({ url: expectedUrl });

      const result = controller.getAuthUrl();

      expect(result).toEqual({ url: expectedUrl });
      expect(mockAuthService.getAuthorizationUrl).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return authentication status', async () => {
      const expectedStatus = {
        authenticated: true,
        hasToken: true,
        message: 'Tesla API authentication is active',
      };

      mockAuthService.getAuthStatus.mockResolvedValue(expectedStatus);

      const result = await controller.getStatus();

      expect(result).toEqual(expectedStatus);
      expect(mockAuthService.getAuthStatus).toHaveBeenCalled();
    });
  });

  describe('deleteToken', () => {
    it('should delete token successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'Token deleted successfully',
      };

      mockAuthService.deleteToken.mockResolvedValue(expectedResponse);

      const result = await controller.deleteToken();

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.deleteToken).toHaveBeenCalled();
    });
  });

  describe('getScopes', () => {
    it('returns Tesla OAuth scopes', async () => {
      const expectedScopes = { scopes: ['vehicle_device_data'] };
      mockAuthService.getTeslaScopes.mockResolvedValue(expectedScopes);

      const result = await controller.getScopes();

      expect(result).toEqual(expectedScopes);
      expect(mockAuthService.getTeslaScopes).toHaveBeenCalled();
    });
  });
});

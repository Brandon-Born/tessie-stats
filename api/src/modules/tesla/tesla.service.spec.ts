/**
 * Tesla Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TeslaService } from './tesla.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TeslaService', () => {
  let service: TeslaService;

  const defaultConfig: Record<string, string | undefined> = {
    TESLA_REGION: 'NORTH_AMERICA',
    TESLA_CLIENT_ID: 'test-client-id',
    TESLA_CLIENT_SECRET: 'test-client-secret',
  };

  const mockConfigService = {
    get: jest.fn((key: string): string | undefined => defaultConfig[key]),
  };

  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockAxiosInstance = {
    get: mockGet,
    post: mockPost,
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  } as unknown as ReturnType<typeof axios.create>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn(() => mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeslaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TeslaService>(TeslaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await service.refreshAccessToken('old-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
    });

    it('should throw error if credentials not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.refreshAccessToken('token')).rejects.toThrow(
        'Tesla API credentials not configured'
      );
    });

    it('should handle refresh token errors', async () => {
      // Reset mock to return credentials
      mockConfigService.get.mockImplementation(
        (key: string): string | undefined => defaultConfig[key]
      );

      mockPost.mockRejectedValue(new Error('Auth failed'));

      await expect(service.refreshAccessToken('invalid-token')).rejects.toThrow(
        'Failed to refresh Tesla access token'
      );
    });
  });

  describe('getVehicles', () => {
    it('should return list of vehicles', async () => {
      const mockVehicles = [
        {
          id: 12345,
          vehicle_id: 67890,
          vin: 'TEST123456789',
          display_name: 'My Tesla',
          state: 'online',
          in_service: false,
          calendar_enabled: true,
          api_version: 67,
          access_type: 'OWNER',
        },
      ];

      mockGet.mockResolvedValue({
        data: { response: mockVehicles },
      });

      const result = await service.getVehicles('access-token');

      expect(result).toEqual(mockVehicles);
      expect(mockGet).toHaveBeenCalledWith(
        '/api/1/vehicles',
        expect.objectContaining({
          headers: { Authorization: 'Bearer access-token' },
        })
      );
    });
  });

  describe('getVehicleData', () => {
    it('should return vehicle data', async () => {
      const mockVehicleData = {
        id: 12345,
        vehicle_id: 67890,
        vin: 'TEST123456789',
        display_name: 'My Tesla',
        state: 'online',
        charge_state: {
          battery_level: 75,
          battery_range: 230.5,
          charge_rate: 0,
          charger_power: 0,
          charging_state: 'Disconnected',
          est_battery_range: 215.2,
          ideal_battery_range: 290.1,
          usable_battery_level: 74,
          charge_limit_soc: 90,
          charger_voltage: 0,
          charger_actual_current: 0,
        },
      };

      mockGet.mockResolvedValue({
        data: { response: mockVehicleData },
      });

      const result = await service.getVehicleData('access-token', '12345');

      expect(result).toEqual(mockVehicleData);
    });

    it('should include endpoints parameter when provided', async () => {
      mockGet.mockResolvedValue({
        data: { response: {} },
      });

      await service.getVehicleData('access-token', '12345', ['charge_state', 'drive_state']);

      expect(mockGet).toHaveBeenCalledWith(
        '/api/1/vehicles/12345/vehicle_data',
        expect.objectContaining({
          params: { endpoints: 'charge_state,drive_state' },
        })
      );
    });
  });

  describe('getEnergySites', () => {
    it('should filter and return only energy sites', async () => {
      const mockProducts = [
        { id: 1, vehicle_id: 123, vin: 'TEST', display_name: 'Car', state: 'online' },
        { energy_site_id: 456, resource_type: 'battery', site_name: 'Home', id: '456' },
      ];

      mockGet.mockResolvedValue({
        data: { response: mockProducts },
      });

      const result = await service.getEnergySites('access-token');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('energy_site_id');
    });
  });
});

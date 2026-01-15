/**
 * Vehicle Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { VehicleService } from './vehicle.service';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';

describe('VehicleService', () => {
  let service: VehicleService;

  const mockTeslaService = {
    getVehicles: jest.fn(),
    getVehicleData: jest.fn(),
    wakeVehicle: jest.fn(),
  };

  const mockAuthService = {
    executeTeslaCall: jest.fn(),
  };

  const mockPrismaService = {
    vehicleListCache: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    vehicleDataCache: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        {
          provide: TeslaService,
          useValue: mockTeslaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
  });

  describe('getVehicles', () => {
    it('delegates Tesla calls through AuthService', async () => {
      mockPrismaService.vehicleListCache.findUnique.mockResolvedValue(null);
      mockPrismaService.vehicleListCache.upsert.mockResolvedValue({});

      const vehicles = [
        {
          id: 123,
          vehicle_id: 456,
          vin: 'VIN123',
          state: 'online',
        },
      ];

      mockTeslaService.getVehicles.mockResolvedValue(vehicles);
      mockAuthService.executeTeslaCall.mockImplementation(
        (operation: (accessToken: string) => Promise<unknown>) => operation('token-1')
      );

      const result = await service.getVehicles();

      expect(result).toEqual(vehicles);
      expect(mockTeslaService.getVehicles).toHaveBeenCalledTimes(1);
      expect(mockTeslaService.getVehicles).toHaveBeenCalledWith('token-1');
      expect(mockAuthService.executeTeslaCall).toHaveBeenCalledTimes(1);
    });
  });
});

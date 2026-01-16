/**
 * Vehicle Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { VehicleService } from './vehicle.service';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';
import { VehicleHistoryQueryDto } from './dto/vehicle-history.dto';

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
    vehicle: {
      findFirst: jest.fn(),
    },
    vehicleState: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
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

  describe('getVehicleHistory', () => {
    it('returns history rows for a resolved vehicle', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1' });
      mockPrismaService.vehicleState.findMany.mockResolvedValue([
        {
          id: 'state-1',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          latitude: 1,
          longitude: 2,
          heading: 3,
          speed: 4,
          batteryLevel: 80,
          batteryRange: 250,
          usableBatteryLevel: 79,
          chargingState: 'Disconnected',
          chargeRate: 0,
          chargerPower: 0,
          odometer: 1000,
          destinationName: null,
          destinationLatitude: null,
          destinationLongitude: null,
          destinationEta: null,
          destinationDistance: null,
          driverId: null,
          insideTemp: 20,
          outsideTemp: 10,
          isLocked: true,
          sentryMode: false,
          rawData: null,
        },
      ]);

      const query: VehicleHistoryQueryDto = {};
      const result = await service.getVehicleHistory('vehicle-1', query);

      expect(result.vehicleId).toBe('vehicle-1');
      expect(result.history).toHaveLength(1);
      expect(mockPrismaService.vehicleState.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLatestVehicleState', () => {
    it('returns the latest vehicle state snapshot', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1' });
      mockPrismaService.vehicleState.findFirst.mockResolvedValue({
        id: 'state-2',
        timestamp: new Date('2024-01-02T00:00:00Z'),
        latitude: 1,
        longitude: 2,
        heading: 3,
        speed: 4,
        batteryLevel: 80,
        batteryRange: 250,
        usableBatteryLevel: 79,
        chargingState: 'Disconnected',
        chargeRate: 0,
        chargerPower: 0,
        odometer: 1000,
        destinationName: null,
        destinationLatitude: null,
        destinationLongitude: null,
        destinationEta: null,
        destinationDistance: null,
        driverId: null,
        insideTemp: 20,
        outsideTemp: 10,
        isLocked: true,
        sentryMode: false,
        rawData: null,
      });

      const result = await service.getLatestVehicleState('vehicle-1');

      expect(result.id).toBe('state-2');
      expect(mockPrismaService.vehicleState.findFirst).toHaveBeenCalledTimes(1);
    });
  });
});

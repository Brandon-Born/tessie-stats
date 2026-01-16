/**
 * Sync Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../../database/prisma.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { EnergyService } from '../energy/energy.service';

type DeleteManyArgs = { where: { expiresAt: { lt: Date } } };
type DeleteManyResult = { count: number };

describe('SyncService', () => {
  let service: SyncService;

  const mockPrismaService = {
    vehicleDataCache: {
      deleteMany: jest.fn<Promise<DeleteManyResult>, [DeleteManyArgs]>(),
    },
    energyDataCache: {
      deleteMany: jest.fn<Promise<DeleteManyResult>, [DeleteManyArgs]>(),
    },
    vehicleListCache: {
      deleteMany: jest.fn<Promise<DeleteManyResult>, [DeleteManyArgs]>(),
    },
    vehicle: {
      upsert: jest.fn(),
    },
    vehicleState: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    energySite: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    energyState: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    chargingSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    driver: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockVehicleService = {
    getVehicles: jest.fn(),
    getVehicleData: jest.fn(),
  };

  const mockEnergyService = {
    getEnergySites: jest.fn(),
    getEnergySiteData: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: VehicleService,
          useValue: mockVehicleService,
        },
        {
          provide: EnergyService,
          useValue: mockEnergyService,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupExpiredCache', () => {
    it('should delete expired cache entries and return counts', async () => {
      mockPrismaService.vehicleDataCache.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.energyDataCache.deleteMany.mockResolvedValue({ count: 3 });
      mockPrismaService.vehicleListCache.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.cleanupExpiredCache();

      expect(mockPrismaService.vehicleDataCache.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) as unknown as Date } },
      });
      expect(mockPrismaService.energyDataCache.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) as unknown as Date } },
      });
      expect(mockPrismaService.vehicleListCache.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) as unknown as Date } },
      });
      expect(result).toEqual({
        vehicleDataDeleted: 2,
        energyDataDeleted: 3,
        vehicleListDeleted: 1,
      });
    });
  });

  describe('triggerSync', () => {
    it('returns success and updates status', async () => {
      mockPrismaService.vehicleDataCache.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.energyDataCache.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.vehicleListCache.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.driver.findFirst.mockResolvedValue(null);
      mockPrismaService.driver.findMany.mockResolvedValue([]);
      mockVehicleService.getVehicles.mockResolvedValue([]);
      mockPrismaService.energySite.findMany.mockResolvedValue([]);
      mockEnergyService.getEnergySites.mockResolvedValue([]);

      const result = await service.triggerSync();
      const status = service.getSyncStatus();

      expect(result.success).toBe(true);
      expect(status.lastRunStatus).toBe('success');
      expect(status.lastRunAt).toBeInstanceOf(Date);
    });

    it('ingests vehicle and energy snapshots', async () => {
      mockPrismaService.vehicleDataCache.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.energyDataCache.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.vehicleListCache.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.driver.findFirst.mockResolvedValue({ id: 'driver-1' });
      mockPrismaService.driver.findMany.mockResolvedValue([]);

      mockVehicleService.getVehicles.mockResolvedValue([
        {
          id: 123,
          vehicle_id: 456,
          vin: 'VIN123',
          display_name: 'Test Tesla',
          state: 'online',
        },
      ]);
      mockVehicleService.getVehicleData.mockResolvedValue({
        id: 123,
        vehicle_id: 456,
        vin: 'VIN123',
        display_name: 'Test Tesla',
        state: 'online',
        vehicle_state: {
          timestamp: 1704067200000,
          odometer: 1000,
          locked: true,
          sentry_mode: false,
          car_version: '2024.1.0',
          api_version: 75,
        },
        drive_state: {
          gps_as_of: 1704067200,
          heading: 120,
          latitude: 40.0,
          longitude: -74.0,
          native_latitude: 40.0,
          native_longitude: -74.0,
          power: 0,
          shift_state: null,
          speed: 0,
        },
        charge_state: {
          battery_level: 80,
          battery_range: 240,
          charge_rate: 0,
          charger_power: 0,
          charging_state: 'Charging',
          est_battery_range: 230,
          ideal_battery_range: 250,
          usable_battery_level: 79,
          charge_limit_soc: 80,
          charger_voltage: 0,
          charger_actual_current: 0,
        },
        climate_state: {
          inside_temp: 20,
          outside_temp: 10,
          driver_temp_setting: 20,
          passenger_temp_setting: 20,
          is_climate_on: false,
          fan_status: 0,
        },
      });
      mockPrismaService.vehicle.upsert.mockResolvedValue({
        id: 'vehicle-1',
        teslaId: '123',
        vin: 'VIN123',
        displayName: 'Test Tesla',
      });
      mockPrismaService.vehicleState.findFirst.mockResolvedValue(null);
      mockPrismaService.vehicleState.create.mockResolvedValue({});
      mockPrismaService.chargingSession.findFirst.mockResolvedValue(null);
      mockPrismaService.chargingSession.create.mockResolvedValue({});

      mockPrismaService.energySite.findMany.mockResolvedValue([
        { id: 'site-1', teslaSiteId: '987' },
      ]);
      mockEnergyService.getEnergySiteData.mockResolvedValue({
        timestamp: '2024-01-01T00:00:00Z',
        solar_power: 100,
        battery_power: 0,
        grid_power: 10,
        load_power: 110,
        grid_status: 'SystemGridConnected',
        percentage_charged: 80,
      });
      mockPrismaService.energyState.findFirst.mockResolvedValue(null);
      mockPrismaService.energyState.create.mockResolvedValue({});

      const result = await service.triggerSync();

      expect(result.ingestion).toEqual({
        vehiclesSynced: 1,
        vehicleStatesCreated: 1,
        vehiclesSkipped: 0,
        energySitesSynced: 1,
        energyStatesCreated: 1,
        energySitesSkipped: 0,
      });
      expect(mockEnergyService.getEnergySites).not.toHaveBeenCalled();
      expect(mockPrismaService.vehicleState.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            driverId: 'driver-1',
          }) as unknown as { driverId: string },
        }) as unknown as { data: { driverId: string } }
      );
      expect(mockPrismaService.chargingSession.create).toHaveBeenCalled();
    });
  });
});

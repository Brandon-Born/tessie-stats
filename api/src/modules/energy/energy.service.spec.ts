/**
 * Energy Service Unit Tests
 */

import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { TeslaService } from '../tesla/tesla.service';
import { EnergyService } from './energy.service';
import { EnergyHistoryQueryDto } from './dto/energy-history.dto';
import { SolarStatsQueryDto } from './dto/solar-stats.dto';

describe('EnergyService', () => {
  let service: EnergyService;

  const mockTeslaService = {
    getEnergySites: jest.fn(),
    getSiteLiveData: jest.fn(),
  };

  const mockAuthService = {
    executeTeslaCall: jest.fn(),
  };

  const mockPrismaService = {
    energySite: {
      findFirst: jest.fn(),
    },
    energyDaily: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    energyDataCache: {
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
        EnergyService,
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

    service = module.get<EnergyService>(EnergyService);
  });

  describe('getEnergySites', () => {
    it('delegates Tesla calls through AuthService', async () => {
      const sites = [
        {
          energy_site_id: 123,
          site_name: 'Home',
        },
      ];

      mockTeslaService.getEnergySites.mockResolvedValue(sites);
      mockAuthService.executeTeslaCall.mockImplementation(
        (operation: (accessToken: string) => Promise<unknown>) => operation('token-1')
      );

      const result = await service.getEnergySites();

      expect(result).toEqual(sites);
      expect(mockTeslaService.getEnergySites).toHaveBeenCalledTimes(1);
      expect(mockTeslaService.getEnergySites).toHaveBeenCalledWith('token-1');
      expect(mockAuthService.executeTeslaCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEnergyHistory', () => {
    it('returns energy history rows for a site', async () => {
      mockPrismaService.energySite.findFirst.mockResolvedValue({ id: 'site-1' });
      mockPrismaService.energyDaily.findMany.mockResolvedValue([
        {
          date: new Date('2024-01-01'),
          solarProducedKwh: new Prisma.Decimal(10),
          solarToHomeKwh: new Prisma.Decimal(5),
          solarToBatteryKwh: new Prisma.Decimal(3),
          solarToGridKwh: new Prisma.Decimal(2),
          batteryChargedKwh: new Prisma.Decimal(4),
          batteryDischargedKwh: new Prisma.Decimal(1),
          gridImportedKwh: new Prisma.Decimal(0.5),
          gridExportedKwh: new Prisma.Decimal(0.2),
          homeConsumedKwh: new Prisma.Decimal(6),
          selfConsumptionPct: new Prisma.Decimal(60),
          solarOffsetPct: new Prisma.Decimal(40),
        },
      ]);

      const query: EnergyHistoryQueryDto = { period: 'day' };
      const result = await service.getEnergyHistory('site-1', query);

      expect(result.siteId).toBe('site-1');
      expect(result.points).toHaveLength(1);
    });
  });

  describe('getSolarStats', () => {
    it('aggregates solar stats from daily data', async () => {
      mockPrismaService.energyDaily.aggregate.mockResolvedValue({
        _sum: {
          solarProducedKwh: new Prisma.Decimal(100),
          solarToHomeKwh: new Prisma.Decimal(50),
          solarToBatteryKwh: new Prisma.Decimal(20),
          solarToGridKwh: new Prisma.Decimal(30),
          homeConsumedKwh: new Prisma.Decimal(80),
        },
        _avg: {
          selfConsumptionPct: new Prisma.Decimal(75),
          solarOffsetPct: new Prisma.Decimal(55),
        },
        _count: { _all: 10 },
      });

      const query: SolarStatsQueryDto = {};
      const result = await service.getSolarStats(query);

      expect(result.days).toBe(10);
      expect(result.totalSolarProducedKwh).toBe(100);
    });
  });
});

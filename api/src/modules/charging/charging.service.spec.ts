/**
 * Charging Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ChargingService } from './charging.service';
import { PrismaService } from '../../database/prisma.service';

describe('ChargingService', () => {
  let service: ChargingService;

  const mockPrismaService = {
    vehicle: {
      findFirst: jest.fn(),
    },
    chargingSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChargingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChargingService>(ChargingService);
  });

  it('lists charging sessions', async () => {
    mockPrismaService.chargingSession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        vehicleId: 'vehicle-1',
        startedAt: new Date('2024-01-01T00:00:00Z'),
        endedAt: null,
        durationMinutes: 20,
        startBatteryLevel: 50,
        endBatteryLevel: 60,
        energyAddedKwh: new Prisma.Decimal(10),
        chargeRateKwAvg: new Prisma.Decimal(7),
        chargeRateKwMax: new Prisma.Decimal(9),
        chargerType: 'home',
        chargerName: 'Wall Connector',
        locationName: 'Home',
        latitude: new Prisma.Decimal(37.0),
        longitude: new Prisma.Decimal(-122.0),
        cost: new Prisma.Decimal(3.5),
        costCurrency: 'USD',
        solarEnergyKwh: new Prisma.Decimal(2),
        solarPercentage: new Prisma.Decimal(20),
        status: 'completed',
        vehicle: {
          id: 'vehicle-1',
          teslaId: '123',
          vin: 'VIN123',
          displayName: 'Model 3',
        },
      },
    ]);

    const result = await service.getChargingSessions({});

    expect(result).toHaveLength(1);
    const session = result[0];
    if (!session) {
      throw new Error('Expected charging session result');
    }
    expect(session.vehicle?.displayName).toBe('Model 3');
  });

  it('returns charging stats', async () => {
    mockPrismaService.chargingSession.aggregate.mockResolvedValue({
      _count: { _all: 2 },
      _sum: {
        energyAddedKwh: new Prisma.Decimal(20),
        cost: new Prisma.Decimal(6),
        durationMinutes: 40,
        solarEnergyKwh: new Prisma.Decimal(4),
      },
      _avg: {
        chargeRateKwAvg: new Prisma.Decimal(8),
      },
    });

    const result = await service.getChargingStats({});

    expect(result.sessionCount).toBe(2);
    expect(result.totalEnergyAddedKwh).toBe(20);
    expect(result.averageCostPerKwh).toBeCloseTo(0.3);
  });
});

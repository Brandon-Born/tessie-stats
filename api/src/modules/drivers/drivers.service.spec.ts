/**
 * Drivers Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { DriversService } from './drivers.service';
import { PrismaService } from '../../database/prisma.service';

describe('DriversService', () => {
  let service: DriversService;

  const mockPrismaService = {
    driver: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    vehicleState: {
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
  });

  it('lists drivers', async () => {
    mockPrismaService.driver.findMany.mockResolvedValue([
      {
        id: 'driver-1',
        name: 'Alex',
        profileId: null,
        isPrimary: true,
        avatarUrl: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      },
    ]);

    const result = await service.getDrivers();

    expect(result).toHaveLength(1);
    const driver = result[0];
    if (!driver) {
      throw new Error('Expected driver result');
    }
    expect(driver.name).toBe('Alex');
  });

  it('returns driver stats', async () => {
    mockPrismaService.driver.findUnique.mockResolvedValue({ id: 'driver-1' });
    mockPrismaService.vehicleState.aggregate.mockResolvedValue({
      _min: { odometer: new Prisma.Decimal(100), timestamp: new Date('2024-01-01T00:00:00Z') },
      _max: { odometer: new Prisma.Decimal(150), timestamp: new Date('2024-01-02T00:00:00Z') },
      _count: { _all: 5 },
    });

    const result = await service.getDriverStats('driver-1');

    expect(result.totalDrivingRecords).toBe(5);
    expect(result.totalDistanceMiles).toBe(50);
  });
});

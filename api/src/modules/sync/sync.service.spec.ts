/**
 * Sync Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../../database/prisma.service';

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

      const result = await service.triggerSync();
      const status = service.getSyncStatus();

      expect(result.success).toBe(true);
      expect(status.lastRunStatus).toBe('success');
      expect(status.lastRunAt).toBeInstanceOf(Date);
    });
  });
});

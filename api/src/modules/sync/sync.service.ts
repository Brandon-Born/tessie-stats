/**
 * Sync Service
 *
 * @description Scheduled maintenance jobs for Vercel cron
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CacheCleanupResult {
  vehicleDataDeleted: number;
  energyDataDeleted: number;
  vehicleListDeleted: number;
}

export interface SyncStatusState {
  lastRunAt: Date | null;
  lastRunStatus: 'never' | 'success' | 'failed';
  lastRunMessage: string | null;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private status: SyncStatusState = {
    lastRunAt: null,
    lastRunStatus: 'never',
    lastRunMessage: null,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clean up expired cache entries.
   *
   * @returns counts of deleted rows by cache table
   */
  async cleanupExpiredCache(): Promise<CacheCleanupResult> {
    const now = new Date();
    const [vehicleData, energyData, vehicleList] = await Promise.all([
      this.prisma.vehicleDataCache.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      this.prisma.energyDataCache.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      this.prisma.vehicleListCache.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    const result: CacheCleanupResult = {
      vehicleDataDeleted: vehicleData.count,
      energyDataDeleted: energyData.count,
      vehicleListDeleted: vehicleList.count,
    };

    this.logger.log(
      `Cache cleanup completed: vehicles=${result.vehicleDataDeleted}, energy=${result.energyDataDeleted}, vehicleList=${result.vehicleListDeleted}`
    );

    return result;
  }

  /**
   * Run maintenance sync (currently cache cleanup only)
   */
  async triggerSync(): Promise<{
    success: boolean;
    message: string;
    cleanup?: CacheCleanupResult;
  }> {
    try {
      const cleanup = await this.cleanupExpiredCache();
      this.status = {
        lastRunAt: new Date(),
        lastRunStatus: 'success',
        lastRunMessage: 'Cache cleanup completed',
      };

      return {
        success: true,
        message: 'Cache cleanup completed',
        cleanup,
      };
    } catch (error) {
      this.logger.error('Manual sync failed', error);
      this.status = {
        lastRunAt: new Date(),
        lastRunStatus: 'failed',
        lastRunMessage: 'Cache cleanup failed',
      };

      return {
        success: false,
        message: 'Cache cleanup failed',
      };
    }
  }

  /**
   * Get last sync status
   */
  getSyncStatus(): SyncStatusState {
    return this.status;
  }
}

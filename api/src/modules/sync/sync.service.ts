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

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

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
}

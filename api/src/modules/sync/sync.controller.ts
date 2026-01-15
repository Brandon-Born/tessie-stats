/**
 * Sync Controller
 *
 * @description Vercel Cron endpoint for scheduled maintenance
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  /**
   * GET /api/sync/cron
   * Vercel Cron endpoint - called every 5 minutes
   *
   * Current implementation:
   * - Clean up expired cache entries
   */
  @Get('cron')
  async handleCron(): Promise<{
    success: boolean;
    message: string;
    cleanup?: {
      vehicleDataDeleted: number;
      energyDataDeleted: number;
      vehicleListDeleted: number;
    };
  }> {
    try {
      this.logger.log('Vercel cron triggered: cache cleanup starting');
      const cleanup = await this.syncService.cleanupExpiredCache();
      this.logger.log(
        `Cache cleanup completed: vehicles=${cleanup.vehicleDataDeleted}, energy=${cleanup.energyDataDeleted}, vehicleList=${cleanup.vehicleListDeleted}`
      );
      return {
        success: true,
        message: 'Cache cleanup completed',
        cleanup,
      };
    } catch (error) {
      this.logger.error('Cache cleanup failed', error);
      return {
        success: false,
        message: 'Cache cleanup failed',
      };
    }
  }
}

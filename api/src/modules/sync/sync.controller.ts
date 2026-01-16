/**
 * Sync Controller
 *
 * @description Vercel Cron endpoint for scheduled maintenance
 */

import { Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService } from '@/modules/sync/sync.service';
import { SyncStatusResponse, SyncTriggerResponse } from '@/modules/sync/dto/sync.dto';

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
  async handleCron(): Promise<SyncTriggerResponse> {
    this.logger.log('Vercel cron triggered: cache cleanup starting');
    const result = await this.syncService.triggerSync();
    return result;
  }

  /**
   * POST /api/sync/trigger
   * Manually trigger maintenance sync
   */
  @Post('trigger')
  @UseGuards(JwtAuthGuard)
  async triggerSync(): Promise<SyncTriggerResponse> {
    return this.syncService.triggerSync();
  }

  /**
   * GET /api/sync/status
   * Get last sync status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(): SyncStatusResponse {
    const status = this.syncService.getSyncStatus();
    return {
      lastRunAt: status.lastRunAt ? status.lastRunAt.toISOString() : null,
      lastRunStatus: status.lastRunStatus,
      lastRunMessage: status.lastRunMessage,
    };
  }
}

/**
 * Sync Controller (Stub)
 *
 * @description Placeholder for Vercel Cron sync endpoint
 * TODO: Implement actual sync logic
 */

import { Controller, Get } from '@nestjs/common';

@Controller('sync')
export class SyncController {
  /**
   * GET /api/sync/cron
   * Vercel Cron endpoint - called every 5 minutes
   *
   * TODO: Implement sync logic:
   * - Fetch latest vehicle states
   * - Fetch latest energy data
   * - Store in database
   */
  @Get('cron')
  handleCron(): { success: boolean; message: string } {
    // Stub implementation - returns success to prevent Vercel errors
    return {
      success: true,
      message: 'Sync endpoint not yet implemented',
    };
  }
}

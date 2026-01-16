/**
 * Sync DTOs
 *
 * @description Data transfer objects for sync endpoints
 */

import { CacheCleanupResult } from '../sync.service';

export interface SyncStatusResponse {
  lastRunAt: string | null;
  lastRunStatus: 'never' | 'success' | 'failed';
  lastRunMessage: string | null;
}

export interface SyncTriggerResponse {
  success: boolean;
  message: string;
  cleanup?: CacheCleanupResult;
}

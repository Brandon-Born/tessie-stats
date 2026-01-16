/**
 * Sync Service
 *
 * @description Frontend service for sync endpoints
 */

import { apiClient } from '@/services/api';

export interface SyncTriggerResponse {
  success: boolean;
  message: string;
  cleanup?: {
    vehicleDataDeleted: number;
    energyDataDeleted: number;
    vehicleListDeleted: number;
  };
  ingestion?: {
    vehiclesSynced: number;
    vehicleStatesCreated: number;
    vehiclesSkipped: number;
    energySitesSynced: number;
    energyStatesCreated: number;
    energySitesSkipped: number;
  };
}

export const syncService = {
  async triggerSync(): Promise<SyncTriggerResponse> {
    const response = await apiClient.get<SyncTriggerResponse>('/sync/cron');
    return response.data;
  },
};

/**
 * Energy Service
 *
 * @description Frontend service for Powerwall/Solar API calls
 */

import { apiClient } from '@/services/api';
import type { EnergySiteResponse, EnergySiteData } from '@/types';

export const energyService = {
  /**
   * Get list of all energy sites
   */
  async getEnergySites(): Promise<EnergySiteResponse[]> {
    const response = await apiClient.get<EnergySiteResponse[]>('/energy/sites');
    return response.data;
  },

  /**
   * Get live energy site data
   */
  async getEnergySiteData(siteId: string): Promise<EnergySiteData> {
    const response = await apiClient.get<EnergySiteData>(`/energy/sites/${siteId}`);
    return response.data;
  },
};

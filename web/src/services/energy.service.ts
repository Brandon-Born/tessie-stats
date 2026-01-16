/**
 * Energy Service
 *
 * @description Frontend service for Powerwall/Solar API calls
 */

import { apiClient } from '@/services/api';
import type {
  EnergySiteResponse,
  EnergySiteData,
  EnergyHistoryResponse,
  SolarStatsResponse,
} from '@/types';

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

  async getEnergyHistory(
    siteId: string,
    query: { period?: 'day' | 'week' | 'month' | 'year' | 'lifetime'; startDate?: string; endDate?: string } = {}
  ): Promise<EnergyHistoryResponse> {
    const response = await apiClient.get<EnergyHistoryResponse>(`/energy/sites/${siteId}/history`, {
      params: query,
    });
    return response.data;
  },

  async getSolarStats(query: { siteId?: string; startDate?: string; endDate?: string } = {}): Promise<SolarStatsResponse> {
    const response = await apiClient.get<SolarStatsResponse>('/energy/solar/stats', {
      params: query,
    });
    return response.data;
  },
};

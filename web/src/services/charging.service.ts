/**
 * Charging Service
 *
 * @description Frontend service for charging API calls
 */

import { apiClient } from '@/services/api';
import type { ChargingSessionResponse, ChargingStatsResponse, ChargingSessionStatus } from '@/types';

export interface ChargingSessionsQuery {
  vehicleId?: string;
  status?: ChargingSessionStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface ChargingStatsQuery {
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
}

export const chargingService = {
  async getChargingSessions(query: ChargingSessionsQuery = {}): Promise<ChargingSessionResponse[]> {
    const response = await apiClient.get<ChargingSessionResponse[]>('/charging/sessions', {
      params: query,
    });
    return response.data;
  },

  async getChargingStats(query: ChargingStatsQuery = {}): Promise<ChargingStatsResponse> {
    const response = await apiClient.get<ChargingStatsResponse>('/charging/stats', {
      params: query,
    });
    return response.data;
  },
};

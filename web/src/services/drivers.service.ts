/**
 * Drivers Service
 *
 * @description Frontend service for driver API calls
 */

import { apiClient } from '@/services/api';
import type { DriverResponse, DriverStatsResponse } from '@/types';

export const driversService = {
  async getDrivers(): Promise<DriverResponse[]> {
    const response = await apiClient.get<DriverResponse[]>('/drivers');
    return response.data;
  },

  async getDriverStats(driverId: string): Promise<DriverStatsResponse> {
    const response = await apiClient.get<DriverStatsResponse>(`/drivers/${driverId}/stats`);
    return response.data;
  },
};

/**
 * Vehicle Service
 *
 * @description Frontend service for vehicle API calls
 */

import { apiClient } from '@/services/api';
import { TeslaVehicle, VehicleData, VehicleStateResponse } from '@/types';

export const vehicleService = {
  /**
   * Get list of all vehicles
   */
  async getVehicles(): Promise<TeslaVehicle[]> {
    const response = await apiClient.get<TeslaVehicle[]>('/vehicles');
    return response.data;
  },

  /**
   * Get detailed vehicle data
   */
  async getVehicleData(
    vehicleId: string,
    options: { forceFresh?: boolean } = {}
  ): Promise<VehicleData> {
    const response = await apiClient.get<VehicleData>(`/vehicles/${vehicleId}`, {
      params: options.forceFresh ? { forceFresh: true } : undefined,
    });
    return response.data;
  },

  /**
   * Clear cache for a specific vehicle
   */
  async clearVehicleCache(vehicleId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/vehicles/${vehicleId}/cache`);
    return response.data;
  },

  /**
   * Get latest stored vehicle state snapshot
   */
  async getVehicleState(vehicleId: string): Promise<VehicleStateResponse> {
    const response = await apiClient.get<VehicleStateResponse>(`/vehicles/${vehicleId}/state`);
    return response.data;
  },

  /**
   * Wake up a vehicle
   */
  async wakeVehicle(vehicleId: string): Promise<{ state: string }> {
    const response = await apiClient.post<{ state: string }>(`/vehicles/${vehicleId}/wake`);
    return response.data;
  },
};

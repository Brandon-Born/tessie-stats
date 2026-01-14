/**
 * Vehicle Service
 *
 * @description Frontend service for vehicle API calls
 */

import { apiClient } from '@/services/api';
import { TeslaVehicle, VehicleData } from '@/types';

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
  async getVehicleData(vehicleId: string): Promise<VehicleData> {
    const response = await apiClient.get<VehicleData>(`/vehicles/${vehicleId}`);
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

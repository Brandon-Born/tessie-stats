/**
 * Vehicle Service
 *
 * @description Handles fetching and managing Tesla vehicle data
 */

import { Injectable, Logger } from '@nestjs/common';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { TeslaVehicle, VehicleData } from '../tesla/tesla.types';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    private readonly teslaService: TeslaService,
    private readonly authService: AuthService
  ) {}

  /**
   * Get list of all vehicles
   */
  async getVehicles(): Promise<TeslaVehicle[]> {
    try {
      const accessToken = await this.authService.getAccessToken();
      return await this.teslaService.getVehicles(accessToken);
    } catch (error) {
      this.logger.error('Failed to fetch vehicles', error);
      throw error;
    }
  }

  /**
   * Get detailed vehicle data including battery level
   */
  async getVehicleData(vehicleId: string): Promise<VehicleData> {
    try {
      const accessToken = await this.authService.getAccessToken();
      return await this.teslaService.getVehicleData(accessToken, vehicleId);
    } catch (error) {
      this.logger.error(`Failed to fetch vehicle data for ${vehicleId}`, error);
      throw error;
    }
  }

  /**
   * Wake up a vehicle
   */
  async wakeVehicle(vehicleId: string): Promise<{ state: string }> {
    try {
      const accessToken = await this.authService.getAccessToken();
      return await this.teslaService.wakeVehicle(accessToken, vehicleId);
    } catch (error) {
      this.logger.error(`Failed to wake vehicle ${vehicleId}`, error);
      throw error;
    }
  }
}

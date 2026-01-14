/**
 * Energy Service
 *
 * @description Handles fetching and managing Tesla Powerwall/Solar data
 */

import { Injectable, Logger } from '@nestjs/common';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { EnergySite, LiveEnergyData } from '../tesla/tesla.types';

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);

  constructor(
    private readonly teslaService: TeslaService,
    private readonly authService: AuthService
  ) {}

  /**
   * Get list of all energy sites (Powerwall/Solar)
   */
  async getEnergySites(): Promise<EnergySite[]> {
    try {
      const accessToken = await this.authService.getAccessToken();
      return await this.teslaService.getEnergySites(accessToken);
    } catch (error) {
      this.logger.error('Failed to fetch energy sites', error);
      throw error;
    }
  }

  /**
   * Get live energy site data including battery level
   */
  async getEnergySiteData(siteId: string): Promise<LiveEnergyData> {
    try {
      const accessToken = await this.authService.getAccessToken();
      return await this.teslaService.getSiteLiveData(accessToken, siteId);
    } catch (error) {
      this.logger.error(`Failed to fetch energy site data for ${siteId}`, error);
      throw error;
    }
  }
}

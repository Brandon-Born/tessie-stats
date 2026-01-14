/**
 * Energy Controller
 *
 * @description REST endpoints for Tesla Powerwall/Solar data
 */

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnergySite, LiveEnergyData } from '../tesla/tesla.types';

@Controller('energy')
@UseGuards(JwtAuthGuard)
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  /**
   * GET /api/energy/sites
   * Get list of all energy sites
   */
  @Get('sites')
  async getEnergySites(): Promise<EnergySite[]> {
    return this.energyService.getEnergySites();
  }

  /**
   * GET /api/energy/sites/:id
   * Get live energy site data
   */
  @Get('sites/:id')
  async getEnergySiteData(@Param('id') id: string): Promise<LiveEnergyData> {
    return this.energyService.getEnergySiteData(id);
  }
}

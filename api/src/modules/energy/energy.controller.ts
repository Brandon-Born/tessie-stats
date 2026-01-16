/**
 * Energy Controller
 *
 * @description REST endpoints for Tesla Powerwall/Solar data
 * @implementation Supports forceFresh parameter for cost management
 */

import { Controller, Get, Param, Query, Delete, ParseBoolPipe, UseGuards } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnergySite, LiveEnergyData } from '../tesla/tesla.types';
import { EnergyHistoryQueryDto, EnergyHistoryResponse } from './dto/energy-history.dto';
import { SolarStatsQueryDto, SolarStatsResponse } from './dto/solar-stats.dto';

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
   *
   * @param id - Energy site ID
   * @query forceFresh - Skip cache and fetch fresh data (optional, default: false)
   */
  @Get('sites/:id')
  async getEnergySiteData(
    @Param('id') id: string,
    @Query('forceFresh', new ParseBoolPipe({ optional: true })) forceFresh?: boolean
  ): Promise<LiveEnergyData> {
    return this.energyService.getEnergySiteData(id, forceFresh ?? false);
  }

  /**
   * GET /api/energy/sites/:id/live
   * Alias for live energy site data
   */
  @Get('sites/:id/live')
  async getEnergySiteLiveData(
    @Param('id') id: string,
    @Query('forceFresh', new ParseBoolPipe({ optional: true })) forceFresh?: boolean
  ): Promise<LiveEnergyData> {
    return this.energyService.getEnergySiteData(id, forceFresh ?? false);
  }

  /**
   * GET /api/energy/sites/:id/history
   * Get historical energy data
   */
  @Get('sites/:id/history')
  async getEnergyHistory(
    @Param('id') id: string,
    @Query() query: EnergyHistoryQueryDto
  ): Promise<EnergyHistoryResponse> {
    return this.energyService.getEnergyHistory(id, query);
  }

  /**
   * GET /api/energy/solar/stats
   * Get solar summary statistics
   */
  @Get('solar/stats')
  async getSolarStats(@Query() query: SolarStatsQueryDto): Promise<SolarStatsResponse> {
    return this.energyService.getSolarStats(query);
  }

  /**
   * DELETE /api/energy/sites/:id/cache
   * Clear cache for a specific energy site (useful for debugging)
   */
  @Delete('sites/:id/cache')
  async clearSiteCache(@Param('id') id: string): Promise<{ message: string }> {
    await this.energyService.clearSiteCache(id);
    return { message: `Cache cleared for energy site ${id}` };
  }

  /**
   * DELETE /api/energy/cache/all
   * Clear all energy site caches (useful for debugging)
   */
  @Delete('cache/all')
  async clearAllCaches(): Promise<{ message: string }> {
    await this.energyService.clearAllCaches();
    return { message: 'All energy site caches cleared' };
  }
}

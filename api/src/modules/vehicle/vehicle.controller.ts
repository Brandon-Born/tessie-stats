/**
 * Vehicle Controller
 *
 * @description REST endpoints for Tesla vehicle data
 * @implementation Supports forceFresh parameter for cost management
 */

import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Delete,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeslaVehicle, VehicleData } from '../tesla/tesla.types';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  /**
   * GET /api/vehicles
   * Get list of all vehicles
   *
   * @query forceFresh - Skip cache and fetch fresh data (optional, default: false)
   */
  @Get()
  async getVehicles(
    @Query('forceFresh', new ParseBoolPipe({ optional: true })) forceFresh?: boolean
  ): Promise<TeslaVehicle[]> {
    return this.vehicleService.getVehicles(forceFresh ?? false);
  }

  /**
   * GET /api/vehicles/:id
   * Get detailed vehicle data
   *
   * @param id - Vehicle ID
   * @query forceFresh - Skip cache, wake if needed, and fetch fresh data (optional, default: false)
   *
   * Note: forceFresh=true may wake sleeping vehicles, which drains battery
   */
  @Get(':id')
  async getVehicleData(
    @Param('id') id: string,
    @Query('forceFresh', new ParseBoolPipe({ optional: true })) forceFresh?: boolean
  ): Promise<VehicleData> {
    return this.vehicleService.getVehicleData(id, forceFresh ?? false);
  }

  /**
   * POST /api/vehicles/:id/wake
   * Wake up a vehicle
   *
   * Warning: This uses vehicle battery - use sparingly
   */
  @Post(':id/wake')
  async wakeVehicle(@Param('id') id: string): Promise<{ state: string }> {
    return this.vehicleService.wakeVehicle(id);
  }

  /**
   * DELETE /api/vehicles/:id/cache
   * Clear cache for a specific vehicle (useful for debugging)
   */
  @Delete(':id/cache')
  async clearVehicleCache(@Param('id') id: string): Promise<{ message: string }> {
    await this.vehicleService.clearVehicleCache(id);
    return { message: `Cache cleared for vehicle ${id}` };
  }

  /**
   * DELETE /api/vehicles/cache/all
   * Clear all vehicle caches (useful for debugging)
   */
  @Delete('cache/all')
  async clearAllCaches(): Promise<{ message: string }> {
    await this.vehicleService.clearAllCaches();
    return { message: 'All vehicle caches cleared' };
  }
}

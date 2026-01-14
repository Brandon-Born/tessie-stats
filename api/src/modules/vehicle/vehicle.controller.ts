/**
 * Vehicle Controller
 *
 * @description REST endpoints for Tesla vehicle data
 */

import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
   */
  @Get()
  async getVehicles(): Promise<TeslaVehicle[]> {
    return this.vehicleService.getVehicles();
  }

  /**
   * GET /api/vehicles/:id
   * Get detailed vehicle data
   */
  @Get(':id')
  async getVehicleData(@Param('id') id: string): Promise<VehicleData> {
    return this.vehicleService.getVehicleData(id);
  }

  /**
   * POST /api/vehicles/:id/wake
   * Wake up a vehicle
   */
  @Post(':id/wake')
  async wakeVehicle(@Param('id') id: string): Promise<{ state: string }> {
    return this.vehicleService.wakeVehicle(id);
  }
}

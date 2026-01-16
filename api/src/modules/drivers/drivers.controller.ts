/**
 * Drivers Controller
 *
 * @description REST endpoints for driver management
 */

import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriversService } from './drivers.service';
import {
  CreateDriverDto,
  DriverResponse,
  DriverStatsResponse,
  UpdateDriverDto,
} from './dto/driver.dto';

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  /**
   * GET /api/drivers
   * List drivers
   */
  @Get()
  async getDrivers(): Promise<DriverResponse[]> {
    return this.driversService.getDrivers();
  }

  /**
   * POST /api/drivers
   * Create a driver
   */
  @Post()
  async createDriver(@Body() body: CreateDriverDto): Promise<DriverResponse> {
    return this.driversService.createDriver(body);
  }

  /**
   * PUT /api/drivers/:id
   * Update a driver
   */
  @Put(':id')
  async updateDriver(
    @Param('id') id: string,
    @Body() body: UpdateDriverDto
  ): Promise<DriverResponse> {
    return this.driversService.updateDriver(id, body);
  }

  /**
   * GET /api/drivers/:id/stats
   * Get driver statistics
   */
  @Get(':id/stats')
  async getDriverStats(@Param('id') id: string): Promise<DriverStatsResponse> {
    return this.driversService.getDriverStats(id);
  }
}

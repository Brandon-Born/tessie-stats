/**
 * Charging Controller
 *
 * @description REST endpoints for charging session data
 */

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChargingService } from './charging.service';
import {
  ChargingSessionsQueryDto,
  ChargingSessionResponse,
  ChargingStatsQueryDto,
  ChargingStatsResponse,
} from './dto/charging.dto';

@Controller('charging')
@UseGuards(JwtAuthGuard)
export class ChargingController {
  constructor(private readonly chargingService: ChargingService) {}

  /**
   * GET /api/charging/sessions
   * List charging sessions
   */
  @Get('sessions')
  async getChargingSessions(
    @Query() query: ChargingSessionsQueryDto
  ): Promise<ChargingSessionResponse[]> {
    return this.chargingService.getChargingSessions(query);
  }

  /**
   * GET /api/charging/sessions/:id
   * Get a charging session by ID
   */
  @Get('sessions/:id')
  async getChargingSession(@Param('id') id: string): Promise<ChargingSessionResponse> {
    return this.chargingService.getChargingSessionById(id);
  }

  /**
   * GET /api/charging/stats
   * Get charging statistics
   */
  @Get('stats')
  async getChargingStats(@Query() query: ChargingStatsQueryDto): Promise<ChargingStatsResponse> {
    return this.chargingService.getChargingStats(query);
  }
}

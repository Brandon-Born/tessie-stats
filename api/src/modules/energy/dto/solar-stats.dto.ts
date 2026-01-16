/**
 * Solar Stats DTOs
 *
 * @description Data transfer objects for solar statistics endpoints
 */

import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SolarStatsQueryDto {
  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface SolarStatsResponse {
  siteId: string | null;
  startDate: string | null;
  endDate: string | null;
  days: number;
  totalSolarProducedKwh: number;
  totalSolarToHomeKwh: number;
  totalSolarToBatteryKwh: number;
  totalSolarToGridKwh: number;
  totalHomeConsumedKwh: number;
  averageSelfConsumptionPct: number | null;
  averageSolarOffsetPct: number | null;
}

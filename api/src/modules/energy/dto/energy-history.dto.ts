/**
 * Energy History DTOs
 *
 * @description Data transfer objects for energy history endpoints
 */

import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EnergyHistoryPeriod } from '../../tesla/tesla.types';

export class EnergyHistoryQueryDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month', 'year', 'lifetime'])
  period?: EnergyHistoryPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export interface EnergyHistoryPoint {
  date: string;
  solarProducedKwh: number;
  solarToHomeKwh: number;
  solarToBatteryKwh: number;
  solarToGridKwh: number;
  batteryChargedKwh: number;
  batteryDischargedKwh: number;
  gridImportedKwh: number;
  gridExportedKwh: number;
  homeConsumedKwh: number;
  selfConsumptionPct: number | null;
  solarOffsetPct: number | null;
}

export interface EnergyHistoryResponse {
  siteId: string;
  period: EnergyHistoryPeriod;
  startDate: string | null;
  endDate: string | null;
  points: EnergyHistoryPoint[];
}

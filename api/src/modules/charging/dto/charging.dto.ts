/**
 * Charging DTOs
 *
 * @description Data transfer objects for charging endpoints
 */

import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export type ChargingSessionStatus = 'in_progress' | 'completed' | 'stopped';

export class ChargingSessionsQueryDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsIn(['in_progress', 'completed', 'stopped'])
  status?: ChargingSessionStatus;

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
  @Max(500)
  limit?: number;
}

export class ChargingStatsQueryDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface ChargingSessionVehicle {
  id: string;
  teslaId: string;
  vin: string;
  displayName: string | null;
}

export interface ChargingSessionResponse {
  id: string;
  vehicleId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  startBatteryLevel: number | null;
  endBatteryLevel: number | null;
  energyAddedKwh: number | null;
  chargeRateKwAvg: number | null;
  chargeRateKwMax: number | null;
  chargerType: string | null;
  chargerName: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  cost: number | null;
  costCurrency: string | null;
  solarEnergyKwh: number | null;
  solarPercentage: number | null;
  status: string;
  vehicle?: ChargingSessionVehicle;
}

export interface ChargingStatsResponse {
  sessionCount: number;
  totalEnergyAddedKwh: number;
  totalCost: number;
  totalDurationMinutes: number;
  totalSolarEnergyKwh: number;
  averageChargeRateKw: number | null;
  averageCostPerKwh: number | null;
}

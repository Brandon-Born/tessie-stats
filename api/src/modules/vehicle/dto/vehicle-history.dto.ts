/**
 * Vehicle History DTOs
 *
 * @description Data transfer objects for vehicle history endpoints
 */

import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class VehicleHistoryQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeRaw?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export interface VehicleHistoryItem {
  id: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
  batteryLevel: number | null;
  batteryRange: number | null;
  usableBatteryLevel: number | null;
  chargingState: string | null;
  chargeRate: number | null;
  chargerPower: number | null;
  odometer: number | null;
  destinationName: string | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationEta: string | null;
  destinationDistance: number | null;
  driverId: string | null;
  insideTemp: number | null;
  outsideTemp: number | null;
  isLocked: boolean | null;
  sentryMode: boolean | null;
  rawData?: Record<string, unknown> | null;
}

export interface VehicleHistoryResponse {
  vehicleId: string;
  history: VehicleHistoryItem[];
}

export type VehicleStateResponse = VehicleHistoryItem;

/**
 * Driver DTOs
 *
 * @description Data transfer objects for driver endpoints
 */

import { IsBoolean, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  profileId?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  profileId?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export interface DriverResponse {
  id: string;
  name: string;
  profileId: string | null;
  isPrimary: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriverStatsResponse {
  driverId: string;
  totalDrivingRecords: number;
  totalDistanceMiles: number | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
}

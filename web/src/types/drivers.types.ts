/**
 * Driver Types
 *
 * @description API response types for driver endpoints
 */

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

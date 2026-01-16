/**
 * Charging Types
 *
 * @description API response types for charging endpoints
 */

export type ChargingSessionStatus = 'in_progress' | 'completed' | 'stopped';

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
  status: ChargingSessionStatus;
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

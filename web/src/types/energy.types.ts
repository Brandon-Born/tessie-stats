/**
 * Energy Types
 *
 * @description TypeScript interfaces for Powerwall and Solar data
 * @see docs/TESLA_API.md for API reference
 */

export interface EnergySite {
  id: string;
  teslaSiteId: string;
  siteName: string;
  timeZone: string;
  batteryCount: number;
  totalBatteryCapacityKwh: number;
  solarCapacityKw: number;
}

export type GridStatus = 'Active' | 'Inactive';

export interface EnergyLiveStatus {
  siteId: string;
  timestamp: Date;

  // Power flows (Watts)
  // Positive = consuming/importing
  // Negative = producing/exporting
  solarPowerW: number;
  batteryPowerW: number;
  gridPowerW: number;
  loadPowerW: number;

  // Battery state
  batteryPercentage: number;

  // Grid
  gridStatus: GridStatus;
}

export interface EnergyDistribution {
  // Where solar is going
  solarToHome: number;
  solarToBattery: number;
  solarToGrid: number;

  // Battery flows
  batteryToHome: number;
  gridToBattery: number;

  // Grid flows
  gridToHome: number;
  homeToGrid: number; // Rare, but possible
}

export interface EnergyDailySummary {
  siteId: string;
  date: Date;

  // Production (kWh)
  solarProducedKwh: number;

  // Solar distribution (kWh)
  solarToHomeKwh: number;
  solarToBatteryKwh: number;
  solarToGridKwh: number;

  // Battery (kWh)
  batteryChargedKwh: number;
  batteryDischargedKwh: number;

  // Grid (kWh)
  gridImportedKwh: number;
  gridExportedKwh: number;

  // Home consumption (kWh)
  homeConsumedKwh: number;

  // Calculated metrics
  selfConsumptionPct: number; // % solar used at home
  solarOffsetPct: number; // % home powered by solar
}

export interface SolarStats {
  period: StatsPeriod;
  startDate: Date;
  endDate: Date;

  // Totals
  totalSolarProducedKwh: number;
  totalHomeConsumedKwh: number;
  totalGridImportedKwh: number;
  totalGridExportedKwh: number;

  // Averages
  avgDailySolarKwh: number;
  avgDailyConsumptionKwh: number;

  // Percentages
  selfConsumptionPct: number;
  solarOffsetPct: number;
  gridDependencyPct: number;

  // Vehicle charging
  vehicleChargingKwh: number;
  vehicleChargingFromSolarPct: number;
}

export type StatsPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export interface EnergyHistory {
  siteId: string;
  period: StatsPeriod;
  data: EnergyDailySummary[];
}

/**
 * Tesla API Response Types
 */

export interface EnergySiteResponse {
  energy_site_id: number;
  id: string;
  site_name: string;
  resource_type: 'battery' | 'solar';
  backup_reserve_percent?: number;
  battery_count?: number;
}

export interface EnergySiteData {
  percentage_charged: number;
  battery_power: number;
  load_power: number;
  grid_power: number;
  solar_power: number;
  grid_status: string;
  timestamp: string;
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
  period: 'day' | 'week' | 'month' | 'year' | 'lifetime';
  startDate: string | null;
  endDate: string | null;
  points: EnergyHistoryPoint[];
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

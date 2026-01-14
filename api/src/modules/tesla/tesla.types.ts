/**
 * Tesla API Types
 *
 * @description TypeScript interfaces for Tesla Fleet API responses
 * @see docs/TESLA_API.md for detailed API documentation
 */

/**
 * Token pair from OAuth flow
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Tesla API base response wrapper
 */
export interface TeslaResponse<T> {
  response: T;
  count?: number;
}

/**
 * Vehicle from list endpoint
 */
export interface TeslaVehicle {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: 'online' | 'asleep' | 'offline';
  in_service: boolean;
  calendar_enabled: boolean;
  api_version: number;
  access_type: string;
}

/**
 * Charge state data
 */
export interface ChargeState {
  battery_level: number;
  battery_range: number;
  charge_rate: number;
  charger_power: number;
  charging_state: string;
  est_battery_range: number;
  ideal_battery_range: number;
  usable_battery_level: number;
  charge_limit_soc: number;
  charger_voltage: number;
  charger_actual_current: number;
}

/**
 * Drive state data
 */
export interface DriveState {
  gps_as_of: number;
  heading: number;
  latitude: number;
  longitude: number;
  native_latitude: number;
  native_longitude: number;
  power: number;
  shift_state: string | null;
  speed: number | null;
  active_route_destination?: string;
  active_route_latitude?: number;
  active_route_longitude?: number;
  active_route_traffic_minutes_delay?: number;
}

/**
 * Vehicle state data
 */
export interface VehicleStateData {
  odometer: number;
  locked: boolean;
  car_version: string;
  sentry_mode: boolean;
  api_version: number;
  timestamp: number;
}

/**
 * Climate state data
 */
export interface ClimateState {
  inside_temp: number;
  outside_temp: number;
  driver_temp_setting: number;
  passenger_temp_setting: number;
  is_climate_on: boolean;
  fan_status: number;
}

/**
 * Complete vehicle data
 */
export interface VehicleData {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: string;
  charge_state?: ChargeState;
  drive_state?: DriveState;
  vehicle_state?: VehicleStateData;
  climate_state?: ClimateState;
  gui_settings?: Record<string, unknown>;
  vehicle_config?: Record<string, unknown>;
}

/**
 * Energy site (Powerwall/Solar)
 */
export interface EnergySite {
  energy_site_id: number;
  resource_type: 'battery' | 'solar';
  site_name: string;
  id: string;
  gateway_id?: string;
  energy_left?: number;
  total_pack_energy?: number;
  percentage_charged?: number;
  battery_power?: number;
}

/**
 * Site status response
 */
export interface SiteStatus {
  solar_power: number;
  energy_left: number;
  total_pack_energy: number;
  percentage_charged: number;
  battery_power: number;
}

/**
 * Live energy data
 */
export interface LiveEnergyData {
  timestamp: string;
  solar_power: number;
  battery_power: number;
  grid_power: number;
  load_power: number;
  grid_status: string;
  percentage_charged: number;
}

/**
 * Energy history period
 */
export type EnergyHistoryPeriod = 'day' | 'week' | 'month' | 'year' | 'lifetime';

/**
 * Energy history response
 */
export interface EnergyHistory {
  time_series: Array<{
    timestamp: string;
    solar_energy_exported: number;
    battery_energy_exported: number;
    battery_energy_imported_from_solar: number;
    battery_energy_imported_from_grid: number;
    grid_energy_imported: number;
    grid_energy_exported_from_solar: number;
    grid_energy_exported_from_battery: number;
    consumer_energy_imported_from_solar: number;
    consumer_energy_imported_from_battery: number;
    consumer_energy_imported_from_grid: number;
  }>;
}

/**
 * Tesla API error response
 */
export interface TeslaApiError {
  error: string;
  error_description?: string;
}

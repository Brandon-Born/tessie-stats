/**
 * Vehicle Types
 *
 * @description TypeScript interfaces for Tesla vehicle data
 * @see docs/TESLA_API.md for API reference
 */

export interface Vehicle {
  id: string;
  teslaId: string;
  vin: string;
  displayName: string;
  model: VehicleModel;
  year: number;
  color: string;
}

export type VehicleModel = 'Model S' | 'Model 3' | 'Model X' | 'Model Y' | 'Cybertruck';

export type VehicleState = 'online' | 'asleep' | 'offline';

export type ChargingState = 'Charging' | 'Disconnected' | 'Complete' | 'Stopped' | 'Pending';

export interface VehicleStatus {
  vehicleId: string;
  timestamp: Date;
  state: VehicleState;

  // Location
  latitude: number;
  longitude: number;
  heading: number;
  speed: number | null;

  // Battery
  batteryLevel: number;
  batteryRange: number;
  usableBatteryLevel: number;

  // Charging
  chargingState: ChargingState;
  chargeRate: number;
  chargerPower: number;
  timeToFullCharge: number | null;

  // Odometer
  odometer: number;

  // Navigation
  destinationName: string | null;
  destinationEta: Date | null;
  destinationDistance: number | null;

  // Climate
  insideTemp: number;
  outsideTemp: number;

  // Status
  isLocked: boolean;
  sentryMode: boolean;
}

export interface ChargingSession {
  id: string;
  vehicleId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: 'in_progress' | 'completed' | 'interrupted';

  // Energy
  startBatteryLevel: number;
  endBatteryLevel: number | null;
  energyAddedKwh: number;

  // Charging details
  chargeRateKwAvg: number;
  chargeRateKwMax: number;
  chargerType: ChargerType;
  chargerName: string | null;

  // Location
  locationName: string;
  latitude: number;
  longitude: number;

  // Cost
  cost: number | null;
  costCurrency: string;

  // Solar attribution
  solarPercentage: number | null;
}

export type ChargerType = 'home' | 'supercharger' | 'destination' | 'third_party' | 'other';

/**
 * Tesla API Response Types
 */

export interface TeslaVehicle {
  id: string;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: string;
}

export interface VehicleData {
  id: string;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: string;
  charge_state?: {
    battery_level: number;
    battery_range: number;
    usable_battery_level: number;
    charging_state: string;
    charge_rate: number;
    charger_power: number;
    time_to_full_charge: number;
  };
  drive_state?: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number | null;
  };
  climate_state?: {
    inside_temp: number;
    outside_temp: number;
  };
  vehicle_state?: {
    odometer: number;
    locked: boolean;
    sentry_mode: boolean;
  };
}

export interface VehicleStateResponse {
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
  insideTemp: number | null;
  outsideTemp: number | null;
  isLocked: boolean | null;
  sentryMode: boolean | null;
}

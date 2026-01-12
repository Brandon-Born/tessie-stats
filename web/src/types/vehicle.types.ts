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

export interface Driver {
  id: string;
  name: string;
  profileId: string | null;
  isPrimary: boolean;
  avatarUrl: string | null;
}

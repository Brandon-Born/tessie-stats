# Tesla Fleet API Reference

> ⚠️ **IMPORTANT:** Tesla's API can change. Always verify against the [official documentation](https://developer.tesla.com/docs/fleet-api).

---

## 🔴 CRITICAL: API Calls Are NOT Free

**Every Tesla API call has a cost.** This section outlines our strict policy for API usage.

### Prime Directive: Minimize API Calls

1. **Cache First, Always**
   - Every API response MUST be cached in PostgreSQL with timestamp
   - Check cache BEFORE making any API call
   - Default cache TTL: **2 minutes** (120 seconds)
   - Only bypass cache when user explicitly requests fresh data

2. **Check Wake State Before Multiple Calls**
   - Vehicles sleep after ~15 minutes of inactivity
   - ALWAYS check vehicle state using `/api/1/vehicles` first
   - If vehicle is `asleep` or `offline`:
     - Return cached data, OR
     - Explicitly wake vehicle only if absolutely necessary
   - NEVER make multiple API calls to sleeping vehicles without checking

3. **Batch Operations**
   - Use `endpoints` parameter to request multiple data types in one call
   - Example: `GET /vehicle_data?endpoints=charge_state,drive_state,vehicle_state`
   - Don't make 3 separate calls when 1 batched call will do

4. **Smart Polling Strategy**
   - Active vehicles (driving/charging): Poll every 30-60 seconds
   - Parked vehicles (awake): Poll every 2-5 minutes
   - Sleeping vehicles: Use cached data, don't poll

### Cache Schema

```sql
-- Example cache table structure
CREATE TABLE vehicle_data_cache (
  vehicle_id VARCHAR(50) PRIMARY KEY,
  data JSONB NOT NULL,
  cached_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_cache_expiry ON vehicle_data_cache(expires_at);
```

### Implementation Pattern

```typescript
class VehicleService {
  private readonly CACHE_TTL_SECONDS = 120; // 2 minutes

  async getVehicleData(vehicleId: string, forceFresh = false): Promise<VehicleData> {
    // Step 1: Check cache (unless force fresh)
    if (!forceFresh) {
      const cached = await this.db.query(
        'SELECT data, cached_at FROM vehicle_data_cache WHERE vehicle_id = $1 AND expires_at > NOW()',
        [vehicleId]
      );
      
      if (cached.rows.length > 0) {
        console.log(`Cache hit for vehicle ${vehicleId}`);
        return cached.rows[0].data;
      }
    }

    // Step 2: Check if vehicle is awake (lightweight call)
    const vehicles = await this.teslaApi.getVehicles(); // Cached at API level
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (vehicle.state !== 'online') {
      console.log(`Vehicle ${vehicleId} is ${vehicle.state}`);
      
      // Return stale cache if available
      const staleCache = await this.db.query(
        'SELECT data FROM vehicle_data_cache WHERE vehicle_id = $1',
        [vehicleId]
      );
      
      if (staleCache.rows.length > 0) {
        console.log(`Returning stale cache for sleeping vehicle ${vehicleId}`);
        return staleCache.rows[0].data;
      }
      
      // Only wake if absolutely necessary
      if (forceFresh) {
        console.log(`Waking vehicle ${vehicleId} - API COST INCURRED`);
        await this.teslaApi.wakeVehicle(vehicleId);
        await this.sleep(5000); // Wait for wake
      } else {
        throw new Error(`Vehicle ${vehicleId} is offline and no cache available`);
      }
    }

    // Step 3: Fetch from API (batched endpoints)
    console.log(`Fetching fresh data for vehicle ${vehicleId} - API COST INCURRED`);
    const data = await this.teslaApi.getVehicleData(vehicleId, {
      endpoints: 'charge_state,drive_state,vehicle_state,climate_state'
    });

    // Step 4: Cache the result
    await this.db.query(
      `INSERT INTO vehicle_data_cache (vehicle_id, data, cached_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '${this.CACHE_TTL_SECONDS} seconds')
       ON CONFLICT (vehicle_id) DO UPDATE 
       SET data = $2, cached_at = NOW(), expires_at = NOW() + INTERVAL '${this.CACHE_TTL_SECONDS} seconds'`,
      [vehicleId, JSON.stringify(data)]
    );

    return data;
  }
}
```

---

## API Overview

Tesla Fleet API provides access to vehicle and energy product data. This document covers the endpoints relevant to Tessie Stats.

---

## Authentication

### OAuth 2.0 Flow

Tesla uses OAuth 2.0 for authentication. The app stores a **refresh token** to obtain access tokens as needed.

### Token Endpoints

**Authorization URL:**
```
https://auth.tesla.com/oauth2/v3/authorize
```

**Token URL:**
```
https://auth.tesla.com/oauth2/v3/token
```

### Required Scopes

| Scope | Description |
|-------|-------------|
| `openid` | Required for authentication |
| `offline_access` | Allows refresh token usage |
| `vehicle_device_data` | Read vehicle data |
| `vehicle_cmds` | Send commands (wake) |
| `energy_device_data` | Read Powerwall/Solar data |

### Refresh Token Exchange

```http
POST https://auth.tesla.com/oauth2/v3/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
client_id={client_id}
client_secret={client_secret}
refresh_token={refresh_token}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "new_refresh_token",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

---

## Base URLs

| Region | Base URL |
|--------|----------|
| North America | `https://fleet-api.prd.na.vn.cloud.tesla.com` |
| Europe | `https://fleet-api.prd.eu.vn.cloud.tesla.com` |
| China | `https://fleet-api.prd.cn.vn.cloud.tesla.cn` |

---

## Vehicle Endpoints

### List Vehicles

```http
GET /api/1/vehicles
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "response": [
    {
      "id": 12345678901234567,
      "vehicle_id": 1234567890,
      "vin": "5YJ3E1EA1MF000001",
      "display_name": "My Tesla",
      "state": "online",
      "in_service": false,
      "calendar_enabled": true,
      "api_version": 67,
      "access_type": "OWNER"
    }
  ],
  "count": 1
}
```

### Get Vehicle Data

```http
GET /api/1/vehicles/{id}/vehicle_data
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `endpoints` - Comma-separated list of data endpoints to include

**Available Endpoints:**
- `charge_state`
- `climate_state`
- `drive_state`
- `gui_settings`
- `vehicle_config`
- `vehicle_state`
- `location_data`

**Example Response (abbreviated):**
```json
{
  "response": {
    "id": 12345678901234567,
    "vehicle_id": 1234567890,
    "vin": "5YJ3E1EA1MF000001",
    "display_name": "My Tesla",
    "state": "online",
    "charge_state": {
      "battery_level": 75,
      "battery_range": 230.5,
      "charge_rate": 0,
      "charger_power": 0,
      "charging_state": "Disconnected",
      "est_battery_range": 215.2,
      "ideal_battery_range": 290.1,
      "usable_battery_level": 74
    },
    "drive_state": {
      "gps_as_of": 1704067200,
      "heading": 180,
      "latitude": 37.7749,
      "longitude": -122.4194,
      "native_latitude": 37.7749,
      "native_longitude": -122.4194,
      "power": 0,
      "shift_state": null,
      "speed": null
    },
    "vehicle_state": {
      "odometer": 15234.5,
      "locked": true,
      "car_version": "2024.2.7"
    },
    "climate_state": {
      "inside_temp": 22.5,
      "outside_temp": 18.0
    }
  }
}
```

### Wake Vehicle

```http
POST /api/1/vehicles/{id}/wake_up
Authorization: Bearer {access_token}
```

> ⚠️ **Note:** Waking uses vehicle battery. Use sparingly.

**Response:**
```json
{
  "response": {
    "id": 12345678901234567,
    "state": "online"
  }
}
```

---

## Energy Endpoints (Powerwall)

### List Energy Sites

```http
GET /api/1/products
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "response": [
    {
      "energy_site_id": 1234567890,
      "resource_type": "battery",
      "site_name": "My Home",
      "id": "STE12345678-00001",
      "gateway_id": "1234567-89-A--TG12345678901A",
      "components": {
        "battery": true,
        "solar": true,
        "grid": true,
        "load_meter": true
      }
    }
  ],
  "count": 1
}
```

### Get Site Status

```http
GET /api/1/energy_sites/{site_id}/site_status
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "response": {
    "resource_type": "battery",
    "site_name": "My Home",
    "gateway_id": "1234567-89-A--TG12345678901A",
    "percentage_charged": 85,
    "battery_power": -2500,
    "backup_capable": true
  }
}
```

### Get Live Status (Real-time Power Flow)

```http
GET /api/1/energy_sites/{site_id}/live_status
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "response": {
    "solar_power": 4500,
    "battery_power": -2000,
    "grid_power": 500,
    "load_power": 3000,
    "grid_status": "Active",
    "grid_services_active": false,
    "percentage_charged": 85,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Power Values:**
- Positive = consuming/importing
- Negative = producing/exporting

### Get Energy History

```http
GET /api/1/energy_sites/{site_id}/calendar_history
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `kind` - `energy` or `power`
- `period` - `day`, `week`, `month`, `year`
- `start_date` - ISO 8601 date (optional)
- `end_date` - ISO 8601 date (optional)

**Response (energy):**
```json
{
  "response": {
    "time_series": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "solar_energy_exported": 25.5,
        "generator_energy_exported": 0,
        "grid_energy_imported": 5.2,
        "grid_energy_exported_from_solar": 10.5,
        "grid_energy_exported_from_battery": 0,
        "battery_energy_exported": 8.0,
        "battery_energy_imported_from_solar": 12.0,
        "battery_energy_imported_from_grid": 0,
        "consumer_energy_imported_from_solar": 15.0,
        "consumer_energy_imported_from_battery": 8.0,
        "consumer_energy_imported_from_grid": 5.2
      }
    ]
  }
}
```

---

## Rate Limits

### Free Tier Limits

| Limit Type | Value |
|------------|-------|
| Requests per day | 1000 |
| Requests per minute | 10 |
| Requests per second | 1 |

### Best Practices

1. **Cache data** - Don't fetch unchanged data repeatedly
2. **Batch requests** - Use `endpoints` parameter for vehicle data
3. **Smart polling** - Poll more when vehicle active, less when idle
4. **Queue requests** - Implement request queue with rate limiting
5. **Handle 429** - Implement exponential backoff for rate limit errors

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "invalid_token",
  "error_description": "The access token is invalid"
}
```
→ Refresh the access token
→ The backend will refresh and retry once when a Tesla API call returns 401

**403 Forbidden:**
```json
{
  "error": "access_denied",
  "error_description": "Vehicle is not accessible"
}
```
→ Check vehicle permissions

**408 Timeout (Vehicle Sleeping):**
```json
{
  "error": "vehicle_unavailable",
  "error_description": "Vehicle is offline"
}
```
→ Wake vehicle first, or use cached data

**429 Rate Limited:**
```json
{
  "error": "rate_limited",
  "error_description": "Too many requests"
}
```
→ Implement backoff and reduce request frequency

---

## Data Structures

### VehicleState Interface

```typescript
interface VehicleState {
  // Identification
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: 'online' | 'asleep' | 'offline';
  
  // Charge State
  charge_state: {
    battery_level: number;           // 0-100
    battery_range: number;           // miles
    charging_state: 'Charging' | 'Disconnected' | 'Complete' | 'Stopped';
    charge_rate: number;             // mph
    charger_power: number;           // kW
    time_to_full_charge: number;     // hours
    charge_limit_soc: number;        // 0-100
  };
  
  // Drive State
  drive_state: {
    latitude: number;
    longitude: number;
    heading: number;                 // 0-360
    speed: number | null;            // mph, null if parked
    power: number;                   // kW, negative = regen
    shift_state: 'P' | 'D' | 'R' | 'N' | null;
  };
  
  // Vehicle State
  vehicle_state: {
    odometer: number;                // miles
    locked: boolean;
    car_version: string;
    sentry_mode: boolean;
    valet_mode: boolean;
  };
  
  // Climate State
  climate_state: {
    inside_temp: number;             // Celsius
    outside_temp: number;            // Celsius
    is_climate_on: boolean;
    fan_status: number;
  };
}
```

### EnergyLiveStatus Interface

```typescript
interface EnergyLiveStatus {
  solar_power: number;           // Watts
  battery_power: number;         // Watts (negative = charging)
  grid_power: number;            // Watts (negative = exporting)
  load_power: number;            // Watts (home consumption)
  percentage_charged: number;    // 0-100
  grid_status: 'Active' | 'Inactive';
  timestamp: string;             // ISO 8601
}
```

---

## Implementation Notes

### Vehicle Sleep Detection

Vehicles go to sleep after ~15 minutes of inactivity. To check state without waking:

1. Use `/api/1/vehicles` - returns `state` field
2. If `asleep`, use cached data or wake if needed

### Powerwall Always Online

Powerwall/Energy sites are always online and can be queried anytime.

### Navigation Data

Active navigation provides destination info:

```typescript
interface NavigationState {
  active_route_destination: string;      // "123 Main St, City"
  active_route_latitude: number;
  active_route_longitude: number;
  active_route_minutes_to_arrival: number;
  active_route_miles_to_arrival: number;
  active_route_traffic_minutes_delay: number;
}
```

---

## Resources

- [Tesla Fleet API Documentation](https://developer.tesla.com/docs/fleet-api)
- [Tesla Developer Portal](https://developer.tesla.com/)
- [Tesla API Community Resources](https://teslaapi.io/)

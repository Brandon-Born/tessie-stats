# Tessie Stats - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              VERCEL                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         React Frontend                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │  │
│  │  │  Dashboard  │  │   History   │  │    Settings/Config      │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                  │                                       │
│                                  ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    NestJS API (Serverless)                        │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────────┐   │  │
│  │  │  Auth   │  │  Vehicle │  │Powerwall│  │   Sync Jobs      │   │  │
│  │  │ Module  │  │  Module  │  │ Module  │  │   (Cron)         │   │  │
│  │  └─────────┘  └──────────┘  └─────────┘  └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                  │                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Vercel Postgres                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
              ┌─────────────────────────────────────┐
              │           Tesla Fleet API           │
              │  ┌───────────┐    ┌─────────────┐  │
              │  │  Vehicle  │    │  Powerwall  │  │
              │  │    API    │    │    (Energy) │  │
              │  └───────────┘    └─────────────┘  │
              └─────────────────────────────────────┘
```

---

## Backend Architecture (NestJS)

### Module Structure

```
api/src/
├── app.module.ts                 # Root module
├── main.ts                       # Application entry
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── store-token.dto.ts
│   │   └── auth.service.spec.ts
│   │
│   ├── tesla/
│   │   ├── tesla.module.ts
│   │   ├── tesla.service.ts       # Tesla API client wrapper
│   │   ├── tesla.types.ts         # Tesla API response types
│   │   ├── tesla.constants.ts     # API endpoints, limits
│   │   └── tesla.service.spec.ts
│   │
│   ├── vehicle/
│   │   ├── vehicle.module.ts
│   │   ├── vehicle.controller.ts
│   │   ├── vehicle.service.ts
│   │   ├── entities/
│   │   │   ├── vehicle.entity.ts
│   │   │   └── vehicle-state.entity.ts
│   │   ├── dto/
│   │   │   └── vehicle-state.dto.ts
│   │   └── vehicle.service.spec.ts
│   │
│   ├── powerwall/
│   │   ├── powerwall.module.ts
│   │   ├── powerwall.controller.ts
│   │   ├── powerwall.service.ts
│   │   ├── entities/
│   │   │   ├── powerwall.entity.ts
│   │   │   └── energy-state.entity.ts
│   │   └── powerwall.service.spec.ts
│   │
│   ├── charging/
│   │   ├── charging.module.ts
│   │   ├── charging.controller.ts
│   │   ├── charging.service.ts
│   │   ├── entities/
│   │   │   └── charging-session.entity.ts
│   │   └── charging.service.spec.ts
│   │
│   ├── solar/
│   │   ├── solar.module.ts
│   │   ├── solar.controller.ts
│   │   ├── solar.service.ts
│   │   └── solar.service.spec.ts
│   │
│   ├── drivers/
│   │   ├── drivers.module.ts
│   │   ├── drivers.controller.ts
│   │   ├── drivers.service.ts
│   │   ├── entities/
│   │   │   └── driver.entity.ts
│   │   └── drivers.service.spec.ts
│   │
│   └── sync/
│       ├── sync.module.ts
│       ├── sync.service.ts         # Orchestrates data sync
│       ├── sync.scheduler.ts       # Cron job definitions
│       └── sync.service.spec.ts
│
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── utils/
│       ├── encryption.util.ts      # AES-256-GCM encryption
│       └── date.util.ts
│
└── database/
    ├── database.module.ts
    ├── migrations/
    └── seeds/
```

### Key Services

#### TeslaService
Primary interface with Tesla Fleet API:

```typescript
interface TeslaService {
  // Authentication
  refreshAccessToken(refreshToken: string): Promise<TokenPair>;
  
  // Vehicle Data
  getVehicles(): Promise<Vehicle[]>;
  getVehicleData(vehicleId: string): Promise<VehicleData>;
  wakeVehicle(vehicleId: string): Promise<void>;
  
  // Energy (Powerwall)
  getEnergySites(): Promise<EnergySite[]>;
  getSiteStatus(siteId: string): Promise<SiteStatus>;
  getSiteLiveData(siteId: string): Promise<LiveEnergyData>;
  getSiteHistory(siteId: string, period: Period): Promise<EnergyHistory>;
}
```

#### SyncService
Orchestrates periodic data synchronization:

```typescript
interface SyncService {
  // Full sync operations
  syncAllVehicleData(): Promise<void>;
  syncAllEnergyData(): Promise<void>;
  
  // Incremental updates
  syncVehicleState(vehicleId: string): Promise<void>;
  syncEnergyState(siteId: string): Promise<void>;
  
  // Historical data
  syncChargingHistory(vehicleId: string, since: Date): Promise<void>;
  syncDrivingHistory(vehicleId: string, since: Date): Promise<void>;
}
```

---

## Frontend Architecture (React)

### Component Structure

```
web/src/
├── App.tsx
├── main.tsx
│
├── components/
│   ├── ui/                        # Base UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Spinner/
│   │
│   ├── charts/                    # Chart components
│   │   ├── EnergyFlowChart/
│   │   ├── ChargingHistoryChart/
│   │   ├── SolarProductionChart/
│   │   └── BatteryLevelChart/
│   │
│   ├── dashboard/                 # Dashboard-specific components
│   │   ├── VehicleCard/
│   │   ├── PowerwallCard/
│   │   ├── EnergyDistribution/
│   │   ├── LiveStats/
│   │   └── QuickActions/
│   │
│   ├── vehicle/
│   │   ├── VehicleStatus/
│   │   ├── ChargingStatus/
│   │   ├── LocationMap/
│   │   └── TripInfo/
│   │
│   └── layout/
│       ├── Header/
│       ├── Sidebar/
│       ├── Footer/
│       └── PageContainer/
│
├── pages/
│   ├── Dashboard/
│   ├── VehicleDetail/
│   ├── ChargingHistory/
│   ├── EnergyAnalytics/
│   ├── Drivers/
│   ├── Settings/
│   └── Login/
│
├── hooks/
│   ├── useVehicle.ts
│   ├── usePowerwall.ts
│   ├── useChargingSessions.ts
│   ├── useSolarStats.ts
│   └── useAuth.ts
│
├── services/
│   ├── api.ts                     # Axios instance configuration
│   ├── vehicle.service.ts
│   ├── powerwall.service.ts
│   ├── charging.service.ts
│   └── auth.service.ts
│
├── stores/
│   └── auth.store.ts              # Zustand or similar
│
├── types/
│   ├── vehicle.types.ts
│   ├── powerwall.types.ts
│   ├── charging.types.ts
│   └── api.types.ts
│
└── utils/
    ├── formatters.ts
    ├── constants.ts
    └── helpers.ts
```

### State Management Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   TanStack Query                        │ │
│  │   • Server state (API data)                            │ │
│  │   • Caching & background refetch                       │ │
│  │   • Loading/error states                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     Zustand                             │ │
│  │   • Auth state                                         │ │
│  │   • UI preferences                                     │ │
│  │   • Client-only state                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   React Context                         │ │
│  │   • Theme                                              │ │
│  │   • Notifications                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Entities

```sql
-- User configuration (single user for now)
CREATE TABLE user_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tesla_refresh_token_encrypted TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tesla Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tesla_id VARCHAR(50) UNIQUE NOT NULL,
  vin VARCHAR(17) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  model VARCHAR(20),
  year INTEGER,
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicle State Snapshots
CREATE TABLE vehicle_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  timestamp TIMESTAMP NOT NULL,
  odometer DECIMAL(10,1),
  battery_level INTEGER,
  battery_range DECIMAL(6,1),
  charging_state VARCHAR(20),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  speed INTEGER,
  heading INTEGER,
  destination_name VARCHAR(200),
  destination_eta TIMESTAMP,
  driver_id UUID REFERENCES drivers(id),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Charging Sessions
CREATE TABLE charging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  start_battery_level INTEGER,
  end_battery_level INTEGER,
  energy_added_kwh DECIMAL(6,2),
  charge_rate_kw DECIMAL(5,2),
  charger_type VARCHAR(30),
  location_name VARCHAR(200),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  cost DECIMAL(8,2),
  cost_currency VARCHAR(3),
  solar_percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  profile_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Powerwall Sites
CREATE TABLE energy_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tesla_site_id VARCHAR(50) UNIQUE NOT NULL,
  site_name VARCHAR(100),
  time_zone VARCHAR(50),
  battery_count INTEGER,
  total_battery_capacity_kwh DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Energy State Snapshots
CREATE TABLE energy_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES energy_sites(id),
  timestamp TIMESTAMP NOT NULL,
  solar_power_w DECIMAL(10,2),
  battery_power_w DECIMAL(10,2),
  grid_power_w DECIMAL(10,2),
  load_power_w DECIMAL(10,2),
  battery_percentage DECIMAL(5,2),
  grid_status VARCHAR(20),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily Energy Aggregates
CREATE TABLE energy_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES energy_sites(id),
  date DATE NOT NULL,
  solar_produced_kwh DECIMAL(8,2),
  solar_exported_kwh DECIMAL(8,2),
  battery_charged_kwh DECIMAL(8,2),
  battery_discharged_kwh DECIMAL(8,2),
  grid_imported_kwh DECIMAL(8,2),
  grid_exported_kwh DECIMAL(8,2),
  home_consumed_kwh DECIMAL(8,2),
  self_consumption_percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, date)
);

-- Indexes
CREATE INDEX idx_vehicle_states_vehicle_timestamp ON vehicle_states(vehicle_id, timestamp DESC);
CREATE INDEX idx_charging_sessions_vehicle ON charging_sessions(vehicle_id, started_at DESC);
CREATE INDEX idx_energy_states_site_timestamp ON energy_states(site_id, timestamp DESC);
CREATE INDEX idx_energy_daily_site_date ON energy_daily(site_id, date DESC);
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/status` | Check authentication status |
| DELETE | `/api/auth/token` | Remove stored token |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List all vehicles |
| GET | `/api/vehicles/:id` | Get vehicle details |
| GET | `/api/vehicles/:id/state` | Get current vehicle state |
| GET | `/api/vehicles/:id/history` | Get vehicle state history |
| POST | `/api/vehicles/:id/wake` | Wake vehicle |

### Charging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/charging/sessions` | List charging sessions |
| GET | `/api/charging/sessions/:id` | Get session details |
| GET | `/api/charging/stats` | Get charging statistics |

### Energy (Powerwall)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/energy/sites` | List energy sites |
| GET | `/api/energy/sites/:id` | Get site details |
| GET | `/api/energy/sites/:id/live` | Get live energy data |
| GET | `/api/energy/sites/:id/history` | Get energy history |
| GET | `/api/energy/solar/stats` | Get solar statistics |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List drivers |
| POST | `/api/drivers` | Add driver |
| PUT | `/api/drivers/:id` | Update driver |
| GET | `/api/drivers/:id/stats` | Get driver statistics |

### Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/trigger` | Manually trigger sync |
| GET | `/api/sync/status` | Get last sync status |

---

## Security Implementation

### Token Encryption

```typescript
// Encryption utility using Node.js crypto
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## Vercel Configuration

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/src/main.ts",
      "use": "@vercel/node"
    },
    {
      "src": "web/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/src/main.ts"
    },
    {
      "src": "/(.*)",
      "dest": "web/$1"
    }
  ],
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=postgres://...

# Encryption (32-byte hex string)
ENCRYPTION_KEY=your_64_char_hex_string_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=7d

# Tesla API (for initial setup guidance only)
TESLA_CLIENT_ID=your_tesla_client_id
TESLA_CLIENT_SECRET=your_tesla_client_secret

# App
NODE_ENV=production
LOG_LEVEL=info
```

---

## Performance Considerations

### Caching Strategy

> 🔴 **CRITICAL:** Tesla API calls are NOT free. Aggressive caching is mandatory.

#### Database-Level Cache (Primary Strategy)
- **Tesla API Responses:** 2-minute TTL (120 seconds) - stored in PostgreSQL
- **Cache Tables:** `vehicle_data_cache`, `energy_data_cache` with timestamps
- **Check Order:** Always check database cache BEFORE making Tesla API calls
- **Wake State:** Always verify vehicle is `online` before making data requests
- **Batch Requests:** Use `endpoints` parameter to minimize API calls

#### Cache Implementation Requirements
```typescript
// Every Tesla API wrapper must follow this pattern:
async getTeslaData(resourceId: string): Promise<Data> {
  // 1. Check database cache (2-minute TTL)
  const cached = await this.checkCache(resourceId);
  if (cached && isWithinTTL(cached, 120)) {
    return cached.data;
  }
  
  // 2. Check wake state for vehicles
  if (isVehicle(resourceId)) {
    const vehicle = await this.getVehicleState(resourceId);
    if (vehicle.state !== 'online') {
      // Return stale cache or wake only if necessary
      return cached?.data ?? this.handleOfflineVehicle(resourceId);
    }
  }
  
  // 3. Make API call and cache result
  const data = await this.teslaApi.call(resourceId);
  await this.saveToCache(resourceId, data, 120);
  return data;
}
```

#### Additional Caching
- **Historical Data:** Aggressive caching (data doesn't change)
- **Static Assets:** Long-term caching with hash-based invalidation
- **Frontend:** TanStack Query with 1-minute staleTime for live data

### Database Optimization
- Indexed queries for time-series data
- Aggregation tables for analytics
- Connection pooling for serverless
- Dedicated cache tables with TTL columns

### API Rate Limiting & Cost Management
- **Rate Limits:** 10 requests/minute, 1 request/second
- **Queue System:** Serialize requests to stay within limits
- **Exponential Backoff:** On rate limit errors (429)
- **Wake Management:** Only wake vehicles when absolutely necessary
- **Batch Operations:** Combine related requests using `endpoints` parameter

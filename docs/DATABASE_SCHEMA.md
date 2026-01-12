# Database Schema Documentation

## Overview

Tessie Stats uses Vercel Postgres (PostgreSQL) for data persistence. The schema is designed for efficient time-series queries while maintaining historical data.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌────────────────────┐
│   user_config   │       │     vehicles       │
├─────────────────┤       ├────────────────────┤
│ id (PK)         │       │ id (PK)            │
│ refresh_token   │       │ tesla_id           │
│ encryption_iv   │       │ vin                │
│ settings        │       │ display_name       │
└─────────────────┘       │ model              │
                          └────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │ vehicle_states  │ │charging_sessions│ │    drivers      │
          ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
          │ id (PK)         │ │ id (PK)         │ │ id (PK)         │
          │ vehicle_id (FK) │ │ vehicle_id (FK) │ │ name            │
          │ timestamp       │ │ started_at      │ │ profile_id      │
          │ odometer        │ │ ended_at        │ └─────────────────┘
          │ battery_level   │ │ energy_added    │
          │ latitude        │ │ charger_type    │
          │ longitude       │ │ solar_pct       │
          │ driver_id (FK)  │ └─────────────────┘
          └─────────────────┘

┌─────────────────┐
│  energy_sites   │
├─────────────────┤
│ id (PK)         │
│ tesla_site_id   │
│ site_name       │
│ battery_count   │
└─────────────────┘
         │
         ├──────────────────────┐
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ energy_states   │    │  energy_daily   │
├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │
│ site_id (FK)    │    │ site_id (FK)    │
│ timestamp       │    │ date            │
│ solar_power_w   │    │ solar_kwh       │
│ battery_power_w │    │ grid_imported   │
│ grid_power_w    │    │ self_consume_pct│
│ load_power_w    │    └─────────────────┘
└─────────────────┘
```

---

## Tables

### user_config

Stores encrypted user credentials and app settings.

```sql
CREATE TABLE user_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tesla_refresh_token_encrypted TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    encryption_tag TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_config_updated_at
    BEFORE UPDATE ON user_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Notes:**
- Single row table (bespoke app)
- Token encrypted with AES-256-GCM
- Settings JSONB for flexible configuration

---

### vehicles

Tesla vehicle registration.

```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tesla_id VARCHAR(50) UNIQUE NOT NULL,
    vin VARCHAR(17) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    model VARCHAR(20),
    year INTEGER,
    color VARCHAR(50),
    trim VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `tesla_id`: Tesla's internal ID
- `vin`: Vehicle Identification Number
- `model`: Model S/3/X/Y/Cybertruck

---

### vehicle_states

Time-series vehicle state snapshots.

```sql
CREATE TABLE vehicle_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Location
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    heading INTEGER,
    speed INTEGER,
    
    -- Battery
    battery_level INTEGER,
    battery_range DECIMAL(6,1),
    usable_battery_level INTEGER,
    
    -- Charging
    charging_state VARCHAR(20),
    charge_rate DECIMAL(5,2),
    charger_power INTEGER,
    
    -- Odometer
    odometer DECIMAL(10,1),
    
    -- Navigation
    destination_name VARCHAR(200),
    destination_latitude DECIMAL(10,7),
    destination_longitude DECIMAL(10,7),
    destination_eta TIMESTAMPTZ,
    destination_distance DECIMAL(6,1),
    
    -- Driver
    driver_id UUID REFERENCES drivers(id),
    
    -- Climate
    inside_temp DECIMAL(4,1),
    outside_temp DECIMAL(4,1),
    
    -- Status
    is_locked BOOLEAN,
    sentry_mode BOOLEAN,
    
    -- Raw data for debugging/future use
    raw_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_vehicle_states_vehicle_timestamp 
    ON vehicle_states(vehicle_id, timestamp DESC);

CREATE INDEX idx_vehicle_states_timestamp 
    ON vehicle_states(timestamp DESC);

-- Hypertable hint for TimescaleDB (if using)
-- SELECT create_hypertable('vehicle_states', 'timestamp');
```

**Query Patterns:**
- Latest state: `ORDER BY timestamp DESC LIMIT 1`
- History: `WHERE timestamp BETWEEN x AND y`
- Location tracking: GROUP BY date

---

### charging_sessions

Complete charging session records.

```sql
CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Energy
    start_battery_level INTEGER,
    end_battery_level INTEGER,
    energy_added_kwh DECIMAL(6,2),
    
    -- Charging details
    charge_rate_kw_avg DECIMAL(5,2),
    charge_rate_kw_max DECIMAL(5,2),
    charger_type VARCHAR(30), -- 'home', 'supercharger', 'destination', 'other'
    charger_name VARCHAR(100),
    
    -- Location
    location_name VARCHAR(200),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    
    -- Cost
    cost DECIMAL(8,2),
    cost_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Solar attribution (calculated)
    solar_energy_kwh DECIMAL(6,2),
    solar_percentage DECIMAL(5,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'interrupted'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_charging_sessions_vehicle 
    ON charging_sessions(vehicle_id, started_at DESC);

CREATE INDEX idx_charging_sessions_date 
    ON charging_sessions(started_at DESC);
```

**Charger Types:**
- `home` - Home charging (Wall Connector, outlet)
- `supercharger` - Tesla Supercharger
- `destination` - Destination charger
- `third_party` - Third-party DC fast charger
- `other` - Unknown/other

---

### drivers

Multi-driver tracking.

```sql
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    profile_id VARCHAR(50),  -- Tesla profile ID if available
    is_primary BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### energy_sites

Powerwall/Solar system registration.

```sql
CREATE TABLE energy_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tesla_site_id VARCHAR(50) UNIQUE NOT NULL,
    site_name VARCHAR(100),
    time_zone VARCHAR(50),
    battery_count INTEGER DEFAULT 0,
    total_battery_capacity_kwh DECIMAL(8,2),
    solar_capacity_kw DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_energy_sites_updated_at
    BEFORE UPDATE ON energy_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### energy_states

Real-time energy flow snapshots.

```sql
CREATE TABLE energy_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES energy_sites(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Power flows (Watts)
    solar_power_w DECIMAL(10,2),
    battery_power_w DECIMAL(10,2),   -- negative = charging
    grid_power_w DECIMAL(10,2),      -- negative = exporting
    load_power_w DECIMAL(10,2),      -- home consumption
    
    -- Battery state
    battery_percentage DECIMAL(5,2),
    
    -- Grid status
    grid_status VARCHAR(20),         -- 'Active', 'Inactive'
    
    -- Raw data
    raw_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_energy_states_site_timestamp 
    ON energy_states(site_id, timestamp DESC);

CREATE INDEX idx_energy_states_timestamp 
    ON energy_states(timestamp DESC);
```

**Power Sign Convention:**
- **Positive:** Consuming/importing
- **Negative:** Producing/exporting

---

### energy_daily

Aggregated daily energy statistics.

```sql
CREATE TABLE energy_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES energy_sites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Production (kWh)
    solar_produced_kwh DECIMAL(8,2) DEFAULT 0,
    
    -- Solar distribution (kWh)
    solar_to_home_kwh DECIMAL(8,2) DEFAULT 0,
    solar_to_battery_kwh DECIMAL(8,2) DEFAULT 0,
    solar_to_grid_kwh DECIMAL(8,2) DEFAULT 0,
    
    -- Battery (kWh)
    battery_charged_kwh DECIMAL(8,2) DEFAULT 0,
    battery_discharged_kwh DECIMAL(8,2) DEFAULT 0,
    
    -- Grid (kWh)
    grid_imported_kwh DECIMAL(8,2) DEFAULT 0,
    grid_exported_kwh DECIMAL(8,2) DEFAULT 0,
    
    -- Home consumption (kWh)
    home_consumed_kwh DECIMAL(8,2) DEFAULT 0,
    
    -- Calculated metrics
    self_consumption_pct DECIMAL(5,2),  -- % solar used at home
    solar_offset_pct DECIMAL(5,2),       -- % home powered by solar
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(site_id, date)
);

CREATE INDEX idx_energy_daily_site_date 
    ON energy_daily(site_id, date DESC);
```

**Aggregation Job:**
Run daily to summarize energy_states into energy_daily.

---

## Migrations

### Running Migrations

```bash
# In api directory
npm run db:migrate        # Run pending migrations
npm run db:migrate:undo   # Rollback last migration
npm run db:migrate:status # Check migration status
```

### Migration File Naming

```
YYYYMMDDHHMMSS_description.ts

Example:
20240101120000_create_vehicles_table.ts
20240101120001_create_vehicle_states_table.ts
```

---

## Data Retention

### Real-time Data (vehicle_states, energy_states)

- **Granular data:** Keep for 30 days
- **After 30 days:** Aggregate to hourly snapshots
- **After 1 year:** Aggregate to daily snapshots

### Session Data (charging_sessions)

- Keep full detail indefinitely

### Daily Aggregates (energy_daily)

- Keep indefinitely

### Cleanup Job

```sql
-- Delete granular states older than 30 days (keep aggregates)
DELETE FROM vehicle_states 
WHERE timestamp < NOW() - INTERVAL '30 days';

DELETE FROM energy_states 
WHERE timestamp < NOW() - INTERVAL '30 days';
```

---

## Indexing Strategy

### Primary Query Patterns

1. **Latest state:** `WHERE vehicle_id = ? ORDER BY timestamp DESC LIMIT 1`
2. **Time range:** `WHERE timestamp BETWEEN ? AND ?`
3. **Daily aggregation:** `GROUP BY DATE(timestamp)`

### Index Types

- B-tree for equality and range queries (default)
- Consider BRIN for time-series data on very large tables

---

## Performance Tips

1. **Use connection pooling** - Essential for serverless
2. **Limit returned rows** - Always use LIMIT
3. **Select specific columns** - Avoid SELECT *
4. **Use prepared statements** - Better query planning
5. **Monitor slow queries** - pg_stat_statements

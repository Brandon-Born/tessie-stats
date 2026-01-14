-- CreateTable
CREATE TABLE "user_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tesla_refresh_token_encrypted" TEXT NOT NULL,
    "tesla_access_token_encrypted" TEXT,
    "access_token_expires_at" TIMESTAMPTZ,
    "encryption_iv" TEXT NOT NULL,
    "encryption_tag" TEXT NOT NULL,
    "access_token_iv" TEXT,
    "access_token_tag" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tesla_id" VARCHAR(50) NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "display_name" VARCHAR(100),
    "model" VARCHAR(20),
    "year" INTEGER,
    "color" VARCHAR(50),
    "trim" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_states" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "heading" INTEGER,
    "speed" INTEGER,
    "battery_level" INTEGER,
    "battery_range" DECIMAL(6,1),
    "usable_battery_level" INTEGER,
    "charging_state" VARCHAR(20),
    "charge_rate" DECIMAL(5,2),
    "charger_power" INTEGER,
    "odometer" DECIMAL(10,1),
    "destination_name" VARCHAR(200),
    "destination_latitude" DECIMAL(10,7),
    "destination_longitude" DECIMAL(10,7),
    "destination_eta" TIMESTAMPTZ,
    "destination_distance" DECIMAL(6,1),
    "driver_id" UUID,
    "inside_temp" DECIMAL(4,1),
    "outside_temp" DECIMAL(4,1),
    "is_locked" BOOLEAN,
    "sentry_mode" BOOLEAN,
    "raw_data" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charging_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL,
    "ended_at" TIMESTAMPTZ,
    "duration_minutes" INTEGER,
    "start_battery_level" INTEGER,
    "end_battery_level" INTEGER,
    "energy_added_kwh" DECIMAL(6,2),
    "charge_rate_kw_avg" DECIMAL(5,2),
    "charge_rate_kw_max" DECIMAL(5,2),
    "charger_type" VARCHAR(30),
    "charger_name" VARCHAR(100),
    "location_name" VARCHAR(200),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "cost" DECIMAL(8,2),
    "cost_currency" VARCHAR(3) DEFAULT 'USD',
    "solar_energy_kwh" DECIMAL(6,2),
    "solar_percentage" DECIMAL(5,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charging_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "profile_id" VARCHAR(50),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_sites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tesla_site_id" VARCHAR(50) NOT NULL,
    "site_name" VARCHAR(100),
    "time_zone" VARCHAR(50),
    "battery_count" INTEGER DEFAULT 0,
    "total_battery_capacity_kwh" DECIMAL(8,2),
    "solar_capacity_kw" DECIMAL(6,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_states" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "solar_power_w" DECIMAL(10,2),
    "battery_power_w" DECIMAL(10,2),
    "grid_power_w" DECIMAL(10,2),
    "load_power_w" DECIMAL(10,2),
    "battery_percentage" DECIMAL(5,2),
    "grid_status" VARCHAR(20),
    "raw_data" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_daily" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "solar_produced_kwh" DECIMAL(8,2) DEFAULT 0,
    "solar_to_home_kwh" DECIMAL(8,2) DEFAULT 0,
    "solar_to_battery_kwh" DECIMAL(8,2) DEFAULT 0,
    "solar_to_grid_kwh" DECIMAL(8,2) DEFAULT 0,
    "battery_charged_kwh" DECIMAL(8,2) DEFAULT 0,
    "battery_discharged_kwh" DECIMAL(8,2) DEFAULT 0,
    "grid_imported_kwh" DECIMAL(8,2) DEFAULT 0,
    "grid_exported_kwh" DECIMAL(8,2) DEFAULT 0,
    "home_consumed_kwh" DECIMAL(8,2) DEFAULT 0,
    "self_consumption_pct" DECIMAL(5,2),
    "solar_offset_pct" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tesla_id_key" ON "vehicles"("tesla_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "idx_vehicle_states_vehicle_timestamp" ON "vehicle_states"("vehicle_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_vehicle_states_timestamp" ON "vehicle_states"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_charging_sessions_vehicle" ON "charging_sessions"("vehicle_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "idx_charging_sessions_date" ON "charging_sessions"("started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "energy_sites_tesla_site_id_key" ON "energy_sites"("tesla_site_id");

-- CreateIndex
CREATE INDEX "idx_energy_states_site_timestamp" ON "energy_states"("site_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_energy_states_timestamp" ON "energy_states"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_energy_daily_site_date" ON "energy_daily"("site_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "energy_daily_site_id_date_key" ON "energy_daily"("site_id", "date");

-- AddForeignKey
ALTER TABLE "vehicle_states" ADD CONSTRAINT "vehicle_states_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_states" ADD CONSTRAINT "vehicle_states_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charging_sessions" ADD CONSTRAINT "charging_sessions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_states" ADD CONSTRAINT "energy_states_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "energy_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_daily" ADD CONSTRAINT "energy_daily_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "energy_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

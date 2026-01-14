-- CreateTable: Vehicle Data Cache
-- Purpose: Cache Tesla vehicle data responses to minimize API calls (2-minute TTL)
-- Cost Management: Prevents excessive API costs by caching responses
CREATE TABLE "vehicle_data_cache" (
    "vehicle_id" VARCHAR(50) NOT NULL,
    "data" JSONB NOT NULL,
    "cached_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicle_data_cache_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateIndex
CREATE INDEX "idx_vehicle_cache_expiry" ON "vehicle_data_cache"("expires_at");

-- CreateTable: Energy Site Data Cache
-- Purpose: Cache Tesla energy site data responses to minimize API calls (2-minute TTL)
-- Cost Management: Prevents excessive API costs by caching responses
CREATE TABLE "energy_data_cache" (
    "site_id" VARCHAR(50) NOT NULL,
    "data" JSONB NOT NULL,
    "cached_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "energy_data_cache_pkey" PRIMARY KEY ("site_id")
);

-- CreateIndex
CREATE INDEX "idx_energy_cache_expiry" ON "energy_data_cache"("expires_at");

-- CreateTable: Vehicle List Cache
-- Purpose: Cache vehicle list for wake state checking (lightweight, 30-second TTL)
-- Cost Management: Allows checking if vehicle is awake before making expensive data calls
CREATE TABLE "vehicle_list_cache" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'singleton',
    "data" JSONB NOT NULL,
    "cached_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicle_list_cache_pkey" PRIMARY KEY ("id")
);

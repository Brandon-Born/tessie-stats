-- Drop driver feature
-- This migration removes the drivers table and driverId column from vehicle_states

-- First drop the foreign key constraint and column from vehicle_states
ALTER TABLE "vehicle_states" DROP CONSTRAINT IF EXISTS "vehicle_states_driver_id_fkey";
ALTER TABLE "vehicle_states" DROP COLUMN IF EXISTS "driver_id";

-- Then drop the drivers table
DROP TABLE IF EXISTS "drivers";

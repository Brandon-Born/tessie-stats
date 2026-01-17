/**
 * Root Application Module
 *
 * @description Configures all feature modules for the Tessie Stats API
 * @see ARCHITECTURE.md for module structure
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Database
import { DatabaseModule } from './database/database.module';

// Core modules
import { WellKnownModule } from './modules/well-known/well-known.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { TeslaModule } from './modules/tesla/tesla.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { EnergyModule } from './modules/energy/energy.module';

// Sync module (for Vercel Cron)
import { SyncModule } from './modules/sync/sync.module';
import { ChargingModule } from './modules/charging/charging.module';
import { DrivingModule } from './modules/driving/driving.module';

// Additional feature modules will be imported here as they are created:
// import { ChargingModule } from './modules/charging/charging.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Scheduled tasks (cron jobs)
    ScheduleModule.forRoot(),

    // Database (global)
    DatabaseModule,

    // Core modules (public endpoints)
    WellKnownModule,

    // Feature modules
    AuthModule,
    TeslaModule,
    VehicleModule,
    EnergyModule,
    SyncModule,
    ChargingModule,
    DrivingModule,

    // Additional feature modules - add as implemented:
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

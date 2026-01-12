/**
 * Root Application Module
 *
 * @description Configures all feature modules for the Tessie Stats API
 * @see ARCHITECTURE.md for module structure
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Feature modules will be imported here as they are created:
// import { AuthModule } from './modules/auth/auth.module';
// import { VehicleModule } from './modules/vehicle/vehicle.module';
// import { PowerwallModule } from './modules/powerwall/powerwall.module';
// import { ChargingModule } from './modules/charging/charging.module';
// import { SolarModule } from './modules/solar/solar.module';
// import { SyncModule } from './modules/sync/sync.module';
// import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Scheduled tasks (cron jobs)
    ScheduleModule.forRoot(),

    // Feature modules - uncomment as implemented:
    // DatabaseModule,
    // AuthModule,
    // VehicleModule,
    // PowerwallModule,
    // ChargingModule,
    // SolarModule,
    // SyncModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

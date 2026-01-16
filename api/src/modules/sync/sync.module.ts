/**
 * Sync Module (Stub)
 *
 * @description Placeholder module for data synchronization
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { EnergyModule } from '../energy/energy.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [DatabaseModule, AuthModule, VehicleModule, EnergyModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}

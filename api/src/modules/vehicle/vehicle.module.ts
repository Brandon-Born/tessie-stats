/**
 * Vehicle Module
 *
 * @description Module for Tesla vehicle management
 */

import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { TeslaModule } from '../tesla/tesla.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TeslaModule, AuthModule],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}

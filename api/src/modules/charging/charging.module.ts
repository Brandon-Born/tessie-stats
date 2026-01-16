/**
 * Charging Module
 *
 * @description Module for charging session management
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ChargingController } from './charging.controller';
import { ChargingService } from './charging.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ChargingController],
  providers: [ChargingService],
  exports: [ChargingService],
})
export class ChargingModule {}

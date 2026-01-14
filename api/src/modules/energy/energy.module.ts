/**
 * Energy Module
 *
 * @description Module for Tesla Powerwall/Solar management
 */

import { Module } from '@nestjs/common';
import { EnergyController } from './energy.controller';
import { EnergyService } from './energy.service';
import { TeslaModule } from '../tesla/tesla.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [TeslaModule, AuthModule, DatabaseModule],
  controllers: [EnergyController],
  providers: [EnergyService],
  exports: [EnergyService],
})
export class EnergyModule {}

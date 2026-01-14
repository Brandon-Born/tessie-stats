/**
 * Tesla Module
 *
 * @description Provides Tesla Fleet API client services
 */

import { Module } from '@nestjs/common';
import { TeslaService } from './tesla.service';

@Module({
  providers: [TeslaService],
  exports: [TeslaService],
})
export class TeslaModule {}

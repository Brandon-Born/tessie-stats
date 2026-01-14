/**
 * Well-Known Module
 *
 * @description Module for serving .well-known resources
 */

import { Module } from '@nestjs/common';
import { WellKnownController } from './well-known.controller';

@Module({
  controllers: [WellKnownController],
})
export class WellKnownModule {}

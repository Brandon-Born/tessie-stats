/**
 * Sync Module (Stub)
 *
 * @description Placeholder module for data synchronization
 */

import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';

@Module({
  controllers: [SyncController],
})
export class SyncModule {}

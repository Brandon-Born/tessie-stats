/**
 * Sync Module (Stub)
 *
 * @description Placeholder module for data synchronization
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}

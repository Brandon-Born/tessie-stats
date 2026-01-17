import { Module } from '@nestjs/common';
import { DrivingController } from './driving.controller';
import { DrivingService } from './driving.service';

@Module({
    controllers: [DrivingController],
    providers: [DrivingService],
    exports: [DrivingService],
})
export class DrivingModule { }

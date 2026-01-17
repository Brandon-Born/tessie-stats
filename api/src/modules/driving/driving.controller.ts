import { Controller, Get, Param, Query, ParseIntPipe, NotFoundException, UseGuards } from '@nestjs/common';
import { DrivingService } from './driving.service';
import { DrivingSessionResponse } from './dto/driving-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('driving')
@UseGuards(JwtAuthGuard)
export class DrivingController {
    constructor(private readonly drivingService: DrivingService) { }

    @Get('sessions')
    async getSessions(
        @Query('vehicleId') vehicleId: string,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
    ): Promise<DrivingSessionResponse[]> {
        return this.drivingService.getRecentSessions(vehicleId, limit ?? 20);
    }

    @Get('sessions/:id')
    async getSession(@Param('id') id: string): Promise<DrivingSessionResponse> {
        const session = await this.drivingService.getSession(id);
        if (!session) {
            throw new NotFoundException(`Driving session ${id} not found`);
        }
        return session;
    }
}

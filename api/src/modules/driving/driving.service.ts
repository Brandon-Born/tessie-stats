import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DrivingSessionResponse } from './dto/driving-session.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class DrivingService {
    constructor(private readonly prisma: PrismaService) { }

    async getRecentSessions(vehicleId: string, limit = 20): Promise<DrivingSessionResponse[]> {
        const sessions = await this.prisma.drivingSession.findMany({
            where: { vehicleId },
            orderBy: { startedAt: 'desc' },
            take: limit,
        });

        return sessions.map((session) => {
            const response = plainToInstance(DrivingSessionResponse, session, {
                excludeExtraneousValues: true,
            });
            return response;
        });
    }

    async getSession(id: string): Promise<DrivingSessionResponse | null> {
        const session = await this.prisma.drivingSession.findUnique({
            where: { id },
        });

        if (!session) return null;

        return plainToInstance(DrivingSessionResponse, session, {
            excludeExtraneousValues: true,
        });
    }
}

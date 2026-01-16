/**
 * Charging Service
 *
 * @description Handles charging session queries and statistics
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ChargingSession, Vehicle } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ChargingSessionsQueryDto,
  ChargingStatsQueryDto,
  ChargingSessionResponse,
  ChargingStatsResponse,
  ChargingSessionVehicle,
} from './dto/charging.dto';

type ChargingSessionWithVehicle = ChargingSession & { vehicle?: Vehicle | null };

@Injectable()
export class ChargingService {
  constructor(private readonly prisma: PrismaService) {}

  private isUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private toNumber(value: Prisma.Decimal | number | null): number | null {
    if (value === null) {
      return null;
    }

    return Number(value);
  }

  private async resolveVehicleId(identifier: string): Promise<string> {
    const conditions: Prisma.VehicleWhereInput[] = [];

    if (this.isUuid(identifier)) {
      conditions.push({ id: identifier });
    }

    conditions.push({ teslaId: identifier });
    conditions.push({ vin: identifier });

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { OR: conditions },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${identifier} not found`);
    }

    return vehicle.id;
  }

  private mapVehicle(vehicle: Vehicle | null | undefined): ChargingSessionVehicle | undefined {
    if (!vehicle) {
      return undefined;
    }

    return {
      id: vehicle.id,
      teslaId: vehicle.teslaId,
      vin: vehicle.vin,
      displayName: vehicle.displayName ?? null,
    };
  }

  private mapSession(session: ChargingSessionWithVehicle): ChargingSessionResponse {
    const vehicle = this.mapVehicle(session.vehicle);

    return {
      id: session.id,
      vehicleId: session.vehicleId,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      durationMinutes: session.durationMinutes,
      startBatteryLevel: session.startBatteryLevel,
      endBatteryLevel: session.endBatteryLevel,
      energyAddedKwh: this.toNumber(session.energyAddedKwh),
      chargeRateKwAvg: this.toNumber(session.chargeRateKwAvg),
      chargeRateKwMax: this.toNumber(session.chargeRateKwMax),
      chargerType: session.chargerType,
      chargerName: session.chargerName,
      locationName: session.locationName,
      latitude: this.toNumber(session.latitude),
      longitude: this.toNumber(session.longitude),
      cost: this.toNumber(session.cost),
      costCurrency: session.costCurrency,
      solarEnergyKwh: this.toNumber(session.solarEnergyKwh),
      solarPercentage: this.toNumber(session.solarPercentage),
      status: session.status,
      ...(vehicle ? { vehicle } : {}),
    };
  }

  async getChargingSessions(query: ChargingSessionsQueryDto): Promise<ChargingSessionResponse[]> {
    const where: Prisma.ChargingSessionWhereInput = {};

    if (query.vehicleId) {
      where.vehicleId = await this.resolveVehicleId(query.vehicleId);
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate ?? query.endDate) {
      where.startedAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const sessions = await this.prisma.chargingSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: query.limit ?? 200,
      include: {
        vehicle: true,
      },
    });

    return sessions.map((session) => this.mapSession(session));
  }

  async getChargingSessionById(sessionId: string): Promise<ChargingSessionResponse> {
    const session = await this.prisma.chargingSession.findUnique({
      where: { id: sessionId },
      include: {
        vehicle: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Charging session ${sessionId} not found`);
    }

    return this.mapSession(session);
  }

  async getChargingStats(query: ChargingStatsQueryDto): Promise<ChargingStatsResponse> {
    const where: Prisma.ChargingSessionWhereInput = {};

    if (query.vehicleId) {
      where.vehicleId = await this.resolveVehicleId(query.vehicleId);
    }

    if (query.startDate ?? query.endDate) {
      where.startedAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const aggregate = await this.prisma.chargingSession.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        energyAddedKwh: true,
        cost: true,
        durationMinutes: true,
        solarEnergyKwh: true,
      },
      _avg: {
        chargeRateKwAvg: true,
      },
    });

    const totalEnergyAddedKwh = this.toNumber(aggregate._sum.energyAddedKwh ?? null) ?? 0;
    const totalCost = this.toNumber(aggregate._sum.cost ?? null) ?? 0;

    return {
      sessionCount: aggregate._count._all,
      totalEnergyAddedKwh,
      totalCost,
      totalDurationMinutes: aggregate._sum.durationMinutes ?? 0,
      totalSolarEnergyKwh: this.toNumber(aggregate._sum.solarEnergyKwh ?? null) ?? 0,
      averageChargeRateKw: aggregate._avg.chargeRateKwAvg
        ? Number(aggregate._avg.chargeRateKwAvg)
        : null,
      averageCostPerKwh: totalEnergyAddedKwh > 0 ? totalCost / totalEnergyAddedKwh : null,
    };
  }
}

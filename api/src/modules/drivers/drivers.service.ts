/**
 * Drivers Service
 *
 * @description Handles driver CRUD and stats
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Driver } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateDriverDto,
  DriverResponse,
  DriverStatsResponse,
  UpdateDriverDto,
} from './dto/driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  private mapDriver(driver: Driver): DriverResponse {
    return {
      id: driver.id,
      name: driver.name,
      profileId: driver.profileId ?? null,
      isPrimary: driver.isPrimary,
      avatarUrl: driver.avatarUrl ?? null,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
    };
  }

  async getDrivers(): Promise<DriverResponse[]> {
    const drivers = await this.prisma.driver.findMany({
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });

    return drivers.map((driver) => this.mapDriver(driver));
  }

  async createDriver(payload: CreateDriverDto): Promise<DriverResponse> {
    const data: Prisma.DriverCreateInput = {
      name: payload.name,
      profileId: payload.profileId ?? null,
      isPrimary: payload.isPrimary ?? false,
      avatarUrl: payload.avatarUrl ?? null,
    };

    const operations: Prisma.PrismaPromise<Driver | Prisma.BatchPayload>[] = [];

    if (payload.isPrimary) {
      operations.push(this.prisma.driver.updateMany({ data: { isPrimary: false } }));
    }

    operations.push(this.prisma.driver.create({ data }));

    const results = await this.prisma.$transaction(operations);
    const driver = results[results.length - 1] as Driver;

    return this.mapDriver(driver);
  }

  async updateDriver(driverId: string, payload: UpdateDriverDto): Promise<DriverResponse> {
    const existing = await this.prisma.driver.findUnique({ where: { id: driverId } });

    if (!existing) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }

    const operations: Prisma.PrismaPromise<Driver | Prisma.BatchPayload>[] = [];

    if (payload.isPrimary) {
      operations.push(
        this.prisma.driver.updateMany({
          where: { id: { not: driverId } },
          data: { isPrimary: false },
        })
      );
    }

    const data: Prisma.DriverUpdateInput = {};

    if (payload.name !== undefined) {
      data.name = payload.name;
    }

    if (payload.profileId !== undefined) {
      data.profileId = payload.profileId;
    }

    if (payload.isPrimary !== undefined) {
      data.isPrimary = payload.isPrimary;
    }

    if (payload.avatarUrl !== undefined) {
      data.avatarUrl = payload.avatarUrl;
    }

    operations.push(
      this.prisma.driver.update({
        where: { id: driverId },
        data,
      })
    );

    const results = await this.prisma.$transaction(operations);
    const driver = results[results.length - 1] as Driver;

    return this.mapDriver(driver);
  }

  async getDriverStats(driverId: string): Promise<DriverStatsResponse> {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });

    if (!driver) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }

    const aggregate = await this.prisma.vehicleState.aggregate({
      where: { driverId, odometer: { not: null } },
      _min: { odometer: true, timestamp: true },
      _max: { odometer: true, timestamp: true },
      _count: { _all: true },
    });

    const minOdometer = aggregate._min.odometer ? Number(aggregate._min.odometer) : null;
    const maxOdometer = aggregate._max.odometer ? Number(aggregate._max.odometer) : null;
    const totalDistanceMiles =
      minOdometer !== null && maxOdometer !== null ? maxOdometer - minOdometer : null;

    return {
      driverId,
      totalDrivingRecords: aggregate._count._all,
      totalDistanceMiles,
      firstSeenAt: aggregate._min.timestamp ? aggregate._min.timestamp.toISOString() : null,
      lastSeenAt: aggregate._max.timestamp ? aggregate._max.timestamp.toISOString() : null,
    };
  }
}

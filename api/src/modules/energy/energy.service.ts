/**
 * Energy Service
 *
 * @description Handles fetching and managing Tesla Powerwall/Solar data
 * @implementation Follows Prime Directive for API cost management
 * @see .cursorrules for cost management requirements
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';
import { EnergyHistoryPeriod, EnergySite, LiveEnergyData } from '../tesla/tesla.types';
import {
  EnergyHistoryQueryDto,
  EnergyHistoryResponse,
  EnergyHistoryPoint,
} from './dto/energy-history.dto';
import { SolarStatsQueryDto, SolarStatsResponse } from './dto/solar-stats.dto';

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);
  private readonly CACHE_TTL_SECONDS = 120; // 2 minutes

  constructor(
    private readonly teslaService: TeslaService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  private isUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private toNumber(value: Prisma.Decimal | number | null): number {
    if (value === null) {
      return 0;
    }

    return Number(value);
  }

  private async resolveSiteId(identifier: string): Promise<string> {
    const conditions: Prisma.EnergySiteWhereInput[] = [];

    if (this.isUuid(identifier)) {
      conditions.push({ id: identifier });
    }

    conditions.push({ teslaSiteId: identifier });

    const site = await this.prisma.energySite.findFirst({
      where: { OR: conditions },
    });

    if (!site) {
      throw new NotFoundException(`Energy site ${identifier} not found`);
    }

    return site.id;
  }

  private resolveDateRange(
    period: EnergyHistoryPeriod,
    startDate?: string,
    endDate?: string
  ): { startDate: Date | null; endDate: Date | null } {
    if (startDate ?? endDate) {
      return {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      };
    }

    if (period === 'lifetime') {
      return { startDate: null, endDate: null };
    }

    const now = new Date();
    const start = new Date(now);

    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setDate(start.getDate() - 30);
        break;
      case 'year':
        start.setDate(start.getDate() - 365);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return { startDate: start, endDate: now };
  }

  /**
   * Get list of all energy sites (Powerwall/Solar)
   * Note: Energy sites are always online, no wake state check needed
   */
  async getEnergySites(): Promise<EnergySite[]> {
    try {
      return await this.authService.executeTeslaCall((accessToken) =>
        this.teslaService.getEnergySites(accessToken)
      );
    } catch (error) {
      this.logger.error('Failed to fetch energy sites', error);
      throw error;
    }
  }

  /**
   * Get live energy site data with Prime Directive caching
   *
   * Implementation follows cost management requirements:
   * 1. Check cache first (2-minute TTL)
   * 2. Fetch from API only if cache expired or forceFresh
   * 3. Cache result to minimize future API calls
   *
   * Note: Energy sites (Powerwall) are always online, no wake state check needed
   *
   * @param siteId - Tesla energy site ID
   * @param forceFresh - Skip cache and force fresh API call
   */
  async getEnergySiteData(siteId: string, forceFresh = false): Promise<LiveEnergyData> {
    try {
      // STEP 1: Check cache first (unless force fresh)
      if (!forceFresh) {
        const cached = await this.prisma.energyDataCache.findUnique({
          where: { siteId },
        });

        if (cached && cached.expiresAt > new Date()) {
          this.logger.debug(`Cache hit for energy site ${siteId}`);
          return cached.data as unknown as LiveEnergyData;
        }
      }

      // STEP 2: Fetch from API
      this.logger.debug(`Fetching fresh data for energy site ${siteId} - API COST INCURRED`);
      const data = await this.authService.executeTeslaCall((accessToken) =>
        this.teslaService.getSiteLiveData(accessToken, siteId)
      );

      // STEP 3: Cache the result
      const expiresAt = new Date(Date.now() + this.CACHE_TTL_SECONDS * 1000);
      await this.prisma.energyDataCache.upsert({
        where: { siteId },
        create: {
          siteId,
          data: data as unknown as Prisma.InputJsonValue,
          cachedAt: new Date(),
          expiresAt,
        },
        update: {
          data: data as unknown as Prisma.InputJsonValue,
          cachedAt: new Date(),
          expiresAt,
        },
      });

      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch energy site data for ${siteId}`, error);
      throw error;
    }
  }

  /**
   * Get historical energy data stored in the database
   */
  async getEnergyHistory(
    siteId: string,
    query: EnergyHistoryQueryDto
  ): Promise<EnergyHistoryResponse> {
    const resolvedSiteId = await this.resolveSiteId(siteId);
    const period = query.period ?? 'month';
    const { startDate, endDate } = this.resolveDateRange(period, query.startDate, query.endDate);
    const where: Prisma.EnergyDailyWhereInput = { siteId: resolvedSiteId };

    if (startDate ?? endDate) {
      where.date = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    const rows = await this.prisma.energyDaily.findMany({
      where,
      orderBy: { date: 'asc' },
      take: query.limit ?? 365,
    });

    const points: EnergyHistoryPoint[] = rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      solarProducedKwh: this.toNumber(row.solarProducedKwh),
      solarToHomeKwh: this.toNumber(row.solarToHomeKwh),
      solarToBatteryKwh: this.toNumber(row.solarToBatteryKwh),
      solarToGridKwh: this.toNumber(row.solarToGridKwh),
      batteryChargedKwh: this.toNumber(row.batteryChargedKwh),
      batteryDischargedKwh: this.toNumber(row.batteryDischargedKwh),
      gridImportedKwh: this.toNumber(row.gridImportedKwh),
      gridExportedKwh: this.toNumber(row.gridExportedKwh),
      homeConsumedKwh: this.toNumber(row.homeConsumedKwh),
      selfConsumptionPct: row.selfConsumptionPct === null ? null : Number(row.selfConsumptionPct),
      solarOffsetPct: row.solarOffsetPct === null ? null : Number(row.solarOffsetPct),
    }));

    return {
      siteId: resolvedSiteId,
      period,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      points,
    };
  }

  /**
   * Get solar summary stats from stored aggregates
   */
  async getSolarStats(query: SolarStatsQueryDto): Promise<SolarStatsResponse> {
    const where: Prisma.EnergyDailyWhereInput = {};
    let resolvedSiteId: string | null = null;

    if (query.siteId) {
      resolvedSiteId = await this.resolveSiteId(query.siteId);
      where.siteId = resolvedSiteId;
    }

    if (query.startDate ?? query.endDate) {
      where.date = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const aggregate = await this.prisma.energyDaily.aggregate({
      where,
      _sum: {
        solarProducedKwh: true,
        solarToHomeKwh: true,
        solarToBatteryKwh: true,
        solarToGridKwh: true,
        homeConsumedKwh: true,
      },
      _avg: {
        selfConsumptionPct: true,
        solarOffsetPct: true,
      },
      _count: { _all: true },
    });

    return {
      siteId: resolvedSiteId,
      startDate: query.startDate ?? null,
      endDate: query.endDate ?? null,
      days: aggregate._count._all,
      totalSolarProducedKwh: this.toNumber(aggregate._sum.solarProducedKwh ?? null),
      totalSolarToHomeKwh: this.toNumber(aggregate._sum.solarToHomeKwh ?? null),
      totalSolarToBatteryKwh: this.toNumber(aggregate._sum.solarToBatteryKwh ?? null),
      totalSolarToGridKwh: this.toNumber(aggregate._sum.solarToGridKwh ?? null),
      totalHomeConsumedKwh: this.toNumber(aggregate._sum.homeConsumedKwh ?? null),
      averageSelfConsumptionPct:
        aggregate._avg.selfConsumptionPct === null
          ? null
          : Number(aggregate._avg.selfConsumptionPct),
      averageSolarOffsetPct:
        aggregate._avg.solarOffsetPct === null ? null : Number(aggregate._avg.solarOffsetPct),
    };
  }

  /**
   * Clear cache for a specific energy site (useful for debugging/testing)
   */
  async clearSiteCache(siteId: string): Promise<void> {
    await this.prisma.energyDataCache
      .delete({
        where: { siteId },
      })
      .catch(() => {
        // Ignore if doesn't exist
      });
    this.logger.debug(`Cache cleared for energy site ${siteId}`);
  }

  /**
   * Clear all energy site caches
   */
  async clearAllCaches(): Promise<void> {
    await this.prisma.energyDataCache.deleteMany({});
    this.logger.debug('All energy site caches cleared');
  }
}

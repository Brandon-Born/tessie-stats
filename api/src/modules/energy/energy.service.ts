/**
 * Energy Service
 *
 * @description Handles fetching and managing Tesla Powerwall/Solar data
 * @implementation Follows Prime Directive for API cost management
 * @see .cursorrules for cost management requirements
 */

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';
import { EnergySite, LiveEnergyData } from '../tesla/tesla.types';

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);
  private readonly CACHE_TTL_SECONDS = 120; // 2 minutes

  constructor(
    private readonly teslaService: TeslaService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

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

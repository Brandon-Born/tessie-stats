/**
 * Vehicle Service
 *
 * @description Handles fetching and managing Tesla vehicle data
 * @implementation Follows Prime Directive for API cost management
 * @see .cursorrules for cost management requirements
 */

import { Injectable, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';
import { TeslaVehicle, VehicleData } from '../tesla/tesla.types';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);
  private readonly CACHE_TTL_SECONDS = 120; // 2 minutes
  private readonly VEHICLE_LIST_CACHE_TTL_SECONDS = 30; // 30 seconds for wake state checking

  constructor(
    private readonly teslaService: TeslaService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get list of all vehicles (with lightweight caching for wake state checks)
   */
  async getVehicles(forceFresh = false): Promise<TeslaVehicle[]> {
    try {
      // Check cache first (unless force fresh)
      if (!forceFresh) {
        const cached = await this.prisma.vehicleListCache.findUnique({
          where: { id: 'singleton' },
        });

        if (cached && cached.expiresAt > new Date()) {
          this.logger.debug('Vehicle list cache hit');
          return cached.data as unknown as TeslaVehicle[];
        }
      }

      // Fetch from API
      this.logger.debug('Fetching vehicle list from Tesla API');
      const vehicles = await this.authService.executeTeslaCall((accessToken) =>
        this.teslaService.getVehicles(accessToken)
      );

      // Cache the result
      const expiresAt = new Date(Date.now() + this.VEHICLE_LIST_CACHE_TTL_SECONDS * 1000);
      await this.prisma.vehicleListCache.upsert({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          data: vehicles as unknown as Prisma.InputJsonValue,
          cachedAt: new Date(),
          expiresAt,
        },
        update: {
          data: vehicles as unknown as Prisma.InputJsonValue,
          cachedAt: new Date(),
          expiresAt,
        },
      });

      return vehicles;
    } catch (error) {
      this.logger.error('Failed to fetch vehicles', error);
      throw error;
    }
  }

  /**
   * Get detailed vehicle data with Prime Directive caching
   *
   * Implementation follows cost management requirements:
   * 1. Check cache first (2-minute TTL)
   * 2. Verify vehicle is awake before API call
   * 3. Return stale cache if vehicle is sleeping
   * 4. Batch endpoints to minimize API calls
   *
   * @param vehicleId - Tesla vehicle ID
   * @param forceFresh - Skip cache and force fresh API call (may wake vehicle)
   */
  async getVehicleData(vehicleId: string, forceFresh = false): Promise<VehicleData> {
    try {
      // STEP 1: Check cache first (unless force fresh)
      if (!forceFresh) {
        const cached = await this.prisma.vehicleDataCache.findUnique({
          where: { vehicleId },
        });

        if (cached && cached.expiresAt > new Date()) {
          this.logger.debug(`Cache hit for vehicle ${vehicleId}`);
          return cached.data as unknown as VehicleData;
        }
      }

      // STEP 2: Check if vehicle is awake (cost-effective check)
      const vehicles = await this.getVehicles(); // Uses lightweight cache
      const vehicle = vehicles.find(
        (v) =>
          v.id.toString() === vehicleId ||
          v.vehicle_id.toString() === vehicleId ||
          v.vin === vehicleId
      );

      if (!vehicle) {
        throw new NotFoundException(`Vehicle ${vehicleId} not found`);
      }

      // STEP 3: Handle sleeping/offline vehicles
      if (vehicle.state !== 'online') {
        this.logger.debug(`Vehicle ${vehicleId} is ${vehicle.state}`);

        // Try to return stale cache if available
        const staleCache = await this.prisma.vehicleDataCache.findUnique({
          where: { vehicleId },
        });

        if (staleCache) {
          this.logger.debug(`Returning stale cache for sleeping vehicle ${vehicleId}`);
          return staleCache.data as unknown as VehicleData;
        }

        // Only wake if explicitly requested via forceFresh
        if (forceFresh) {
          this.logger.warn(`Waking vehicle ${vehicleId} - API COST INCURRED`);
          await this.wakeVehicle(vehicleId);
          // Wait for vehicle to wake up
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else {
          throw new HttpException(
            `Vehicle ${vehicleId} is ${vehicle.state} and no cached data available`,
            HttpStatus.REQUEST_TIMEOUT
          );
        }
      }

      // STEP 4: Fetch from API with batched endpoints
      this.logger.debug(`Fetching fresh data for vehicle ${vehicleId} - API COST INCURRED`);
      const data = await this.authService.executeTeslaCall((accessToken) =>
        this.teslaService.getVehicleData(accessToken, vehicleId, [
          'charge_state',
          'drive_state',
          'vehicle_state',
          'climate_state',
          'location_data',
        ])
      );

      // STEP 5: Cache the result
      const expiresAt = new Date(Date.now() + this.CACHE_TTL_SECONDS * 1000);
      await this.prisma.vehicleDataCache.upsert({
        where: { vehicleId },
        create: {
          vehicleId,
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
      this.logger.error(`Failed to fetch vehicle data for ${vehicleId}`, error);
      throw error;
    }
  }

  /**
   * Wake up a vehicle
   * Note: This uses vehicle battery - use sparingly
   */
  async wakeVehicle(vehicleId: string): Promise<{ state: string }> {
    try {
      this.logger.warn(`Attempting to wake vehicle ${vehicleId} - this drains battery`);
      const result = await this.authService.executeTeslaCall((accessToken) =>
        this.teslaService.wakeVehicle(accessToken, vehicleId)
      );

      // Invalidate vehicle list cache since state changed
      await this.prisma.vehicleListCache.deleteMany({});

      return { state: result.state };
    } catch (error) {
      this.logger.error(`Failed to wake vehicle ${vehicleId}`, error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific vehicle (useful for debugging/testing)
   */
  async clearVehicleCache(vehicleId: string): Promise<void> {
    await this.prisma.vehicleDataCache
      .delete({
        where: { vehicleId },
      })
      .catch(() => {
        // Ignore if doesn't exist
      });
    this.logger.debug(`Cache cleared for vehicle ${vehicleId}`);
  }

  /**
   * Clear all vehicle caches
   */
  async clearAllCaches(): Promise<void> {
    await this.prisma.vehicleDataCache.deleteMany({});
    await this.prisma.vehicleListCache.deleteMany({});
    this.logger.debug('All vehicle caches cleared');
  }
}

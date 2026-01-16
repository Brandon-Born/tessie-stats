/**
 * Vehicle Service
 *
 * @description Handles fetching and managing Tesla vehicle data
 * @implementation Follows Prime Directive for API cost management
 * @see .cursorrules for cost management requirements
 */

import { Injectable, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma, VehicleState } from '@prisma/client';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';
import { TeslaVehicle, VehicleData } from '../tesla/tesla.types';
import {
  VehicleHistoryQueryDto,
  VehicleHistoryResponse,
  VehicleHistoryItem,
  VehicleStateResponse,
} from './dto/vehicle-history.dto';

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
   * Normalize vehicle data to handle cases where the Tesla API
   * returns double-wrapped responses (data inside a "response" property)
   */
  private normalizeVehicleData(vehicleData: VehicleData): VehicleData {
    const wrapper = vehicleData as unknown as { response?: VehicleData };
    if (wrapper.response && typeof wrapper.response === 'object' && 'id' in wrapper.response) {
      this.logger.debug('Normalizing double-wrapped vehicle data response');
      return wrapper.response;
    }
    return vehicleData;
  }

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

  private mapVehicleState(state: VehicleState, includeRaw: boolean): VehicleHistoryItem {
    return {
      id: state.id,
      timestamp: state.timestamp.toISOString(),
      latitude: this.toNumber(state.latitude),
      longitude: this.toNumber(state.longitude),
      heading: state.heading,
      speed: state.speed,
      batteryLevel: state.batteryLevel,
      batteryRange: this.toNumber(state.batteryRange),
      usableBatteryLevel: state.usableBatteryLevel,
      chargingState: state.chargingState,
      chargeRate: this.toNumber(state.chargeRate),
      chargerPower: state.chargerPower,
      odometer: this.toNumber(state.odometer),
      destinationName: state.destinationName,
      destinationLatitude: this.toNumber(state.destinationLatitude),
      destinationLongitude: this.toNumber(state.destinationLongitude),
      destinationEta: state.destinationEta ? state.destinationEta.toISOString() : null,
      destinationDistance: this.toNumber(state.destinationDistance),
      insideTemp: this.toNumber(state.insideTemp),
      outsideTemp: this.toNumber(state.outsideTemp),
      isLocked: state.isLocked,
      sentryMode: state.sentryMode,
      ...(includeRaw ? { rawData: (state.rawData as Record<string, unknown> | null) ?? null } : {}),
    };
  }

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
          return this.normalizeVehicleData(cached.data as unknown as VehicleData);
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
          return this.normalizeVehicleData(staleCache.data as unknown as VehicleData);
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
      const rawData = await this.authService.executeTeslaCall((accessToken) =>
        this.teslaService.getVehicleData(accessToken, vehicleId, [
          'charge_state',
          'drive_state',
          'vehicle_state',
          'climate_state',
        ])
      );

      // Normalize the response (handles double-wrapped API responses)
      const data = this.normalizeVehicleData(rawData);

      // STEP 5: Cache the normalized result
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
   * Get vehicle state history from stored snapshots
   */
  async getVehicleHistory(
    vehicleId: string,
    query: VehicleHistoryQueryDto
  ): Promise<VehicleHistoryResponse> {
    const resolvedVehicleId = await this.resolveVehicleId(vehicleId);
    const { startDate, endDate, limit, includeRaw } = query;
    const where: Prisma.VehicleStateWhereInput = { vehicleId: resolvedVehicleId };

    if (startDate ?? endDate) {
      where.timestamp = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const states = await this.prisma.vehicleState.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit ?? 200,
    });

    const history: VehicleHistoryItem[] = states.map((state) =>
      this.mapVehicleState(state, includeRaw ?? false)
    );

    return {
      vehicleId: resolvedVehicleId,
      history,
    };
  }

  /**
   * Get the latest stored vehicle state snapshot
   */
  async getLatestVehicleState(vehicleId: string): Promise<VehicleStateResponse> {
    const resolvedVehicleId = await this.resolveVehicleId(vehicleId);
    const state = await this.prisma.vehicleState.findFirst({
      where: { vehicleId: resolvedVehicleId },
      orderBy: { timestamp: 'desc' },
    });

    if (!state) {
      throw new NotFoundException(`No vehicle state history found for ${vehicleId}`);
    }

    return this.mapVehicleState(state, false);
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

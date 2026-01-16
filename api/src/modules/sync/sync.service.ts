/**
 * Sync Service
 *
 * @description Scheduled maintenance jobs for Vercel cron
 */

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { EnergyService } from '../energy/energy.service';
import { EnergySite, LiveEnergyData, TeslaVehicle, VehicleData } from '../tesla/tesla.types';

export interface CacheCleanupResult {
  vehicleDataDeleted: number;
  energyDataDeleted: number;
  vehicleListDeleted: number;
}

export interface SyncIngestionResult {
  vehiclesSynced: number;
  vehicleStatesCreated: number;
  vehiclesSkipped: number;
  energySitesSynced: number;
  energyStatesCreated: number;
  energySitesSkipped: number;
}

export interface SyncStatusState {
  lastRunAt: Date | null;
  lastRunStatus: 'never' | 'success' | 'failed';
  lastRunMessage: string | null;
}

interface SyncVehicleRecord {
  id: string;
  teslaId: string;
  vin: string;
}

interface SyncEnergySiteRecord {
  id: string;
  teslaSiteId: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly RATE_LIMIT_MS = 1100;
  private readonly VEHICLE_STATE_DEDUPE_SECONDS = 30;
  private readonly ENERGY_STATE_DEDUPE_SECONDS = 30;
  private lastTeslaCallAt = 0;
  private status: SyncStatusState = {
    lastRunAt: null,
    lastRunStatus: 'never',
    lastRunMessage: null,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleService: VehicleService,
    private readonly energyService: EnergyService
  ) {}

  private async rateLimitTeslaCalls(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      this.lastTeslaCallAt = Date.now();
      return;
    }

    const now = Date.now();
    const elapsed = now - this.lastTeslaCallAt;
    const waitMs = Math.max(0, this.RATE_LIMIT_MS - elapsed);

    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    this.lastTeslaCallAt = Date.now();
  }

  private toDecimal(value: number | null | undefined): Prisma.Decimal | null {
    if (value === null || value === undefined) {
      return null;
    }

    return new Prisma.Decimal(value);
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }

  private resolveVehicleSnapshotTimestamp(vehicleData: VehicleData): Date {
    if (vehicleData.vehicle_state?.timestamp) {
      return new Date(vehicleData.vehicle_state.timestamp);
    }

    if (vehicleData.drive_state?.gps_as_of) {
      return new Date(vehicleData.drive_state.gps_as_of * 1000);
    }

    return new Date();
  }

  private resolveEnergySnapshotTimestamp(liveData: LiveEnergyData): Date {
    const parsed = new Date(liveData.timestamp);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private normalizeVehicleData(vehicleData: VehicleData): VehicleData {
    const wrapper = vehicleData as unknown as { response?: VehicleData };
    return wrapper.response ?? vehicleData;
  }

  private hasVehicleTelemetry(vehicleData: VehicleData): boolean {
    return Boolean(
      vehicleData.charge_state ??
      vehicleData.drive_state ??
      vehicleData.vehicle_state ??
      vehicleData.climate_state ??
      null
    );
  }

  private async upsertVehicle(teslaVehicle: TeslaVehicle): Promise<SyncVehicleRecord> {
    const vehicle = await this.prisma.vehicle.upsert({
      where: { teslaId: teslaVehicle.id.toString() },
      create: {
        teslaId: teslaVehicle.id.toString(),
        vin: teslaVehicle.vin,
        displayName: teslaVehicle.display_name,
      },
      update: {
        vin: teslaVehicle.vin,
        displayName: teslaVehicle.display_name,
      },
    });

    return {
      id: vehicle.id,
      teslaId: vehicle.teslaId,
      vin: vehicle.vin,
    };
  }

  private async upsertEnergySite(site: EnergySite): Promise<SyncEnergySiteRecord> {
    const record = await this.prisma.energySite.upsert({
      where: { teslaSiteId: site.energy_site_id.toString() },
      create: {
        teslaSiteId: site.energy_site_id.toString(),
        siteName: site.site_name ?? null,
        totalBatteryCapacityKwh: this.toDecimal(site.total_pack_energy ?? null),
      },
      update: {
        siteName: site.site_name ?? null,
        totalBatteryCapacityKwh: this.toDecimal(site.total_pack_energy ?? null),
      },
    });

    return {
      id: record.id,
      teslaSiteId: record.teslaSiteId,
    };
  }

  private async getEnergySitesForSync(): Promise<SyncEnergySiteRecord[]> {
    const storedSites = await this.prisma.energySite.findMany({
      select: { id: true, teslaSiteId: true },
    });

    if (storedSites.length > 0) {
      return storedSites.map((site) => ({
        id: site.id,
        teslaSiteId: site.teslaSiteId,
      }));
    }

    await this.rateLimitTeslaCalls();
    const sites = await this.energyService.getEnergySites();
    const records: SyncEnergySiteRecord[] = [];

    for (const site of sites) {
      records.push(await this.upsertEnergySite(site));
    }

    return records;
  }

  private async syncVehicleRecords(
    vehicles: TeslaVehicle[]
  ): Promise<Map<string, SyncVehicleRecord>> {
    const records = new Map<string, SyncVehicleRecord>();

    for (const vehicle of vehicles) {
      const record = await this.upsertVehicle(vehicle);
      records.set(vehicle.id.toString(), record);
      records.set(vehicle.vehicle_id.toString(), record);
      records.set(vehicle.vin, record);
    }

    return records;
  }

  private async syncVehicleStates(
    vehicles: TeslaVehicle[],
    records: Map<string, SyncVehicleRecord>
  ): Promise<{
    vehicleStatesCreated: number;
    vehiclesSkipped: number;
  }> {
    let vehicleStatesCreated = 0;
    let vehiclesSkipped = 0;

    for (const vehicle of vehicles) {
      try {
        const vehicleRecord = records.get(vehicle.id.toString());
        if (!vehicleRecord) {
          vehiclesSkipped += 1;
          continue;
        }

        await this.rateLimitTeslaCalls();
        const vehicleData = await this.vehicleService.getVehicleData(vehicle.id.toString(), false);

        const normalizedVehicleData = this.normalizeVehicleData(vehicleData);
        if (!this.hasVehicleTelemetry(normalizedVehicleData)) {
          this.logger.warn(`Vehicle data missing telemetry for ${vehicle.id}; skipping snapshot`);
          vehiclesSkipped += 1;
          continue;
        }
        const snapshotTimestamp = this.resolveVehicleSnapshotTimestamp(normalizedVehicleData);
        const latestState = await this.prisma.vehicleState.findFirst({
          where: { vehicleId: vehicleRecord.id },
          orderBy: { timestamp: 'desc' },
        });

        if (
          latestState &&
          latestState.timestamp.getTime() + this.VEHICLE_STATE_DEDUPE_SECONDS * 1000 >=
            snapshotTimestamp.getTime()
        ) {
          continue;
        }

        await this.prisma.vehicleState.create({
          data: {
            vehicleId: vehicleRecord.id,
            timestamp: snapshotTimestamp,
            latitude: this.toDecimal(normalizedVehicleData.drive_state?.latitude ?? null),
            longitude: this.toDecimal(normalizedVehicleData.drive_state?.longitude ?? null),
            heading: normalizedVehicleData.drive_state?.heading ?? null,
            speed: normalizedVehicleData.drive_state?.speed ?? null,
            batteryLevel: normalizedVehicleData.charge_state?.battery_level ?? null,
            batteryRange: this.toDecimal(normalizedVehicleData.charge_state?.battery_range ?? null),
            usableBatteryLevel: normalizedVehicleData.charge_state?.usable_battery_level ?? null,
            chargingState: normalizedVehicleData.charge_state?.charging_state ?? null,
            chargeRate: this.toDecimal(normalizedVehicleData.charge_state?.charge_rate ?? null),
            chargerPower: normalizedVehicleData.charge_state?.charger_power ?? null,
            odometer: this.toDecimal(normalizedVehicleData.vehicle_state?.odometer ?? null),
            destinationName: normalizedVehicleData.drive_state?.active_route_destination ?? null,
            destinationLatitude: this.toDecimal(
              normalizedVehicleData.drive_state?.active_route_latitude ?? null
            ),
            destinationLongitude: this.toDecimal(
              normalizedVehicleData.drive_state?.active_route_longitude ?? null
            ),
            insideTemp: this.toDecimal(normalizedVehicleData.climate_state?.inside_temp ?? null),
            outsideTemp: this.toDecimal(normalizedVehicleData.climate_state?.outside_temp ?? null),
            isLocked: normalizedVehicleData.vehicle_state?.locked ?? null,
            sentryMode: normalizedVehicleData.vehicle_state?.sentry_mode ?? null,
            rawData: normalizedVehicleData as unknown as Prisma.InputJsonValue,
          },
        });

        await this.syncChargingSession(vehicleRecord.id, snapshotTimestamp, normalizedVehicleData);

        vehicleStatesCreated += 1;
      } catch (error) {
        vehiclesSkipped += 1;
        this.logger.warn(`Vehicle sync skipped for ${vehicle.id}`, error);
      }
    }

    return { vehicleStatesCreated, vehiclesSkipped };
  }

  private async syncEnergyStates(
    sites: SyncEnergySiteRecord[]
  ): Promise<{ energyStatesCreated: number; energySitesSkipped: number }> {
    let energyStatesCreated = 0;
    let energySitesSkipped = 0;

    for (const site of sites) {
      try {
        await this.rateLimitTeslaCalls();
        const liveData = await this.energyService.getEnergySiteData(site.teslaSiteId, false);
        const snapshotTimestamp = this.resolveEnergySnapshotTimestamp(liveData);
        const latestState = await this.prisma.energyState.findFirst({
          where: { siteId: site.id },
          orderBy: { timestamp: 'desc' },
        });

        if (
          latestState &&
          latestState.timestamp.getTime() + this.ENERGY_STATE_DEDUPE_SECONDS * 1000 >=
            snapshotTimestamp.getTime()
        ) {
          continue;
        }

        await this.prisma.energyState.create({
          data: {
            siteId: site.id,
            timestamp: snapshotTimestamp,
            solarPowerW: this.toDecimal(liveData.solar_power ?? null),
            batteryPowerW: this.toDecimal(liveData.battery_power ?? null),
            gridPowerW: this.toDecimal(liveData.grid_power ?? null),
            loadPowerW: this.toDecimal(liveData.load_power ?? null),
            batteryPercentage: this.toDecimal(liveData.percentage_charged ?? null),
            gridStatus: liveData.grid_status ?? null,
            rawData: liveData as unknown as Prisma.InputJsonValue,
          },
        });

        energyStatesCreated += 1;
      } catch (error) {
        energySitesSkipped += 1;
        this.logger.warn(`Energy sync skipped for site ${site.teslaSiteId}`, error);
      }
    }

    return { energyStatesCreated, energySitesSkipped };
  }

  private async syncChargingSession(
    vehicleId: string,
    snapshotTimestamp: Date,
    vehicleData: VehicleData
  ): Promise<void> {
    const chargeState = vehicleData.charge_state;
    if (!chargeState) {
      return;
    }

    const chargingState = chargeState.charging_state;
    const isCharging = chargingState === 'Charging' || chargingState === 'Starting';
    const currentRate = this.toNumber(chargeState.charge_rate ?? null);
    const currentBatteryLevel = chargeState.battery_level ?? null;

    const activeSession = await this.prisma.chargingSession.findFirst({
      where: { vehicleId, status: 'in_progress' },
      orderBy: { startedAt: 'desc' },
    });

    if (isCharging) {
      if (!activeSession) {
        await this.prisma.chargingSession.create({
          data: {
            vehicleId,
            startedAt: snapshotTimestamp,
            startBatteryLevel: currentBatteryLevel,
            chargeRateKwAvg: this.toDecimal(currentRate ?? null),
            chargeRateKwMax: this.toDecimal(currentRate ?? null),
            latitude: this.toDecimal(vehicleData.drive_state?.latitude ?? null),
            longitude: this.toDecimal(vehicleData.drive_state?.longitude ?? null),
            status: 'in_progress',
          },
        });
      } else {
        const avgRate =
          currentRate === null
            ? this.toNumber(activeSession.chargeRateKwAvg ?? null)
            : activeSession.chargeRateKwAvg === null
              ? currentRate
              : (this.toNumber(activeSession.chargeRateKwAvg) ?? 0) / 2 + currentRate / 2;

        const maxRate =
          currentRate === null
            ? this.toNumber(activeSession.chargeRateKwMax ?? null)
            : Math.max(this.toNumber(activeSession.chargeRateKwMax ?? null) ?? 0, currentRate);

        await this.prisma.chargingSession.update({
          where: { id: activeSession.id },
          data: {
            endBatteryLevel: currentBatteryLevel,
            chargeRateKwAvg: this.toDecimal(avgRate ?? null),
            chargeRateKwMax: this.toDecimal(maxRate ?? null),
            latitude: this.toDecimal(vehicleData.drive_state?.latitude ?? null),
            longitude: this.toDecimal(vehicleData.drive_state?.longitude ?? null),
          },
        });
      }

      return;
    }

    if (!activeSession) {
      return;
    }

    if (snapshotTimestamp.getTime() < activeSession.startedAt.getTime()) {
      return;
    }

    const durationMinutes = Math.round(
      (snapshotTimestamp.getTime() - activeSession.startedAt.getTime()) / 60000
    );
    const finalStatus = chargingState === 'Stopped' ? 'interrupted' : 'completed';

    await this.prisma.chargingSession.update({
      where: { id: activeSession.id },
      data: {
        endedAt: snapshotTimestamp,
        durationMinutes,
        endBatteryLevel: currentBatteryLevel,
        status: finalStatus,
      },
    });
  }

  private async runIngestion(): Promise<SyncIngestionResult> {
    await this.rateLimitTeslaCalls();
    const vehicles = await this.vehicleService.getVehicles(false);
    const records = await this.syncVehicleRecords(vehicles);
    const { vehicleStatesCreated, vehiclesSkipped } = await this.syncVehicleStates(
      vehicles,
      records
    );
    const sites = await this.getEnergySitesForSync();
    const { energyStatesCreated, energySitesSkipped } = await this.syncEnergyStates(sites);

    return {
      vehiclesSynced: vehicles.length,
      vehicleStatesCreated,
      vehiclesSkipped,
      energySitesSynced: sites.length,
      energyStatesCreated,
      energySitesSkipped,
    };
  }

  /**
   * Clean up expired cache entries.
   *
   * @returns counts of deleted rows by cache table
   */
  async cleanupExpiredCache(): Promise<CacheCleanupResult> {
    const now = new Date();
    const [vehicleData, energyData, vehicleList] = await Promise.all([
      this.prisma.vehicleDataCache.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      this.prisma.energyDataCache.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      this.prisma.vehicleListCache.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    const result: CacheCleanupResult = {
      vehicleDataDeleted: vehicleData.count,
      energyDataDeleted: energyData.count,
      vehicleListDeleted: vehicleList.count,
    };

    this.logger.log(
      `Cache cleanup completed: vehicles=${result.vehicleDataDeleted}, energy=${result.energyDataDeleted}, vehicleList=${result.vehicleListDeleted}`
    );

    return result;
  }

  /**
   * Run maintenance sync (currently cache cleanup only)
   */
  async triggerSync(): Promise<{
    success: boolean;
    message: string;
    cleanup?: CacheCleanupResult;
    ingestion?: SyncIngestionResult;
  }> {
    try {
      const cleanup = await this.cleanupExpiredCache();
      const ingestion = await this.runIngestion();
      this.status = {
        lastRunAt: new Date(),
        lastRunStatus: 'success',
        lastRunMessage: 'Cache cleanup and ingestion completed',
      };

      return {
        success: true,
        message: 'Cache cleanup and ingestion completed',
        cleanup,
        ingestion,
      };
    } catch (error) {
      this.logger.error('Manual sync failed', error);
      this.status = {
        lastRunAt: new Date(),
        lastRunStatus: 'failed',
        lastRunMessage: 'Cache cleanup or ingestion failed',
      };

      return {
        success: false,
        message: 'Cache cleanup or ingestion failed',
      };
    }
  }

  /**
   * Get last sync status
   */
  getSyncStatus(): SyncStatusState {
    return this.status;
  }
}

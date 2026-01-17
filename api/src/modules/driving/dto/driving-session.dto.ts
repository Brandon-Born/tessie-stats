import { Expose, Type } from 'class-transformer';

export class DrivingSessionResponse {
    @Expose()
    id!: string;

    @Expose()
    vehicleId!: string;

    @Expose()
    @Type(() => Date)
    startedAt!: Date;

    @Expose()
    @Type(() => Date)
    endedAt!: Date | null;

    @Expose()
    durationMinutes!: number | null;

    @Expose()
    distanceMiles!: number | null;

    @Expose()
    startBatteryLevel!: number | null;

    @Expose()
    endBatteryLevel!: number | null;

    @Expose()
    efficiencyWhPerMile!: number | null; // Calculated field
}

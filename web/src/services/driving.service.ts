import { api } from '@/services/api';

export interface DrivingSession {
    id: string;
    vehicleId: string;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
    distanceMiles: number | null;
    startBatteryLevel: number | null;
    endBatteryLevel: number | null;
    efficiencyWhPerMile: number | null;
}

export const DrivingService = {
    getRecentSessions: async (vehicleId: string, limit = 20): Promise<DrivingSession[]> => {
        const { data } = await api.get<DrivingSession[]>('/driving/sessions', {
            params: { vehicleId, limit },
        });
        return data;
    },
};

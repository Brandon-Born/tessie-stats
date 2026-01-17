import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import { useVehiclesStore } from '@/stores/vehicles.store';
import { cn } from '@/utils/cn';

export function VehicleSelector(): React.JSX.Element | null {
    const { selectedVehicleId, setSelectedVehicleId } = useVehiclesStore();

    const { data: vehicles, isLoading } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => vehicleService.getVehicles(),
    });

    // Auto-select first vehicle if none selected
    React.useEffect(() => {
        if (vehicles?.length && !selectedVehicleId) {
            if (vehicles[0]) {
                setSelectedVehicleId(vehicles[0].id);
            }
        }
    }, [vehicles, selectedVehicleId, setSelectedVehicleId]);

    if (isLoading || !vehicles?.length) return null;

    return (
        <div className="relative">
            <select
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className={cn(
                    'h-9 w-full appearance-none rounded-lg border border-border/50 bg-background pl-3 pr-8 text-sm shadow-sm transition-colors',
                    'hover:bg-accent/5 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20'
                )}
            >
                {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                        {v.display_name || v.vin}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-50"
                >
                    <path
                        d="M1 1L5 5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
}

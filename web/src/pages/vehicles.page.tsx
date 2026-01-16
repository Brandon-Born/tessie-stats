import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { syncService, vehicleService } from '@/services';
import type { TeslaVehicle } from '@/types';

export function VehiclesPage(): React.JSX.Element {
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getVehicles(),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Vehicles</h1>
          <p className="mt-1 text-sm text-muted">Manage and inspect your Tesla vehicles.</p>
        </div>
        <Button variant="primary">Add Vehicle</Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Vehicle list</CardTitle>
            <CardDescription>Latest snapshots from sync.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {vehiclesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : vehiclesQuery.isError ? (
            <div className="text-sm text-red-400">Failed to load vehicles.</div>
          ) : vehiclesQuery.data?.length ? (
            <div className="grid gap-4">
              {vehiclesQuery.data.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted">No vehicles yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface VehicleCardProps {
  vehicle: TeslaVehicle;
}

function VehicleCard({ vehicle }: VehicleCardProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [refreshState, setRefreshState] = React.useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [refreshMessage, setRefreshMessage] = React.useState<string | null>(null);
  const vehicleStateQuery = useQuery({
    queryKey: ['vehicle-state', vehicle.id],
    queryFn: () => vehicleService.getVehicleState(String(vehicle.id)),
    enabled: !!vehicle.id,
    refetchInterval: 60_000,
  });

  const vehicleDataQuery = useQuery({
    queryKey: ['vehicle-data', vehicle.id],
    queryFn: () => vehicleService.getVehicleData(String(vehicle.id)),
    enabled: vehicleStateQuery.isError,
    refetchInterval: 60_000,
  });

  const state = vehicleStateQuery.data;
  const batteryLevel = state?.batteryLevel ?? vehicleDataQuery.data?.charge_state?.battery_level ?? null;
  const batteryRange = state?.batteryRange ?? vehicleDataQuery.data?.charge_state?.battery_range ?? null;
  const odometer = state?.odometer ?? vehicleDataQuery.data?.vehicle_state?.odometer ?? null;
  const chargingState =
    state?.chargingState ?? vehicleDataQuery.data?.charge_state?.charging_state ?? null;

  const handleRefreshTelemetry = async (): Promise<void> => {
    if (
      !window.confirm(
        'Refresh vehicle telemetry? This may trigger Tesla API usage if cache is empty.'
      )
    ) {
      return;
    }

    setRefreshState('loading');
    setRefreshMessage(null);

    try {
      await vehicleService.clearVehicleCache(String(vehicle.id));
      await vehicleService.getVehicleData(String(vehicle.id), { forceFresh: true });
      const syncResult = await syncService.triggerSync();
      setRefreshState('success');
      setRefreshMessage(syncResult.message);

      await queryClient.invalidateQueries({ queryKey: ['vehicle-state', vehicle.id] });
      await queryClient.invalidateQueries({ queryKey: ['vehicle-data', vehicle.id] });
    } catch (error) {
      setRefreshState('error');
      setRefreshMessage(error instanceof Error ? error.message : 'Failed to refresh telemetry');
    }
  };

  return (
    <div className="rounded-xl border border-border/40 bg-surface-2/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-text">
            {vehicle.display_name || vehicle.vin}
          </div>
          <div className="text-xs text-muted">State: {vehicle.state}</div>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs text-muted sm:items-end">
          <div>
            {state?.timestamp ? `Updated ${formatTimestamp(state.timestamp)}` : 'No snapshot yet'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefreshTelemetry()}
            disabled={refreshState === 'loading'}
          >
            {refreshState === 'loading' ? 'Refreshing...' : 'Refresh telemetry'}
          </Button>
        </div>
      </div>

      {refreshMessage && (
        <div
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            refreshState === 'error'
              ? 'border-red-500/20 bg-red-500/10 text-red-400'
              : 'border-green-500/20 bg-green-500/10 text-green-400'
          }`}
        >
          {refreshMessage}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
        <Metric label="Battery" value={formatPercent(batteryLevel)} />
        <Metric label="Range" value={formatMiles(batteryRange)} />
        <Metric label="Odometer" value={formatMiles(odometer)} />
        <Metric label="Charging" value={chargingState ?? '—'} />
      </div>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps): React.JSX.Element {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm text-text">{value}</div>
    </div>
  );
}

function formatPercent(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${Math.round(value)}%`;
}

function formatMiles(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${Math.round(value)} mi`;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }
  return date.toLocaleString();
}


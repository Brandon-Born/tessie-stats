import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { vehicleService, energyService } from '@/services';

export function DashboardPage(): React.JSX.Element {
  // Fetch vehicles
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getVehicles(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch vehicle data for first vehicle
  const firstVehicleId = vehiclesQuery.data?.[0]?.id;
  const vehicleDataQuery = useQuery({
    queryKey: ['vehicle-data', firstVehicleId],
    queryFn: () => vehicleService.getVehicleData(firstVehicleId!),
    enabled: !!firstVehicleId,
    refetchInterval: 60000,
  });

  // Fetch energy sites
  const energySitesQuery = useQuery({
    queryKey: ['energy-sites'],
    queryFn: () => energyService.getEnergySites(),
    refetchInterval: 60000,
  });

  // Fetch energy data for first site
  const firstSiteId = energySitesQuery.data?.[0]?.id;
  const energyDataQuery = useQuery({
    queryKey: ['energy-data', firstSiteId],
    queryFn: () => energyService.getEnergySiteData(firstSiteId!),
    enabled: !!firstSiteId,
    refetchInterval: 60000,
  });

  const handleRefresh = (): void => {
    void vehiclesQuery.refetch();
    void vehicleDataQuery.refetch();
    void energySitesQuery.refetch();
    void energyDataQuery.refetch();
  };

  const vehicleData = vehicleDataQuery.data;
  const energyData = energyDataQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Live snapshot of vehicle + energy state.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleRefresh} disabled={vehiclesQuery.isRefetching}>
            {vehiclesQuery.isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Vehicle</CardTitle>
              <CardDescription>
                {vehicleData?.display_name ?? 'Battery, location, charging, trips.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {vehicleDataQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : vehicleDataQuery.isError ? (
              <div className="space-y-3">
                <div className="text-sm text-red-400">Failed to load vehicle data</div>
                <div className="text-xs text-muted">
                  Your Tesla connection may need to be refreshed. Go to Settings to reconnect.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Metric
                  label="Battery"
                  value={`${vehicleData?.charge_state?.battery_level ?? '—'}%`}
                  accent="battery"
                />
                <Metric
                  label="Range"
                  value={`${Math.round(vehicleData?.charge_state?.battery_range ?? 0)} mi`}
                />
                <Metric label="State" value={vehicleData?.state ?? '—'} />
                <Metric
                  label="Charging"
                  value={vehicleData?.charge_state?.charging_state ?? '—'}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Energy</CardTitle>
              <CardDescription>Solar, Powerwall, grid and home usage.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {energyDataQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : energyDataQuery.isError ? (
              <div className="space-y-3">
                <div className="text-sm text-red-400">Failed to load energy data</div>
                <div className="text-xs text-muted">
                  Your Tesla connection may need to be refreshed. Go to Settings to reconnect.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Metric
                  label="Solar"
                  value={`${((energyData?.solar_power ?? 0) / 1000).toFixed(1)} kW`}
                  accent="solar"
                />
                <Metric
                  label="Home"
                  value={`${((energyData?.load_power ?? 0) / 1000).toFixed(1)} kW`}
                />
                <Metric
                  label="Battery"
                  value={`${Math.round(energyData?.percentage_charged ?? 0)}%`}
                  accent="battery"
                />
                <Metric
                  label="Grid"
                  value={`${((energyData?.grid_power ?? 0) / 1000).toFixed(1)} kW`}
                  accent="grid"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
  accent?: 'solar' | 'battery' | 'grid';
}

function Metric({ label, value, accent }: MetricProps): React.JSX.Element {
  const accentClass =
    accent === 'solar'
      ? 'text-solar'
      : accent === 'battery'
        ? 'text-battery'
        : accent === 'grid'
          ? 'text-grid'
          : 'text-text';

  return (
    <div className="rounded-xl border border-border/40 bg-surface-2/40 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accentClass}`}>{value}</div>
    </div>
  );
}


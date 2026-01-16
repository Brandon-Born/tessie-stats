import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { chargingService } from '@/services';
import type { ChargingSessionResponse, ChargingStatsResponse } from '@/types';

export function ChargingPage(): React.JSX.Element {
  const statsQuery = useQuery({
    queryKey: ['charging', 'stats'],
    queryFn: () => chargingService.getChargingStats(),
  });

  const sessionsQuery = useQuery({
    queryKey: ['charging', 'sessions'],
    queryFn: () => chargingService.getChargingSessions({ limit: 10 }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Charging</h1>
          <p className="mt-1 text-sm text-muted">Charging sessions, costs, and solar percentage.</p>
        </div>
        <Button variant="outline">Import History</Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Totals from synced charging sessions.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {statsQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : statsQuery.isError ? (
            <div className="text-sm text-red-400">Failed to load charging stats.</div>
          ) : (
            <ChargingSummary stats={statsQuery.data} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Most recent sessions captured by sync.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sessionsQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : sessionsQuery.isError ? (
            <div className="text-sm text-red-400">Failed to load sessions.</div>
          ) : sessionsQuery.data?.length ? (
            <div className="grid gap-4">
              {sessionsQuery.data.map((session) => (
                <ChargingSessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted">No sessions yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ChargingSummaryProps {
  stats: ChargingStatsResponse | undefined;
}

function ChargingSummary({ stats }: ChargingSummaryProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
      <Metric label="Sessions" value={formatNumber(stats?.sessionCount)} />
      <Metric label="Energy added" value={formatKwh(stats?.totalEnergyAddedKwh)} />
      <Metric label="Total cost" value={formatCurrency(stats?.totalCost)} />
      <Metric label="Avg $/kWh" value={formatCurrency(stats?.averageCostPerKwh)} />
      <Metric label="Total time" value={formatDuration(stats?.totalDurationMinutes)} />
      <Metric label="Solar kWh" value={formatKwh(stats?.totalSolarEnergyKwh)} />
      <Metric label="Avg rate" value={formatKw(stats?.averageChargeRateKw)} />
    </div>
  );
}

interface ChargingSessionCardProps {
  session: ChargingSessionResponse;
}

function ChargingSessionCard({ session }: ChargingSessionCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border/40 bg-surface-2/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-text">
            {session.vehicle?.displayName ?? 'Vehicle'} • {formatStatus(session.status)}
          </div>
          <div className="text-xs text-muted">
            {formatDateTime(session.startedAt)} → {session.endedAt ? formatDateTime(session.endedAt) : 'In progress'}
          </div>
        </div>
        <div className="text-xs text-muted">
          {session.locationName ?? 'Unknown location'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
        <Metric label="Energy" value={formatKwh(session.energyAddedKwh)} />
        <Metric label="Battery" value={formatBattery(session.startBatteryLevel, session.endBatteryLevel)} />
        <Metric label="Avg rate" value={formatKw(session.chargeRateKwAvg)} />
        <Metric label="Cost" value={formatCurrency(session.cost)} />
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

function formatNumber(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return value.toLocaleString();
}

function formatKwh(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${value.toFixed(1)} kWh`;
}

function formatKw(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${value.toFixed(1)} kW`;
}

function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `$${value.toFixed(2)}`;
}

function formatDuration(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return `${hours}h ${minutes}m`;
}

function formatBattery(start?: number | null, end?: number | null): string {
  if (start === null || start === undefined) {
    return '—';
  }
  if (end === null || end === undefined) {
    return `${Math.round(start)}%`;
  }
  return `${Math.round(start)}% → ${Math.round(end)}%`;
}

function formatStatus(status: ChargingSessionResponse['status']): string {
  switch (status) {
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'stopped':
      return 'Stopped';
    default:
      return status;
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}


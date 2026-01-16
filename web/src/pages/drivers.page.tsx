import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { driversService } from '@/services';
import type { DriverResponse } from '@/types';

export function DriversPage(): React.JSX.Element {
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversService.getDrivers(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Drivers</h1>
          <p className="mt-1 text-sm text-muted">Multi-driver profiles and statistics.</p>
        </div>
        <Button variant="primary">Add Driver</Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Driver list</CardTitle>
            <CardDescription>Profiles with driving totals from sync.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {driversQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : driversQuery.isError ? (
            <div className="text-sm text-red-400">Failed to load drivers.</div>
          ) : driversQuery.data?.length ? (
            <div className="grid gap-4">
              {driversQuery.data.map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted">No drivers yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DriverCardProps {
  driver: DriverResponse;
}

function DriverCard({ driver }: DriverCardProps): React.JSX.Element {
  const statsQuery = useQuery({
    queryKey: ['drivers', driver.id, 'stats'],
    queryFn: () => driversService.getDriverStats(driver.id),
  });

  const stats = statsQuery.data;

  return (
    <div className="rounded-xl border border-border/40 bg-surface-2/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-text">
            {driver.name} {driver.isPrimary ? '• Primary' : ''}
          </div>
          <div className="text-xs text-muted">Profile: {driver.profileId ?? '—'}</div>
        </div>
        <div className="text-xs text-muted">
          {stats?.lastSeenAt ? `Last seen ${formatTimestamp(stats.lastSeenAt)}` : 'No stats yet'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
        <Metric label="Records" value={formatNumber(stats?.totalDrivingRecords)} />
        <Metric label="Distance" value={formatMiles(stats?.totalDistanceMiles)} />
        <Metric label="First seen" value={formatDate(stats?.firstSeenAt)} />
        <Metric label="Last seen" value={formatDate(stats?.lastSeenAt)} />
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

function formatMiles(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${value.toFixed(1)} mi`;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }
  return date.toLocaleString();
}


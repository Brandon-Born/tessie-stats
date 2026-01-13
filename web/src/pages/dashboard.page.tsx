import * as React from 'react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export function DashboardPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Live snapshot of vehicle + energy state.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary">Refresh</Button>
          <Button variant="outline">Sync Now</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Vehicle</CardTitle>
              <CardDescription>Battery, location, charging, trips.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Battery" value="—%" accent="battery" />
              <Metric label="Range" value="— mi" />
              <Metric label="State" value="—" />
              <Metric label="Location" value="—" />
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Solar" value="— kW" accent="solar" />
              <Metric label="Home" value="— kW" />
              <Metric label="Battery" value="—%" accent="battery" />
              <Metric label="Grid" value="— kW" accent="grid" />
            </div>
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


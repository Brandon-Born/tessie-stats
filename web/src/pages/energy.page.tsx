import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@/components/ui';
import { energyService } from '@/services';
import type { EnergyHistoryResponse, EnergySiteData, SolarStatsResponse } from '@/types';

export function EnergyPage(): React.JSX.Element {
  const sitesQuery = useQuery({
    queryKey: ['energy-sites'],
    queryFn: () => energyService.getEnergySites(),
    refetchInterval: 60_000,
  });

  const firstSiteId = sitesQuery.data?.[0]?.energy_site_id;
  const liveDataQuery = useQuery({
    queryKey: ['energy-site', firstSiteId],
    queryFn: () => energyService.getEnergySiteData(String(firstSiteId!)),
    enabled: !!firstSiteId,
    refetchInterval: 60_000,
  });

  const historyQuery = useQuery({
    queryKey: ['energy-history', firstSiteId],
    queryFn: () => energyService.getEnergyHistory(String(firstSiteId!), { period: 'month' }),
    enabled: !!firstSiteId,
  });

  const solarStatsQuery = useQuery({
    queryKey: ['energy-solar-stats', firstSiteId],
    queryFn: () => energyService.getSolarStats({ siteId: String(firstSiteId!) }),
    enabled: !!firstSiteId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text">Energy</h1>
        <p className="mt-1 text-sm text-muted">Powerwall, solar production, and grid flow.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Live flow</CardTitle>
              <CardDescription>Solar → Home / Battery / Grid</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {sitesQuery.isLoading || liveDataQuery.isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : liveDataQuery.isError ? (
              <div className="text-sm text-red-400">Failed to load live energy data.</div>
            ) : (
              <LiveEnergySummary data={liveDataQuery.data} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>History</CardTitle>
              <CardDescription>Daily / weekly / monthly aggregates.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : historyQuery.isError ? (
              <div className="text-sm text-red-400">Failed to load history.</div>
            ) : (
              <HistorySummary history={historyQuery.data} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Solar stats</CardTitle>
              <CardDescription>Aggregate solar performance.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {solarStatsQuery.isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : solarStatsQuery.isError ? (
              <div className="text-sm text-red-400">Failed to load solar stats.</div>
            ) : (
              <SolarStatsSummary stats={solarStatsQuery.data} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface LiveEnergySummaryProps {
  data: EnergySiteData | undefined;
}

function LiveEnergySummary({ data }: LiveEnergySummaryProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
      <Metric label="Solar" value={formatKw(data?.solar_power)} />
      <Metric label="Home" value={formatKw(data?.load_power)} />
      <Metric label="Battery" value={formatPercent(data?.percentage_charged)} />
      <Metric label="Grid" value={formatKw(data?.grid_power)} />
    </div>
  );
}

interface HistorySummaryProps {
  history: EnergyHistoryResponse | undefined;
}

function HistorySummary({ history }: HistorySummaryProps): React.JSX.Element {
  const points = history?.points ?? [];
  const latest = points.length ? points[points.length - 1] : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
      <Metric label="Days" value={points.length.toString()} />
      <Metric label="Solar" value={formatKwh(latest?.solarProducedKwh)} />
      <Metric label="Home" value={formatKwh(latest?.homeConsumedKwh)} />
      <Metric label="Self use" value={formatPercent(latest?.selfConsumptionPct)} />
    </div>
  );
}

interface SolarStatsSummaryProps {
  stats: SolarStatsResponse | undefined;
}

function SolarStatsSummary({ stats }: SolarStatsSummaryProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-4">
      <Metric label="Days" value={stats?.days?.toString() ?? '—'} />
      <Metric label="Solar" value={formatKwh(stats?.totalSolarProducedKwh)} />
      <Metric label="Home" value={formatKwh(stats?.totalHomeConsumedKwh)} />
      <Metric label="Self use" value={formatPercent(stats?.averageSelfConsumptionPct)} />
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

function formatKw(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${(value / 1000).toFixed(1)} kW`;
}

function formatKwh(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${value.toFixed(1)} kWh`;
}

function formatPercent(value?: number | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${value.toFixed(1)}%`;
}


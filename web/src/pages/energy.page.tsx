import * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export function EnergyPage(): React.JSX.Element {
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
            <div className="text-sm text-muted">Chart placeholder.</div>
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
            <div className="text-sm text-muted">Chart placeholder.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


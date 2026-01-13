import * as React from 'react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export function VehiclesPage(): React.JSX.Element {
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
            <CardDescription>Placeholder until API + DB are wired.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted">No vehicles yet.</div>
        </CardContent>
      </Card>
    </div>
  );
}


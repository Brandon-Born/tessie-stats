import * as React from 'react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export function DriversPage(): React.JSX.Element {
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
            <CardDescription>Placeholder until drivers module is wired.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted">No drivers yet.</div>
        </CardContent>
      </Card>
    </div>
  );
}


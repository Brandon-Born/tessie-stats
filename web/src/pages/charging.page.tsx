import * as React from 'react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export function ChargingPage(): React.JSX.Element {
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
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Placeholder until charging module is wired.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted">No sessions yet.</div>
        </CardContent>
      </Card>
    </div>
  );
}


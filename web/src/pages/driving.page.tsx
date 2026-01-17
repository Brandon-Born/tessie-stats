import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { DrivingService } from '@/services/driving.service';
import { useVehiclesStore } from '@/stores/vehicles.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function DrivingPage(): React.JSX.Element {
    const selectedVehicleId = useVehiclesStore((state) => state.selectedVehicleId);

    const { data: sessions, isLoading } = useQuery({
        queryKey: ['driving-sessions', selectedVehicleId],
        queryFn: () => (selectedVehicleId ? DrivingService.getRecentSessions(selectedVehicleId) : []),
        enabled: !!selectedVehicleId,
    });

    if (!selectedVehicleId) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-muted-foreground">Select a vehicle to view driving history</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Driving History</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Trips</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading...</div>
                    ) : !sessions?.length ? (
                        <div className="py-8 text-center text-muted-foreground">No trips recorded yet.</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            Date
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            Duration
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            Distance
                                        </th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                            Battery Used
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {sessions.map((session) => (
                                        <tr
                                            key={session.id}
                                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                        >
                                            <td className="p-4 align-middle">
                                                {format(new Date(session.startedAt), 'MMM d, yyyy h:mm a')}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {session.durationMinutes ? `${session.durationMinutes} min` : '-'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {session.distanceMiles ? `${session.distanceMiles.toFixed(1)} mi` : '-'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {session.startBatteryLevel && session.endBatteryLevel
                                                    ? `${session.startBatteryLevel - session.endBatteryLevel}%`
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

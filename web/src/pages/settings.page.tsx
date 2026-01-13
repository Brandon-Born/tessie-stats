import * as React from 'react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal } from '@/components/ui';
import { useThemeStore } from '@/stores/theme.store';

export function SettingsPage(): React.JSX.Element {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Settings</h1>
          <p className="mt-1 text-sm text-muted">Authentication, sync settings, and preferences.</p>
        </div>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          Open modal
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Dark-first Tesla styling.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant={mode === 'dark' ? 'primary' : 'outline'} onClick={() => setMode('dark')}>
                Dark
              </Button>
              <Button variant={mode === 'light' ? 'primary' : 'outline'} onClick={() => setMode('light')}>
                Light
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sync</CardTitle>
              <CardDescription>Placeholders until backend sync config exists.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input label="Sync interval (minutes)" placeholder="5" inputMode="numeric" />
              <Button variant="primary">Save</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isOpen}
        title="Example modal"
        description="Use this for confirmations and settings flows."
        onClose={() => setIsOpen(false)}
      >
        <div className="text-sm text-muted">
          This is a styled modal using the app theme tokens and shared UI components.
        </div>
      </Modal>
    </div>
  );
}


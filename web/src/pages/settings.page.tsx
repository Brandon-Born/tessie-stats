import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal } from '@/components/ui';
import { useThemeStore } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export function SettingsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [authStatus, setAuthStatus] = React.useState<{
    authenticated: boolean;
    hasToken: boolean;
    message?: string;
  } | null>(null);
  const [scopeStatus, setScopeStatus] = React.useState<{ scopes: string[] | null } | null>(null);
  const [scopeError, setScopeError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check auth status on mount and handle OAuth callback result
  React.useEffect(() => {
    void checkAuthStatus();

    // Handle OAuth callback result from query params
    const authResult = searchParams.get('auth');
    if (authResult === 'success') {
      setMessage({ type: 'success', text: 'Tesla account connected successfully!' });
      // Clean up URL
      searchParams.delete('auth');
      setSearchParams(searchParams, { replace: true });
    } else if (authResult === 'error') {
      setMessage({ type: 'error', text: 'Failed to connect Tesla account. Please try again.' });
      // Clean up URL
      searchParams.delete('auth');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const status = await authService.getStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    }
  };

  const handleConnectTesla = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { url } = await authService.getAuthUrl();
      // Redirect to Tesla OAuth
      window.location.href = url;
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to start OAuth flow',
      });
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    if (!window.confirm('Are you sure you want to disconnect your Tesla account?')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await authService.deleteToken();
      setMessage({ type: 'success', text: result.message });
      void checkAuthStatus();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to disconnect',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckScopes = async (): Promise<void> => {
    setScopeError(null);
    try {
      const result = await authService.getScopes();
      setScopeStatus(result);
    } catch (error) {
      setScopeError(error instanceof Error ? error.message : 'Failed to fetch scopes');
      setScopeStatus(null);
    }
  };

  const handleLogout = (): void => {
    if (!window.confirm('Are you sure you want to log out?')) {
      return;
    }

    authService.logout();
    setAuthenticated(false);
    navigate('/login');
  };

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
              <CardTitle>Tesla Authentication</CardTitle>
              <CardDescription>
                Connect your Tesla account to enable vehicle and energy data syncing.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {authStatus && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    authStatus.authenticated
                      ? 'border-green-500/20 bg-green-500/10 text-green-400'
                      : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  <div className="font-medium">
                    {authStatus.authenticated ? '✓ Connected' : '⚠ Not Connected'}
                  </div>
                  {authStatus.message && (
                    <div className="mt-1 text-xs opacity-80">{authStatus.message}</div>
                  )}
                </div>
              )}

              {message && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    message.type === 'success'
                      ? 'border-green-500/20 bg-green-500/10 text-green-400'
                      : 'border-red-500/20 bg-red-500/10 text-red-400'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex gap-3">
                {!authStatus?.authenticated ? (
                  <Button
                    variant="primary"
                    onClick={() => void handleConnectTesla()}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Connecting...' : 'Connect Tesla Account'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => void handleDisconnect()}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                    <Button variant="outline" onClick={() => void handleCheckScopes()}>
                      Check scopes
                    </Button>
                  </>
                )}
              </div>

              {scopeStatus && (
                <div className="rounded-lg border border-border/40 bg-surface-2/40 px-4 py-3 text-xs text-muted">
                  <div className="font-medium text-text">Granted scopes</div>
                  <div className="mt-2">
                    {scopeStatus.scopes?.length
                      ? scopeStatus.scopes.join(', ')
                      : 'No scopes found in token.'}
                  </div>
                </div>
              )}
              {scopeError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                  {scopeError}
                </div>
              )}

              <div className="rounded-lg border border-border/40 bg-surface-2/40 p-4 text-xs text-muted">
                <div className="font-medium text-text mb-2">How it works:</div>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Click "Connect Tesla Account"</li>
                  <li>Log in with your Tesla credentials</li>
                  <li>Authorize Tessie Stats to access your data</li>
                  <li>You'll be redirected back here automatically</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your app authentication.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Log out to require password authentication on next visit.
              </p>
              <Button variant="outline" onClick={handleLogout}>
                Log Out
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

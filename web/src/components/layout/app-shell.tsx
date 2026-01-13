import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { useAuthStatus } from '@/hooks/use-auth-status';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/energy', label: 'Energy' },
  { to: '/charging', label: 'Charging' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/settings', label: 'Settings' },
];

export function AppShell(): React.JSX.Element {
  // Keep auth status fresh while the app is open (no-op until backend exists)
  useAuthStatus();

  return (
    <div className="min-h-screen bg-tesla-gradient">
      <Header />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-10 pt-6 md:grid-cols-[240px_1fr]">
        <Sidebar />
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Header(): React.JSX.Element {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-accent/15 ring-1 ring-accent/30" aria-hidden="true" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-text">Tessie Stats</div>
            <div className="text-xs text-muted">Tesla &amp; Powerwall</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill isAuthenticated={isAuthenticated} />
          <Button variant="outline" size="sm" onClick={toggle}>
            Theme: {mode}
          </Button>
        </div>
      </div>
    </header>
  );
}

function StatusPill({ isAuthenticated }: { isAuthenticated: boolean }): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        isAuthenticated
          ? 'border-battery/30 bg-battery/10 text-text'
          : 'border-border/60 bg-surface/50 text-muted'
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isAuthenticated ? 'bg-battery shadow-[0_0_18px_rgb(var(--ts-battery)/0.6)]' : 'bg-border'
        )}
        aria-hidden="true"
      />
      {isAuthenticated ? 'Tesla connected' : 'Not connected'}
    </div>
  );
}

function Sidebar(): React.JSX.Element {
  return (
    <aside className="md:sticky md:top-20 md:h-[calc(100vh-5rem)]">
      <nav className="rounded-2xl border border-border/50 bg-surface/60 p-2 backdrop-blur-md">
        <div className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Navigation
        </div>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                    isActive ? 'bg-accent/12 text-text ring-1 ring-accent/25' : 'text-muted hover:bg-surface/60 hover:text-text'
                  )
                }
                end={item.to === '/'}
              >
                <span>{item.label}</span>
                <span className="text-xs text-muted/70">→</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}


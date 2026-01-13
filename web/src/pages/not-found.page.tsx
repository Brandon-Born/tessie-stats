import * as React from 'react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/utils/cn';

export function NotFoundPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div>
            <CardTitle>Page not found</CardTitle>
            <CardDescription>The route you tried to visit doesn’t exist.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium',
                'bg-accent text-white hover:bg-accent/90 active:bg-accent/80',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
              )}
            >
              Go to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium',
                'border border-border/70 bg-transparent text-text hover:bg-surface/40 active:bg-surface/30',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
              )}
            >
              Back
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


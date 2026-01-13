import * as React from 'react';

import { cn } from '@/utils/cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-[3px]',
};

export function Spinner({ className, size = 'md', ...props }: SpinnerProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'animate-spin rounded-full border-border/60 border-t-text/80',
          SIZE[size]
        )}
      />
    </div>
  );
}


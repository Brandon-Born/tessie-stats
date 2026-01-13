import * as React from 'react';

import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function Input({
  className,
  containerClassName,
  label,
  error,
  helperText,
  id,
  ...props
}: InputProps): React.JSX.Element {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const describedById = (helperText ?? error) ? `${inputId}-help` : undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={cn(
          'h-10 w-full rounded-xl border bg-surface px-3 text-sm text-text placeholder:text-muted/70',
          'border-border/70 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30',
          error ? 'border-red-500/70 focus:border-red-500/70 focus:ring-red-500/20' : null,
          className
        )}
        {...props}
      />
      {(helperText ?? error) ? (
        <p id={describedById} className={cn('text-xs', error ? 'text-red-400' : 'text-muted')}>
          {error ?? helperText}
        </p>
      ) : null}
    </div>
  );
}


import * as React from 'react';

import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-[0_20px_40px_-25px_rgb(var(--ts-accent)/0.8)] hover:bg-accent/90 active:bg-accent/80',
  secondary: 'bg-surface-2 text-text hover:bg-surface-2/80 active:bg-surface-2/70',
  outline: 'border border-border/70 bg-transparent text-text hover:bg-surface/40 active:bg-surface/30',
  ghost: 'bg-transparent text-text hover:bg-surface/40 active:bg-surface/30',
  danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', isLoading = false, disabled, children, ...props },
  ref
): React.JSX.Element {
  const isDisabled = Boolean(disabled) || isLoading;

  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {isLoading ? <SpinnerInline /> : null}
      <span className={cn(isLoading ? 'opacity-90' : null)}>{children}</span>
    </button>
  );
});

function SpinnerInline(): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
    />
  );
}


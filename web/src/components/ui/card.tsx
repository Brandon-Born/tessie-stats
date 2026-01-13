import * as React from 'react';

import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps): React.JSX.Element {
  return <div className={cn('ts-card ts-card-inner', className)} {...props} />;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardHeaderProps): React.JSX.Element {
  return <div className={cn('mb-4 flex items-start justify-between gap-4', className)} {...props} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps): React.JSX.Element {
  return <h2 className={cn('text-lg font-semibold tracking-tight text-text', className)} {...props} />;
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...props }: CardDescriptionProps): React.JSX.Element {
  return <p className={cn('text-sm text-muted', className)} {...props} />;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...props }: CardContentProps): React.JSX.Element {
  return <div className={cn('text-sm text-text', className)} {...props} />;
}


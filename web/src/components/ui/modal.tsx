import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

export interface ModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  title,
  description,
  children,
  onClose,
  footer,
}: ModalProps): React.JSX.Element | null {
  React.useEffect((): (() => void) | void => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return (): void => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'w-full max-w-lg rounded-2xl border border-border/60 bg-surface shadow-[0_30px_100px_-60px_rgba(0,0,0,0.9)]'
          )}
        >
          {(title ?? description) && (
            <div className="border-b border-border/50 p-5">
              {title ? <h2 className="text-base font-semibold text-text">{title}</h2> : null}
              {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
            </div>
          )}
          <div className="p-5">{children}</div>
          <div className="flex items-center justify-end gap-3 border-t border-border/50 p-4">
            {footer ?? <Button onClick={onClose}>Close</Button>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


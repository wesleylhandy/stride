'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Modal title
   */
  title?: string;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Size of the modal
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal component
 * 
 * A simple modal/dialog component with backdrop and close functionality.
 * Uses React Portal for proper rendering.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = 'md',
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  // Handle mount for portal
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle ESC key
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close if clicking the backdrop (not the content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  if (!open || !mounted) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full',
          'bg-surface dark:bg-surface-dark',
          'border border-border dark:border-border-dark',
          'rounded-lg shadow-xl',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'mt-[5vh]',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border dark:border-border-dark">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-foreground dark:text-foreground-dark"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark transition-colors rounded-md p-1 hover:bg-background-secondary dark:hover:bg-background-dark-secondary"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}


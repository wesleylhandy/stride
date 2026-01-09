'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface AuthErrorProps {
  error?: string | null;
  className?: string;
}

/**
 * AuthError component - Display authentication errors with proper styling and ARIA attributes
 * 
 * Provides accessible error display for authentication forms with:
 * - Proper ARIA attributes for screen readers
 * - Dark mode support
 * - Consistent error styling
 */
export const AuthError = React.forwardRef<HTMLDivElement, AuthErrorProps>(
  ({ error, className }, ref) => {
    if (!error) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md bg-red-50 dark:bg-red-900/20 p-4',
          className
        )}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }
);

AuthError.displayName = 'AuthError';

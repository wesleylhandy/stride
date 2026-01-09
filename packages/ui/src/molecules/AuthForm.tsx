'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface AuthFormProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
  themeToggle?: React.ReactNode;
}

/**
 * AuthForm component - Reusable form structure for authentication pages
 * 
 * Provides consistent form structure with:
 * - Centered card layout (max-width 400px)
 * - Title and optional subtitle
 * - Dark mode support
 * - Error display area
 * - Loading state handling
 */
export const AuthForm = React.forwardRef<HTMLFormElement, AuthFormProps>(
  (
    {
      title,
      subtitle,
      children,
      onSubmit,
      loading = false,
      error,
      className,
      themeToggle,
    },
    ref
  ) => {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background-secondary dark:bg-background-dark px-4 py-12 sm:px-6 lg:px-8">
        {/* Theme toggle in top-right corner */}
        {themeToggle && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            {themeToggle}
          </div>
        )}
        <div className="w-full max-w-md space-y-8 mx-auto">
          <div>
            <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-center text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                {subtitle}
              </p>
            )}
          </div>
          <form
            ref={ref}
            className={cn(
              'mt-8 rounded-lg bg-surface dark:bg-surface-dark px-6 py-8 shadow-md space-y-6',
              className
            )}
            onSubmit={onSubmit}
          >
            {error && (
              <div
                className="rounded-md bg-red-50 dark:bg-red-900/20 p-4"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}
            <fieldset disabled={loading} className="space-y-6">
              {children}
            </fieldset>
          </form>
        </div>
      </div>
    );
  }
);

AuthForm.displayName = 'AuthForm';

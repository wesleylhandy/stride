'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, icon, label, ...props }, ref) => {
    const baseStyles =
      'flex min-h-[44px] w-full rounded-md border bg-background dark:bg-background-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted dark:placeholder:text-foreground-dark-muted focus:text-foreground dark:focus:text-foreground-dark focus-visible:text-foreground dark:focus-visible:text-foreground-dark focus-ring disabled:cursor-not-allowed disabled:opacity-50';

    const errorStyles = error
      ? 'border-error dark:border-error-dark focus-visible:ring-error dark:focus-visible:ring-error-dark'
      : 'border-border dark:border-border-dark hover:border-border-hover dark:hover:border-border-dark-hover focus-visible:border-border-focus dark:focus-visible:border-border-dark-focus';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium mb-1 text-foreground dark:text-foreground-dark"
          >
            {label}
            {props.required && (
              <span className="text-error dark:text-error-dark" aria-label="required">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary dark:text-foreground-dark-secondary">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              baseStyles,
              errorStyles,
              icon && 'pl-10',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={props.id ? `${props.id}-error` : undefined}
            className="mt-1 text-sm text-error dark:text-error-dark"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };


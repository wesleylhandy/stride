'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, icon, ...props }, ref) => {
    const baseStyles =
      'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted focus-ring disabled:cursor-not-allowed disabled:opacity-50';

    const errorStyles = error
      ? 'border-error focus-visible:ring-error'
      : 'border-border hover:border-border-hover focus-visible:border-border-focus';

    return (
      <div className="relative w-full">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
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
        {error && (
          <p
            id={props.id ? `${props.id}-error` : undefined}
            className="mt-1 text-sm text-error"
            role="alert"
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


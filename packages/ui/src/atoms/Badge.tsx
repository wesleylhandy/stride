'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className }, ref) => {
    const baseStyles =
      'inline-flex items-center rounded-full font-medium transition-colors';

    const variantStyles = {
      default:
        'bg-background-secondary text-foreground border border-border',
      success:
        'bg-success-light text-success-dark border border-success',
      warning:
        'bg-warning-light text-warning-dark border border-warning',
      error: 'bg-error-light text-error-dark border border-error',
      info: 'bg-info-light text-info-dark border border-info',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };


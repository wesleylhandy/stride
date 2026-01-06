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
        'bg-success-bg text-success border border-success/20',
      warning:
        'bg-warning-bg text-warning border border-warning/20',
      error: 'bg-error-bg text-error border border-error/20',
      info: 'bg-info-bg text-info border border-info/20',
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


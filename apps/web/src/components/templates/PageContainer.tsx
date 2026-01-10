import { ReactNode } from 'react';
import { cn } from '@stride/ui';

export type PageContainerVariant = 'full' | 'constrained' | 'custom';

export interface PageContainerProps {
  /**
   * Content to wrap
   */
  children: ReactNode;
  /**
   * Width variant:
   * - 'full': Full viewport width (for kanban boards, docs, wide tables)
   * - 'constrained': Max width with responsive scaling (for forms, detail pages)
   * - 'custom': No width constraints applied (parent controls width)
   */
  variant?: PageContainerVariant;
  /**
   * Custom max-width for 'custom' variant or to override default constrained width
   */
  maxWidth?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to include vertical padding
   */
  withPadding?: boolean;
}

/**
 * PageContainer component
 * 
 * Provides consistent width management for page content.
 * Handles responsive max-widths from large screens down to mobile.
 * 
 * Usage:
 * - Full-width pages (kanban, docs, projects list): variant="full"
 * - Constrained pages (settings, forms, detail pages): variant="constrained"
 * - Custom width: variant="custom" with maxWidth prop
 * 
 * Best Practices:
 * - Use 'full' for data-dense views that benefit from width (kanban, tables, docs)
 * - Use 'constrained' for forms and content-heavy pages (improves readability)
 * - Use 'custom' when you need specific control
 */
export function PageContainer({
  children,
  variant = 'constrained',
  maxWidth,
  className,
  withPadding = true,
}: PageContainerProps) {
  const getMaxWidthClasses = () => {
    if (variant === 'full') {
      // Full width with reasonable maximum to prevent excessive width
      return 'max-w-none xl:max-w-[1600px] 2xl:max-w-[1920px]';
    }
    if (variant === 'constrained') {
      // Responsive constrained width optimized for readability
      return 'max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px]';
    }
    // Custom variant - use maxWidth prop or no constraint
    return maxWidth ? undefined : 'max-w-none';
  };

  const maxWidthStyle = variant === 'custom' && maxWidth ? { maxWidth } : undefined;

  return (
    <div
      className={cn(
        'mx-auto w-full',
        getMaxWidthClasses(),
        withPadding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
      style={maxWidthStyle}
    >
      {children}
    </div>
  );
}

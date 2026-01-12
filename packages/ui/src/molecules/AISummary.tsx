'use client';

import { cn } from '../utils/cn';

export interface AISummaryProps {
  /**
   * Plain-language root cause summary from AI
   */
  summary: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * AISummary component
 * Displays plain-language root cause summary from AI triage analysis
 */
export function AISummary({
  summary,
  className,
}: AISummaryProps) {
  return (
    <div
      className={cn(
        'p-4 bg-background-secondary dark:bg-background-dark-secondary',
        'rounded-lg border border-border dark:border-border-dark',
        className
      )}
    >
      <h3 className="text-sm font-semibold mb-2 text-foreground dark:text-foreground-dark">
        Root Cause Analysis
      </h3>
      <p className="text-sm text-foreground dark:text-foreground-dark leading-relaxed whitespace-pre-wrap">
        {summary}
      </p>
    </div>
  );
}

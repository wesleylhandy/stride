/**
 * Root Cause Dashboard component
 * T252-T258: Display error traces, stack traces, error frequency, last occurrence, error aggregation
 */

'use client';

import * as React from 'react';
import { Badge } from '../atoms/Badge';
import { cn } from '../utils/cn';

export interface ErrorTraceData {
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  environment?: string;
  release?: string;
  tags?: Record<string, string>;
  context?: Record<string, unknown>;
  fingerprint?: string;
  stackTrace?: string;
  occurrenceCount?: number;
}

export interface RootCauseDashboardProps {
  /**
   * Error trace data from issue customFields
   */
  errorTrace?: ErrorTraceData;
  /**
   * Array of all error trace occurrences
   */
  errorTraces?: Array<Omit<ErrorTraceData, 'occurrenceCount'>>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

/**
 * Get badge variant for severity
 */
function getSeverityVariant(
  severity: 'low' | 'medium' | 'high' | 'critical',
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Syntax highlight stack trace (basic implementation)
 * T254: Show stack traces with syntax highlighting
 */
function highlightStackTrace(stackTrace: string): React.ReactNode {
  const lines = stackTrace.split('\n');
  
  return (
    <pre className="text-xs font-mono bg-background-secondary p-4 rounded-lg border border-border overflow-x-auto">
      <code>
        {lines.map((line, index) => {
          // Highlight error type
          if (line.includes(':') && index === 0) {
            const [errorType, ...rest] = line.split(':');
            return (
              <React.Fragment key={index}>
                <span className="text-error font-semibold">{errorType}:</span>
                <span className="text-foreground">{rest.join(':')}</span>
                {'\n'}
              </React.Fragment>
            );
          }
          
          // Highlight file paths
          if (line.includes('(') && line.includes(')')) {
            const match = line.match(/^(\s+at\s+)(.+?)(\s+\((.+?)\))$/);
            if (match) {
              const [, prefix, functionName, suffix, filePath] = match;
              return (
                <React.Fragment key={index}>
                  <span className="text-foreground-secondary">{prefix}</span>
                  <span className="text-primary">{functionName}</span>
                  <span className="text-foreground-secondary">{suffix}</span>
                  <span className="text-foreground">{filePath}</span>
                  {'\n'}
                </React.Fragment>
              );
            }
          }
          
          return (
            <React.Fragment key={index}>
              <span className="text-foreground">{line}</span>
              {'\n'}
            </React.Fragment>
          );
        })}
      </code>
    </pre>
  );
}

/**
 * Root Cause Dashboard component
 * 
 * Displays error diagnostic information including stack traces, frequency, and metadata.
 * T252: Display error traces
 * T253: Show stack traces with syntax highlighting
 * T254: Display error frequency
 * T255: Show last occurrence time
 * T256: Add error aggregation
 */
export function RootCauseDashboard({
  errorTrace,
  errorTraces = [],
  className,
}: RootCauseDashboardProps) {
  // If no error trace data, don't render
  if (!errorTrace && errorTraces.length === 0) {
    return null;
  }

  // Use errorTrace if available, otherwise use latest from errorTraces
  const displayTrace = errorTrace || (errorTraces.length > 0 ? errorTraces[errorTraces.length - 1] : null);
  
  if (!displayTrace) {
    return null;
  }

  // Calculate frequency from errorTraces array
  const frequency = errorTrace?.occurrenceCount || errorTraces.length || 1;
  
  // Get last occurrence time
  const lastOccurrence = errorTrace?.timestamp || displayTrace.timestamp;
  
  // Aggregate error information
  const services = React.useMemo(() => {
    const serviceSet = new Set<string>();
    if (errorTrace) serviceSet.add(errorTrace.service);
    errorTraces.forEach(trace => serviceSet.add(trace.service));
    return Array.from(serviceSet);
  }, [errorTrace, errorTraces]);

  const environments = React.useMemo(() => {
    const envSet = new Set<string>();
    if (errorTrace?.environment) envSet.add(errorTrace.environment);
    errorTraces.forEach(trace => {
      if (trace.environment) envSet.add(trace.environment);
    });
    return Array.from(envSet);
  }, [errorTrace, errorTraces]);

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold mb-4">Root Cause Diagnostics</h3>
        
        {/* Error Summary */}
        <div className="p-4 bg-background-secondary rounded-lg border border-border mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service */}
            <div>
              <label className="text-sm font-medium text-foreground-secondary block mb-1">
                Service
              </label>
              <div className="flex items-center gap-2">
                <Badge variant="info">{displayTrace.service}</Badge>
                {services.length > 1 && (
                  <span className="text-xs text-foreground-secondary">
                    (+{services.length - 1} more)
                  </span>
                )}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="text-sm font-medium text-foreground-secondary block mb-1">
                Severity
              </label>
              <Badge variant={getSeverityVariant(displayTrace.severity)}>
                {displayTrace.severity.toUpperCase()}
              </Badge>
            </div>

            {/* Frequency */}
            <div>
              <label className="text-sm font-medium text-foreground-secondary block mb-1">
                Occurrences
              </label>
              <p className="text-foreground font-semibold">{frequency}</p>
            </div>
          </div>

          {/* Last Occurrence */}
          <div className="mt-4 pt-4 border-t border-border">
            <label className="text-sm font-medium text-foreground-secondary block mb-1">
              Last Occurrence
            </label>
            <p className="text-foreground">{formatDate(lastOccurrence)}</p>
          </div>

          {/* Environment & Release */}
          {(displayTrace.environment || displayTrace.release || environments.length > 0) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayTrace.environment && (
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary block mb-1">
                      Environment
                    </label>
                    <p className="text-foreground">{displayTrace.environment}</p>
                    {environments.length > 1 && (
                      <p className="text-xs text-foreground-secondary mt-1">
                        Also seen in: {environments.filter(e => e !== displayTrace.environment).join(', ')}
                      </p>
                    )}
                  </div>
                )}
                {displayTrace.release && (
                  <div>
                    <label className="text-sm font-medium text-foreground-secondary block mb-1">
                      Release
                    </label>
                    <p className="text-foreground">{displayTrace.release}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {displayTrace.tags && Object.keys(displayTrace.tags).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className="text-sm font-medium text-foreground-secondary block mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(displayTrace.tags).map(([key, value]) => (
                  <Badge key={key} variant="default">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stack Trace */}
        {displayTrace.stackTrace && (
          <div>
            <label className="text-sm font-medium text-foreground-secondary block mb-2">
              Stack Trace
            </label>
            {highlightStackTrace(displayTrace.stackTrace)}
          </div>
        )}

        {/* Additional Context */}
        {displayTrace.context && Object.keys(displayTrace.context).length > 0 && (
          <div>
            <label className="text-sm font-medium text-foreground-secondary block mb-2">
              Additional Context
            </label>
            <pre className="text-xs font-mono bg-background-secondary p-4 rounded-lg border border-border overflow-x-auto">
              <code>
                {JSON.stringify(displayTrace.context, null, 2)}
              </code>
            </pre>
          </div>
        )}

        {/* Error History (if multiple occurrences) */}
        {errorTraces.length > 1 && (
          <div>
            <label className="text-sm font-medium text-foreground-secondary block mb-2">
              Error History ({errorTraces.length} occurrences)
            </label>
            <div className="space-y-2">
              {errorTraces.slice(-10).reverse().map((trace, index) => (
                <div
                  key={index}
                  className="p-3 bg-background-secondary rounded border border-border text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-foreground-secondary">
                      {formatDate(trace.timestamp)}
                    </span>
                    <Badge variant={getSeverityVariant(trace.severity)}>
                      {trace.severity}
                    </Badge>
                  </div>
                  {trace.environment && (
                    <span className="text-xs text-foreground-secondary">
                      Environment: {trace.environment}
                    </span>
                  )}
                </div>
              ))}
              {errorTraces.length > 10 && (
                <p className="text-xs text-foreground-secondary text-center">
                  Showing last 10 of {errorTraces.length} occurrences
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


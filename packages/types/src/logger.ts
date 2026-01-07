/**
 * Structured JSON logging utilities
 *
 * Provides type-safe logging interfaces for structured JSON logging.
 * All logs are output as JSON to stdout for log aggregation systems.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: LogContext;
}

/**
 * Creates a structured log entry
 */
export function createLogEntry(
  level: LogLevel,
  message: string,
  options?: {
    requestId?: string;
    userId?: string;
    error?: Error;
    context?: LogContext;
  }
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (options?.requestId) {
    entry.requestId = options.requestId;
  }

  if (options?.userId) {
    entry.userId = options.userId;
  }

  if (options?.error) {
    entry.error = {
      name: options.error.name,
      message: options.error.message,
      stack: options.error.stack,
    };
  }

  if (options?.context) {
    entry.context = options.context;
  }

  return entry;
}

/**
 * Serializes a log entry to JSON string
 */
export function serializeLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}






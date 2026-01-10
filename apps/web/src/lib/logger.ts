import {
  type LogLevel,
  type LogContext,
  createLogEntry,
  serializeLogEntry,
} from '@stride/types';
import { headers } from 'next/headers';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Application metadata for log aggregation
 */
const APP_METADATA = {
  service: 'stride-web',
  version: process.env.APP_VERSION || 'unknown',
  environment: process.env.NODE_ENV || 'development',
};

/**
 * Log level hierarchy for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Gets the configured log level from environment
 */
function getLogLevel(): LogLevel {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  if (envLevel in LOG_LEVELS) {
    return envLevel;
  }
  return 'info';
}

/**
 * Checks if a log level should be output based on configured level
 */
function shouldLog(level: LogLevel): boolean {
  const configuredLevel = getLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
}

/**
 * Gets the current request ID from headers
 */
async function getRequestId(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return headersList.get(REQUEST_ID_HEADER) ?? undefined;
  } catch {
    // Not in a request context (e.g., background job)
    return undefined;
  }
}

/**
 * Gets the current user ID from context (if available)
 */
async function getUserId(): Promise<string | undefined> {
  // TODO: Extract from session/auth context when auth is implemented
  // For now, return undefined
  return undefined;
}

/**
 * Outputs a log entry to stdout as JSON for log aggregation
 * 
 * Log aggregation systems (Docker logs, Kubernetes logs, ELK, Datadog, etc.)
 * capture stdout and parse JSON logs. This ensures all logs are properly
 * structured for aggregation, filtering, and analysis.
 */
function outputLog(entry: ReturnType<typeof createLogEntry>): void {
  // Add application metadata for log aggregation
  const enrichedEntry = {
    ...entry,
    service: APP_METADATA.service,
    version: APP_METADATA.version,
    environment: APP_METADATA.environment,
  };

  const json = JSON.stringify(enrichedEntry);
  // Output to stdout for log aggregation systems
  // Docker, Kubernetes, and log shippers automatically capture stdout
  process.stdout.write(`${json}\n`);
}

/**
 * Logger class for structured JSON logging
 */
class Logger {
  /**
   * Logs a debug message
   * 
   * Debug logs are filtered based on LOG_LEVEL environment variable
   */
  async debug(message: string, context?: LogContext): Promise<void> {
    // Check log level before processing
    if (!shouldLog('debug')) {
      return;
    }

    const requestId = await getRequestId();
    const userId = await getUserId();

    const entry = createLogEntry('debug', message, {
      requestId,
      userId,
      context,
    });

    outputLog(entry);
  }

  /**
   * Logs an info message
   * 
   * Info logs are included by default and filtered based on LOG_LEVEL
   */
  async info(message: string, context?: LogContext): Promise<void> {
    // Check log level before processing
    if (!shouldLog('info')) {
      return;
    }

    const requestId = await getRequestId();
    const userId = await getUserId();

    const entry = createLogEntry('info', message, {
      requestId,
      userId,
      context,
    });

    outputLog(entry);
  }

  /**
   * Logs a warning message
   * 
   * Warning logs are included by default and filtered based on LOG_LEVEL
   */
  async warn(message: string, context?: LogContext): Promise<void> {
    // Check log level before processing
    if (!shouldLog('warn')) {
      return;
    }

    const requestId = await getRequestId();
    const userId = await getUserId();

    const entry = createLogEntry('warn', message, {
      requestId,
      userId,
      context,
    });

    outputLog(entry);
  }

  /**
   * Logs an error message
   * 
   * Error logs are always included (highest priority) and should be
   * captured by log aggregation systems for alerting and monitoring
   */
  async error(
    message: string,
    error?: Error,
    context?: LogContext
  ): Promise<void> {
    // Errors are always logged (highest priority)
    // No need to check log level for errors

    const requestId = await getRequestId();
    const userId = await getUserId();

    const entry = createLogEntry('error', message, {
      requestId,
      userId,
      error,
      context,
    });

    outputLog(entry);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Creates a logger with a default context
 */
export function createLogger(defaultContext: LogContext): Logger {
  return {
    async debug(message: string, context?: LogContext): Promise<void> {
      return logger.debug(message, { ...defaultContext, ...context });
    },
    async info(message: string, context?: LogContext): Promise<void> {
      return logger.info(message, { ...defaultContext, ...context });
    },
    async warn(message: string, context?: LogContext): Promise<void> {
      return logger.warn(message, { ...defaultContext, ...context });
    },
    async error(
      message: string,
      error?: Error,
      context?: LogContext
    ): Promise<void> {
      return logger.error(message, error, { ...defaultContext, ...context });
    },
  };
}


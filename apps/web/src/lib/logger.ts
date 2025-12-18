import {
  type LogLevel,
  type LogContext,
  createLogEntry,
  serializeLogEntry,
} from '@stride/types';
import { headers } from 'next/headers';

const REQUEST_ID_HEADER = 'x-request-id';

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
 * Outputs a log entry to stdout as JSON
 */
function outputLog(entry: ReturnType<typeof createLogEntry>): void {
  const json = serializeLogEntry(entry);
  // Output to stdout for log aggregation
  process.stdout.write(`${json}\n`);
}

/**
 * Logger class for structured JSON logging
 */
class Logger {
  /**
   * Logs a debug message
   */
  async debug(message: string, context?: LogContext): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      // Skip debug logs in production
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
   */
  async info(message: string, context?: LogContext): Promise<void> {
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
   */
  async warn(message: string, context?: LogContext): Promise<void> {
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
   */
  async error(
    message: string,
    error?: Error,
    context?: LogContext
  ): Promise<void> {
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


/**
 * Error tracking setup
 *
 * Provides error tracking integration with Sentry and fallback error logging.
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';

export interface ErrorTrackingOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  enabled?: boolean;
}

class ErrorTracker {
  private options: ErrorTrackingOptions;
  private initialized: boolean = false;
  private userContext?: { userId: string; email?: string; username?: string };

  constructor(options: ErrorTrackingOptions = {}) {
    this.options = {
      enabled: process.env.ERROR_TRACKING_ENABLED === 'true',
      environment: process.env.NODE_ENV || 'development',
      release: process.env.APP_VERSION,
      ...options,
    };
  }

  /**
   * Initializes error tracking
   */
  async initialize(): Promise<void> {
    if (!this.options.enabled || !this.options.dsn) {
      await logger.info('Error tracking disabled or DSN not configured');
      return;
    }

    // Sentry is initialized via sentry.client.config.ts, sentry.server.config.ts, and sentry.edge.config.ts
    // This method just verifies that tracking is enabled
    await logger.info('Error tracking initialized', {
      environment: this.options.environment,
      release: this.options.release,
      dsnConfigured: !!this.options.dsn,
    });

    this.initialized = true;
  }

  /**
   * Captures an error
   */
  async captureError(
    error: Error,
    context?: {
      requestId?: string;
      userId?: string;
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    }
  ): Promise<void> {
    // Always log to our structured logger
    await logger.error('Error captured', error, {
      requestId: context?.requestId,
      userId: context?.userId,
      tags: context?.tags,
      extra: context?.extra,
    });

    if (!this.initialized || !this.options.enabled) {
      return;
    }

    // Capture error in Sentry
    try {
      Sentry.captureException(error, {
        tags: context?.tags,
        extra: {
          ...context?.extra,
          requestId: context?.requestId,
        },
        user: context?.userId
          ? {
              id: context.userId,
              ...(this.userContext || {}),
            }
          : this.userContext
            ? {
                id: this.userContext.userId,
                email: this.userContext.email,
                username: this.userContext.username,
              }
            : undefined,
      });
    } catch (sentryError) {
      // Fallback: log if Sentry capture fails
      await logger.warn('Failed to capture error in Sentry', {
        error: sentryError instanceof Error ? sentryError.message : String(sentryError),
        stack: sentryError instanceof Error ? sentryError.stack : undefined,
      });
    }
  }

  /**
   * Captures a message (non-error)
   */
  async captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: {
      requestId?: string;
      userId?: string;
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    }
  ): Promise<void> {
    // Always log to our structured logger
    if (level === 'error') {
      await logger.error(message, undefined, {
        requestId: context?.requestId,
        userId: context?.userId,
        tags: context?.tags,
        extra: context?.extra,
      });
    } else if (level === 'warning') {
      await logger.warn(message, {
        requestId: context?.requestId,
        userId: context?.userId,
        tags: context?.tags,
        extra: context?.extra,
      });
    } else {
      await logger.info(message, {
        requestId: context?.requestId,
        userId: context?.userId,
        tags: context?.tags,
        extra: context?.extra,
      });
    }

    if (!this.initialized || !this.options.enabled) {
      return;
    }

    // Capture message in Sentry
    try {
      const sentryLevel: Sentry.SeverityLevel =
        level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info';

      Sentry.captureMessage(message, {
        level: sentryLevel,
        tags: context?.tags,
        extra: {
          ...context?.extra,
          requestId: context?.requestId,
        },
        user: context?.userId
          ? {
              id: context.userId,
              ...(this.userContext || {}),
            }
          : this.userContext
            ? {
                id: this.userContext.userId,
                email: this.userContext.email,
                username: this.userContext.username,
              }
            : undefined,
      });
    } catch (sentryError) {
      // Fallback: log if Sentry capture fails
      await logger.warn('Failed to capture message in Sentry', {
        error: sentryError instanceof Error ? sentryError.message : String(sentryError),
        stack: sentryError instanceof Error ? sentryError.stack : undefined,
      });
    }
  }

  /**
   * Sets user context for error tracking
   */
  setUser(userId: string, email?: string, username?: string): void {
    if (!this.initialized || !this.options.enabled) {
      return;
    }

    // Store user context
    this.userContext = { userId, email, username };

    // Set user context in Sentry
    try {
      Sentry.setUser({
        id: userId,
        email,
        username,
      });
    } catch (sentryError) {
      // Fallback: log if Sentry setUser fails
      logger.warn('Failed to set user context in Sentry', {
        error: sentryError instanceof Error ? sentryError.message : String(sentryError),
        stack: sentryError instanceof Error ? sentryError.stack : undefined,
      });
    }
  }

  /**
   * Clears user context
   */
  clearUser(): void {
    if (!this.initialized || !this.options.enabled) {
      return;
    }

    this.userContext = undefined;

    // Clear user context in Sentry
    try {
      Sentry.setUser(null);
    } catch (sentryError) {
      // Fallback: log if Sentry clearUser fails
      logger.warn('Failed to clear user context in Sentry', {
        error: sentryError instanceof Error ? sentryError.message : String(sentryError),
        stack: sentryError instanceof Error ? sentryError.stack : undefined,
      });
    }
  }
}

/**
 * Global error tracker instance
 */
export const errorTracker = new ErrorTracker({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  enabled: process.env.ERROR_TRACKING_ENABLED === 'true',
});

/**
 * Initializes error tracking on application startup
 */
export async function initializeErrorTracking(): Promise<void> {
  await errorTracker.initialize();
}

/**
 * Helper to capture errors with request context
 */
export async function captureErrorWithContext(
  error: Error,
  requestId?: string,
  userId?: string
): Promise<void> {
  await errorTracker.captureError(error, {
    requestId,
    userId,
  });
}


/**
 * Error tracking setup
 *
 * Provides error tracking integration with external services (Sentry, etc.)
 * and fallback error logging.
 */

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
    if (!this.options.enabled) {
      await logger.info('Error tracking disabled');
      return;
    }

    // TODO: Initialize Sentry or other error tracking service
    // For now, just log that tracking is enabled
    await logger.info('Error tracking initialized', {
      environment: this.options.environment,
      release: this.options.release,
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

    // TODO: Send to Sentry or other error tracking service
    // Example:
    // if (this.sentryClient) {
    //   this.sentryClient.captureException(error, {
    //     tags: context?.tags,
    //     extra: context?.extra,
    //     user: context?.userId ? { id: context.userId } : undefined,
    //   });
    // }
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

    // TODO: Send to Sentry or other error tracking service
  }

  /**
   * Sets user context for error tracking
   */
  setUser(userId: string, email?: string, username?: string): void {
    if (!this.initialized || !this.options.enabled) {
      return;
    }

    // Store user context for later use (will be used when Sentry is integrated)
    this.userContext = { userId, email, username };

    // TODO: Set user context in Sentry
    // When Sentry is integrated, use: this.userContext
    // Example:
    // if (this.sentryClient) {
    //   this.sentryClient.setUser({
    //     id: userId,
    //     email,
    //     username,
    //   });
    // }
  }

  /**
   * Clears user context
   */
  clearUser(): void {
    if (!this.initialized || !this.options.enabled) {
      return;
    }

    // TODO: Clear user context in Sentry
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


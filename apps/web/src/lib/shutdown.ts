/**
 * Graceful shutdown handler
 * 
 * Handles clean shutdown of the application on SIGTERM, SIGINT signals
 * Ensures database connections are closed and resources are cleaned up
 */

import { disconnectDatabase } from '@stride/database';
import { logger } from './logger';

type ShutdownHandler = () => Promise<void> | void;

class GracefulShutdown {
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30 seconds default timeout

  /**
   * Register a shutdown handler
   */
  register(handler: ShutdownHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Execute all registered shutdown handlers
   */
  private async executeHandlers(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    await logger.info('Starting graceful shutdown...');

    // Execute all handlers in parallel, but wait for all to complete
    const results = await Promise.allSettled(
      this.handlers.map(async (handler) => {
        try {
          await handler();
        } catch (error) {
          await logger.error(
            'Shutdown handler failed',
            error instanceof Error ? error : undefined
          );
        }
      })
    );

    // Check if any handlers failed
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      await logger.warn(`Some shutdown handlers failed: ${failed.length}`, {
        failedCount: failed.length,
      });
    }

    await logger.info('Graceful shutdown complete');
  }

  /**
   * Initiate shutdown process
   */
  async shutdown(): Promise<void> {
    // Set timeout to force exit if shutdown takes too long
    const timeoutId = setTimeout(() => {
      logger.error(
        'Shutdown timeout exceeded, forcing exit',
        undefined
      ).then(() => {
        process.exit(1);
      });
    }, this.shutdownTimeout);

    try {
      await this.executeHandlers();
      clearTimeout(timeoutId);
      process.exit(0);
    } catch (error) {
      clearTimeout(timeoutId);
      await logger.error(
        'Error during shutdown',
        error instanceof Error ? error : undefined
      );
      process.exit(1);
    }
  }

  /**
   * Setup signal handlers
   */
  setup(): void {
    // Handle SIGTERM (termination signal from Docker, Kubernetes, etc.)
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, initiating graceful shutdown...').then(() => {
        this.shutdown();
      });
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, initiating graceful shutdown...').then(() => {
        this.shutdown();
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      await logger.error('Uncaught exception', error);
      await this.shutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      await logger.error(
        'Unhandled promise rejection',
        reason instanceof Error ? reason : new Error(String(reason)),
        { promise: String(promise) }
      );
      // In production, we might want to shutdown on unhandled rejections
      // For now, just log it
    });
  }
}

/**
 * Global graceful shutdown instance
 */
const gracefulShutdown = new GracefulShutdown();

/**
 * Register default shutdown handlers
 */
function registerDefaultHandlers(): void {
  // Disconnect from database
  gracefulShutdown.register(async () => {
    await logger.info('Disconnecting from database...');
    try {
      await disconnectDatabase();
      await logger.info('Database disconnected successfully');
    } catch (error) {
      await logger.error(
        'Failed to disconnect from database',
        error instanceof Error ? error : undefined
      );
    }
  });

  // Close any other connections or cleanup tasks can be added here
}

/**
 * Initialize graceful shutdown handlers
 * 
 * This should be called at application startup
 */
export function initializeGracefulShutdown(): void {
  registerDefaultHandlers();
  gracefulShutdown.setup();

  logger.info('Graceful shutdown handlers initialized').catch(() => {
    // Fallback if logger fails
    console.log('Graceful shutdown handlers initialized');
  });
}

// Auto-initialize on module load (only on server side)
if (typeof window === 'undefined') {
  // Only initialize once (check if already initialized)
  if (!process.env.STRIDE_SHUTDOWN_INITIALIZED) {
    process.env.STRIDE_SHUTDOWN_INITIALIZED = 'true';
    initializeGracefulShutdown();
  }
}

/**
 * Manually trigger shutdown (useful for testing or manual shutdown)
 */
export async function triggerShutdown(): Promise<void> {
  await gracefulShutdown.shutdown();
}

/**
 * Register a custom shutdown handler
 */
export function registerShutdownHandler(handler: ShutdownHandler): void {
  gracefulShutdown.register(handler);
}

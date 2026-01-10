/**
 * Sentry Server Configuration
 * 
 * This file configures Sentry for the server-side bundle (Node.js)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.APP_VERSION || undefined,
  
  // Enable tracing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Filter out localhost in development
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }
    return event;
  },
  
  // Integrations
  integrations: [],
  
  // Configure which errors to ignore
  ignoreErrors: [
    // Common database connection errors that might be transient
    'ECONNREFUSED',
    'ETIMEDOUT',
    // Prisma errors that are expected
    'P2002', // Unique constraint violation
    'P2025', // Record not found
  ],
});

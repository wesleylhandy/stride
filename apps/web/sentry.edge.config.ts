/**
 * Sentry Edge Configuration
 * 
 * This file configures Sentry for the edge runtime (middleware, edge functions)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.APP_VERSION || undefined,
  
  // Lower trace sample rate for edge (cost optimization)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Filter out localhost in development
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }
    return event;
  },
});

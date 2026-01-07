'use client';

import { useEffect } from 'react';

/**
 * Suppress non-critical Next.js internal errors
 * These are known issues with Next.js 16.0.10 + React 19
 * 
 * Errors suppressed:
 * - Performance API negative timestamp errors (Next.js internal)
 * - ViewportBoundary bundler warnings (React Server Components)
 * 
 * Only active in development mode
 */
export function ErrorSuppressor() {
  useEffect(() => {
    // Only suppress in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const originalError = console.error;
    const originalWarn = console.warn;

    // Suppress specific Next.js internal errors
    console.error = (...args: unknown[]) => {
      const message = args[0]?.toString() || '';
      
      // Suppress performance measure errors
      if (
        message.includes("Failed to execute 'measure' on 'Performance'") ||
        message.includes("cannot have a negative time stamp")
      ) {
        return; // Suppress these errors
      }
      
      // Suppress ViewportBoundary bundler warnings
      if (
        message.includes('ViewportBoundary') ||
        message.includes('React Client Manifest')
      ) {
        return; // Suppress these warnings
      }
      
      // Log everything else normally
      originalError.apply(console, args);
    };

    // Suppress specific warnings
    console.warn = (...args: unknown[]) => {
      const message = args[0]?.toString() || '';
      
      // Suppress ViewportBoundary bundler warnings
      if (
        message.includes('ViewportBoundary') ||
        message.includes('React Client Manifest')
      ) {
        return; // Suppress these warnings
      }
      
      // Log everything else normally
      originalWarn.apply(console, args);
    };

    // Also catch unhandled promise rejections for these specific errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || event.reason?.toString() || '';
      
      if (
        message.includes("Failed to execute 'measure' on 'Performance'") ||
        message.includes('ViewportBoundary') ||
        message.includes('React Client Manifest')
      ) {
        event.preventDefault(); // Suppress these rejections
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}


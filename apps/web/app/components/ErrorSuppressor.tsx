"use client";

import { useEffect } from "react";

/**
 * Suppress non-critical Next.js internal errors
 * These are known issues with Next.js 16.0.10 + React 19
 *
 * Errors suppressed:
 * - Performance API negative timestamp errors (Next.js internal)
 * - ViewportBoundary bundler warnings (React Server Components)
 *
 * Works in both development and production to prevent these known bugs
 * from affecting the user experience.
 */
export function ErrorSuppressor() {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    // Check if error message matches known Next.js bugs
    const isKnownNextJsBug = (message: string): boolean => {
      return (
        message.includes("Failed to execute 'measure' on 'Performance'") ||
        message.includes("cannot have a negative time stamp") ||
        message.includes("ViewportBoundary") ||
        message.includes("React Client Manifest")
      );
    };

    // Suppress specific Next.js internal errors in console
    console.error = (...args: unknown[]) => {
      const message = args[0]?.toString() || "";

      if (isKnownNextJsBug(message)) {
        return; // Suppress these errors
      }

      // Log everything else normally
      originalError.apply(console, args);
    };

    // Suppress specific warnings
    console.warn = (...args: unknown[]) => {
      const message = args[0]?.toString() || "";

      if (isKnownNextJsBug(message)) {
        return; // Suppress these warnings
      }

      // Log everything else normally
      originalWarn.apply(console, args);
    };

    // Catch global JavaScript runtime errors (window.onerror)
    const originalOnError = window.onerror;
    window.onerror = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean => {
      const errorMessage =
        typeof message === "string" ? message : error?.message || "";

      if (isKnownNextJsBug(errorMessage)) {
        return true; // Suppress the error
      }

      // Call original handler if it exists
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }

      return false; // Let other errors bubble up
    };

    // Catch resource loading errors (addEventListener('error'))
    const handleResourceError = (event: ErrorEvent): void => {
      const message = event.message || event.error?.message || "";

      if (isKnownNextJsBug(message)) {
        event.preventDefault(); // Suppress the error
      }
    };

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const message = event.reason?.message || event.reason?.toString() || "";

      if (isKnownNextJsBug(message)) {
        event.preventDefault(); // Suppress these rejections
      }
    };

    window.addEventListener("error", handleResourceError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.onerror = originalOnError;
      window.removeEventListener("error", handleResourceError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return null; // This component doesn't render anything
}

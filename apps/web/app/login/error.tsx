"use client";

import { useEffect } from 'react';
import { Button } from '@stride/ui';
import Link from 'next/link';

/**
 * Login Page Error Boundary
 * 
 * Handles unexpected errors on the login page gracefully with user-friendly error messages.
 * 
 * Features:
 * - User-friendly error display
 * - Retry functionality
 * - Navigation options
 * - Error logging for debugging
 */
export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Enhanced error logging for debugging
    console.error('Login page error:', {
      error,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      path: '/login',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    });
  }, [error]);

  // Determine user-friendly error message
  const getErrorMessage = (): {
    title: string;
    message: string;
    action: string;
    actionHref?: string;
  } => {
    // Check for specific error types
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Try Again',
      };
    }

    if (error.message.includes('Timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        action: 'Retry',
      };
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred while loading the login page. Please try again or contact support if the problem persists.',
      action: 'Try Again',
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary dark:bg-background-dark px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <svg
            className="mx-auto h-24 w-24 text-red-500 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark mb-4">
            {errorInfo.title}
          </h1>
          
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary mb-8">
            {errorInfo.message}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={reset} size="lg" aria-label="Retry loading login page">
              {errorInfo.action}
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => window.location.href = '/'}
              aria-label="Go to home page"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

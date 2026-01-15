'use client';

import { useEffect } from 'react';
import { Button } from '@stride/ui';
import Link from 'next/link';

/**
 * Project Import Error Boundary
 * 
 * Handles errors on the project import page.
 * 
 * Features:
 * - Error display with user-friendly messages
 * - Retry functionality
 * - Navigation options
 * - Error logging for debugging
 */
export default function ImportProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Enhanced error logging for debugging
    console.error('Project import page error:', {
      error,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      path: '/projects/import',
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

    if (error.message.includes('OAuth') || error.message.includes('authentication')) {
      return {
        title: 'Authentication Error',
        message: 'Unable to authenticate with the git provider. Please try again or contact support if the problem persists.',
        action: 'Try Again',
      };
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred while importing the project. Please try again or contact support if the problem persists.',
      action: 'Try Again',
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
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
        
        <h2 className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-4">
          {errorInfo.title}
        </h2>
        
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary mb-8">
          {errorInfo.message}
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} size="lg" aria-label="Retry project import">
            {errorInfo.action}
          </Button>
          <Link href="/projects">
            <Button variant="secondary" size="lg" aria-label="Go back to projects">
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

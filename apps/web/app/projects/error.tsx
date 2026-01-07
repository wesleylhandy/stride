"use client";

import { useEffect } from 'react';
import { Button } from '@stride/ui';
import Link from 'next/link';

/**
 * Projects Error Boundary
 * 
 * Handles errors on the projects listing page.
 * 
 * Features:
 * - Error display (T012)
 * - Retry functionality (T013)
 * - User-friendly error messages (T030)
 * - Error logging (T031)
 */
export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Enhanced error logging for debugging (T031)
    console.error('Projects page error:', {
      error,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      path: '/projects',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    });
  }, [error]);

  // Determine user-friendly error message (T030)
  const getErrorMessage = () => {
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      return {
        title: 'Authentication Required',
        message: 'You need to be logged in to view your projects. Please sign in and try again.',
        action: 'Go to Login',
        actionHref: '/login',
      };
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        title: 'Connection Problem',
        message: 'We couldn\'t connect to the server. Please check your internet connection and try again.',
        action: 'Try Again',
        actionHref: null,
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        title: 'Request Timed Out',
        message: 'The request took too long to complete. This might be due to a slow connection. Please try again.',
        action: 'Try Again',
        actionHref: null,
      };
    }
    
    // Default error message
    return {
      title: 'Something Went Wrong',
      message: 'We couldn\'t load your projects. This might be a temporary issue. Please try again, or contact support if the problem persists.',
      action: 'Try Again',
      actionHref: null,
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
          {errorInfo.actionHref ? (
            <Link href={errorInfo.actionHref}>
              <Button size="lg">
                {errorInfo.action}
              </Button>
            </Link>
          ) : (
            <Button onClick={reset} size="lg" aria-label="Retry loading projects">
              {errorInfo.action}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/'}
            aria-label="Go to home page"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}


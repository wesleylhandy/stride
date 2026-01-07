"use client";

import Link from 'next/link';
import { Button } from '@stride/ui';

/**
 * ProjectsEmptyState Component
 * 
 * Displays empty state when no projects exist.
 * 
 * Features:
 * - Friendly empty state message (T010)
 * - Call-to-action button (T011)
 */
export function ProjectsEmptyState() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <svg
            className="mx-auto h-24 w-24 text-foreground-secondary dark:text-foreground-dark-secondary opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-4">
          No Projects Yet
        </h2>
        
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary mb-8">
          Get started by creating your first project. You can link a repository
          and start managing issues right away.
        </p>
        
        <Link href="/onboarding/project">
          <Button size="lg">
            Create Your First Project
          </Button>
        </Link>
      </div>
    </div>
  );
}


'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Badge } from '@stride/ui';
import type { RepositoryInfo, PaginationInfo } from '@/lib/types/repository';
import { RepositoryListSkeleton } from './RepositoryListSkeleton';

export interface RepositoryListProps {
  /**
   * Git provider type (GitHub or GitLab)
   */
  providerType: 'GitHub' | 'GitLab';
  /**
   * OAuth access token for the provider
   */
  accessToken: string;
  /**
   * Callback when a repository is selected
   */
  onSelectRepository: (repository: RepositoryInfo) => void;
  /**
   * Current page number
   */
  page?: number;
  /**
   * Callback when page changes
   */
  onPageChange?: (page: number) => void;
}

/**
 * RepositoryList component
 * 
 * Displays paginated list of repositories from git provider.
 * Handles repository selection and pagination.
 * 
 * Features:
 * - Fetches repositories using TanStack Query
 * - Displays repository details (name, description, URL, connection status)
 * - Supports pagination
 * - Loading and error states
 * - Accessible keyboard navigation
 */
export function RepositoryList({
  providerType,
  accessToken,
  onSelectRepository,
  page = 1,
  onPageChange,
}: RepositoryListProps) {
  // Fetch repositories using TanStack Query
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<{
    repositories: RepositoryInfo[];
    pagination: PaginationInfo;
  }>({
    queryKey: ['repositories', providerType, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: providerType,
        accessToken,
        page: page.toString(),
        per_page: '20', // Show 20 per page for better UX
      });

      const response = await fetch(`/api/repositories/list?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch repositories');
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - repositories don't change often
  });

  // Handle pagination
  const handlePreviousPage = () => {
    if (data?.pagination.hasPrev && onPageChange) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (data?.pagination.hasNext && onPageChange) {
      onPageChange(page + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return <RepositoryListSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-lg border border-error dark:border-error-dark bg-surface dark:bg-surface-dark p-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
          Error Loading Repositories
        </h3>
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-4">
          {error instanceof Error ? error.message : 'Failed to load repositories. Please try again.'}
        </p>
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (!data || data.repositories.length === 0) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 text-center">
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          No repositories found.
        </p>
      </div>
    );
  }

  const { repositories, pagination } = data;

  return (
    <div className="space-y-4">
      {/* Repository list */}
      <div className="space-y-3">
        {repositories.map((repo) => (
          <div
            key={repo.id}
            className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 hover:border-primary dark:hover:border-primary-dark transition-colors cursor-pointer"
            onClick={() => onSelectRepository(repo)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectRepository(repo);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select repository ${repo.fullName}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-foreground dark:text-foreground-dark truncate">
                    {repo.fullName}
                  </h3>
                  {repo.private && (
                    <Badge variant="default" size="sm">
                      Private
                    </Badge>
                  )}
                  {repo.isConnected && (
                    <Badge variant="info" size="sm">
                      Connected
                    </Badge>
                  )}
                </div>
                {repo.description && (
                  <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-2 line-clamp-2">
                    {repo.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                  <span>Branch: {repo.defaultBranch}</span>
                  <span>
                    Updated: {new Date(repo.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRepository(repo);
                }}
              >
                Select
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <nav
          aria-label="Repository pagination"
          className="flex items-center justify-between border-t border-border dark:border-border-dark pt-4"
        >
          <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} repositories)
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!pagination.hasPrev}
              aria-label="Previous page"
            >
              Previous
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextPage}
              disabled={!pagination.hasNext}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}

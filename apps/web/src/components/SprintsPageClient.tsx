'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, cn } from '@stride/ui';
import { CreateCycleModal } from './CreateCycleModal';
import type { Cycle } from '@stride/types';

export interface SprintsPageClientProps {
  projectId: string;
  cycles: Cycle[];
  canCreate: boolean;
  projectName: string;
}

type FilterType = 'all' | 'active' | 'upcoming' | 'past';
type SortType = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

/**
 * SprintsPageClient component
 * 
 * Client component that handles modal state for creating sprints.
 */
export function SprintsPageClient({
  projectId,
  cycles,
  canCreate,
  projectName,
}: SprintsPageClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [sort, setSort] = React.useState<SortType>('date-desc');

  // Categorize cycles and apply filters
  const filteredAndSortedCycles = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // First, categorize and filter
    let filtered = cycles.filter((cycle) => {
      const startDate = new Date(cycle.startDate);
      const endDate = new Date(cycle.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const isActive = startDate <= now && endDate >= now;
      const isPast = endDate < now;
      const isFuture = startDate > now;

      switch (filter) {
        case 'active':
          return isActive;
        case 'upcoming':
          return isFuture;
        case 'past':
          return isPast;
        case 'all':
        default:
          return true;
      }
    });

    // Then sort
    return filtered.sort((a, b) => {
      switch (sort) {
        case 'date-desc':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'date-asc':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [cycles, filter, sort]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
            Sprints
          </h1>
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
            {cycles.length} {cycles.length === 1 ? 'sprint' : 'sprints'}
          </p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create New Sprint
          </Button>
        )}
      </div>

      {/* Filters and Sorting */}
      {cycles.length > 0 && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
              Filter:
            </span>
            <div className="inline-flex rounded-lg border border-border dark:border-border-dark bg-background dark:bg-background-dark p-1">
              {(['all', 'active', 'upcoming', 'past'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                    filter === filterType
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-foreground-secondary dark:text-foreground-dark-secondary hover:bg-background-secondary dark:hover:bg-background-dark-secondary hover:text-foreground dark:hover:text-foreground-dark'
                  )}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className={cn(
                'rounded-md border border-border dark:border-border-dark',
                'bg-background dark:bg-background-dark',
                'px-3 py-1.5 text-sm font-medium',
                'text-foreground dark:text-foreground-dark',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                'transition-colors'
              )}
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      )}

      {cycles.length === 0 ? (
        <div className="rounded-lg border border-border dark:border-border-dark bg-background-secondary dark:bg-background-dark-secondary p-12 text-center">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto h-12 w-12 text-foreground-secondary dark:text-foreground-dark-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
              No sprints yet
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Get started by creating your first sprint to plan and track your work.
            </p>
            {canCreate && (
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create New Sprint
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : filteredAndSortedCycles.length === 0 ? (
        <div className="rounded-lg border border-border dark:border-border-dark bg-background-secondary dark:bg-background-dark-secondary p-12 text-center">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto h-12 w-12 text-foreground-secondary dark:text-foreground-dark-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
              No sprints match your filter
            </h3>
            <p className="mt-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Try adjusting your filter to see more sprints.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedCycles.map((cycle) => {
            const startDate = new Date(cycle.startDate);
            const endDate = new Date(cycle.endDate);
            const isActive = startDate <= new Date() && endDate >= new Date();
            const isPast = endDate < new Date();
            const isFuture = startDate > new Date();

            return (
              <Link
                key={cycle.id}
                href={`/projects/${projectId}/sprints/${cycle.id}`}
                className="group block p-4 border border-border dark:border-border-dark rounded-md bg-surface dark:bg-surface-dark hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  {/* Sprint content - flex-1 with min-w-0 to allow truncation */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark group-hover:text-accent truncate">
                        {cycle.name}
                      </h3>
                      {(isActive || isPast || isFuture) && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isActive
                              ? 'bg-success/10 text-success'
                              : isPast
                              ? 'bg-foreground-secondary/10 text-foreground-secondary dark:bg-foreground-dark-secondary/10 dark:text-foreground-dark-secondary'
                              : 'bg-info/10 text-info'
                          }`}
                        >
                          {isActive ? 'Active' : isPast ? 'Past' : 'Upcoming'}
                        </span>
                      )}
                    </div>
                    {cycle.description && (
                      <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-1 line-clamp-2">
                        {cycle.description}
                      </p>
                    )}
                    {cycle.goal && (
                      <p className="mt-2 text-sm font-medium text-foreground dark:text-foreground-dark">
                        <span className="font-semibold">Goal:</span> <span className="font-normal">{cycle.goal}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                      <div className="flex items-center gap-1">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {canCreate && (
        <CreateCycleModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={projectId}
        />
      )}
    </>
  );
}

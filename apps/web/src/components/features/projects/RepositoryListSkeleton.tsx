'use client';

/**
 * RepositoryListSkeleton component
 * 
 * Loading skeleton for repository list display.
 * Shows placeholder cards while repositories are being fetched.
 */
export function RepositoryListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-background-secondary dark:bg-background-dark-secondary rounded w-1/3" />
              <div className="h-4 bg-background-secondary dark:bg-background-dark-secondary rounded w-2/3" />
              <div className="h-3 bg-background-secondary dark:bg-background-dark-secondary rounded w-1/2" />
            </div>
            <div className="h-8 w-20 bg-background-secondary dark:bg-background-dark-secondary rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

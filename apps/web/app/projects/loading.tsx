/**
 * Projects Loading State
 * 
 * Displays loading skeleton while projects are being fetched.
 * 
 * Features:
 * - Loading skeleton (T014)
 */
export default function ProjectsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="mb-6">
          <div className="h-9 bg-surface-secondary dark:bg-surface-dark-secondary rounded w-48 mb-2"></div>
          <div className="h-5 bg-surface-secondary dark:bg-surface-dark-secondary rounded w-32"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-border dark:border-border-dark rounded-lg p-6 bg-surface dark:bg-surface-dark">
              <div className="h-6 bg-surface-secondary dark:bg-surface-dark-secondary rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-surface-secondary dark:bg-surface-dark-secondary rounded w-20 mb-4"></div>
              <div className="h-4 bg-surface-secondary dark:bg-surface-dark-secondary rounded w-full mb-2"></div>
              <div className="h-4 bg-surface-secondary dark:bg-surface-dark-secondary rounded w-5/6 mb-4"></div>
              <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border-dark">
                <div className="h-3 bg-surface-secondary dark:bg-surface-dark-secondary rounded w-24"></div>
                <div className="h-4 bg-surface-secondary dark:bg-surface-dark-secondary rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


"use client";

import Link from 'next/link';
import { Button } from '@stride/ui';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  basePath: string;
}

/**
 * PaginationControls Component
 * 
 * Displays pagination controls for navigating through paginated results.
 * 
 * Features:
 * - Previous/Next navigation
 * - Page number display
 * - Keyboard accessible
 * - WCAG 2.1 AA compliant
 */
export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  basePath,
}: PaginationControlsProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageUrl = (page: number) => {
    const url = new URL(basePath, window.location.origin);
    url.searchParams.set('page', page.toString());
    return url.pathname + url.search;
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between border-t border-border dark:border-border-dark pt-6"
    >
      <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
        Showing {startItem} to {endItem} of {totalItems} projects
      </div>
      
      <div className="flex items-center gap-2">
        <Link
          href={getPageUrl(currentPage - 1)}
          aria-label="Previous page"
          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            aria-disabled={currentPage <= 1}
          >
            Previous
          </Button>
        </Link>
        
        <div className="flex items-center gap-1">
          <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        
        <Link
          href={getPageUrl(currentPage + 1)}
          aria-label="Next page"
          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            aria-disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </Link>
      </div>
    </nav>
  );
}


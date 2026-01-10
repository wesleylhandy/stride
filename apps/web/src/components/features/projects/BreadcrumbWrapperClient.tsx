'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumbs, BreadcrumbItem } from '@stride/ui';
import { ReactNode } from 'react';

interface BreadcrumbWrapperClientProps {
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
}

/**
 * BreadcrumbWrapperClient component
 * 
 * Client component that renders breadcrumbs from the breadcrumbs prop.
 * 
 * Note: Project detail page breadcrumbs are rendered directly in ProjectLayoutWrapper
 * (not via this component) to avoid React Context hierarchy issues. This component
 * only renders breadcrumbs for:
 * - Projects listing page (/projects)
 * - Docs pages (/docs/*)
 * - Settings pages (/settings/*)
 * - Other non-project routes
 */
export function BreadcrumbWrapperClient({
  breadcrumbs,
}: BreadcrumbWrapperClientProps) {
  const pathname = usePathname();
  
  // Check if we're on a project detail page
  // Project pages render breadcrumbs in ProjectLayoutWrapper, so we skip here
  // Pattern: /projects/[uuid]/...
  const isProjectDetailPage = pathname?.match(/^\/projects\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  
  // Don't render breadcrumbs for project detail pages (they're rendered in ProjectLayoutWrapper)
  if (isProjectDetailPage) {
    return null;
  }
  
  // Only render if breadcrumbs prop is provided
  if (!breadcrumbs) {
    return null;
  }
  
  // Handle array of breadcrumb items
  if (Array.isArray(breadcrumbs)) {
    if (breadcrumbs.length > 0) {
      return (
        <div className="px-4 sm:px-6 lg:px-8 mb-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      );
    }
    // Empty array - don't render anything
    return null;
  }

  // Handle ReactNode breadcrumbs
  return (
    <div className="px-4 sm:px-6 lg:px-8 mb-4">
      {breadcrumbs}
    </div>
  );
}

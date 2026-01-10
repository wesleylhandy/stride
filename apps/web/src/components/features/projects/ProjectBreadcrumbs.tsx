'use client';

import { usePathname } from 'next/navigation';
import { generateProjectBreadcrumbs } from '@/lib/navigation/breadcrumbs';
import { Breadcrumbs } from '@stride/ui';

export interface ProjectBreadcrumbsProps {
  projectId: string;
  projectName: string;
}

/**
 * ProjectBreadcrumbs component
 * 
 * Client component that generates breadcrumbs dynamically based on the current pathname.
 * Uses the project information to build contextual breadcrumb navigation.
 * 
 * Rules:
 * - "Projects" is always clickable (navigates to /projects)
 * - Project name is never clickable (current location)
 * - Routes at level 3+ are clickable only if they have children routes
 */
export function ProjectBreadcrumbs({
  projectId,
  projectName,
}: ProjectBreadcrumbsProps) {
  const pathname = usePathname();
  
  // Generate breadcrumbs from current pathname
  const breadcrumbs = generateProjectBreadcrumbs(
    pathname || '',
    projectId,
    projectName,
  );
  
  // Don't render if no breadcrumbs (shouldn't happen, but safety check)
  if (breadcrumbs.length === 0) {
    return null;
  }
  
  return <Breadcrumbs items={breadcrumbs} />;
}

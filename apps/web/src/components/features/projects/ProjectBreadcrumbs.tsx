'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateProjectBreadcrumbs } from '@/lib/navigation/breadcrumbs';
import { Breadcrumbs, type BreadcrumbItem } from '@stride/ui';
import { getBreadcrumbMetadata } from '@/lib/navigation/breadcrumb-store';

export interface ProjectBreadcrumbsProps {
  projectId: string;
  projectName: string;
  customSegments?: Array<{ path: string; label: string }>;
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
 * - If customSegments is provided, use those instead of generating from pathname
 * - Reads breadcrumb metadata from store for dynamic segment labels (e.g., cycle names)
 */
export function ProjectBreadcrumbs({
  projectId,
  projectName,
  customSegments,
}: ProjectBreadcrumbsProps) {
  const pathname = usePathname();
  const [segmentLabels, setSegmentLabels] = useState(() => getBreadcrumbMetadata());
  
  // Update segment labels when pathname changes (pages set metadata on mount)
  useEffect(() => {
    // Check store for updates - pages set metadata when they mount
    const updateLabels = () => {
      const newLabels = getBreadcrumbMetadata();
      setSegmentLabels(new Map(newLabels));
    };
    
    // Update immediately
    updateLabels();
    
    // Also check after a short delay to catch metadata set by pages that mount after breadcrumbs
    const timeout = setTimeout(updateLabels, 100);
    
    // Check again after a longer delay to ensure we catch all updates
    const timeout2 = setTimeout(updateLabels, 500);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [pathname]);
  
  // Use custom segments if provided, otherwise generate from pathname
  let breadcrumbs: BreadcrumbItem[];
  
  if (customSegments) {
    // Build breadcrumbs with custom segments
    breadcrumbs = [
      {
        label: 'Projects',
        href: '/projects',
      },
      {
        label: projectName,
        // Not clickable - we're on a project page
      },
    ];
    
    // Add custom segments
    customSegments.forEach((segment, index) => {
      const isLast = index === customSegments.length - 1;
      breadcrumbs.push({
        label: segment.label,
        href: isLast ? undefined : segment.path, // Last segment is not clickable
      });
    });
  } else {
    // Generate breadcrumbs from current pathname
    breadcrumbs = generateProjectBreadcrumbs(
      pathname || '',
      projectId,
      projectName,
      segmentLabels,
    );
  }
  
  // Don't render if no breadcrumbs (shouldn't happen, but safety check)
  if (breadcrumbs.length === 0) {
    return null;
  }
  
  return <Breadcrumbs items={breadcrumbs} />;
}

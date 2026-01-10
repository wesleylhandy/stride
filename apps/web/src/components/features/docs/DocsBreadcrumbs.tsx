'use client';

import { usePathname } from 'next/navigation';
import { generateDocsBreadcrumbs } from '@/lib/navigation/docs-breadcrumbs';
import { Breadcrumbs } from '@stride/ui';

/**
 * DocsBreadcrumbs component
 * 
 * Client component that generates breadcrumbs dynamically for documentation pages.
 * Structure: Documentation > [Section] > [Subsection]
 * 
 * Examples:
 * - /docs/configuration → Documentation > Configuration
 * - /docs/install → Documentation > Installation
 */
export function DocsBreadcrumbs() {
  const pathname = usePathname();
  
  // Generate breadcrumbs from current pathname
  const breadcrumbs = generateDocsBreadcrumbs(pathname || '');
  
  // Don't render if no breadcrumbs (shouldn't happen, but safety check)
  if (breadcrumbs.length === 0) {
    return null;
  }
  
  return <Breadcrumbs items={breadcrumbs} />;
}

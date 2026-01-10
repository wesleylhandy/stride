import type { BreadcrumbItem } from '@stride/ui';

/**
 * Documentation breadcrumb navigation utilities
 * 
 * Generates breadcrumb items for documentation pages.
 * Structure: Documentation > [Section] > [Subsection]
 */

/**
 * Route segment labels for documentation pages
 */
const DOCS_SEGMENT_LABELS: Record<string, string> = {
  'configuration': 'Configuration',
  'install': 'Installation',
  'integrations': 'Integrations',
};

/**
 * Generates breadcrumb items for documentation pages from pathname
 * 
 * @param pathname - Current pathname (e.g., '/docs/configuration')
 * @returns Array of breadcrumb items
 */
export function generateDocsBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  
  // Always start with Documentation (not clickable - it's the base)
  items.push({
    label: 'Documentation',
    // No href - not clickable since we're in docs
  });
  
  // Parse pathname
  const segments = pathname.split('/').filter(Boolean);
  
  // Find 'docs' segment
  const docsIndex = segments.indexOf('docs');
  if (docsIndex === -1) {
    // Not a docs route, return just Documentation
    return items;
  }
  
  // Process segments after 'docs'
  const docsSegments = segments.slice(docsIndex + 1);
  
  if (docsSegments.length === 0) {
    // Just /docs - return Documentation only
    return items;
  }
  
  // Add each documentation section
  docsSegments.forEach((segment, index) => {
    const label = DOCS_SEGMENT_LABELS[segment] || 
      segment.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    
    const isLast = index === docsSegments.length - 1;
    
    if (isLast) {
      // Last segment - not clickable (current page)
      items.push({
        label,
        // No href - not clickable
      });
    } else {
      // Not last - clickable (has children)
      const href = `/docs/${docsSegments.slice(0, index + 1).join('/')}`;
      items.push({
        label,
        href,
      });
    }
  });
  
  return items;
}

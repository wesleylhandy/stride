import type { BreadcrumbItem } from '@stride/ui';

/**
 * Documentation breadcrumb navigation utilities
 * 
 * Generates breadcrumb items for documentation pages.
 * Structure: Documentation > [Section] > [Subsection]
 * 
 * Rules:
 * - "Documentation" is clickable if there are child segments (parent page)
 * - "Documentation" is not clickable if on /docs (terminal)
 * - Child segments are clickable if there are more segments after them
 * - Last segment is never clickable (current page)
 */

/**
 * Route segment labels for documentation pages
 * 
 * Handles both top-level sections and nested subsections
 */
const DOCS_SEGMENT_LABELS: Record<string, string> = {
  // Top-level sections
  'configuration': 'Configuration',
  'install': 'Installation',
  'integrations': 'Integrations',
  'deployment': 'Deployment',
  // Integration subsections
  'smtp': 'SMTP Email',
  'sentry': 'Sentry',
  'ai-providers': 'AI Providers',
  'git-oauth': 'Git OAuth',
  'monitoring-webhooks': 'Monitoring Webhooks',
  // Deployment subsections
  'docker': 'Docker Deployment',
  'infrastructure-configuration': 'Infrastructure Configuration',
};

/**
 * Generates breadcrumb items for documentation pages from pathname
 * 
 * @param pathname - Current pathname (e.g., '/docs/configuration')
 * @returns Array of breadcrumb items
 */
export function generateDocsBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  
  // Parse pathname
  const segments = pathname.split('/').filter(Boolean);
  
  // Find 'docs' segment
  const docsIndex = segments.indexOf('docs');
  if (docsIndex === -1) {
    // Not a docs route, return just Documentation (not clickable)
    items.push({
      label: 'Documentation',
    });
    return items;
  }
  
  // Process segments after 'docs'
  const docsSegments = segments.slice(docsIndex + 1);
  
  // Documentation is always clickable from child pages (links to /docs index)
  // On /docs itself, it's terminal (not clickable)
  if (docsSegments.length === 0) {
    // Just /docs - Documentation is terminal (not clickable, current page)
    items.push({
      label: 'Documentation',
      // No href - not clickable (current page)
    });
    return items;
  }
  
  // Has child segments - Documentation is clickable (links to /docs index page)
  items.push({
    label: 'Documentation',
    href: '/docs',
  });
  
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

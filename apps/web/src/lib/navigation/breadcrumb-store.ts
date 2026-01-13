/**
 * Client-side store for breadcrumb metadata
 * 
 * Allows pages to inject custom labels for dynamic route segments
 * (e.g., cycleId -> cycle name) that breadcrumbs can read.
 * 
 * This is a simple module-level store that works across the component tree
 * without requiring React Context (which doesn't work when breadcrumbs
 * are rendered in layout before page content).
 */

type SegmentLabels = Map<string, string>;

let breadcrumbMetadata: SegmentLabels = new Map();

/**
 * Set breadcrumb metadata (segment labels)
 * 
 * Pages should call this to provide custom labels for dynamic segments.
 * Example: setBreadcrumbMetadata(new Map([['cycle-uuid', 'Sprint 2026-1']]))
 */
export function setBreadcrumbMetadata(labels: SegmentLabels | Record<string, string>) {
  breadcrumbMetadata = labels instanceof Map 
    ? labels 
    : new Map(Object.entries(labels));
}

/**
 * Get breadcrumb metadata (segment labels)
 * 
 * Breadcrumb components call this to get custom labels for segments.
 */
export function getBreadcrumbMetadata(): SegmentLabels {
  return breadcrumbMetadata;
}

/**
 * Clear breadcrumb metadata
 * 
 * Should be called when navigating away from pages that set metadata.
 */
export function clearBreadcrumbMetadata() {
  breadcrumbMetadata = new Map();
}

/**
 * Get label for a specific segment, if available
 */
export function getSegmentLabel(segment: string): string | undefined {
  return breadcrumbMetadata.get(segment);
}

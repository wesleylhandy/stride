import type { BreadcrumbItem } from '@stride/ui';

/**
 * Breadcrumb Navigation Utilities
 * 
 * Dynamically generates breadcrumb items from pathname, with intelligent
 * detection of which segments should be clickable based on route structure.
 * 
 * Rules:
 * - "Projects" is always clickable (level 1)
 * - Project name is never clickable (current location, level 2)
 * - Routes at level 3+ are clickable if there are more segments after them
 *   (i.e., if we're on a deeper page, we can navigate back to the parent landing page)
 * 
 * General Rule: A breadcrumb segment is clickable if:
 *   - There are more segments in the pathname after it (we're on a child page)
 *   - This allows navigation back to landing pages (e.g., from /projects/[id]/issues/KEY-1 
 *     back to /projects/[id]/issues)
 * 
 * Detection Strategy (Hybrid):
 * 1. Check override map for explicit configurations
 * 2. Use pathname heuristics to infer if route has children
 * 3. Fallback to conservative defaults
 */

/**
 * Route override map for edge cases where heuristics may fail.
 * Add routes here when convention-based detection doesn't work correctly.
 * 
 * Format: route pattern -> has children
 * Example: '/projects/[projectId]/sprints' -> true
 */
const ROUTE_CHILDREN_OVERRIDES = new Map<string, boolean>([
  // Add overrides as needed
  // ['/projects/[projectId]/sprints', true],
]);

/**
 * Known static child route segments that indicate a parent has children.
 * These are common patterns in the app structure.
 */
const KNOWN_CHILD_SEGMENTS = new Set([
  'board',
  'issues',
  'settings',
  'config',
  'integrations',
  'sprints',
  'roadmap',
]);

/**
 * Route segment labels for display in breadcrumbs.
 * Maps route segments to human-readable labels.
 */
const SEGMENT_LABELS: Record<string, string> = {
  'board': 'Board',
  'issues': 'Issues',
  'settings': 'Settings',
  'config': 'Configuration',
  'integrations': 'Integrations',
  'sprints': 'Sprints',
  'roadmap': 'Roadmap',
};

/**
 * Determines if a route path has children routes based on pathname analysis.
 * 
 * Strategy:
 * 1. Check override map first (explicit configuration)
 * 2. Check if current pathname extends beyond the route path
 * 3. Check if next segment is a known child segment
 * 4. Check if next segment is dynamic and pathname continues beyond it
 * 
 * @param currentPathname - The current full pathname (e.g., '/projects/abc-123/issues/KEY-1')
 * @param routePath - The route path to check (e.g., '/projects/[projectId]/issues')
 * @returns true if the route has children, false otherwise
 */
export function routeHasChildren(
  currentPathname: string,
  routePath: string,
): boolean {
  // Normalize paths (remove leading/trailing slashes for comparison)
  const normalizedRoute = routePath.replace(/^\/|\/$/g, '');
  const normalizedCurrent = currentPathname.replace(/^\/|\/$/g, '');

  // Check override map first
  if (ROUTE_CHILDREN_OVERRIDES.has(routePath)) {
    return ROUTE_CHILDREN_OVERRIDES.get(routePath)!;
  }

  // Split into segments
  const routeSegments = normalizedRoute.split('/').filter(Boolean);
  const currentSegments = normalizedCurrent.split('/').filter(Boolean);

  // If current pathname doesn't extend beyond route, no children
  if (currentSegments.length <= routeSegments.length) {
    return false;
  }

  // Get the next segment after the route path
  const nextSegmentIndex = routeSegments.length;
  const nextSegment = currentSegments[nextSegmentIndex];

  if (!nextSegment) {
    return false;
  }

  // Check if it's a known child segment
  if (KNOWN_CHILD_SEGMENTS.has(nextSegment)) {
    return true;
  }

  // Check if it's a dynamic segment (UUID or issue key format)
  // Dynamic segments indicate children if pathname continues beyond them
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const issueKeyPattern = /^[A-Z]+-\d+$/;
  
  const isDynamicSegment = uuidPattern.test(nextSegment) || issueKeyPattern.test(nextSegment);
  
  // If it's a dynamic segment and pathname continues, it likely has children
  if (isDynamicSegment && currentSegments.length > routeSegments.length + 1) {
    return true;
  }

  return false;
}

/**
 * Matches a pathname to a route pattern, handling dynamic segments.
 * 
 * @param pathname - Actual pathname (e.g., '/projects/abc-123/issues')
 * @param pattern - Route pattern (e.g., '/projects/[projectId]/issues')
 * @returns true if pathname matches pattern
 */
function pathnameMatchesPattern(
  pathname: string,
  pattern: string,
): boolean {
  const pathSegments = pathname.split('/').filter(Boolean);
  const patternSegments = pattern.split('/').filter(Boolean);

  if (pathSegments.length !== patternSegments.length) {
    return false;
  }

  return patternSegments.every((patternSeg, index) => {
    const pathSeg = pathSegments[index];
    
    // Dynamic segment matches anything
    if (patternSeg.startsWith('[') && patternSeg.endsWith(']')) {
      return true;
    }
    
    // Static segments must match exactly
    return patternSeg === pathSeg;
  });
}

/**
 * Extracts route pattern from pathname by replacing dynamic segments.
 * 
 * @param pathname - Actual pathname (e.g., '/projects/abc-123/issues/KEY-1')
 * @returns Route pattern (e.g., '/projects/[projectId]/issues/[issueKey]')
 */
function extractRoutePattern(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  
  return segments
    .map((segment, index) => {
      // UUID pattern detection
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // If it's a UUID or looks like a dynamic segment, replace with pattern
      if (uuidPattern.test(segment)) {
        // Context-based: projectId is usually first UUID, issueKey is usually later
        if (index === 1) {
          return '[projectId]';
        } else if (segments[index - 1] === 'issues') {
          return '[issueKey]';
        } else if (segments[index - 1] === 'sprints') {
          return '[sprintId]';
        }
        // Generic dynamic segment
        return `[${segment}]`;
      }
      
      // Known static segments
      if (KNOWN_CHILD_SEGMENTS.has(segment)) {
        return segment;
      }
      
      // Check if it looks like an issue key (PROJ-123 format)
      if (/^[A-Z]+-\d+$/.test(segment)) {
        return '[issueKey]';
      }
      
      // Static segment
      return segment;
    })
    .join('/');
}

/**
 * Generates breadcrumb items from a pathname and project information.
 * 
 * @param pathname - Current pathname (e.g., '/projects/abc-123/issues/KEY-1')
 * @param projectId - Project ID (UUID)
 * @param projectName - Project name for display
 * @param segmentLabels - Optional map of segment values to display labels (e.g., cycleId -> cycle name)
 * @returns Array of breadcrumb items
 */
export function generateProjectBreadcrumbs(
  pathname: string,
  projectId: string,
  projectName: string,
  segmentLabels?: Map<string, string>,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  
  // Always start with Projects (clickable)
  items.push({
    label: 'Projects',
    href: '/projects',
  });
  
  // Parse pathname
  const segments = pathname.split('/').filter(Boolean);
  
  // Find project segment index
  // Project ID should be at index 1 (segments[0] = 'projects', segments[1] = projectId)
  const projectIndex = segments.findIndex((seg, idx) => {
    // Project ID is at index 1 (after 'projects')
    // Check if it matches the provided projectId (UUID format)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (idx === 1 && uuidPattern.test(seg)) {
      // Match by ID if provided, or just check UUID format
      return projectId ? seg === projectId : true;
    }
    return false;
  });
  
  if (projectIndex === -1) {
    // Project not found in pathname, return just Projects
    // This shouldn't happen if we're on a project page, but handle gracefully
    return items;
  }
  
  // Always add project name (never clickable - it's where you are)
  items.push({
    label: projectName,
    // No href - not clickable
  });
  
  // Build route path progressively to check for children
  let currentRoutePath = `/projects/${projectId}`;
  
  // Process remaining segments
  for (let i = projectIndex + 1; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) {
      continue; // Skip undefined segments
    }
    
    const nextSegment = segments[i + 1];
    
    // Determine label for this segment
    // Handle issue keys specially - use the key as-is
    // Handle UUIDs for cycles (cycleId) - check segmentLabels first, then fallback
    let label: string;
    if (/^[A-Z]+-\d+$/.test(segment)) {
      // Issue key format (PROJ-123) - use as-is
      label = segment;
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      // UUID format - could be cycleId for sprints or other dynamic segments
      // Check if we have a custom label from context (e.g., cycle name)
      if (segmentLabels?.has(segment)) {
        label = segmentLabels.get(segment)!;
      } else {
        // Check if previous segment was 'sprints' to determine if this is a cycle
        const prevSegment = segments[i - 1];
        if (prevSegment === 'sprints') {
          // This is a cycle ID but no label provided - use generic placeholder
          label = 'Sprint';
        } else {
          // Other UUID - use segment label
          label = SEGMENT_LABELS[segment] || getSegmentLabel(segment);
        }
      }
    } else {
      // Use segment label mapping or format the segment name
      label = SEGMENT_LABELS[segment] || getSegmentLabel(segment);
    }
    
    // Build the route path up to this segment
    const segmentRoutePath = `${currentRoutePath}/${segment}`;
    
    // General rule: Segment is clickable if there are more segments after it
    // This allows navigation back to landing pages (e.g., from /issues/KEY-1 back to /issues)
    // If there's a next segment, we're on a deeper page and can navigate back
    const isClickable = nextSegment !== undefined;
    
    if (isClickable) {
      items.push({
        label,
        href: segmentRoutePath,
      });
    } else {
      // Terminal segment (last segment in pathname) - not clickable
      items.push({
        label,
        // No href - not clickable
      });
    }
    
    // Update current route path for next iteration
    currentRoutePath = segmentRoutePath;
  }
  
  return items;
}

/**
 * Helper to get breadcrumb label for a route segment.
 * Falls back to capitalized segment name if not in SEGMENT_LABELS.
 */
export function getSegmentLabel(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ||
    segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

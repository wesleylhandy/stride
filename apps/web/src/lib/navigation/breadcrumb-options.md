# Breadcrumb Route Detection Options

## Overview
We need to dynamically determine if a route segment has children routes without hard-coding configuration. This enables breadcrumb items to be clickable only when they have navigable children.

## Options Analysis

### Option 1: File System Detection (Server-Side)
**Approach**: Use Node.js `fs` APIs to check if route directories exist

**Implementation**:
```typescript
// Check if /projects/[projectId]/issues/ has child directories
async function hasRouteChildren(basePath: string, segment: string): Promise<boolean> {
  const segmentPath = join(process.cwd(), 'app', basePath, segment);
  try {
    const entries = await readdir(segmentPath, { withFileTypes: true });
    return entries.some(entry => entry.isDirectory() && entry.name !== 'layout.tsx');
  } catch {
    return false;
  }
}
```

**Pros**:
- ✅ Zero configuration - automatically discovers routes
- ✅ Always in sync with file system
- ✅ Extensible - new routes automatically work
- ✅ Type-safe if combined with TypeScript route definitions

**Cons**:
- ❌ Server-side only (can't use in client components)
- ❌ File I/O overhead (can be cached)
- ❌ Doesn't account for dynamic routes (`[issueKey]`)
- ❌ Development vs production path differences

**Best For**: Server components, build-time route generation

---

### Option 2: Convention-Based Pathname Analysis
**Approach**: Parse pathname and infer child routes from patterns

**Implementation**:
```typescript
function hasRouteChildren(pathname: string, segment: string): boolean {
  // Known patterns: if pathname has more segments after this one, it has children
  const segments = pathname.split('/').filter(Boolean);
  const segmentIndex = segments.indexOf(segment);
  
  // Check if there are more segments after this one
  // Account for dynamic segments like [projectId], [issueKey]
  const remainingSegments = segments.slice(segmentIndex + 1);
  
  // Filter out UUIDs/dynamic segments
  const hasStaticChildren = remainingSegments.some(seg => 
    !seg.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  );
  
  return hasStaticChildren;
}
```

**Pros**:
- ✅ Works client-side (uses pathname only)
- ✅ Fast (no I/O)
- ✅ Simple logic
- ✅ Handles dynamic routes naturally

**Cons**:
- ❌ May have false positives (UUID-like segment names)
- ❌ Doesn't distinguish between valid children and invalid paths
- ❌ Less accurate than file system check

**Best For**: Client components, runtime detection

---

### Option 3: Route Metadata Registry (Lightweight Config)
**Approach**: Small TypeScript object that mirrors file structure, maintained manually

**Implementation**:
```typescript
// lib/navigation/route-structure.ts
export const ROUTE_STRUCTURE = {
  '/projects': {
    hasChildren: true,
    children: ['[projectId]'],
  },
  '/projects/[projectId]': {
    hasChildren: true,
    children: ['board', 'issues', 'settings'],
  },
  '/projects/[projectId]/issues': {
    hasChildren: true,
    children: ['[issueKey]'],
  },
  '/projects/[projectId]/settings': {
    hasChildren: true,
    children: ['config', 'integrations'],
  },
  '/projects/[projectId]/board': {
    hasChildren: false,
  },
} as const;

function hasRouteChildren(pathname: string): boolean {
  // Match pathname to route pattern
  // /projects/abc-123/issues → matches /projects/[projectId]/issues
  // Return ROUTE_STRUCTURE['/projects/[projectId]/issues']?.hasChildren ?? false
}
```

**Pros**:
- ✅ Explicit and clear
- ✅ Works everywhere (server/client)
- ✅ Type-safe with TypeScript
- ✅ Fast (in-memory lookup)
- ✅ Can include metadata (labels, permissions)

**Cons**:
- ❌ Requires manual maintenance
- ❌ Can drift from actual routes
- ❌ More code to maintain

**Best For**: When you want explicit control and type safety

---

### Option 4: Build-Time Route Scanning
**Approach**: Generate route metadata at build time by scanning the file system

**Implementation**:
```typescript
// scripts/generate-routes.ts (run at build time)
import { glob } from 'glob';
import { writeFile } from 'fs/promises';

async function generateRouteMetadata() {
  const routes = await glob('app/**/page.tsx', { cwd: process.cwd() });
  
  const routeMap = new Map<string, Set<string>>();
  
  routes.forEach(route => {
    // Parse: app/projects/[projectId]/issues/[issueKey]/page.tsx
    // Extract parent: /projects/[projectId]/issues
    // Child: [issueKey]
    // Add to routeMap
  });
  
  // Generate TypeScript file with route structure
  await writeFile('lib/navigation/routes.generated.ts', `
    export const ROUTE_METADATA = ${JSON.stringify(routeMap, null, 2)};
  `);
}
```

**Pros**:
- ✅ Automatic generation from file system
- ✅ Type-safe generated code
- ✅ No runtime file I/O
- ✅ Always in sync (if build script runs)

**Cons**:
- ❌ Requires build script setup
- ❌ Generated files can be confusing
- ❌ Need to regenerate on route changes
- ❌ More complex setup

**Best For**: Large apps with many routes, CI/CD integration

---

### Option 5: Hybrid: Convention + Smart Heuristics
**Approach**: Combine pathname analysis with known patterns and smart defaults

**Implementation**:
```typescript
// Convention: routes with layouts usually have children
// Convention: routes ending in dynamic segments may have children
// Heuristic: if current pathname has more segments, parent has children

function hasRouteChildren(
  pathname: string, 
  parentPath: string,
  knownPatterns?: Map<string, boolean>
): boolean {
  // 1. Check known patterns first (for edge cases)
  if (knownPatterns?.has(parentPath)) {
    return knownPatterns.get(parentPath)!;
  }
  
  // 2. Check if pathname continues beyond parent
  const pathSegments = pathname.split('/').filter(Boolean);
  const parentSegments = parentPath.split('/').filter(Boolean);
  
  if (pathSegments.length <= parentSegments.length) {
    return false; // We're at or before the parent
  }
  
  // 3. Check if remaining segment looks like a child route
  const nextSegment = pathSegments[parentSegments.length];
  
  // Known child routes patterns
  const childPatterns = ['config', 'integrations', 'settings', 'board', 'issues'];
  if (childPatterns.includes(nextSegment)) {
    return true;
  }
  
  // Dynamic segment might indicate children (but be conservative)
  if (nextSegment.startsWith('[') && nextSegment.endsWith(']')) {
    // Only if pathname continues beyond dynamic segment
    return pathSegments.length > parentSegments.length + 1;
  }
  
  return false;
}
```

**Pros**:
- ✅ Works client-side
- ✅ Handles most cases automatically
- ✅ Can override with known patterns
- ✅ No file I/O
- ✅ Good balance of automation and control

**Cons**:
- ❌ Requires some configuration for edge cases
- ❌ Heuristics may need tuning
- ❌ Less precise than file system scan

**Best For**: General purpose, good balance

---

## Recommendation: **Option 5 (Hybrid Approach)**

### Rationale
1. **Works everywhere**: Client and server components
2. **Low maintenance**: Mostly automatic, minimal config
3. **Extensible**: Easy to add known patterns for edge cases
4. **Fast**: No I/O, in-memory logic
5. **Good UX**: Accurate enough for breadcrumb behavior

### Implementation Structure
```typescript
// lib/navigation/breadcrumbs.ts

// Lightweight override map for edge cases
const ROUTE_CHILDREN_OVERRIDES = new Map<string, boolean>([
  // Override specific routes if convention fails
  // Example: ['/projects/[projectId]/sprints', true],
]);

// Main function
export function routeHasChildren(
  currentPathname: string,
  routePath: string
): boolean {
  // Check overrides first
  if (ROUTE_CHILDREN_OVERRIDES.has(routePath)) {
    return ROUTE_CHILDREN_OVERRIDES.get(routePath)!;
  }
  
  // Apply heuristics
  return inferRouteHasChildren(currentPathname, routePath);
}

function inferRouteHasChildren(
  currentPathname: string,
  routePath: string
): boolean {
  // Implementation from Option 5
}
```

### Future Extensibility
- Add routes to override map as needed
- Patterns automatically handle new routes
- Can evolve to Option 4 (build-time) if needed later

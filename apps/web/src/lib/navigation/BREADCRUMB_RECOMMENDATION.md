# Breadcrumb Route Detection: Recommendation

## Executive Summary

**Recommended Approach**: **Hybrid Convention-Based Detection (Option 5)**

A lightweight, convention-based system that:
- ✅ Works in both client and server components
- ✅ Requires zero configuration for most routes
- ✅ Automatically handles new routes
- ✅ Provides override mechanism for edge cases
- ✅ Fast (no file I/O, in-memory lookups)

## Options Comparison

| Option | Maintenance | Performance | Accuracy | Extensibility | Complexity |
|--------|------------|-------------|----------|---------------|------------|
| **1. File System Detection** | Low | Medium (I/O) | High | High | Low |
| **2. Pathname Analysis** | Low | High | Medium | Medium | Low |
| **3. Route Registry** | High | High | High | Medium | Low |
| **4. Build-Time Scanning** | Medium | High | High | High | High |
| **5. Hybrid (Recommended)** | **Low** | **High** | **High** | **High** | **Medium** |

## Why Hybrid Approach?

### 1. **Zero Configuration for Most Cases**
The system automatically detects child routes using:
- Pathname segment analysis
- Known child segment patterns (`board`, `issues`, `settings`, etc.)
- Dynamic segment detection

### 2. **Easy Override for Edge Cases**
When conventions fail, add a simple override:
```typescript
ROUTE_CHILDREN_OVERRIDES.set('/projects/[projectId]/sprints', true);
```

### 3. **Extensible Design**
- New routes automatically work if they follow conventions
- Override map can be expanded as needed
- Can evolve to build-time scanning (Option 4) later if routes grow complex

### 4. **Works Everywhere**
- Server components: No file I/O needed
- Client components: Uses pathname only
- Fast: In-memory logic, no async operations

## Implementation Details

### Route Detection Logic

```
Current Pathname: /projects/abc-123/issues/KEY-1/settings
Route to Check:   /projects/[projectId]/issues

1. Check override map → Not found
2. Count segments → current has more segments → potential children
3. Check next segment → "KEY-1" → looks like dynamic segment
4. Check if pathname continues → Yes (settings follows)
5. Result: true (has children)
```

### Breadcrumb Generation

```typescript
// Input
pathname: '/projects/abc-123/issues/KEY-1'
projectId: 'abc-123'
projectName: 'My Project'

// Output
[
  { label: 'Projects', href: '/projects' },              // Level 1: clickable
  { label: 'My Project' },                                // Level 2: not clickable
  { label: 'Issues', href: '/projects/abc-123/issues' }, // Level 3: clickable (has children)
  { label: 'KEY-1' },                                     // Level 4: not clickable (terminal)
]
```

## Usage Example

```typescript
// In a server component layout
import { generateProjectBreadcrumbs } from '@/lib/navigation/breadcrumbs';

export default async function ProjectLayout({ params, children }) {
  const { projectId } = await params;
  const project = await projectRepository.findById(projectId);
  
  // Get pathname from headers (server-side)
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/projects';
  
  const breadcrumbs = generateProjectBreadcrumbs(
    pathname,
    projectId,
    project.name
  );
  
  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}
```

## Future Extensibility

If the app grows and conventions become unwieldy, the system can evolve:

1. **Short-term**: Add more patterns to `KNOWN_CHILD_SEGMENTS`
2. **Medium-term**: Expand override map for complex routes
3. **Long-term**: Migrate to build-time route scanning (Option 4) by:
   - Running route scanner at build time
   - Generating TypeScript file with route metadata
   - Importing generated metadata in breadcrumb utility

## Edge Cases Handled

- ✅ Dynamic segments (`[projectId]`, `[issueKey]`)
- ✅ UUIDs in paths
- ✅ Issue keys (`PROJ-123`)
- ✅ Nested routes (`/settings/config`)
- ✅ Terminal routes (no children)

## Configuration Points

1. **KNOWN_CHILD_SEGMENTS**: Add common route segment names
2. **SEGMENT_LABELS**: Customize display labels
3. **ROUTE_CHILDREN_OVERRIDES**: Override detection for specific routes

## Testing Strategy

Test cases to verify:
- ✅ Routes with children are clickable
- ✅ Terminal routes are not clickable
- ✅ Project name is never clickable
- ✅ "Projects" is always clickable
- ✅ Dynamic segments are handled correctly
- ✅ Deeply nested routes work

## Migration Path

To implement:
1. ✅ Create utility function (`breadcrumbs.ts`)
2. ✅ Update project layout to use dynamic breadcrumbs
3. ✅ Test with existing routes
4. ✅ Add overrides for any edge cases
5. ✅ Document patterns for future routes

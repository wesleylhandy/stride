# Transition Rules Implementation - Dynamic Enforcement

## Overview

Transition rules are **dynamically enforced** based on the project configuration stored in the database. Rules are not hardcoded - they are read from the configuration at validation time, ensuring that changes to the configuration are immediately reflected in validation behavior.

## Key Principles

1. **No Hardcoded Rules**: All validation logic reads from the `config` parameter passed to validation functions
2. **Fresh Config Fetching**: Always fetch the latest configuration from the database for each validation
3. **Dynamic Rule Application**: Transition rules (`transitions` arrays) are evaluated at runtime based on the current configuration
4. **Permissive Default**: If no explicit rules are defined, all transitions are allowed (unless blocked by type-based restrictions)

## Implementation Details

### Server-Side Validation (API Routes)

**Location**: `apps/web/app/api/projects/[projectId]/issues/[issueKey]/status/route.ts`

```typescript
// Always fetch fresh config from database
const projectConfig = await projectRepository.getConfig(projectId);
if (!projectConfig || !projectConfig.config) {
  return NextResponse.json(
    { error: "Project configuration not found" },
    { status: 500 },
  );
}

// Cast JSONB to ProjectConfig (already parsed, no YAML parsing needed)
const config = projectConfig.config as ProjectConfig;

// Validate using fresh config
const validationResult = validateStatusChange(
  issueForValidation,
  validated.status,
  config, // Dynamic config from database
);
```

**Key Points**:
- Config is fetched fresh from database for each request
- Uses `projectRepository.getConfig()` which always queries the database
- No caching of configuration data
- Config is stored as JSONB (already parsed), not YAML string

### Client-Side Validation (UI Components)

**Location**: `packages/ui/src/organisms/KanbanBoard.tsx`

Client-side validation uses the `projectConfig` prop passed from the server component:

```typescript
function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  config: ProjectConfig, // From props - fetched fresh on page load
): { isValid: boolean; errors: ValidationError[] } {
  // Validation logic reads from config parameter
  // Rules are applied dynamically based on config.workflow.statuses[].transitions
}
```

**Note**: Client-side validation is for immediate UX feedback. Server-side validation is the source of truth and always uses fresh config.

### Validation Logic Flow

1. **Check Status Existence**: Verify both current and target statuses exist in `config.workflow.statuses`
2. **Check Explicit Transition Rules**: If `transitions` array is defined on the source status:
   - Only allow transitions to statuses listed in the array
   - Block all other transitions
3. **Apply Type-Based Restrictions**: If source status is `closed`:
   - Block transitions to `open` or `in_progress` types
   - Exception: Allow transition to "reopened" status if it exists
4. **Permissive Default**: If no explicit rules are defined, allow the transition

### Configuration Structure

```yaml
workflow:
  statuses:
    - key: todo
      name: To Do
      type: open
      transitions: [in_progress, in_review]  # Explicit rule: only these allowed
    - key: in_progress
      name: In Progress
      type: in_progress
      # No transitions field = all transitions allowed (permissive)
    - key: done
      name: Done
      type: closed
      transitions: [reopened]  # Explicit rule: can only reopen
```

## Ensuring Dynamic Enforcement

### ✅ What Makes It Dynamic

1. **Fresh Database Queries**: `projectRepository.getConfig()` always queries the database
2. **No Caching Layer**: Configuration is not cached - each validation fetches fresh data
3. **Config Parameter**: Validation functions receive config as a parameter, not a global variable
4. **Runtime Evaluation**: `transitions` arrays are checked at validation time, not compile time

### ✅ Responsiveness to Configuration Changes

When a user updates the project configuration:

1. Configuration is saved to database (both `configYaml` and parsed `config` JSONB)
2. Next validation request fetches fresh config via `projectRepository.getConfig()`
3. Validation rules are immediately applied based on new configuration
4. No server restart or cache invalidation needed

### Server Component Config Fetching

**Location**: `apps/web/app/projects/[projectId]/board/page.tsx`

```typescript
// Always fetch fresh config for server-side rendering
const projectConfigData = await projectRepository.getConfig(projectId);
const projectConfig = projectConfigData.config as YAMLProjectConfig;

// Pass to client component as prop
<KanbanBoardClient
  projectConfig={projectConfig}
  // ... other props
/>
```

## Validation Function Documentation

All validation functions include documentation clarifying that rules are dynamic:

```typescript
/**
 * Validate status transition based on workflow rules
 * 
 * Rules are dynamically enforced based on the provided configuration:
 * - Explicit transition rules: If `transitions` array is defined on a status, only those transitions are allowed
 * - Built-in restrictions: Cannot transition from 'closed' to 'open' or 'in_progress' (except via "reopened" status)
 * - Permissive default: If no explicit rules are defined, all transitions are allowed
 * 
 * This function reads rules from the config parameter - rules are not hardcoded.
 * Always pass the latest configuration from the database to ensure rule enforcement
 * is dynamic and responsive to configuration changes.
 */
```

## Testing Dynamic Enforcement

To verify rules are dynamically enforced:

1. **Initial State**: Configure project with permissive rules (no `transitions` fields)
2. **Move Issue**: Verify issue can move between any statuses
3. **Update Config**: Add explicit `transitions` rules (e.g., `todo` can only go to `in_progress`)
4. **Move Issue Again**: Verify issue can now only move according to new rules
5. **No Restart Required**: Rules should be enforced immediately without server restart

## Future Considerations

If caching is added in the future:

1. Cache invalidation must be implemented when configuration is updated
2. Validation functions must continue to accept config as parameter
3. Cache should be invalidated on `PUT /api/projects/[projectId]/config`
4. Consider using `configVersion` field for cache invalidation

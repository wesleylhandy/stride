# State Management Strategy: Stride Core Application

**Created**: 2024-12-19  
**Purpose**: Define state management approach, state requirements, and data flow

## State Management Philosophy

### Principles
- **Minimal Global State**: Only truly global state in Jotai
- **Server State Separation**: All server data in TanStack Query
- **Local State First**: Use React state for component-specific state
- **URL as State**: Use searchParams for shareable/filterable state
- **Derived State**: Compute from source state, don't duplicate

### State Categories

1. **Global Client State** (Jotai)
   - User session
   - Current project
   - UI preferences (theme, sidebar collapsed)
   - Command palette state

2. **Server State** (TanStack Query)
   - Issues, projects, cycles
   - User data
   - Configuration
   - Comments, attachments

3. **Local Component State** (React useState)
   - Form inputs
   - Modal open/close
   - Temporary UI state
   - Component-specific interactions

4. **URL State** (Next.js searchParams)
   - Filters
   - View selection
   - Pagination
   - Shareable links

## Global State (Jotai)

### User Session Atom

```typescript
// packages/ui/atoms/user.ts
import { atom } from 'jotai';

export const userAtom = atom<User | null>(null);
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);
export const userRoleAtom = atom((get) => get(userAtom)?.role ?? null);
```

**Usage**:
- Set on login
- Clear on logout
- Read for permission checks

**Location**: `packages/ui/atoms/user.ts`

---

### Current Project Atom

```typescript
// packages/ui/atoms/project.ts
import { atom } from 'jotai';

export const currentProjectIdAtom = atom<string | null>(null);
export const currentProjectAtom = atom<Project | null>(null);
```

**Usage**:
- Set when navigating to project
- Used for project-scoped queries
- Cleared when leaving project

**Location**: `packages/ui/atoms/project.ts`

---

### UI Preferences Atoms

```typescript
// packages/ui/atoms/ui.ts
import { atom } from 'jotai';

export const sidebarCollapsedAtom = atom<boolean>(false);
export const themeAtom = atom<'light' | 'dark'>('dark');
export const commandPaletteOpenAtom = atom<boolean>(false);
```

**Usage**:
- Persist to localStorage
- Apply across app
- User preferences

**Location**: `packages/ui/atoms/ui.ts`

---

### Command Palette Atoms

```typescript
// packages/ui/atoms/command-palette.ts
import { atom } from 'jotai';

export const commandPaletteQueryAtom = atom<string>('');
export const commandPaletteRecentAtom = atom<string[]>([]);
export const commandPaletteFavoritesAtom = atom<string[]>([]);
```

**Usage**:
- Search query
- Recent commands
- Favorite commands

**Location**: `packages/ui/atoms/command-palette.ts`

---

### Kanban Board Atoms

```typescript
// packages/ui/atoms/kanban.ts
import { atom } from 'jotai';

export const kanbanFiltersAtom = atom<KanbanFilters>({
  assigneeId: null,
  priority: null,
  cycleId: null,
});

export const kanbanViewModeAtom = atom<'board' | 'list'>('board');
```

**Usage**:
- Column filters
- View mode preference
- Persist to URL

**Location**: `packages/ui/atoms/kanban.ts`

## Server State (TanStack Query)

### Query Key Structure

```typescript
// Hierarchical query keys
const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: ProjectFilters) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    config: (id: string) => [...queryKeys.projects.detail(id), 'config'] as const,
  },
  issues: {
    all: ['issues'] as const,
    lists: () => [...queryKeys.issues.all, 'list'] as const,
    list: (projectId: string, filters: IssueFilters) => 
      [...queryKeys.issues.lists(), projectId, filters] as const,
    details: () => [...queryKeys.issues.all, 'detail'] as const,
    detail: (projectId: string, key: string) => 
      [...queryKeys.issues.details(), projectId, key] as const,
    comments: (projectId: string, key: string) => 
      [...queryKeys.issues.detail(projectId, key), 'comments'] as const,
  },
  cycles: {
    all: ['cycles'] as const,
    lists: () => [...queryKeys.cycles.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.cycles.lists(), projectId] as const,
    details: () => [...queryKeys.cycles.all, 'detail'] as const,
    detail: (projectId: string, id: string) => 
      [...queryKeys.cycles.details(), projectId, id] as const,
    metrics: (projectId: string, id: string) => 
      [...queryKeys.cycles.detail(projectId, id), 'metrics'] as const,
  },
};
```

**Location**: `apps/web/lib/queries/keys.ts`

---

### Query Hooks

#### Projects

```typescript
// apps/web/lib/queries/projects.ts
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters ?? {}),
    queryFn: () => api.projects.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => api.projects.get(projectId),
    enabled: !!projectId,
  });
}

export function useProjectConfig(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.config(projectId),
    queryFn: () => api.projects.getConfig(projectId),
    enabled: !!projectId,
  });
}
```

---

#### Issues

```typescript
// apps/web/lib/queries/issues.ts
export function useIssues(projectId: string, filters?: IssueFilters) {
  return useQuery({
    queryKey: queryKeys.issues.list(projectId, filters ?? {}),
    queryFn: () => api.issues.list(projectId, filters),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useIssue(projectId: string, issueKey: string) {
  return useQuery({
    queryKey: queryKeys.issues.detail(projectId, issueKey),
    queryFn: () => api.issues.get(projectId, issueKey),
    enabled: !!projectId && !!issueKey,
  });
}

export function useIssueComments(projectId: string, issueKey: string) {
  return useQuery({
    queryKey: queryKeys.issues.comments(projectId, issueKey),
    queryFn: () => api.issues.getComments(projectId, issueKey),
    enabled: !!projectId && !!issueKey,
  });
}
```

---

#### Cycles

```typescript
// apps/web/lib/queries/cycles.ts
export function useCycles(projectId: string) {
  return useQuery({
    queryKey: queryKeys.cycles.list(projectId),
    queryFn: () => api.cycles.list(projectId),
    enabled: !!projectId,
  });
}

export function useCycle(projectId: string, cycleId: string) {
  return useQuery({
    queryKey: queryKeys.cycles.detail(projectId, cycleId),
    queryFn: () => api.cycles.get(projectId, cycleId),
    enabled: !!projectId && !!cycleId,
  });
}

export function useCycleMetrics(projectId: string, cycleId: string) {
  return useQuery({
    queryKey: queryKeys.cycles.metrics(projectId, cycleId),
    queryFn: () => api.cycles.getMetrics(projectId, cycleId),
    enabled: !!projectId && !!cycleId,
    staleTime: 60 * 1000, // 1 minute
  });
}
```

---

### Mutation Hooks

#### Issue Mutations

```typescript
// apps/web/lib/mutations/issues.ts
export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateIssueInput) => 
      api.issues.create(projectId, data),
    onSuccess: () => {
      // Invalidate issues list
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.lists(),
      });
      // Optimistically add to cache if needed
    },
  });
}

export function useUpdateIssue(projectId: string, issueKey: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateIssueInput) => 
      api.issues.update(projectId, issueKey, data),
    onMutate: async (data) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.issues.detail(projectId, issueKey),
      });
      
      const previousIssue = queryClient.getQueryData(
        queryKeys.issues.detail(projectId, issueKey)
      );
      
      queryClient.setQueryData(
        queryKeys.issues.detail(projectId, issueKey),
        (old: Issue) => ({ ...old, ...data })
      );
      
      return { previousIssue };
    },
    onError: (err, data, context) => {
      // Rollback on error
      if (context?.previousIssue) {
        queryClient.setQueryData(
          queryKeys.issues.detail(projectId, issueKey),
          context.previousIssue
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.detail(projectId, issueKey),
      });
    },
  });
}

export function useMoveIssue(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ issueKey, newStatus }: { issueKey: string; newStatus: string }) =>
      api.issues.updateStatus(projectId, issueKey, newStatus),
    onMutate: async ({ issueKey, newStatus }) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.issues.lists(),
      });
      
      queryClient.setQueriesData(
        { queryKey: queryKeys.issues.lists() },
        (old: { data: Issue[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(issue =>
              issue.key === issueKey ? { ...issue, status: newStatus } : issue
            ),
          };
        }
      );
    },
    onError: () => {
      // Invalidate on error to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.lists(),
      });
    },
  });
}
```

---

#### Configuration Mutations

```typescript
// apps/web/lib/mutations/config.ts
export function useUpdateConfig(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (yaml: string) => api.projects.updateConfig(projectId, yaml),
    onSuccess: () => {
      // Invalidate config and project
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.config(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
      // Invalidate issues to refresh workflow
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.lists(),
      });
    },
  });
}
```

## State Flow Patterns

### Data Fetching Flow

```
1. Component mounts
2. Check TanStack Query cache
3. If stale/missing, fetch from API
4. Update cache
5. Component re-renders with data
6. Background refetch if stale
```

### Mutation Flow

```
1. User action triggers mutation
2. Optimistic update (optional)
3. Send mutation to API
4. On success: update cache, invalidate related queries
5. On error: rollback optimistic update, show error
6. Component re-renders with updated data
```

### Form State Flow

```
1. React Hook Form manages form state
2. Zod validates on submit
3. On valid: trigger mutation
4. Mutation updates server state
5. Form resets or navigates away
```

### URL State Flow

```
1. User applies filter/view
2. Update URL searchParams
3. Read searchParams in component
4. Use as query key parameter
5. TanStack Query fetches filtered data
```

## State Synchronization

### Server State → Client State

- TanStack Query automatically syncs
- Background refetch keeps data fresh
- Optimistic updates for immediate feedback

### Client State → Server State

- Mutations update server
- Cache invalidation triggers refetch
- Optimistic updates provide instant feedback

### Cross-Component State

- Jotai atoms for global client state
- TanStack Query cache for server state
- URL searchParams for shareable state

## State Persistence

### LocalStorage

```typescript
// Persist Jotai atoms to localStorage
import { atomWithStorage } from 'jotai/utils';

export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'dark');
export const sidebarCollapsedAtom = atomWithStorage('sidebarCollapsed', false);
```

### Session Storage

- Not used (prefer URL state for shareable filters)

### Database

- All persistent data in PostgreSQL
- TanStack Query caches server data
- No client-side persistence of server data

## State Management by Feature

### Issue Management

**Global State**:
- Current issue view (URL)
- Kanban filters (Jotai + URL)

**Server State**:
- Issues list (TanStack Query)
- Issue detail (TanStack Query)
- Comments (TanStack Query)

**Local State**:
- Form inputs (React Hook Form)
- Modal open/close
- Drag state (dnd-kit)

---

### Project Configuration

**Global State**:
- Current project (Jotai)

**Server State**:
- Project config (TanStack Query)
- Project details (TanStack Query)

**Local State**:
- Editor content (CodeMirror)
- Validation errors
- Save state

---

### Sprint Planning

**Global State**:
- Current cycle (URL)

**Server State**:
- Cycle details (TanStack Query)
- Cycle metrics (TanStack Query)
- Backlog issues (TanStack Query)

**Local State**:
- Drag state (dnd-kit)
- Planning mode

---

### Authentication

**Global State**:
- User session (Jotai)
- Auth state (Jotai)

**Server State**:
- User profile (TanStack Query)

**Local State**:
- Login form (React Hook Form)
- Error messages

## Performance Optimizations

### Query Optimization

- Appropriate `staleTime` for each query
- `cacheTime` for background data
- Query deduplication
- Parallel queries where possible

### Mutation Optimization

- Optimistic updates for instant feedback
- Selective cache invalidation
- Batch mutations when possible

### State Optimization

- Memoize derived atoms
- Split large atoms into smaller ones
- Use `useMemo` for expensive computations

## Error Handling

### Query Errors

```typescript
const { data, error, isLoading } = useIssues(projectId);

if (error) {
  return <ErrorDisplay error={error} />;
}
```

### Mutation Errors

```typescript
const mutation = useCreateIssue(projectId);

mutation.mutate(data, {
  onError: (error) => {
    toast.error(error.message);
  },
});
```

### Global Error Boundary

- React Error Boundary for component errors
- TanStack Query error handling for API errors
- Jotai error handling for atom errors

## Testing State Management

### Unit Tests

- Test atoms in isolation
- Test query hooks with mocked API
- Test mutation hooks with mocked API

### Integration Tests

- Test state flow end-to-end
- Test cache invalidation
- Test optimistic updates

### E2E Tests

- Test user flows with real state
- Test state persistence
- Test error recovery


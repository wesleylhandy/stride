# Quickstart: Manual Issue Sync Implementation

**Feature**: Manual Issue Sync for Inactive Webhooks  
**Created**: 2026-01-27  
**Purpose**: Developer quickstart guide for implementing manual issue sync functionality

## Overview

This guide provides step-by-step instructions for implementing manual issue sync from Git providers (GitHub, GitLab, Bitbucket) when webhooks are inactive.

## Architecture Summary

```
┌─────────────────┐
│   UI Component  │ → Triggers sync via API
│ ManualSyncButton│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   API Route Handler         │
│ /api/projects/[id]/         │
│  repositories/[id]/sync     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   IssueSyncService          │
│ - Orchestrates sync flow    │
│ - Handles pagination        │
│ - Manages rate limiting     │
└────────┬────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌───────┐ ┌────────┐ ┌──────────┐
│ GitHub │ │GitLab │ │Bitbucket│ │Duplicate │
│ Client │ │Client │ │ Client │ │ Matcher  │
└────────┘ └───────┘ └────────┘ └──────────┘
```

## Implementation Steps

### Step 1: Extend Git Provider Clients

**Location**: `apps/web/src/lib/integrations/`

#### GitHub Client (`github.ts`)

Add functions to fetch issues and security advisories:

```typescript
/**
 * Fetch repository issues from GitHub
 */
export async function fetchGitHubIssues(
  owner: string,
  repo: string,
  accessToken: string,
  options?: {
    state?: 'open' | 'closed' | 'all';
    page?: number;
    perPage?: number;
  }
): Promise<{
  issues: GitHubIssue[];
  hasMore: boolean;
  nextPage?: number;
}> {
  // Implementation: GET /repos/{owner}/{repo}/issues
  // Parse Link headers for pagination
  // Return issues with hasMore flag
}

/**
 * Fetch Dependabot alerts from GitHub
 */
export async function fetchGitHubDependabotAlerts(
  owner: string,
  repo: string,
  accessToken: string,
  options?: {
    state?: 'open' | 'dismissed' | 'fixed' | 'auto_dismissed';
    page?: number;
    perPage?: number;
  }
): Promise<{
  alerts: GitHubDependabotAlert[];
  hasMore: boolean;
  nextPage?: number;
}> {
  // Implementation: GET /repos/{owner}/{repo}/dependabot/alerts
}
```

#### GitLab Client (`gitlab.ts`)

Similar functions:
- `fetchGitLabIssues(projectId, accessToken, options)`
- `fetchGitLabVulnerabilityFindings(projectId, accessToken, options)` (Premium/Ultimate only)

#### Bitbucket Client (`bitbucket.ts`)

Similar functions:
- `fetchBitbucketIssues(workspace, repo, accessToken, options)`

**Key Points**:
- Handle pagination via Link headers (GitHub/GitLab) or `next` URL (Bitbucket)
- Parse rate limit headers and return rate limit info
- Handle 429/403 rate limit errors gracefully
- Return structured data with pagination info

### Step 2: Create Sync Service

**Location**: `apps/web/src/lib/sync/issue-sync-service.ts`

```typescript
export class IssueSyncService {
  constructor(
    private issueRepository: IssueRepository,
    private repositoryConnectionRepository: RepositoryConnectionRepository,
    private duplicateMatcher: DuplicateMatcher
  ) {}

  async syncRepositoryIssues(
    repositoryConnectionId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    // 1. Fetch repository connection with access token
    // 2. Determine provider type and call appropriate client
    // 3. Fetch issues with pagination
    // 4. For each issue:
    //    - Check for duplicates via DuplicateMatcher
    //    - Create or update issue
    //    - Store external identifier in customFields
    // 5. Update RepositoryConnection.lastSyncAt
    // 6. Return sync results
  }
}
```

**Key Points**:
- Handle pagination sequentially to avoid rate limits
- Process issues in batches for progress tracking
- Store external identifiers in `Issue.customFields.externalId`
- Update progress state for async operations

### Step 3: Create Duplicate Matcher

**Location**: `apps/web/src/lib/sync/duplicate-matcher.ts`

```typescript
export class DuplicateMatcher {
  async findMatchingIssue(
    externalIssue: ExternalIssue,
    projectId: string,
    repositoryUrl: string
  ): Promise<Issue | null> {
    // Priority 1: Match on externalId in customFields
    // Priority 2: Match on title + repositoryUrl
    // Return matching issue or null
  }

  private buildExternalId(
    providerType: string,
    repositoryUrl: string,
    issueId: string
  ): string {
    return `${providerType}:${repositoryUrl}:${issueId}`;
  }
}
```

**Key Points**:
- Query `Issue.customFields` using GIN index
- Search for `externalId` first, then fallback to title match
- Return null if no match (new issue will be created)

### Step 4: Create API Route

**Location**: `apps/web/app/api/projects/[projectId]/repositories/[repositoryId]/sync/route.ts`

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; repositoryId: string }> }
) {
  // 1. Authenticate user and check permissions (admin/member, not viewer)
  // 2. Validate repository connection exists and belongs to project
  // 3. Check for active sync operation (prevent concurrent syncs)
  // 4. If webhook active, return requiresConfirmation flag
  // 5. Parse request body (syncType, includeClosed)
  // 6. If includeClosed, validate confirmation was provided
  // 7. Create SyncOperation (if async needed)
  // 8. Call IssueSyncService.syncRepositoryIssues()
  // 9. Return sync results (200) or operation ID (202)
}
```

**Key Points**:
- Validate permissions (FR-017)
- Check webhook status and return confirmation requirement (FR-018)
- Prevent concurrent syncs (FR-012)
- Support both sync and async modes

### Step 5: Create UI Components

**Location**: `apps/web/src/components/features/projects/`

#### ManualSyncButton.tsx

```typescript
export function ManualSyncButton({
  repositoryConnectionId,
  projectId,
  isActive,
}: Props) {
  // Show button in repository settings
  // If webhook active, show info message with confirmation
  // On click: Open sync dialog or trigger sync directly
  // Show loading state during sync
  // Display sync results on completion
}
```

#### SyncProgressDialog.tsx

```typescript
export function SyncProgressDialog({
  operationId,
  open,
  onClose,
}: Props) {
  // Poll sync status endpoint for async operations
  // Display progress bar and stage information
  // Show results summary on completion
  // Handle errors with user-friendly messages
}
```

**Key Points**:
- Follow existing UI patterns (CreateProjectModal, etc.)
- Show progress feedback (FR-010)
- Handle active webhook confirmation flow
- Display sync results (created/updated/skipped counts)

### Step 6: Update Data Model (if needed)

**Location**: `packages/database/prisma/schema.prisma`

**Optional**: Add SyncOperation model if implementing async operations with database persistence:

```prisma
model SyncOperation {
  id                    String    @id @default(uuid())
  repositoryConnectionId String
  projectId             String
  userId                String
  status                SyncStatus
  syncType              SyncType
  includeClosed         Boolean   @default(false)
  progress              Json      @default("{}")
  results               Json      @default("{}")
  error                 String?
  startedAt             DateTime?
  completedAt           DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  repositoryConnection  RepositoryConnection @relation(...)
  project               Project              @relation(...)
  user                  User                 @relation(...)

  @@index([repositoryConnectionId, status])
  @@index([createdAt])
}
```

**Note**: For MVP, SyncOperation can be in-memory only. Database persistence can be added later if needed.

## Testing Strategy

### Unit Tests

1. **Git Provider Clients**: Mock HTTP responses, test pagination parsing
2. **DuplicateMatcher**: Test matching logic with various scenarios
3. **IssueSyncService**: Test sync flow with mocked dependencies

### Integration Tests

1. **API Routes**: Test sync endpoint with real database, mock Git provider APIs
2. **End-to-End**: Test full sync flow from UI to database

### Manual Testing Checklist

- [ ] Sync issues from GitHub repository
- [ ] Sync issues from GitLab repository  
- [ ] Sync issues from Bitbucket repository
- [ ] Test duplicate detection (external ID match)
- [ ] Test duplicate detection (title + repository match)
- [ ] Test security advisory sync (GitHub Dependabot)
- [ ] Test closed/archived issues sync with confirmation
- [ ] Test active webhook confirmation flow
- [ ] Test rate limiting handling
- [ ] Test progress feedback for large repositories
- [ ] Test manual issue linking
- [ ] Test permission enforcement (viewers cannot sync)
- [ ] Test concurrent sync prevention

## Common Patterns

### Rate Limiting Handling

```typescript
async function fetchWithRetry(fetchFn: () => Promise<Response>, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetchFn();
      if (response.status === 429 || response.status === 403) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        const delay = parseInt(retryAfter) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
    }
  }
}
```

### Pagination Handling

```typescript
async function fetchAllPages<T>(
  fetchPageFn: (page: number) => Promise<{ items: T[]; hasMore: boolean }>
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchPageFn(page);
    allItems.push(...result.items);
    hasMore = result.hasMore;
    page++;
  }

  return allItems;
}
```

## Performance Considerations

1. **Batch Processing**: Process issues in batches (e.g., 50 at a time) to avoid memory issues
2. **Pagination**: Use sequential pagination to respect rate limits
3. **Progress Updates**: Update progress every N issues (e.g., every 10) to balance UI responsiveness and API calls
4. **Async Mode**: Use async mode for repositories with > 100 issues to prevent HTTP timeouts

## Security Considerations

1. **Permission Checks**: Verify user has admin/member role (not viewer) before allowing sync
2. **Access Token Security**: Access tokens are already encrypted in RepositoryConnection - use as-is
3. **Input Validation**: Validate sync options (syncType, includeClosed) using Zod schemas
4. **Rate Limiting**: Respect Git provider rate limits to avoid account suspension

## Next Steps

1. Implement Git provider client functions (Step 1)
2. Create sync service and duplicate matcher (Steps 2-3)
3. Create API route (Step 4)
4. Create UI components (Step 5)
5. Write tests (Testing Strategy)
6. Manual testing (Manual Testing Checklist)
7. Deploy and monitor

## References

- [GitHub Issues API](https://docs.github.com/en/rest/issues/issues)
- [GitHub Dependabot Alerts API](https://docs.github.com/en/rest/dependabot/alerts)
- [GitLab Issues API](https://docs.gitlab.com/ee/api/issues.html)
- [Bitbucket Issues API](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-issue-tracker/)
- Spec: [spec.md](./spec.md)
- Research: [research.md](./research.md)
- Data Model: [data-model.md](./data-model.md)

# Data Model: Manual Issue Sync for Inactive Webhooks

**Feature**: Manual Issue Sync for Inactive Webhooks  
**Created**: 2026-01-27  
**Purpose**: Define data model changes and extensions for manual issue sync functionality

## Existing Entities (Extended)

### RepositoryConnection

**Purpose**: Represents Git repository integration configuration (existing model - no changes required)

**Current Attributes**:
- `id` (UUID, Primary Key)
- `projectId` (UUID, Foreign Key → Project)
- `repositoryUrl` (String, Unique)
- `serviceType` (Enum: GitHub | GitLab | Bitbucket)
- `accessToken` (String, Encrypted)
- `webhookSecret` (String, Encrypted)
- `webhookId` (String?, Optional)
- `isActive` (Boolean, Default: true)
- `lastSyncAt` (DateTime?, Optional) - **Used to track last manual sync timestamp**
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relationships**:
- Many-to-One: `RepositoryConnection.projectId` → Project

**Usage in Sync**:
- `isActive` determines if webhook is active (affects UI messaging)
- `accessToken` used for Git provider API authentication
- `serviceType` determines which API client to use
- `repositoryUrl` used for issue matching and API requests
- `lastSyncAt` updated after successful sync completion

### Issue

**Purpose**: Represents work items, bugs, features, or tasks (existing model - extended via customFields)

**Current Attributes**:
- `id` (UUID, Primary Key)
- `key` (String) - Format: `{PROJECT_KEY}-{NUMBER}`
- `projectId` (UUID, Foreign Key → Project)
- `title` (String, Max: 255)
- `description` (Text, Optional)
- `status` (String)
- `type` (Enum: Bug | Feature | Task | Epic)
- `priority` (Enum: Low | Medium | High | Critical, Optional)
- `reporterId` (UUID, Foreign Key → User)
- `assigneeId` (UUID, Foreign Key → User, Optional)
- `cycleId` (UUID, Foreign Key → Cycle, Optional)
- `customFields` (JSONB, Default: {}) - **Extended to store external identifier**
- `storyPoints` (Int?, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `closedAt` (DateTime?, Optional)

**Extended customFields Structure** (for synced issues):
```typescript
{
  // Existing custom fields...
  externalId?: string;          // Format: "{provider}:{repoUrl}:{issueId}"
  externalSync?: {
    providerType: "GitHub" | "GitLab" | "Bitbucket";
    repositoryUrl: string;
    issueNumber?: number;
    syncedAt: string;            // ISO 8601 timestamp
    lastSyncedAt?: string;       // For tracking updates
    securityAdvisory?: boolean;  // True if synced from security advisory
  };
}
```

**Usage in Sync**:
- `customFields.externalId` used for duplicate detection
- `title` used for fallback matching (title + repository URL)
- `customFields.externalSync` stores sync metadata for future updates
- `description` populated from Git provider issue body/description
- `type` set to `Bug` for security advisories (as per FR-014)
- `priority` set to `High` or `Critical` for security advisories
- `reporterId` set to authenticated user triggering sync

**Constraints**:
- `customFields.externalId` must be unique within a project (enforced in application logic, not database constraint)
- One external issue can map to one local issue (prevented by duplicate matching)

## New Entities

### SyncOperation

**Purpose**: Tracks manual sync operations in progress for progress monitoring and async operations

**Attributes**:
- `id` (UUID, Primary Key)
- `repositoryConnectionId` (UUID, Foreign Key → RepositoryConnection, Required)
- `projectId` (UUID, Foreign Key → Project, Required)
- `userId` (UUID, Foreign Key → User, Required) - User who triggered sync
- `status` (Enum: Pending | InProgress | Completed | Failed, Required)
- `syncType` (Enum: Full | IssuesOnly | SecurityOnly, Required)
- `includeClosed` (Boolean, Default: false) - Whether closed/archived issues included
- `progress` (JSONB, Default: {}) - Current progress state
  ```typescript
  {
    current: number;      // Current issue number being processed
    total: number;        // Total issues to sync
    processed: number;    // Issues processed so far
    stage: string;        // Current stage: "fetching" | "matching" | "creating" | "updating"
  }
  ```
- `results` (JSONB, Default: {}) - Sync results summary
  ```typescript
  {
    created: number;      // Issues created
    updated: number;      // Issues updated
    skipped: number;      // Issues skipped (duplicates)
    failed: number;       // Issues that failed to sync
    errors?: Array<{      // Error details (if any)
      issueId?: string;
      error: string;
    }>;
  }
  ```
- `error` (Text, Optional) - Error message if status is Failed
- `startedAt` (DateTime, Optional)
- `completedAt` (DateTime, Optional)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `SyncOperation.repositoryConnectionId` → RepositoryConnection
- Many-to-One: `SyncOperation.projectId` → Project
- Many-to-One: `SyncOperation.userId` → User

**Indexes**:
- `repositoryConnectionId` (for preventing concurrent syncs)
- `status` (for querying active syncs)
- `createdAt` (for cleanup of old operations)

**Validation Rules**:
- Only one `InProgress` or `Pending` sync operation per `repositoryConnectionId` at a time
- `completedAt` required when `status` is `Completed` or `Failed`
- `error` required when `status` is `Failed`

**Lifecycle**:
1. Created with `status: Pending` when sync triggered
2. Transitioned to `status: InProgress` when sync starts
3. `progress` updated during sync operation
4. Transitioned to `status: Completed` or `Failed` when sync finishes
5. `results` populated on completion
6. Cleanup after 7 days (optional background job)

**Note**: This entity may be implemented as a database table or in-memory state depending on async operation requirements. For MVP, in-memory tracking with optional database persistence is acceptable.

## Data Validation

### External Identifier Format

**Format**: `{provider}:{repositoryUrl}:{issueId}`

**Examples**:
- `github:https://github.com/owner/repo:123`
- `gitlab:https://gitlab.com/owner/repo:456`
- `bitbucket:https://bitbucket.org/workspace/repo:789`

**Validation Rules**:
- Must start with provider prefix (`github:`, `gitlab:`, `bitbucket:`)
- Repository URL must be valid HTTPS URL
- Issue ID must be numeric or alphanumeric (provider-dependent)
- Maximum length: 500 characters (prevent abuse)

### Issue Matching Logic

**Priority Order**:
1. Match on `customFields.externalId` (exact match)
2. Match on `title` + `repositoryUrl` from `RepositoryConnection` (exact match)

**Uniqueness Constraints**:
- Application-level constraint: One `externalId` per project
- Database-level: Not enforced (customFields is JSONB, constraint handled in application logic)

## State Transitions

### SyncOperation Status

```
Pending → InProgress → Completed
                  ↓
                Failed
```

**Transition Rules**:
- `Pending` → `InProgress`: When sync processing begins
- `InProgress` → `Completed`: When all issues processed successfully
- `InProgress` → `Failed`: When error occurs (rate limit exceeded, API error, etc.)
- No reverse transitions (syncs cannot be retried from Completed/Failed status - new sync must be triggered)

## Data Migration Considerations

**No Schema Changes Required**:
- External identifiers stored in existing `Issue.customFields` JSONB field
- `SyncOperation` can be implemented as application state or new table
- `RepositoryConnection.lastSyncAt` already exists

**Data Migration Tasks** (if implementing SyncOperation as table):
- Create `SyncOperation` table via Prisma migration
- Add indexes as specified above
- Optional: Backfill `customFields.externalId` for existing issues if external identifiers can be determined

## Performance Considerations

**Indexing**:
- `Issue.customFields` is already indexed with GIN index (from existing schema)
- Queries for external ID matching will use GIN index efficiently
- Consider composite index on `projectId` + `customFields->>'externalId'` if performance requires

**Pagination**:
- Git provider APIs paginate issues (100 per page max)
- Sync operations process sequentially to avoid rate limiting
- Progress updates occur every N issues (configurable, default: 10)

**Large Repository Handling**:
- Sync operations support cancellation
- Progress state persisted for recovery (if SyncOperation in database)
- Batch processing of issues to avoid memory issues

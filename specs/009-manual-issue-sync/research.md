# Research: Manual Issue Sync for Inactive Webhooks

**Feature**: Manual Issue Sync for Inactive Webhooks  
**Created**: 2026-01-27  
**Purpose**: Resolve technical unknowns and document architecture decisions

## Research Tasks

### GitHub Issues API Endpoints

**Decision**: Use GitHub REST API v3 endpoints for fetching issues and security advisories

**Endpoints**:
- **List Repository Issues**: `GET /repos/{owner}/{repo}/issues`
  - Query params: `state` (open/closed/all), `page`, `per_page` (max 100), `sort`, `direction`
  - Returns: Array of issue objects with `id`, `number`, `title`, `body`, `state`, `labels`, `assignees`, `created_at`, `updated_at`, `html_url`
  - Pagination: Link headers with `rel="next"` and `rel="last"`
  
- **List Dependabot Alerts**: `GET /repos/{owner}/{repo}/dependabot/alerts`
  - Requires: `vulnerability-alerts` scope or repository admin access
  - Returns: Array of alert objects with `number`, `state`, `dependency`, `security_advisory`, `security_vulnerability`
  - Pagination: Link headers
  
- **List Security Advisories**: `GET /repos/{owner}/{repo}/security-advisories` (GitHub Enterprise)
  - Note: Limited to GitHub Enterprise Server/Cloud with Advanced Security
  - Alternative: Dependabot alerts are more commonly available

**Rate Limits**: 
- Authenticated requests: 5,000 requests/hour
- Response headers include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- When limit exceeded: `403 Forbidden` with rate limit info in headers

**Rationale**:
- GitHub REST API v3 is well-documented and widely used
- Supports pagination via Link headers for large repositories
- Dependabot alerts API provides security vulnerability information
- Rate limit headers enable proper rate limiting handling

**Alternatives Considered**:
- GraphQL API: More complex, not needed for simple list operations
- GitHub CLI: Would require shell execution, less reliable than direct API calls

### GitLab Issues API Endpoints

**Decision**: Use GitLab REST API v4 endpoints for fetching issues and security advisories

**Endpoints**:
- **List Project Issues**: `GET /projects/{id}/issues`
  - Query params: `state` (opened/closed/all), `page`, `per_page` (max 100), `order_by`, `sort`
  - Returns: Array of issue objects with `id`, `iid`, `title`, `description`, `state`, `labels`, `assignees`, `created_at`, `updated_at`, `web_url`
  - Pagination: Link headers with `rel="next"` and `rel="last"`
  
- **List Vulnerability Findings**: `GET /projects/{id}/vulnerability_findings` (GitLab Ultimate/Premium)
  - Requires: GitLab Premium/Ultimate license for Security Dashboard
  - Returns: Vulnerability findings from security scans
  
- **List Dependency Scanning Reports**: `GET /projects/{id}/dependency_list` (GitLab Ultimate/Premium)
  - Alternative approach for security vulnerabilities

**Rate Limits**:
- Default: 600 requests/hour per user
- Response headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- When limit exceeded: `429 Too Many Requests`

**Rationale**:
- GitLab REST API v4 is the standard API version
- Issues API provides comprehensive issue data
- Security features require Premium/Ultimate - gracefully degrade when unavailable
- Rate limit headers enable proper handling

**Alternatives Considered**:
- GitLab GraphQL API: More complex, REST API sufficient for list operations

### Bitbucket Issues API Endpoints

**Decision**: Use Bitbucket REST API v2 endpoints for fetching issues (limited security advisory support)

**Endpoints**:
- **List Repository Issues**: `GET /2.0/repositories/{workspace}/{repo_slug}/issues`
  - Query params: `page`, `pagelen` (max 100), `q` (query filter)
  - Returns: Paginated response with `values` array containing issue objects
  - Issue object: `id`, `title`, `content`, `state`, `kind`, `priority`, `created_on`, `updated_on`, `links.html.href`
  - Pagination: `next` URL in response object
  
- **Security Advisories**: Not available via standard Bitbucket API
  - Bitbucket does not provide Dependabot-equivalent service
  - Security scanning typically handled by third-party integrations

**Rate Limits**:
- Default: 1,000 requests/hour per user
- No standard rate limit headers
- When limit exceeded: `429 Too Many Requests` or `403 Forbidden`

**Rationale**:
- Bitbucket API v2 is the current standard
- Issues API supports pagination via `next` URL pattern
- Security advisory limitations documented in spec assumptions
- Graceful degradation when security features unavailable

**Alternatives Considered**:
- Bitbucket Cloud API v1: Deprecated, not recommended

### Duplicate Issue Matching Strategy

**Decision**: Multi-tier matching with external identifier storage in issue customFields

**Matching Priority**:
1. **External Identifier Match**: Exact match on `externalId` stored in `Issue.customFields.externalId`
   - Format: `{provider}:{repositoryUrl}:{issueId}` (e.g., `github:https://github.com/owner/repo:123`)
   - Most reliable - unique per provider

2. **Title + Repository URL Match**: Exact match on `title` + `repositoryUrl` from `RepositoryConnection`
   - Fallback when external identifier not available
   - Less reliable due to potential title changes

**Storage Strategy**:
- Store external identifiers in `Issue.customFields` JSONB field
- Structure: `{ externalId: string, providerType: string, repositoryUrl: string, syncedAt: DateTime }`
- Enables future bidirectional sync and update tracking

**Rationale**:
- External identifiers provide reliable unique matching
- Storing in customFields avoids schema changes (YAGNI)
- Title+repository fallback handles legacy issues without external IDs
- Manual linking capability handles edge cases

**Alternatives Considered**:
- Dedicated `externalId` column: More normalized but requires schema migration
- Title similarity matching: Too error-prone, could cause false matches

### Rate Limiting and Pagination Handling

**Decision**: Exponential backoff with jitter for rate limit errors, sequential pagination with Link header parsing

**Rate Limiting Strategy**:
- Detect rate limit via `429` or `403` status codes
- Check rate limit headers when available (`X-RateLimit-Remaining`)
- Implement exponential backoff: `waitTime = baseDelay * (2 ^ attempt) + jitter`
  - Base delay: 60 seconds
  - Max attempts: 5
  - Jitter: Random 0-10 seconds to prevent thundering herd
- Update progress feedback during wait periods
- If rate limit persists after max attempts, return error with user-friendly message

**Pagination Strategy**:
- Parse Link headers (GitHub, GitLab) or `next` URL (Bitbucket)
- Fetch pages sequentially (avoid overwhelming provider APIs)
- Process issues incrementally and update progress
- Support cancellation via AbortController for long-running syncs

**Rationale**:
- Exponential backoff prevents overwhelming rate-limited APIs
- Sequential pagination is safer than parallel for large repositories
- Progress updates maintain user experience during long operations
- Cancellation support prevents wasted API quota

**Alternatives Considered**:
- Parallel pagination: Faster but risks rate limiting
- Fixed delay retry: Less efficient than exponential backoff

### Async Operation Support

**Decision**: Support both synchronous (small repos) and asynchronous (large repos) sync operations

**Synchronous Mode**:
- Repositories with < 100 issues: Complete sync in single request/response
- Return sync results immediately
- Show progress via optimistic UI updates

**Asynchronous Mode**:
- Repositories with > 100 issues or when explicitly requested
- Return `202 Accepted` with operation ID
- Poll status endpoint: `GET /api/projects/[projectId]/repositories/[repositoryId]/sync/[operationId]`
- WebSocket/SSE alternative: Defer to future enhancement (YAGNI)

**Operation Tracking**:
- Store sync operations in database (new table or extend existing)
- Track: `status` (pending/in_progress/completed/failed), `progress` (current/total), `results` (created/updated/failed counts)
- Cleanup completed operations after 7 days

**Rationale**:
- Hybrid approach optimizes for both small and large repositories
- Async mode prevents HTTP timeouts for long operations
- Status polling is simple and works with standard HTTP
- Operation tracking enables progress monitoring and error recovery

**Alternatives Considered**:
- Always async: Adds complexity for simple cases
- WebSocket/SSE: More complex, defer to future if needed

### External Identifier Storage Format

**Decision**: Store external identifiers in `Issue.customFields` as JSONB with standardized structure

**Structure**:
```typescript
{
  externalId: string;        // Format: "{provider}:{repoUrl}:{issueId}"
  providerType: "GitHub" | "GitLab" | "Bitbucket";
  repositoryUrl: string;
  issueNumber?: number;      // Provider-specific issue number
  syncedAt: string;          // ISO 8601 timestamp
  lastSyncedAt?: string;     // For tracking updates
}
```

**Rationale**:
- Uses existing JSONB field (no schema migration)
- Structured format enables efficient querying
- Includes metadata for debugging and future features
- Flexible for different provider formats

**Alternatives Considered**:
- Separate `external_identifiers` table: More normalized but requires migration
- Simple string in customFields: Less structured, harder to query

## Implementation Notes

### Security Advisory Detection

**GitHub**:
- Dependabot alerts are fetched separately from regular issues
- Map to issues with `type: Bug`, `priority: High/Critical` based on severity
- Include vulnerability details in issue description

**GitLab**:
- Security findings require Premium/Ultimate license
- Gracefully skip if unavailable (check API response)
- Map to issues similar to GitHub approach

**Bitbucket**:
- No native security advisory support
- Skip security sync with informative message

### Manual Issue Linking

**UI Pattern**:
- Show "Link to existing issue" button on synced issues
- Modal with issue search/selection
- Update issue's `customFields.externalId` to link them
- Prevent duplicate external IDs (one external issue per local issue)

**Rationale**:
- Provides user control when automatic matching fails
- Simple UI pattern consistent with existing modals
- Prevents data integrity issues with unique constraint on externalId

## Dependencies

### Existing Code Reuse
- `apps/web/src/lib/integrations/github.ts` - Extend with issue fetching functions
- `apps/web/src/lib/integrations/gitlab.ts` - Extend with issue fetching functions
- `apps/web/src/lib/integrations/bitbucket.ts` - Create or extend with issue fetching
- `packages/database/src/repositories/issue-repository.ts` - Use for issue creation/updates
- `packages/database/src/repositories/repository-connection-repository.ts` - Access token retrieval

### New Dependencies
- None required - use native `fetch` API for HTTP requests
- Consider adding `p-retry` library for retry logic (optional enhancement)

## Open Questions (Resolved)

All technical unknowns resolved in this research document. Implementation can proceed to Phase 1 design.

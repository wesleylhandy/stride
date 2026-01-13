# Research: Project Import from Git Providers

**Feature**: Project Import from Git Providers  
**Created**: 2026-01-23  
**Purpose**: Resolve technical unknowns and document architecture decisions

## Research Tasks

### GitHub/GitLab API Repository Listing

**Decision**: Use GitHub `/user/repos` and GitLab `/api/v4/projects` endpoints for repository listing

**Rationale**:
- GitHub API `/user/repos` endpoint lists all repositories accessible to the authenticated user (own repos and organization repos)
- GitLab API `/api/v4/projects` endpoint lists all projects (repositories) accessible to the authenticated user
- Both endpoints support pagination via query parameters
- Both endpoints require OAuth access tokens with appropriate scopes

**Alternatives Considered**:
- Organization/group-specific endpoints: Rejected - would require additional selection UI and complicate the flow
- Repository search endpoints: Rejected - listing user's repos is simpler and more appropriate for import use case

**Implementation Details**:
- GitHub: `GET https://api.github.com/user/repos?per_page=100&page=1&type=all&sort=updated`
- GitLab: `GET https://gitlab.com/api/v4/projects?per_page=100&page=1&order_by=updated_at&sort=desc`
- Support pagination via `per_page` and `page` parameters
- Filter out archived repositories (optional enhancement)

### Project Key Generation from Repository Names

**Decision**: Auto-generate project keys from repository names with conflict resolution

**Rationale**:
- Extract key from repository name: uppercase, alphanumeric only, max 10 characters
- Algorithm: Take repository name, convert to uppercase, remove non-alphanumeric, truncate to 10 chars
- If generated key conflicts, append number suffix (e.g., "MYREPO", "MYREPO1", "MYREPO2")
- Allow user to override generated key during import

**Alternatives Considered**:
- Always require manual key entry: Rejected - adds friction to import flow
- Use repository ID: Rejected - not user-friendly, violates project key format requirements

**Implementation Details**:
- Key generation function: `generateProjectKeyFromName(repoName: string): string`
- Conflict checking: Query database for existing keys with same prefix
- User override: Import UI allows editing key before confirmation

### Repository Import Flow Architecture

**Decision**: Combine project creation and repository connection in a single API endpoint with transaction

**Rationale**:
- Import is atomic operation: either both project creation and repository connection succeed, or both fail
- Reuse existing `projectRepository.create()` and repository connection logic
- Single API endpoint simplifies error handling and rollback
- Follows existing patterns from repository connection flow

**Alternatives Considered**:
- Separate endpoints (create project, then connect repository): Rejected - not atomic, more complex error handling
- Client-side orchestration: Rejected - server-side transaction is safer

**Implementation Details**:
- New endpoint: `POST /api/projects/import`
- Request body includes repository URL, type, access token, and optional project key override
- Server-side transaction: Create project → Connect repository → Register webhooks → Sync config
- Rollback on any failure (transaction or explicit cleanup)

### OAuth Token Scopes

**Decision**: Reuse existing OAuth scopes for repository listing

**Rationale**:
- GitHub: `repo` scope provides access to repository listing and contents
- GitLab: `api`, `read_repository`, `write_repository` scopes provide access to project listing
- Existing OAuth configuration already requests appropriate scopes
- No additional OAuth setup required

**Alternatives Considered**:
- Request additional scopes: Rejected - existing scopes are sufficient
- Public repository access only: Rejected - users need access to private repos

**Implementation Details**:
- GitHub OAuth scope: `repo admin:repo_hook` (existing)
- GitLab OAuth scope: `api read_repository write_repository` (existing)
- Access tokens obtained via existing OAuth flow

### Pagination Strategy

**Decision**: Use API-level pagination with client-side page management

**Rationale**:
- GitHub and GitLab APIs support pagination via query parameters
- Client-side pagination simplifies implementation (no server-side caching needed)
- Standard pattern: `per_page=100&page=1` for GitHub, `per_page=100&page=1` for GitLab
- UI shows page controls and repository count

**Alternatives Considered**:
- Server-side caching: Rejected - adds complexity, repositories change frequently
- Infinite scroll: Considered but rejected for MVP - pagination is clearer UX

**Implementation Details**:
- Default page size: 100 repositories per page
- API parameters: `per_page` and `page` query parameters
- Response includes pagination metadata (total count, has_next, has_prev)
- UI displays page controls and repository list

### Repository Already Connected Handling

**Decision**: Check for existing repository connections and prevent duplicate imports

**Rationale**:
- `RepositoryConnection.repositoryUrl` is unique in database
- Before import, check if repository URL already exists in `RepositoryConnection` table
- If exists, show error message indicating repository is already connected
- Prevents duplicate projects for same repository

**Alternatives Considered**:
- Allow multiple projects for same repository: Rejected - violates business logic, causes confusion
- Auto-link to existing project: Rejected - import should create new project, not link to existing

**Implementation Details**:
- Check: `SELECT * FROM repository_connections WHERE repository_url = ?`
- If exists, return error: "Repository is already connected to another project"
- Include project name/ID in error message for user reference

## Resolved Clarifications

All technical unknowns have been resolved based on existing codebase patterns and industry standards:

1. ✅ Repository listing API endpoints identified
2. ✅ Pagination strategy determined
3. ✅ Project key generation algorithm defined
4. ✅ Import flow architecture decided
5. ✅ OAuth token scopes confirmed
6. ✅ Duplicate repository handling strategy defined

## Notes

- All decisions align with existing codebase patterns
- No new technologies or libraries required
- Reuses existing OAuth, API integration, and database patterns
- Follows SOLID principles and existing architecture patterns

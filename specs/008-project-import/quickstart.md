# Quickstart: Project Import from Git Providers

**Feature**: Import projects from GitHub and GitLab repositories  
**Created**: 2026-01-23

## Overview

This feature enables users to import projects from git repositories (GitHub, GitLab) with automatic repository connection, configuration sync, and webhook setup. It supports both manual project creation (enhanced) and automated import workflows.

## User Flows

### Flow 1: Manual Project Creation (Enhanced)

**During Onboarding**:
1. Navigate to project creation page (`/onboarding/project`)
2. Enter project key, name, and description
3. Optionally provide repository URL and type
4. Submit form
5. Project is created (repository URL stored if provided; connection happens separately)

**After Onboarding**:
1. Navigate to projects listing page (`/projects`)
2. Click "Create Project" button (top-right header)
3. Modal opens with project creation form
4. Enter project key, name, and description
5. Optionally provide repository URL and type
6. Submit form
7. Modal closes and projects list refreshes
8. Project is created (repository URL stored if provided; connection happens separately)

### Flow 2: Repository Import (Automated)

1. Navigate to project import page (`/projects/import`)
2. Select git provider (GitHub or GitLab)
3. Authenticate with git provider (OAuth flow)
4. View list of available repositories
5. Select repository to import
6. Review and optionally edit project key and name
7. Confirm import
8. Project is created with repository connected, configuration synced, and webhooks registered

## Developer Setup

### Prerequisites

- Existing Stride installation
- Git provider OAuth apps configured (GitHub/GitLab)
- User account with git provider access

### Configuration

Ensure Git OAuth credentials are configured (see [Git OAuth Integration Guide](../docs/integrations/git-oauth.md)):

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret
```

### API Endpoints

#### GET /api/repositories/list

List repositories from a git provider.

**Query Parameters**:
- `type`: `GitHub` or `GitLab` (required)
- `accessToken`: OAuth access token (required)
- `page`: Page number (optional, default: 1)
- `per_page`: Items per page (optional, default: 100)

**Example Request**:
```typescript
const response = await fetch(
  `/api/repositories/list?type=GitHub&accessToken=${token}&page=1&per_page=100`
);
const data = await response.json();
// { repositories: [...], pagination: {...} }
```

#### POST /api/projects/import

Import a project from a repository.

**Request Body**:
```typescript
{
  repositoryUrl: "https://github.com/owner/repo",
  repositoryType: "GitHub",
  accessToken: "ghp_...",
  projectKey?: "MYREPO", // Optional, auto-generated if not provided
  projectName?: "My Repository" // Optional, auto-populated from repo
}
```

**Example Request**:
```typescript
const response = await fetch('/api/projects/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repositoryUrl: 'https://github.com/owner/repo',
    repositoryType: 'GitHub',
    accessToken: token,
  }),
});
const data = await response.json();
// { project: {...}, connection: {...} }
```

## Implementation Steps

### 1. Add Repository Listing Functions

Add functions to `apps/web/src/lib/integrations/github.ts` and `apps/web/src/lib/integrations/gitlab.ts`:

```typescript
// GitHub
export async function listGitHubRepositories(
  accessToken: string,
  page: number = 1,
  perPage: number = 100
): Promise<GitHubRepository[]>

// GitLab
export async function listGitLabRepositories(
  accessToken: string,
  baseUrl?: string,
  page: number = 1,
  perPage: number = 100
): Promise<GitLabRepository[]>
```

### 2. Create Repository Listing API Endpoint

Create `apps/web/app/api/repositories/list/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  // Validate authentication
  // Extract query parameters (type, accessToken, page, per_page)
  // Call appropriate listing function (GitHub/GitLab)
  // Return repositories with pagination info
}
```

### 3. Create Project Import API Endpoint

Create `apps/web/app/api/projects/import/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // Validate authentication
  // Validate request body
  // Check for duplicate repository connection
  // Fetch repository metadata
  // Generate project key if not provided
  // Sync configuration from repository
  // Create project (transaction)
  // Create repository connection (same transaction)
  // Register webhooks
  // Return project and connection info
}
```

### 4. Create Import UI Page

Create `apps/web/app/projects/import/page.tsx`:

- Server component for authentication
- Client component for repository selection and import flow
- OAuth authentication flow
- Repository list display with pagination
- Import confirmation form
- Success/error handling

### 5. Enhance Manual Project Creation

Update `apps/web/app/api/projects/route.ts`:

- Accept optional `repositoryUrl` and `repositoryType` in request body
- If provided, establish repository connection after project creation
- Reuse existing repository connection logic

## Testing

### Manual Testing

1. **Manual Project Creation**:
   - Create project without repository
   - Create project with repository URL
   - Verify repository connection is established

2. **Repository Import**:
   - Authenticate with GitHub/GitLab
   - View repository list
   - Import repository
   - Verify project created with correct metadata
   - Verify repository connection established
   - Verify configuration synced (if `stride.config.yaml` exists)
   - Verify webhooks registered

3. **Error Cases**:
   - Import repository that's already connected
   - Import with invalid repository URL
   - Import with invalid access token
   - Import with duplicate project key

### Automated Testing

- Unit tests for repository listing functions
- Unit tests for project key generation
- Integration tests for API endpoints
- E2E tests for import flow

## Common Issues

### OAuth Token Expired

**Issue**: Repository listing fails with 401 error  
**Solution**: Re-authenticate with git provider to get new access token

### Repository Already Connected

**Issue**: Import fails with "Repository already connected" error  
**Solution**: Repository is already connected to another project. Check existing connections or disconnect first.

### Project Key Conflict

**Issue**: Auto-generated project key conflicts with existing project  
**Solution**: System automatically appends number suffix. Or manually provide unique key during import.

### Configuration Sync Failed

**Issue**: Repository has invalid `stride.config.yaml`  
**Solution**: System falls back to default configuration. Fix YAML file in repository and re-sync later.

## Next Steps

- Review API contracts in `contracts/api.yaml`
- Review data model in `data-model.md`
- Review implementation plan in `impl-plan.md`
- Start implementation with repository listing functions

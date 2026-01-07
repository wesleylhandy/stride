# API Contracts: Repository Connection Management

**Feature**: Post-onboarding repository connection configuration  
**Created**: 2024-12-19  
**Base Path**: `/api/projects/[projectId]/repositories`

## Overview

All endpoints already exist. This document describes their usage for the settings page feature.

## Endpoints

### GET /api/projects/[projectId]/repositories

**Purpose**: Fetch existing repository connection for a project.

**Authentication**: Required (Admin role)

**Query Parameters**:
- `action=oauth` (optional): Request OAuth URL
- `type={GitHub|GitLab}` (optional, required if `action=oauth`): Repository service type

**Response (Standard)**:
```json
{
  "id": "uuid",
  "repositoryUrl": "https://github.com/owner/repo",
  "serviceType": "GitHub",
  "isActive": true,
  "lastSyncAt": "2024-12-19T10:30:00Z",
  "createdAt": "2024-12-19T09:00:00Z"
}
```

**Response (OAuth Request)**:
```json
{
  "authUrl": "https://github.com/login/oauth/authorize?...",
  "state": "random-uuid"
}
```

**Status Codes**:
- `200`: Connection found
- `404`: No connection found (only for standard request)
- `400`: Invalid parameters
- `401`: Unauthorized
- `403`: Forbidden (not Admin)
- `500`: Internal server error

**Usage in Settings Page**:
```typescript
// Fetch existing connection
const { data: connection } = useQuery({
  queryKey: ['repository-connection', projectId],
  queryFn: async () => {
    const res = await fetch(`/api/projects/${projectId}/repositories`);
    if (res.status === 404) return null; // No connection
    if (!res.ok) throw new Error('Failed to fetch connection');
    return res.json();
  },
});

// Get OAuth URL
const { data: oauth } = useQuery({
  queryKey: ['oauth-url', projectId, 'GitHub'],
  queryFn: async () => {
    const res = await fetch(
      `/api/projects/${projectId}/repositories?action=oauth&type=GitHub`
    );
    if (!res.ok) throw new Error('Failed to get OAuth URL');
    return res.json();
  },
  enabled: false, // Manual trigger
});
```

---

### POST /api/projects/[projectId]/repositories

**Purpose**: Create or update repository connection.

**Authentication**: Required (Admin role)

**Request Body (OAuth Flow)**:
```json
{
  "repositoryUrl": "https://github.com/owner/repo",
  "repositoryType": "GitHub",
  "code": "oauth-authorization-code"
}
```

**Request Body (Manual Token)**:
```json
{
  "repositoryUrl": "https://github.com/owner/repo",
  "repositoryType": "GitHub",
  "accessToken": "ghp_xxxxxxxxxxxx"
}
```

**Validation**:
- `repositoryUrl`: Required, must be valid Git repository URL
- `repositoryType`: Required, must be "GitHub" | "GitLab" | "Bitbucket"
- `code` OR `accessToken`: Required (one or the other, not both)

**Response**:
```json
{
  "id": "uuid",
  "repositoryUrl": "https://github.com/owner/repo",
  "serviceType": "GitHub",
  "isActive": true
}
```

**Status Codes**:
- `201`: Connection created/updated successfully
- `400`: Validation error or missing required fields
- `401`: Unauthorized
- `403`: Forbidden (not Admin)
- `404`: Project not found
- `500`: Internal server error

**Behavior**:
- Uses `upsert` operation:
  - If `repositoryUrl` matches existing connection → Updates credentials
  - If `repositoryUrl` is new → Creates new connection
- Automatically:
  - Syncs configuration from repository
  - Registers webhook with Git service
  - Encrypts and stores credentials
  - Updates `lastSyncAt` timestamp

**Usage in Settings Page**:
```typescript
// OAuth flow (after callback)
const connectOAuth = async (code: string, repositoryUrl: string) => {
  const res = await fetch(`/api/projects/${projectId}/repositories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repositoryUrl,
      repositoryType: 'GitHub',
      code,
    }),
  });
  if (!res.ok) throw new Error('Failed to connect repository');
  return res.json();
};

// Manual token flow
const connectManual = async (repositoryUrl: string, accessToken: string) => {
  const res = await fetch(`/api/projects/${projectId}/repositories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repositoryUrl,
      repositoryType: 'GitHub',
      accessToken,
    }),
  });
  if (!res.ok) throw new Error('Failed to connect repository');
  return res.json();
};
```

---

### GET /api/projects/[projectId]/repositories/callback

**Purpose**: OAuth callback handler (existing endpoint).

**Authentication**: Not required (handled by OAuth provider)

**Query Parameters**:
- `code`: OAuth authorization code
- `state`: OAuth state parameter (for CSRF protection)
- `returnTo` (optional): Redirect URL after success (default: `/onboarding/complete`)

**Behavior**:
1. Validates OAuth code and state
2. Exchanges code for access token
3. Creates/updates repository connection
4. Redirects to `returnTo` URL or default

**Usage in Settings Page**:
```typescript
// OAuth redirect URL
const redirectUri = `/api/projects/${projectId}/repositories/callback?returnTo=/projects/${projectId}/settings/integrations`;

// OAuth flow
const handleOAuth = async (type: 'GitHub' | 'GitLab') => {
  const { authUrl } = await fetch(
    `/api/projects/${projectId}/repositories?action=oauth&type=${type}`
  ).then(r => r.json());
  
  // Store returnTo in sessionStorage for callback
  sessionStorage.setItem('oauthReturnTo', `/projects/${projectId}/settings/integrations`);
  
  window.location.href = authUrl;
};
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "details": {} // Optional, for validation errors
}
```

**Validation Error Example**:
```json
{
  "error": "Validation failed",
  "details": {
    "repositoryUrl": ["Invalid repository URL format"],
    "repositoryType": ["Required field"]
  }
}
```

---

## TypeScript Types

```typescript
// Request types
interface ConnectRepositoryOAuthRequest {
  repositoryUrl: string;
  repositoryType: 'GitHub' | 'GitLab' | 'Bitbucket';
  code: string;
}

interface ConnectRepositoryManualRequest {
  repositoryUrl: string;
  repositoryType: 'GitHub' | 'GitLab' | 'Bitbucket';
  accessToken: string;
}

// Response types
interface RepositoryConnectionInfo {
  id: string;
  repositoryUrl: string;
  serviceType: 'GitHub' | 'GitLab' | 'Bitbucket';
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface OAuthUrlResponse {
  authUrl: string;
  state: string;
}

interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}
```

---

## Future Endpoints (Out of Scope)

### DELETE /api/projects/[projectId]/repositories

**Purpose**: Disconnect repository (future enhancement).

**Authentication**: Required (Admin role)

**Response**:
```json
{
  "success": true,
  "message": "Repository disconnected successfully"
}
```

**Behavior**:
- Removes webhook from Git service
- Deletes connection from database
- Optionally: Marks linked issues/branches as disconnected

---

## Rate Limiting

All endpoints should respect existing rate limiting:
- Per-user rate limits
- Per-endpoint rate limits
- OAuth endpoints may have stricter limits

---

## Security Considerations

1. **Authentication**: All endpoints require Admin role
2. **Encryption**: Access tokens encrypted at rest
3. **Validation**: All inputs validated with Zod schemas
4. **CSRF Protection**: OAuth state parameter for callback
5. **Sensitive Data**: Never return `accessToken` or `webhookSecret` in responses


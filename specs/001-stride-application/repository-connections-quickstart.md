# Quickstart: Repository Connection Management

**Feature**: Configure GitHub/GitLab connections in Project Settings  
**Created**: 2024-12-19

## Overview

This feature allows Admin users to manage repository connections for projects after onboarding is complete. Connections can be configured via OAuth (recommended) or manual token entry.

## User Flow

### 1. Access Repository Settings

1. Navigate to a project
2. Go to **Project Settings** → **Integrations**
3. View existing connection (if any) or connect a new repository

### 2. Connect Repository (OAuth - Recommended)

1. Click **"Connect GitHub"** or **"Connect GitLab"** button
2. Authorize Stride in the Git service (GitHub/GitLab)
3. Redirected back to settings page
4. Connection status displayed

### 3. Connect Repository (Manual Token)

1. Select repository type (GitHub/GitLab)
2. Enter repository URL (e.g., `https://github.com/owner/repo`)
3. Enter Personal Access Token
4. Click **"Connect Repository"**
5. Connection status displayed

### 4. Update Connection

1. If connection exists, click **"Reconnect"** or **"Update"**
2. Follow OAuth or manual flow
3. Existing connection is updated with new credentials

## Developer Setup

### Prerequisites

- Existing Stride installation
- Admin user account
- Project created
- OAuth apps configured (GitHub/GitLab) - see main quickstart

### Implementation Steps

1. **Enable Integrations Link**
   ```typescript
   // apps/web/src/components/features/projects/ProjectSettingsNavigation.tsx
   // Uncomment Integrations section
   ```

2. **Create Settings Page**
   ```typescript
   // apps/web/app/projects/[projectId]/settings/integrations/page.tsx
   // Server component for auth + data fetching
   ```

3. **Extract Connection Form**
   ```typescript
   // apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
   // Reusable component from onboarding flow
   ```

4. **Create Settings Component**
   ```typescript
   // apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
   // Main UI component for settings page
   ```

## API Usage Examples

### Fetch Existing Connection

```typescript
const response = await fetch(`/api/projects/${projectId}/repositories`);
if (response.status === 404) {
  // No connection exists
} else {
  const connection = await response.json();
  // Use connection data
}
```

### Connect via OAuth

```typescript
// 1. Get OAuth URL
const { authUrl } = await fetch(
  `/api/projects/${projectId}/repositories?action=oauth&type=GitHub`
).then(r => r.json());

// 2. Redirect user
window.location.href = authUrl;

// 3. Callback handles connection creation
// 4. User redirected back to settings page
```

### Connect via Manual Token

```typescript
const response = await fetch(`/api/projects/${projectId}/repositories`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repositoryUrl: 'https://github.com/owner/repo',
    repositoryType: 'GitHub',
    accessToken: 'ghp_xxxxxxxxxxxx',
  }),
});

const connection = await response.json();
```

## Testing

### Manual Testing

1. **View Connection**:
   - Navigate to settings → integrations
   - Verify existing connection displays (if any)

2. **OAuth Flow**:
   - Click "Connect GitHub"
   - Complete OAuth authorization
   - Verify redirect back to settings
   - Verify connection status updated

3. **Manual Token Flow**:
   - Enter repository URL and token
   - Submit form
   - Verify connection created
   - Verify success message

4. **Update Connection**:
   - With existing connection, click "Reconnect"
   - Complete OAuth or manual flow
   - Verify connection updated

### Automated Testing

```typescript
// Integration test example
describe('Repository Connection Settings', () => {
  it('should display existing connection', async () => {
    // Mock API response
    // Render settings page
    // Verify connection info displayed
  });

  it('should connect repository via OAuth', async () => {
    // Mock OAuth flow
    // Verify connection created
  });

  it('should connect repository via manual token', async () => {
    // Submit form with token
    // Verify connection created
  });
});
```

## Troubleshooting

### OAuth Not Working

- Verify OAuth app configured correctly
- Check redirect URI matches callback URL
- Verify environment variables set (GITHUB_CLIENT_ID, etc.)

### Connection Not Updating

- Verify Admin role (required)
- Check API response for errors
- Verify repository URL format
- Check token permissions (repo scope for GitHub)

### Connection Not Displaying

- Verify connection exists in database
- Check API endpoint returns 200 (not 404)
- Verify user has Admin role
- Check browser console for errors

## Next Steps

After implementing MVP:
- Add disconnect functionality (DELETE endpoint)
- Add connection health indicators
- Add connection activity logs
- Support multiple repositories per project


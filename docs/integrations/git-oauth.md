# Git OAuth Integration

**Status**: Optional  
**Required For**: Repository webhook integration and automatic issue status updates  
**App Functionality**: Works fully without Git OAuth configuration

## Overview

Stride integrates with GitHub and GitLab via OAuth to enable repository webhook integration. This integration is **optional** - the application works perfectly without it. When Git OAuth is not configured:

- ✅ All core features work normally
- ✅ Manual issue management
- ❌ Repository webhook integration is disabled
- ❌ Automatic issue status updates from branch/PR activity are disabled

If you want to enable repository integration, configure Git OAuth for GitHub or GitLab.

### Supported Services

- **GitHub**: GitHub.com or GitHub Enterprise
- **GitLab**: GitLab.com or self-hosted GitLab instances

---

## Prerequisites

Before configuring Git OAuth:

1. **Git Service Account**: Access to GitHub or GitLab account
   - GitHub: Personal account or organization account
   - GitLab: Personal account or group account

2. **OAuth Application**: Create OAuth app in your Git service:
   - GitHub: Settings → Developer settings → OAuth Apps
   - GitLab: User Settings → Applications (or Group/Project Settings)

3. **Callback URL**: Know your application's callback URL:
   - Format: `https://your-domain.com/api/auth/github/callback` (GitHub)
   - Format: `https://your-domain.com/api/auth/gitlab/callback` (GitLab)

4. **Network Access**: Application must be able to reach Git service APIs:
   - GitHub: `https://api.github.com`
   - GitLab: `https://gitlab.com/api/v4` (or self-hosted API endpoint)

5. **Docker (if using Docker)**: Docker Compose set up and running
   - `.env` file configured
   - Docker network allows external connections

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_CLIENT_ID` | Yes* | - | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes* | - | GitHub OAuth App Client Secret |
| `GITLAB_CLIENT_ID` | Yes* | - | GitLab OAuth Application ID |
| `GITLAB_CLIENT_SECRET` | Yes* | - | GitLab OAuth Application Secret |

*Required only if repository integration is enabled (at least one Git service)

---

## Setup Instructions

### GitHub OAuth Setup

#### Step 1: Create GitHub OAuth App

1. **Navigate to GitHub Settings**:
   - Go to [GitHub.com](https://github.com)
   - Click your profile → Settings
   - Go to Developer settings → OAuth Apps
   - Click "New OAuth App"

2. **Configure OAuth App**:
   - **Application name**: `Stride` (or your app name)
   - **Homepage URL**: `https://your-domain.com` (your Stride instance URL)
   - **Authorization callback URL**: `https://your-domain.com/api/auth/github/callback`
   - Click "Register application"

3. **Get Client Credentials**:
   - After creation, GitHub displays:
     - **Client ID**: Copy this value
     - **Client Secret**: Click "Generate a new client secret" and copy the secret
     - **Important**: Client secret is only shown once, save it immediately

#### Step 2: Configure Environment Variables

**Docker** (`.env` file):
```env
# GitHub OAuth Configuration (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Bare-Metal** (`.env` file):
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### Step 3: Update docker-compose.yml

The `docker-compose.yml` already includes GitHub OAuth environment variable mappings. Verify they're present:

```yaml
services:
  web:
    environment:
      # OAuth Configuration (optional, for repository integration)
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:-}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:-}
```

#### Step 4: Restart Containers

After updating environment variables, restart the web container:

```bash
docker-compose restart web
```

### GitLab OAuth Setup

#### Step 1: Create GitLab OAuth Application

1. **Navigate to GitLab Settings**:
   - Go to [GitLab.com](https://gitlab.com) (or your self-hosted instance)
   - Click your profile → User Settings → Applications
   - Or for group/project: Group/Project Settings → Applications

2. **Configure OAuth Application**:
   - **Name**: `Stride` (or your app name)
   - **Redirect URI**: `https://your-domain.com/api/auth/gitlab/callback`
   - **Scopes**: Select `api`, `read_repository`, `write_repository`
   - Click "Save application"

3. **Get Application Credentials**:
   - After creation, GitLab displays:
     - **Application ID**: Copy this value
     - **Secret**: Copy the secret (can regenerate if needed)

#### Step 2: Configure Environment Variables

**Docker** (`.env` file):
```env
# GitLab OAuth Configuration (Optional)
GITLAB_CLIENT_ID=your-gitlab-application-id
GITLAB_CLIENT_SECRET=your-gitlab-secret
```

**Bare-Metal** (`.env` file):
```env
GITLAB_CLIENT_ID=your-gitlab-application-id
GITLAB_CLIENT_SECRET=your-gitlab-secret
```

#### Step 3: Update docker-compose.yml

The `docker-compose.yml` already includes GitLab OAuth environment variable mappings. Verify they're present:

```yaml
services:
  web:
    environment:
      # OAuth Configuration (optional, for repository integration)
      GITLAB_CLIENT_ID: ${GITLAB_CLIENT_ID:-}
      GITLAB_CLIENT_SECRET: ${GITLAB_CLIENT_SECRET:-}
```

#### Step 4: Restart Containers

After updating environment variables, restart the web container:

```bash
docker-compose restart web
```

---

## Verification

### Check if Git OAuth is Configured

The application automatically detects Git OAuth configuration on startup. Check the logs:

**Docker**:
```bash
docker-compose logs web | grep -i -E "(github|gitlab|oauth)"

# If configured correctly:
# ✅ GitHub OAuth configured
# ✅ GitLab OAuth configured
```

**Bare-Metal**:
```bash
tail -f /var/log/stride/app.log | grep -i -E "(github|gitlab|oauth)"
```

### Test OAuth Flow

#### Method 1: Via UI

1. **Navigate to Repository Settings**: Go to Project Settings → Repository
2. **Connect Repository**: Click "Connect GitHub" or "Connect GitLab"
3. **Authorize Application**: You'll be redirected to GitHub/GitLab to authorize
4. **Verify Connection**: After authorization, repository should be connected

#### Method 2: Check OAuth Callback

1. **Monitor Logs**: Watch application logs during OAuth flow
2. **Check Callback**: Verify callback URL receives OAuth code
3. **Verify Token Exchange**: Check logs for successful token exchange

---

## Examples

### GitHub OAuth (Minimal Example)

**`.env` file**:
```env
GITHUB_CLIENT_ID=abc123def456
GITHUB_CLIENT_SECRET=xyz789secret
```

**docker-compose.yml**:
```yaml
services:
  web:
    environment:
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:-}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:-}
```

### GitLab OAuth (Minimal Example)

**`.env` file**:
```env
GITLAB_CLIENT_ID=gitlab-12345
GITLAB_CLIENT_SECRET=gitlab-secret-abc
```

**docker-compose.yml**:
```yaml
services:
  web:
    environment:
      GITLAB_CLIENT_ID: ${GITLAB_CLIENT_ID:-}
      GITLAB_CLIENT_SECRET: ${GITLAB_CLIENT_SECRET:-}
```

### Self-Hosted GitLab

**`.env` file**:
```env
GITLAB_CLIENT_ID=gitlab-12345
GITLAB_CLIENT_SECRET=gitlab-secret-abc
GITLAB_BASE_URL=https://gitlab.your-domain.com  # Self-hosted GitLab URL
```

**Note**: If using self-hosted GitLab, the application may need additional configuration for the base URL.

---

## Troubleshooting

### Docker-Specific Issues

#### Environment Variables Not Loading

**Problem**: `GITHUB_CLIENT_ID` or `GITLAB_CLIENT_SECRET` set in `.env` file but not available in container.

**Solution**: See Docker troubleshooting in the [SMTP Integration guide](/docs/integrations/smtp#docker-specific-issues) for same solutions.

### Connection Problems

#### "OAuth callback URL mismatch"

**Problem**: OAuth callback fails with URL mismatch error.

**Causes**:
- Callback URL in OAuth app doesn't match application URL
- Redirect URI in request doesn't match registered callback URL

**Solution**:
1. **Verify Callback URL**: Check OAuth app callback URL matches:
   - GitHub: `https://your-domain.com/api/auth/github/callback`
   - GitLab: `https://your-domain.com/api/auth/gitlab/callback`
2. **Check Application URL**: Verify `NEXT_PUBLIC_APP_URL` is set correctly:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```
3. **Update OAuth App**: If URL changed, update callback URL in OAuth app settings

#### "Invalid client credentials" or "OAuth error"

**Problem**: OAuth flow fails with invalid credentials error.

**Causes**:
- Client ID or secret incorrect
- Client secret was regenerated but environment variable not updated
- Typo in environment variables

**Solution**:
1. **Verify Credentials**: Double-check Client ID and Secret from OAuth app settings
2. **Check Environment Variables**: Verify variables are loaded correctly:
   ```bash
   docker-compose exec web env | grep -E "(GITHUB|GITLAB)"
   ```
3. **Regenerate Secret**: If needed, generate new client secret in OAuth app and update `.env`

### Service-Specific Issues

#### GitHub OAuth Issues

**"Redirect URI mismatch"**:
- **Cause**: Callback URL in OAuth app doesn't match request redirect URI
- **Solution**: Update callback URL in GitHub OAuth app settings to match application URL

**"Scope insufficient"**:
- **Cause**: OAuth app doesn't have required scopes
- **Solution**: OAuth app should request `repo` and `admin:repo_hook` scopes (configured in application code)

#### GitLab OAuth Issues

**"Invalid redirect_uri"**:
- **Cause**: Redirect URI not registered in GitLab OAuth application
- **Solution**: Add redirect URI to GitLab OAuth application settings

**"Insufficient scope"**:
- **Cause**: OAuth application doesn't have required scopes
- **Solution**: OAuth app should request `api`, `read_repository`, `write_repository` scopes

---

## Security Best Practices

1. **Protect Client Secrets**: Treat OAuth secrets as sensitive information
   - Never commit secrets to version control
   - Use environment variables or secrets management
   - For Docker: Use Docker secrets or environment variable files (not committed)

2. **Use HTTPS**: Always use HTTPS for OAuth callbacks (required by most providers)

3. **Validate State Parameter**: Application should use state parameter for CSRF protection

4. **Rotate Secrets**: Regularly rotate OAuth client secrets

5. **Restrict Scopes**: Request only necessary OAuth scopes (don't request more than needed)

---

## Related Documentation

- [Integration Overview](/docs/integrations) - All integrations guide
- [Monitoring Webhooks](/docs/integrations/monitoring-webhooks) - Webhook setup for monitoring services
- [Configuration Documentation](/docs/configuration) - YAML workflow configuration

**Note**: Docker deployment documentation is available in the repository's `docs/deployment/docker.md` file.

---

## External Resources

- [GitHub OAuth Apps Documentation](https://docs.github.com/en/apps/oauth-apps) - GitHub OAuth setup
- [GitLab OAuth Applications](https://docs.gitlab.com/ee/integration/oauth_provider.html) - GitLab OAuth setup

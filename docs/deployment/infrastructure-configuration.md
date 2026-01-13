---
purpose: Complete guide for configuring global infrastructure settings (Git OAuth and AI Gateway)
targetAudience: System administrators, DevOps engineers
lastUpdated: 2026-01-12
---

# Infrastructure Configuration Guide

## Overview

Stride supports two levels of configuration:

1. **Infrastructure Configuration** (Global): System-wide settings for Git OAuth and AI Gateway
2. **Project Configuration** (Per-Project): Project-specific settings that can override global defaults

This guide covers **Infrastructure Configuration** - the global, system-wide settings that apply to all projects.

## Configuration Methods

Infrastructure configuration can be set up using two methods:

### Option 1: Environment Variables (Infrastructure-as-Code)

**Recommended for**: Production deployments, version-controlled configuration, infrastructure-as-code workflows

- Configuration stored in `.env` file or deployment configuration
- Version-controlled (via Git or deployment configs)
- Immutable (requires deployment to change)
- Consistent across environments

### Option 2: Admin Settings UI (Dynamic Configuration)

**Recommended for**: Development, testing, quick configuration changes

- Configuration stored in database
- Can be changed without deployment
- UI-based management (no file editing)
- Can be overridden by environment variables

## Configuration Precedence

**Important**: Environment variables always override UI-based configuration.

**Precedence Order** (highest to lowest):

1. **Environment Variables** (infrastructure-as-code, immutable, requires deployment)
2. **Database (UI-based)** (dynamic, can be changed without deployment)
3. **Default Values** (hardcoded fallbacks)

**Per-Provider Precedence**: Each provider (GitHub, GitLab, AI Gateway) is checked independently. This allows mixed sources:
- GitHub configured via environment variables
- GitLab configured via UI
- AI Gateway configured via environment variables

**UI Indication**: When environment variables override UI settings, the Admin Settings UI shows:
- Read-only state for affected fields
- "Configured via environment variables" message
- Explanation that changes require updating environment variables

## Git OAuth Configuration

Configure global Git OAuth credentials for GitHub and GitLab. These credentials are used to initiate OAuth flows when connecting repositories to projects.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_CLIENT_ID` | Yes* | - | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes* | - | GitHub OAuth App Client Secret |
| `GITLAB_CLIENT_ID` | Yes* | - | GitLab OAuth Application ID |
| `GITLAB_CLIENT_SECRET` | Yes* | - | GitLab OAuth Application Secret |
| `GITLAB_BASE_URL` | No | `https://gitlab.com` | GitLab base URL (for self-hosted GitLab) |

*Required only if repository integration is enabled (at least one Git service)

### Setup via Environment Variables

**Docker** (`.env` file):
```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# GitLab OAuth Configuration
GITLAB_CLIENT_ID=your-gitlab-application-id
GITLAB_CLIENT_SECRET=your-gitlab-secret
GITLAB_BASE_URL=https://gitlab.com  # Optional, for self-hosted GitLab
```

**Bare-Metal** (`.env` file):
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITLAB_CLIENT_ID=your-gitlab-application-id
GITLAB_CLIENT_SECRET=your-gitlab-secret
```

**Restart Required**: After updating environment variables, restart the application:
```bash
# Docker
docker-compose restart web

# Bare-Metal
pm2 restart stride-web
# Or
sudo systemctl restart stride-web
```

### Setup via Admin Settings UI

1. **Navigate to Admin Settings**: Go to `/settings/infrastructure` (admin-only)
2. **Configure GitHub OAuth**:
   - Enter GitHub Client ID
   - Enter GitHub Client Secret (password-type field, masked)
   - Click "Save" or "Test Connection" to verify
3. **Configure GitLab OAuth**:
   - Enter GitLab Application ID
   - Enter GitLab Application Secret (password-type field, masked)
   - Enter GitLab Base URL (optional, for self-hosted GitLab)
   - Click "Save" or "Test Connection" to verify

**Note**: If environment variables are set, UI fields will be read-only with "Configured via environment variables" message.

### OAuth App Setup

#### GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Configure:
   - **Application name**: `Stride` (or your app name)
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/repositories/oauth/callback`
4. Click "Register application"
5. Copy Client ID and generate Client Secret

#### GitLab OAuth Application

1. Go to GitLab User Settings → Applications (or Group/Project Settings)
2. Click "New Application"
3. Configure:
   - **Name**: `Stride` (or your app name)
   - **Redirect URI**: `https://your-domain.com/api/repositories/oauth/callback`
   - **Scopes**: Select `api`, `read_repository`, `write_repository`
4. Click "Save application"
5. Copy Application ID and Secret

### Relationship to Per-Project Repository Connections

**Infrastructure Configuration** (Global):
- OAuth App credentials (Client ID, Client Secret)
- Used to initiate OAuth flow
- System-wide, applies to all projects

**Per-Project Repository Connections**:
- User access tokens (obtained via OAuth flow)
- Stored per-project in database
- Project-specific repository access

**Workflow**:
1. Admin configures global OAuth credentials (infrastructure)
2. User connects repository to project (uses global OAuth credentials)
3. OAuth flow exchanges credentials for user access token
4. Access token stored per-project for repository operations

## AI Gateway Configuration

Configure global AI Gateway service URL and default provider credentials. These settings provide system-wide defaults for AI features.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_GATEWAY_URL` | No | `http://ai-gateway:3001` (Docker) or `http://localhost:3001` (bare-metal) | AI Gateway service URL |
| `LLM_ENDPOINT` | Yes* | - | Ollama endpoint URL (self-hosted, e.g., `http://localhost:11434`) |
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key (if using OpenAI) |
| `ANTHROPIC_API_KEY` | Yes* | - | Anthropic API key (if using Anthropic) |
| `GOOGLE_AI_API_KEY` | Yes* | - | Google AI (Gemini) API key (if using Gemini) |

*At least one AI provider configuration is required if AI features are enabled

### Setup via Environment Variables

**Docker** (`.env` file):
```env
# AI Gateway Configuration
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://host.docker.internal:11434  # For Ollama on host
OPENAI_API_KEY=sk-your-openai-api-key  # Optional, if using OpenAI
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key  # Optional, if using Anthropic
GOOGLE_AI_API_KEY=AIza-your-google-ai-api-key  # Optional, if using Gemini
```

**Bare-Metal** (`.env` file):
```env
AI_GATEWAY_URL=http://localhost:3001
LLM_ENDPOINT=http://localhost:11434
OPENAI_API_KEY=sk-your-openai-api-key
```

**Restart Required**: After updating environment variables, restart services:
```bash
# Docker
docker-compose restart web ai-gateway

# Bare-Metal
pm2 restart stride-web stride-ai-gateway
```

### Setup via Admin Settings UI

1. **Navigate to Admin Settings**: Go to `/settings/infrastructure` (admin-only)
2. **Configure AI Gateway**:
   - Enter AI Gateway URL
   - Enter Ollama Endpoint URL (if using Ollama)
   - Enter OpenAI API Key (if using OpenAI, password-type field)
   - Enter Anthropic API Key (if using Anthropic, password-type field)
   - Enter Google AI API Key (if using Gemini, password-type field)
   - Click "Save" or "Test Connection" to verify

**Note**: If environment variables are set, UI fields will be read-only with "Configured via environment variables" message.

### Relationship to Per-Project AI Provider Configuration

**Infrastructure Configuration** (Global):
- AI Gateway service URL
- Default provider credentials (API keys, endpoints)
- System-wide defaults, applies to all projects

**Per-Project AI Provider Configuration**:
- Project-specific provider credentials (can override global defaults)
- Project-specific model selection
- Stored per-project in database

**Precedence** (for AI configuration):
1. Per-project configuration (highest priority)
2. Global infrastructure configuration (defaults)
3. Environment variables (if per-project not configured)

**Workflow**:
1. Admin configures global AI Gateway URL and default credentials (infrastructure)
2. Project admin configures project-specific providers (optional, can override global defaults)
3. AI triage uses project-specific config if available, otherwise falls back to global defaults

## Verification

### Check Configuration Status

**Via UI**:
1. Navigate to `/settings/infrastructure`
2. View configuration status:
   - Green checkmark: Configured
   - "Configured via environment variables": Environment variables active
   - Empty fields: Not configured

**Via Logs**:
```bash
# Docker
docker-compose logs web | grep -i -E "(github|gitlab|ai gateway|infrastructure)"

# Bare-Metal
tail -f /var/log/stride/app.log | grep -i -E "(github|gitlab|ai gateway|infrastructure)"
```

### Test Connections

**Via UI**:
1. Navigate to `/settings/infrastructure`
2. Click "Test Connection" buttons:
   - GitHub OAuth: Tests OAuth credentials
   - GitLab OAuth: Tests OAuth credentials
   - AI Gateway: Tests AI Gateway connectivity
   - Ollama: Tests Ollama endpoint connectivity

**Via API**:
```bash
# Test infrastructure configuration API
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/settings/infrastructure/test \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"provider": "github"}'
```

## Troubleshooting

### Environment Variables Not Loading

**Problem**: Environment variables set in `.env` file but not available in application.

**Causes**:
- `.env` file not in correct location
- Docker Compose not loading `.env` file
- Application not restarted after updating `.env`

**Solution**:
1. **Verify `.env` file location**: Should be in project root (same directory as `docker-compose.yml`)
2. **Check Docker Compose**: Verify `docker-compose.yml` references environment variables:
   ```yaml
   services:
     web:
       environment:
         GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:-}
   ```
3. **Restart services**: After updating `.env`, restart:
   ```bash
   docker-compose restart web
   ```
4. **Verify variables loaded**:
   ```bash
   docker-compose exec web env | grep -E "(GITHUB|GITLAB|AI_GATEWAY)"
   ```

### UI Overridden by Environment Variables

**Problem**: Configuration saved via UI but environment variables are being used instead.

**Expected Behavior**: This is correct - environment variables always override UI settings.

**Solution**:
1. **Check environment variables**: Verify which environment variables are set:
   ```bash
   docker-compose exec web env | grep -E "(GITHUB|GITLAB|AI_GATEWAY)"
   ```
2. **Remove environment variables**: If you want to use UI configuration, remove or unset environment variables:
   ```bash
   # Remove from .env file
   # GITHUB_CLIENT_ID=...
   # GITHUB_CLIENT_SECRET=...
   ```
3. **Restart application**: After removing environment variables, restart:
   ```bash
   docker-compose restart web
   ```
4. **Verify UI configuration**: UI fields should become editable after restart

### OAuth Flow Failures

**Problem**: OAuth flow fails when connecting repositories.

**Causes**:
- Invalid OAuth credentials (Client ID or Secret)
- Callback URL mismatch
- OAuth app not configured correctly
- Network connectivity issues

**Solution**:
1. **Verify OAuth credentials**: Check Client ID and Secret are correct
2. **Verify callback URL**: Ensure OAuth app callback URL matches:
   - Format: `https://your-domain.com/api/repositories/oauth/callback`
   - Must match exactly (including protocol, domain, path)
3. **Test OAuth connection**: Use "Test Connection" button in Admin Settings UI
4. **Check logs**: Review application logs for OAuth errors:
   ```bash
   docker-compose logs web | grep -i oauth
   ```
5. **Verify OAuth app scopes**: Ensure OAuth app has required scopes:
   - GitHub: `repo`, `admin:repo_hook`
   - GitLab: `api`, `read_repository`, `write_repository`

### AI Gateway Connection Failures

**Problem**: AI Gateway connection fails or AI features not working.

**Causes**:
- AI Gateway service not running
- Incorrect AI Gateway URL
- Network connectivity issues
- Invalid API keys or endpoints

**Solution**:
1. **Verify AI Gateway is running**:
   ```bash
   # Docker
   docker-compose ps ai-gateway
   
   # Bare-Metal
   ps aux | grep ai-gateway
   ```
2. **Verify AI Gateway URL**: Check `AI_GATEWAY_URL` is correct:
   - Docker: `http://ai-gateway:3001` (service name)
   - Bare-Metal: `http://localhost:3001` (localhost)
3. **Test AI Gateway health**:
   ```bash
   curl http://localhost:3001/health
   ```
4. **Verify API keys**: Check API keys are correct and valid:
   - OpenAI: Starts with `sk-`
   - Anthropic: Starts with `sk-ant-`
   - Google Gemini: Starts with `AIza`
5. **Test connections**: Use "Test Connection" buttons in Admin Settings UI
6. **Check logs**: Review AI Gateway logs:
   ```bash
   docker-compose logs ai-gateway
   ```

### Configuration Not Persisting

**Problem**: Configuration saved via UI but not persisting after restart.

**Causes**:
- Database connection issues
- Encryption/decryption failures
- Configuration validation errors

**Solution**:
1. **Check database connection**: Verify database is accessible
2. **Check logs**: Review application logs for database errors:
   ```bash
   docker-compose logs web | grep -i -E "(database|config|infrastructure)"
   ```
3. **Verify admin permissions**: Ensure user has admin role
4. **Check configuration validation**: Review validation errors in UI
5. **Test save operation**: Try saving configuration again and check for errors

## Security Best Practices

1. **Protect Credentials**: Treat OAuth secrets and API keys as sensitive information
   - Never commit secrets to version control
   - Use environment variables or secrets management
   - For Docker: Use Docker secrets or environment variable files (not committed)

2. **Use HTTPS**: Always use HTTPS for OAuth callbacks and API endpoints (required by most providers)

3. **Rotate Secrets**: Regularly rotate OAuth client secrets and API keys

4. **Restrict Access**: Admin Settings UI is admin-only - ensure proper access control

5. **Audit Configuration Changes**: Review audit logs for infrastructure configuration changes (available via `/api/admin/settings/infrastructure/audit`)

## Related Documentation

- [Git OAuth Integration](/docs/integrations/git-oauth) - Detailed Git OAuth setup guide
- [AI Providers Integration](/docs/integrations/ai-providers) - Detailed AI provider setup guide
- [Integration Overview](/docs/integrations) - All integrations guide
- [Docker Deployment Guide](/docs/deployment/docker) - Docker deployment instructions

## Next Steps

1. **Configure Infrastructure**: Set up Git OAuth and AI Gateway via environment variables or UI
2. **Verify Configuration**: Test connections and verify configuration is working
3. **Configure Projects**: Set up project-specific repository connections and AI provider configuration
4. **Monitor Usage**: Track OAuth usage and AI API usage

For detailed setup instructions for specific providers, see the individual integration guides linked above.

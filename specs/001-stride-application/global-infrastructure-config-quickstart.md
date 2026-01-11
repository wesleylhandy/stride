# Quickstart: Global Infrastructure Configuration

**Feature**: Global infrastructure configuration for Git and AI providers  
**Created**: 2026-01-23

## Overview

This guide covers setting up global infrastructure configuration for Git OAuth credentials and AI Gateway settings. Configuration can be done via environment variables (infrastructure-as-code) or Admin Settings UI (dynamic configuration).

## Prerequisites

- Admin user account created
- Stride application running
- Access to Admin Settings (Admin role required)

## Quick Start

### Option 1: Environment Variables (Infrastructure-as-Code) - Recommended

**Best for**: Production deployments, infrastructure-as-code, version-controlled configuration

#### Step 1: Configure Environment Variables

Add Git OAuth and AI Gateway configuration to your `.env` file:

**For Docker Compose** (`.env` file in project root):
```env
# Git OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret
GITLAB_BASE_URL=https://gitlab.com  # Optional, defaults to https://gitlab.com

# AI Gateway Configuration
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://localhost:11434  # For Ollama
OPENAI_API_KEY=sk-your-openai-api-key  # Optional, if using OpenAI
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key  # Optional, if using Anthropic
GOOGLE_AI_API_KEY=AIza-your-google-ai-api-key  # Optional, if using Google Gemini
```

**For Bare-Metal Deployment** (`.env` file):
```env
# Git OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret

# AI Gateway Configuration
AI_GATEWAY_URL=http://localhost:3001
LLM_ENDPOINT=http://localhost:11434
# Add provider API keys as needed
```

#### Step 2: Restart Services

**Docker Compose**:
```bash
docker-compose restart web
```

**Bare-Metal**:
```bash
# PM2
pm2 restart stride-web

# systemd
sudo systemctl restart stride-web

# Manual
# Stop and restart your Node.js process
```

#### Step 3: Verify Configuration

Configuration is automatically loaded from environment variables. No UI setup required.

**Verification**:
1. Navigate to Admin Settings → Infrastructure (`/settings/infrastructure`)
2. Configuration should show "Configured via environment variables" message
3. Git OAuth and AI Gateway should be ready for use

**Advantages**:
- ✅ Infrastructure-as-code (version-controlled)
- ✅ Immutable configuration (requires deployment to change)
- ✅ Consistent across environments
- ✅ No database storage required

---

### Option 2: Admin Settings UI (Dynamic Configuration)

**Best for**: Development, testing, quick configuration changes without deployment

#### Step 1: Navigate to Admin Settings

1. Log in as Admin user
2. Navigate to Settings → Infrastructure (`/settings/infrastructure`)

#### Step 2: Configure Git OAuth

**GitHub OAuth**:
1. Click "Configure GitHub OAuth"
2. Enter GitHub OAuth App Client ID
3. Enter GitHub OAuth App Client Secret (masked input)
4. Click "Save"

**GitLab OAuth**:
1. Click "Configure GitLab OAuth"
2. Enter GitLab OAuth Application ID
3. Enter GitLab OAuth Application Secret (masked input)
4. Enter GitLab Base URL (optional, defaults to `https://gitlab.com`)
5. Click "Save"

#### Step 3: Configure AI Gateway

1. Enter AI Gateway URL (e.g., `http://ai-gateway:3001`)
2. (Optional) Enter Ollama Endpoint URL (e.g., `http://localhost:11434`)
3. (Optional) Enter provider API keys:
   - OpenAI API Key (format: `sk-...`)
   - Anthropic API Key (format: `sk-ant-...`)
   - Google AI API Key (format: `AIza...`)
4. Click "Test Connection" to verify connectivity
5. Click "Save"

#### Step 4: Verify Configuration

Configuration is saved to database and immediately available.

**Verification**:
1. Configuration should show "Saved successfully" message
2. Git OAuth flows should work for project repository connections
3. AI Gateway should be accessible for AI triage features

**Advantages**:
- ✅ Dynamic configuration (no deployment required)
- ✅ Easy to test different configurations
- ✅ UI-based management (no file editing)

**Disadvantages**:
- ❌ Not version-controlled (database storage)
- ❌ Can be overridden by environment variables
- ❌ Requires database migration for new fields

---

## Configuration Precedence

**Important**: Environment variables always override UI-based configuration.

**Precedence Order**:
1. **Environment Variables** (highest priority, infrastructure-as-code)
2. **Database (UI-based)** (dynamic configuration)
3. **Default Values** (hardcoded fallbacks)

**Example**:
```env
# .env file
GITHUB_CLIENT_ID=env-var-client-id
GITHUB_CLIENT_SECRET=env-var-secret
```

Even if you configure GitHub OAuth via UI with different credentials, environment variables take precedence.

**UI Indication**:
- UI shows "Configured via environment variables" message when env vars are active
- UI shows readonly state with explanation when env vars override UI settings

---

## Git OAuth Setup

### GitHub OAuth App Setup

1. **Create GitHub OAuth App**:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Set Application name: "Stride Integration"
   - Set Homepage URL: `https://your-stride-domain.com`
   - Set Authorization callback URL: `https://your-stride-domain.com/api/projects/[projectId]/repositories/callback`
   - Click "Register application"

2. **Get Credentials**:
   - Copy Client ID (shown on app page)
   - Generate Client Secret (click "Generate a new client secret")
   - Save both values securely

3. **Configure in Stride**:
   - Option 1: Add to `.env` file: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
   - Option 2: Enter in Admin Settings → Infrastructure → GitHub OAuth

### GitLab OAuth App Setup

1. **Create GitLab OAuth Application**:
   - Go to GitLab Settings → Applications
   - Set Name: "Stride Integration"
   - Set Redirect URI: `https://your-stride-domain.com/api/projects/[projectId]/repositories/callback`
   - Select scopes: `api`, `read_repository`
   - Click "Save application"

2. **Get Credentials**:
   - Copy Application ID (shown on app page)
   - Copy Secret (shown once, save securely)

3. **Configure in Stride**:
   - Option 1: Add to `.env` file: `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_BASE_URL` (optional)
   - Option 2: Enter in Admin Settings → Infrastructure → GitLab OAuth

---

## AI Gateway Setup

### Option 1: Ollama (Self-Hosted) - Recommended for Privacy

1. **Install Ollama**:
   ```bash
   # Follow Ollama installation guide: https://ollama.ai/download
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama**:
   ```bash
   ollama serve
   ```

3. **Download Model**:
   ```bash
   ollama pull llama2  # Or mistral, codellama, etc.
   ```

4. **Configure in Stride**:
   - Option 1: Add to `.env`: `LLM_ENDPOINT=http://localhost:11434`
   - Option 2: Enter in Admin Settings → Infrastructure → AI Gateway → Ollama Endpoint

### Option 2: OpenAI (Commercial)

1. **Get API Key**:
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Go to API Keys section
   - Create new secret key (starts with `sk-`)

2. **Configure in Stride**:
   - Option 1: Add to `.env`: `OPENAI_API_KEY=sk-your-key`
   - Option 2: Enter in Admin Settings → Infrastructure → AI Gateway → OpenAI API Key

### Option 3: Anthropic (Commercial)

1. **Get API Key**:
   - Sign up at [console.anthropic.com](https://console.anthropic.com)
   - Go to API Keys section
   - Create new key (starts with `sk-ant-`)

2. **Configure in Stride**:
   - Option 1: Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-your-key`
   - Option 2: Enter in Admin Settings → Infrastructure → AI Gateway → Anthropic API Key

### Option 4: Google Gemini (Commercial)

1. **Get API Key**:
   - Sign up at [ai.google.dev](https://ai.google.dev)
   - Go to API Keys section
   - Create new key (starts with `AIza`)

2. **Configure in Stride**:
   - Option 1: Add to `.env`: `GOOGLE_AI_API_KEY=AIza-your-key`
   - Option 2: Enter in Admin Settings → Infrastructure → AI Gateway → Google AI API Key

---

## Testing Configuration

### Test Git OAuth Configuration

1. Navigate to Admin Settings → Infrastructure
2. Click "Test GitHub OAuth" or "Test GitLab OAuth"
3. System verifies OAuth App credentials
4. Success message confirms configuration is valid

### Test AI Gateway Configuration

1. Navigate to Admin Settings → Infrastructure
2. Click "Test AI Gateway Connection"
3. System verifies endpoint connectivity
4. Success message confirms AI Gateway is reachable

### Test Ollama Endpoint

1. Navigate to Admin Settings → Infrastructure
2. Click "Test Ollama Endpoint"
3. System queries Ollama `/api/tags` endpoint
4. Success message shows available models

---

## Troubleshooting

### Environment Variables Not Loading

**Problem**: Configuration shows "Not configured" even though env vars are set.

**Solution**:
1. Verify `.env` file is in correct location (project root for Docker, app root for bare-metal)
2. Restart services to load new environment variables
3. Check environment variable names match exactly (case-sensitive)
4. Verify `.env` file syntax (no spaces around `=`, no quotes unless needed)

### UI Configuration Overridden by Env Vars

**Problem**: Changes made in UI don't take effect.

**Solution**: This is expected behavior. Environment variables always override UI configuration. To use UI configuration:
1. Remove environment variables from `.env` file
2. Restart services
3. UI configuration will now be active

### Git OAuth Flow Fails

**Problem**: OAuth flow fails with "invalid_client" error.

**Solution**:
1. Verify Client ID and Client Secret are correct
2. Check OAuth App callback URL matches Stride callback URL exactly
3. Ensure OAuth App has correct scopes/permissions
4. For GitLab: Verify `GITLAB_BASE_URL` matches your GitLab instance URL

### AI Gateway Connection Fails

**Problem**: AI Gateway test connection fails.

**Solution**:
1. Verify AI Gateway service is running
2. Check `AI_GATEWAY_URL` is correct (use service name in Docker, localhost in bare-metal)
3. Verify network connectivity between services
4. Check AI Gateway logs for errors
5. For Ollama: Verify Ollama service is running and accessible at `LLM_ENDPOINT`

---

## Next Steps

After configuring global infrastructure:

1. **Create Project**: Create your first project
2. **Connect Repository**: Use Git OAuth to connect project repository (uses global OAuth credentials)
3. **Configure AI Providers** (Phase 9): Configure per-project AI provider settings if needed (uses global AI Gateway URL)
4. **Test Integration**: Test Git webhook processing and AI triage features

---

## Related Documentation

- [Infrastructure Configuration Guide](/docs/deployment/infrastructure-configuration.md) - Comprehensive setup guide
- [Git OAuth Integration](/docs/integrations/git-oauth.md) - Detailed Git OAuth setup
- [AI Providers Integration](/docs/integrations/ai-providers.md) - Detailed AI Gateway setup
- [Project Settings](/docs/configuration/project-settings.md) - Per-project configuration guide

---

## Security Best Practices

1. **Protect Secrets**: Never commit `.env` file to version control
2. **Use HTTPS**: Always use HTTPS in production for OAuth callbacks
3. **Restrict OAuth Scopes**: Request minimum required OAuth scopes
4. **Rotate Secrets**: Regularly rotate OAuth client secrets and API keys
5. **Audit Access**: Review `updatedBy` field in configuration to track changes
6. **Environment Variables**: Prefer environment variables for production (infrastructure-as-code)

---

## Notes

- **Backward Compatibility**: Existing environment variable configuration continues to work. UI-based configuration is optional enhancement.
- **Phase 9 Compatibility**: Global infrastructure configuration does not interfere with Phase 9 per-project AI provider configuration. They work together: global provides defaults, per-project can override.
- **Singleton Pattern**: Only one global infrastructure configuration record exists (enforced by application).

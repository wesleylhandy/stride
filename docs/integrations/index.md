---
purpose: Complete guide to configuring Stride service integrations
targetAudience: System administrators, DevOps engineers, developers
lastUpdated: 2026-01-12
---

# Integration Guide

Complete guide to configuring Stride service integrations. All integrations are optional—Stride works perfectly without them.

## Overview

Stride supports integrations with external services to enhance functionality:

- **SMTP Email**: Send email invitations for user management
- **Sentry**: Error tracking and performance monitoring
- **AI Providers**: AI-powered issue triage and analysis
- **Git OAuth**: Connect GitHub/GitLab repositories for webhook integration
- **Monitoring Webhooks**: Automatic issue creation from error events (Sentry, Datadog, New Relic)

All integrations are optional. The application works fully without any of them configured.

---

## Integration Status

| Integration | Status | Required For | Services Supported |
|-------------|--------|--------------|-------------------|
| SMTP Email | Optional | Email invitations | SendGrid, AWS SES, Mailgun, Gmail, Microsoft 365, Self-hosted |
| Sentry | Optional | Error tracking | Sentry |
| AI Providers | Optional | AI triage | Ollama (self-hosted), OpenAI, Anthropic, Google Gemini |
| Git OAuth | Optional | Repository webhooks | GitHub, GitLab |
| Monitoring Webhooks | Optional | Auto issue creation | Sentry, Datadog, New Relic |

---

## Quick Reference: Environment Variables

### SMTP Email

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | Yes* | - | SMTP server hostname |
| `SMTP_PORT` | Yes* | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | Yes* | - | SMTP authentication username |
| `SMTP_PASSWORD` | Yes* | - | SMTP authentication password |
| `SMTP_SECURE` | No | `false` | `true` for SSL (port 465), `false` for STARTTLS |
| `SMTP_FROM` | No | `SMTP_USER` | Default sender email address |

*Required only if email invitations are enabled

### Sentry Error Tracking

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | Yes* | - | Sentry DSN (Data Source Name) from Sentry project settings |
| `ERROR_TRACKING_ENABLED` | No | `false` | Set to `true` to enable error tracking |

*Required only if error tracking is enabled

### AI Providers

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_GATEWAY_URL` | No | `http://ai-gateway:3001` | AI Gateway service URL (for Docker) or `http://localhost:3001` (bare-metal) |
| `LLM_ENDPOINT` | Yes* | - | Ollama endpoint URL (self-hosted, e.g., `http://localhost:11434`) |
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key (if using OpenAI) |
| `ANTHROPIC_API_KEY` | Yes* | - | Anthropic API key (if using Anthropic) |
| `GOOGLE_AI_API_KEY` | Yes* | - | Google AI (Gemini) API key (if using Gemini) |

*At least one AI provider configuration is required if AI features are enabled

### Git OAuth

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_CLIENT_ID` | Yes* | - | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes* | - | GitHub OAuth App Client Secret |
| `GITLAB_CLIENT_ID` | Yes* | - | GitLab OAuth Application ID |
| `GITLAB_CLIENT_SECRET` | Yes* | - | GitLab OAuth Application Secret |

*Required only if repository integration is enabled (at least one Git service)

### Monitoring Webhooks

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEBHOOK_SECRET` | No | - | HMAC secret for webhook signature verification (recommended for production) |

**Note**: Monitoring webhooks use endpoints that don't require environment variables:
- Sentry: `/api/webhooks/sentry`
- Datadog: `/api/webhooks/datadog`
- New Relic: `/api/webhooks/newrelic`

---

## Setup Guides

### [SMTP Email Integration](/docs/integrations/smtp)

Configure email invitations using any SMTP-compatible service (SendGrid, AWS SES, Mailgun, Gmail, Microsoft 365, or self-hosted mail server).

**Quick Start**: See [SMTP Setup Guide](/docs/integrations/smtp)

### [Sentry Error Tracking](/docs/integrations/sentry)

Monitor application errors and performance with Sentry.

**Quick Start**: See [Sentry Setup Guide](/docs/integrations/sentry)

### [AI Providers](/docs/integrations/ai-providers)

Enable AI-powered issue triage with Ollama (self-hosted), OpenAI, Anthropic, or Google Gemini.

**Configuration Levels**:
- **Infrastructure (Global)**: AI Gateway URL and default provider credentials - see [Infrastructure Configuration Guide](/docs/deployment/infrastructure-configuration)
- **Project-Level**: Per-project AI provider configuration (API keys, models, endpoints) - see [AI Providers Setup Guide](/docs/integrations/ai-providers)

**Quick Start**: See [AI Providers Setup Guide](/docs/integrations/ai-providers)

### [Git OAuth](/docs/integrations/git-oauth)

Connect GitHub or GitLab repositories for webhook integration and automatic issue status updates.

**Configuration Levels**:
- **Infrastructure (Global)**: OAuth App credentials (Client ID, Client Secret) - see [Infrastructure Configuration Guide](/docs/deployment/infrastructure-configuration)
- **Project-Level**: Per-project repository connections (access tokens) - see [Git OAuth Setup Guide](/docs/integrations/git-oauth)

**Quick Start**: See [Git OAuth Setup Guide](/docs/integrations/git-oauth)

### [Monitoring Webhooks](/docs/integrations/monitoring-webhooks)

Configure webhooks from Sentry, Datadog, or New Relic to automatically create issues from error events.

**Quick Start**: See [Monitoring Webhooks Setup Guide](/docs/integrations/monitoring-webhooks)

---

## Configuration Levels

Stride supports two levels of configuration for integrations:

### Infrastructure Configuration (Global)

**System-wide settings** that apply to all projects. Configured via:
- Environment variables (infrastructure-as-code, recommended for production)
- Admin Settings UI (`/settings/infrastructure`, admin-only)

**Applies to**:
- Git OAuth credentials (GitHub, GitLab) - used to initiate OAuth flows
- AI Gateway service URL and default provider credentials - system-wide defaults

**Documentation**: See [Infrastructure Configuration Guide](/docs/deployment/infrastructure-configuration) for complete setup instructions.

### Project-Level Configuration (Per-Project)

**Project-specific settings** that can override global defaults. Configured via:
- Project Settings UI (`/projects/[projectId]/settings/integrations`)

**Applies to**:
- Repository connections (per-project access tokens, obtained via OAuth flow)
- AI provider configuration (per-project API keys, models, endpoints)

**Documentation**: See individual integration guides for project-level setup.

## Configuration Methods

### Docker Compose (Recommended)

All integrations are configured via environment variables in your `docker-compose.yml` or `.env` file:

```yaml
# docker-compose.yml
services:
  web:
    environment:
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      # ... other variables
```

See each integration guide for Docker-specific setup instructions.

### Bare-Metal Deployment

For non-Docker deployments, configure environment variables in your `.env` file or system environment:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
```

### Admin Settings UI (Infrastructure Configuration)

For infrastructure-level configuration (Git OAuth, AI Gateway), you can also use the Admin Settings UI:

1. Navigate to `/settings/infrastructure` (admin-only)
2. Configure Git OAuth credentials or AI Gateway settings
3. Save configuration (stored in database)

**Note**: Environment variables always override UI-based configuration. See [Infrastructure Configuration Guide](/docs/deployment/infrastructure-configuration) for precedence rules.

---

## Verification

Each integration includes verification steps. Common verification methods:

1. **Check Logs**: Application logs indicate successful initialization:
   ```bash
   ✅ SMTP email service initialized successfully
   ✅ Sentry error tracking enabled
   ```

2. **Test Functionality**: Use the integration feature (send email, create issue from webhook, etc.)

3. **Check Service Dashboards**: Verify events appear in external service dashboards (Sentry, monitoring services)

---

## Troubleshooting

Each integration guide includes comprehensive troubleshooting sections covering:

- Docker container issues (env vars not loading, secrets problems, container restart)
- Connection failures (network issues, firewall blocking, incorrect endpoints)
- Authentication errors (invalid credentials, token expiration, OAuth flow issues)
- Service-specific problems (provider-specific error messages and solutions)
- Debugging techniques (logs, test commands, verification steps)

See individual integration guides for detailed troubleshooting.

---

## Related Documentation

- [Configuration Documentation](/docs/configuration) - YAML workflow configuration

**Note**: Docker deployment and installation documentation is available in the repository's `docs/deployment/` folder. These guides are not yet served via web routes but can be accessed directly from the repository.

---

## Next Steps

1. Choose which integrations you need
2. Follow the setup guide for each integration
3. Verify configuration using the verification steps
4. Refer to troubleshooting sections if issues arise

For detailed setup instructions, see the individual integration guides linked above.

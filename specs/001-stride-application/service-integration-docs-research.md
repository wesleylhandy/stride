# Research: Service Integration Documentation

**Feature**: Service Integration Documentation  
**Created**: 2025-01-XX  
**Status**: Complete

## Overview

This document resolves all "NEEDS CLARIFICATION" items from the implementation plan for service integration documentation. It covers documentation structure, content organization, access control, and webhook configuration patterns.

---

## 1. Documentation Structure: Marketing Site vs Web App

### Decision: Static Pages for Marketing Site, Content Files for Web App

**Marketing Site** (`apps/site`):
- Use **static JSX pages** (follows existing pattern from `apps/site/app/docs/configuration/page.tsx`)
- Pages are fully rendered at build time for performance and SEO
- No need for dynamic content loading
- Simple, maintainable structure

**Rationale**: 
- Marketing site pages are static content that doesn't change frequently
- Static generation provides better SEO and performance
- Consistent with existing documentation pages

**Web App** (`apps/web`):
- Use **content files** stored in `apps/web/content/docs/integrations/`
- Pages read content using existing `MarkdownRenderer` component (see `apps/web/app/docs/configuration/page.tsx`)
- Supports authenticated access with proper layout
- Content separated from presentation

**Rationale**:
- Content can be updated without touching page components
- Markdown is easier to write and maintain than JSX
- Consistent with existing web app documentation pattern
- Enables potential future content management features

### Implementation Pattern

**Marketing Site**:
```typescript
// apps/site/app/docs/integrations/[service]/page.tsx
export default function ServicePage() {
  return (
    <div>
      {/* Static JSX content */}
    </div>
  );
}
```

**Web App**:
```typescript
// apps/web/app/docs/integrations/[service]/page.tsx
async function getDocContent(service: string): Promise<string> {
  const contentDir = join(process.cwd(), 'content', 'docs', 'integrations');
  const filePath = join(contentDir, `${service}.md`);
  return await readFile(filePath, 'utf-8');
}
```

---

## 2. Access Control for Integration Documentation

### Decision: All Authenticated Users Can Access, Admin-Focused Implementation Guides

**Access Level**: All authenticated users can access integration documentation pages.

**Rationale**:
- **Transparency**: Users should understand what features are available/configured
- **Self-Service**: Non-admin users can see what's configured and what's missing
- **Education**: Helps users understand capabilities even if they can't configure
- **Configuration Separation**: Actual configuration (env vars, settings) requires admin access anyway

**Content Differentiation**:
- **Usage Documentation**: For all users (what features are enabled, how to use them)
- **Configuration Documentation**: Admin-focused (how to set up, env vars, troubleshooting)
- Clear labeling: "Admin-only" sections for configuration steps

**Example Structure**:
```markdown
# SMTP Integration

## Overview
[For all users - what SMTP enables]

## Usage
[For all users - how to use email invitations if configured]

## Configuration (Admin Only)
[For admins - how to set up SMTP, env vars, etc.]
```

**Future Enhancement**: When integration settings UI is created, it will enforce admin-only access for configuration actions.

---

## 3. Partial Configuration Documentation

### Decision: Document Verification Steps and Status Detection

**Status Indicators**:
- Document how to verify each service is configured correctly
- Show clear success/failure indicators
- Provide troubleshooting for partial configurations

**Verification Patterns**:

**SMTP**:
```bash
# Check logs for initialization status
✅ SMTP email service initialized successfully
⚠️ SMTP email service not configured. Missing required environment variables.
```

**Sentry**:
```bash
# Check application logs for Sentry initialization
✅ Sentry error tracking initialized
⚠️ Sentry not configured. Set SENTRY_DSN to enable error tracking.
```

**AI Gateway**:
```bash
# Test endpoint availability
curl http://ai-gateway:3001/health
# Check logs for LLM connection status
```

**Documentation Sections**:
1. **Configuration Status**: How to check if service is configured
2. **Verification Steps**: How to test the integration is working
3. **Troubleshooting**: Common partial-config issues (e.g., SMTP configured but not verified, wrong credentials, etc.)

**Example Troubleshooting Entry**:
```markdown
### "SMTP configured but emails not sending"

**Possible Causes**:
- SMTP credentials incorrect (check logs for auth errors)
- Firewall blocking SMTP port (test connection manually)
- SMTP server not allowing connections from your IP
- TLS/SSL mismatch (check SMTP_SECURE matches port)

**Solution**:
1. Check application logs for specific error messages
2. Test SMTP connection: `telnet smtp.example.com 587`
3. Verify credentials are correct
4. Check firewall rules allow outbound SMTP connections
```

---

## 4. Unified Integrations Settings UI (Future)

### Decision: Documentation-Only Work, Support Future UI Implementation

**Scope Limitation**: This is documentation work only. No UI implementation.

**Future UI Support**:
- Documentation should be structured to support future settings page
- Document all environment variables and configuration options that future UI might expose
- Use clear sections that could map to UI components (Configuration, Verification, Troubleshooting)

**Documentation Structure for Future UI**:
```markdown
## Configuration

### Environment Variables
[Table of all env vars - could become form fields]

### Service-Specific Setup
[Step-by-step - could become setup wizard]

### Verification
[Status checks - could become status indicators in UI]
```

**Note**: Add comment in documentation: "A unified integrations settings page is planned for future releases. For now, configure integrations via environment variables as documented below."

---

## 5. Webhook Configuration Documentation

### Decision: Comprehensive Step-by-Step Guides with External Service Examples

**Webhook Documentation Structure**:

1. **Stride Side Setup**:
   - Webhook endpoint URLs
   - Expected payload format
   - Signature verification (HMAC)
   - Security requirements

2. **External Service Setup**:
   - Step-by-step instructions for each service (Sentry, Datadog, New Relic)
   - Where to find webhook configuration in external service UI
   - What data to send
   - Screenshots/examples where helpful

3. **Testing**:
   - How to send test webhooks
   - How to verify webhook is received
   - Common issues and fixes

**Example Structure**:

```markdown
# Monitoring Webhooks Integration

## Overview
[What monitoring webhooks enable]

## Stride Configuration

### Webhook Endpoints
- Sentry: `https://your-domain.com/api/webhooks/sentry`
- Datadog: `https://your-domain.com/api/webhooks/datadog`
- New Relic: `https://your-domain.com/api/webhooks/newrelic`

### Expected Payload Format
[Document payload structure]

## External Service Setup

### Sentry Webhook Configuration
1. Log in to Sentry dashboard
2. Navigate to Settings → Integrations → Webhooks
3. Click "Create Webhook"
4. Enter webhook URL: `https://your-domain.com/api/webhooks/sentry`
5. Select events: [list of events]
6. Copy webhook secret for HMAC verification
7. Add `SENTRY_WEBHOOK_SECRET` to Stride environment variables

### Datadog Webhook Configuration
[Similar step-by-step for Datadog]

## Verification
[How to test webhooks are working]
```

**Best Practices**:
- Include screenshots or clear UI navigation instructions
- Document all required fields and optional fields
- Show example payloads
- Document signature verification setup
- Include troubleshooting for common webhook issues

---

## 6. Navigation Structure

### Decision: Extend Existing `/docs` Structure

**Current Structure Analysis**:

**Marketing Site** (`apps/site`):
- `/docs/configuration` - Configuration overview (static page)
- `/docs/install` - Installation guide (static page)
- Need to check if there's a `/docs` landing page or navigation

**Web App** (`apps/web`):
- `/docs/configuration` - Configuration documentation (reads from content files)
- Has layout at `apps/web/app/docs/layout.tsx` with authentication check
- Navigation tabs for different sections (reference, troubleshooting, examples)

**Implementation Decision**:

**Marketing Site**:
- Create `/docs/integrations` overview page
- Create `/docs/integrations/[service]` pages for each service
- Add "Integrations" link to `/docs` navigation (if exists) or create docs navigation
- Consider adding to main site navigation if `/docs` is prominent

**Web App**:
- Create `/docs/integrations` overview page (reads from content file)
- Create `/docs/integrations/[service]` pages (reads from content files)
- Add "Integrations" link to docs navigation sidebar
- Follow existing pattern with tabs/sections if appropriate

**Navigation Updates**:

**Marketing Site Navigation**:
```typescript
// Add to site navigation
const docsNavItems = [
  { label: 'Installation', href: '/docs/install' },
  { label: 'Configuration', href: '/docs/configuration' },
  { label: 'Integrations', href: '/docs/integrations' }, // NEW
];
```

**Web App Docs Navigation**:
```typescript
// Add to docs sidebar (or navigation)
const docSections = [
  { label: 'Configuration', href: '/docs/configuration' },
  { label: 'Integrations', href: '/docs/integrations' }, // NEW
];
```

---

## 7. Content Reusability Strategy

### Decision: Separate Content with Shared Reference Data

**Content Separation**:
- Marketing site: Custom written for marketing context (overview, benefits, quick start)
- Web app: Detailed implementation guides (configuration, troubleshooting)
- Minimal overlap - different audiences, different detail levels

**Shared Reference Data**:
- Create shared constants file for service names, env var names, URLs
- Example: `packages/types/src/integrations.ts`
  ```typescript
  export const INTEGRATION_SERVICES = {
    SMTP: {
      name: 'SMTP Email',
      envVars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_SECURE', 'SMTP_FROM'],
    },
    // ... other services
  } as const;
  ```

**Rationale**:
- Marketing and web app docs serve different purposes (discovery vs. implementation)
- Shared data prevents inconsistencies (env var names, service names)
- Separate content allows appropriate tone and detail for each audience
- Easier to maintain and update independently

**Future Enhancement**: If content needs to be shared more extensively, extract common sections to shared markdown files that both sites can import.

---

## 8. Service-Specific Setup Requirements

### Decision: Comprehensive Setup Guides for Each Service

**SMTP**:
- ✅ Already documented in `docs/deployment/smtp-configuration.md`
- Need to: Move to proper routes, enhance with marketing overview

**Sentry** (Error Tracking):
- Create Sentry account and project
- Get DSN from Sentry dashboard
- Configure environment variables (SENTRY_DSN, ERROR_TRACKING_ENABLED)
- Verify initialization in logs

**AI Providers**:
- **Self-hosted (Ollama)**:
  - Install Ollama
  - Download model
  - Configure LLM_ENDPOINT
  - Verify AI Gateway connection
- **Commercial (OpenAI)**:
  - Create OpenAI account
  - Generate API key
  - Configure OPENAI_API_KEY
  - Verify API connection
- **Commercial (Anthropic)**:
  - Create Anthropic account
  - Generate API key
  - Configure ANTHROPIC_API_KEY
  - Verify API connection

**Git OAuth**:
- **GitHub**:
  - Create GitHub OAuth App
  - Set callback URL
  - Get Client ID and Secret
  - Configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
- **GitLab**:
  - Create GitLab OAuth Application
  - Set redirect URI
  - Get Application ID and Secret
  - Configure GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET

**Monitoring Webhooks**:
- **Sentry**:
  - Configure Sentry webhook (see section 5)
  - Set webhook secret for HMAC verification
  - Test webhook delivery
- **Datadog**:
  - Create Datadog webhook integration
  - Configure webhook URL and authentication
  - Test webhook delivery
- **New Relic**:
  - Configure New Relic webhook integration
  - Set webhook URL and authentication
  - Test webhook delivery

---

## 9. Environment Variables Documentation

### Decision: Centralized Reference with Service-Specific Details

**Structure**:
1. **Marketing Site**: Summary table of all integrations with key env vars
2. **Web App**: Comprehensive env var reference with:
   - Variable name
   - Required/Optional
   - Default value
   - Description
   - Service-specific notes
   - Example values
   - Related variables

**Format**:
```markdown
| Variable | Required | Default | Description | Notes |
|----------|----------|---------|-------------|-------|
| SMTP_HOST | Yes* | - | SMTP server hostname | Required only if using email invitations |
| SMTP_PORT | Yes* | `587` | SMTP port | Use 587 for TLS, 465 for SSL |
| ... | ... | ... | ... | ... |

*Required only if feature is enabled
```

**Web App Enhancement**: Add "Copy to .env" functionality or downloadable .env template with all variables documented.

---

## 10. Documentation Template for Future Services

### Decision: Create Reusable Documentation Template

**Template Structure**:
```markdown
# [Service Name] Integration

## Overview
[What the service does, why use it, what features it enables]

## Prerequisites
[What's needed before setup]

## Configuration

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|

### Step-by-Step Setup
1. [Step 1]
2. [Step 2]
...

### Service-Specific Configuration
[External service setup if needed]

## Verification
[How to verify it's working]

## Examples
[Working examples]

## Troubleshooting
[Common issues and solutions]

## Related Documentation
[Links to related docs]
```

**Benefits**:
- Consistent documentation structure
- Ensures all necessary sections are included
- Easier to create new service docs
- Easier to review and maintain

---

## Summary

All clarifications have been resolved:

1. ✅ **Marketing site**: Static JSX pages; **Web app**: Content files with MarkdownRenderer
2. ✅ **Access control**: All authenticated users; Admin-focused implementation sections
3. ✅ **Partial config**: Document verification steps and troubleshooting
4. ✅ **Future UI**: Documentation-only; structure supports future UI
5. ✅ **Webhooks**: Comprehensive guides with external service setup
6. ✅ **Navigation**: Extend existing `/docs` structure
7. ✅ **Content reuse**: Separate content with shared reference data
8. ✅ **Setup requirements**: Comprehensive guides for all services
9. ✅ **Env vars**: Centralized reference with service-specific details
10. ✅ **Template**: Reusable documentation template for consistency

All research tasks are complete. Ready to proceed with Phase 1 (Design & Contracts).

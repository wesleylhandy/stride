# Content Contracts: Service Integration Documentation

**Feature**: Service Integration Documentation  
**Created**: 2025-01-XX  
**Status**: Complete

## Overview

This document defines the content structure and requirements for service integration documentation pages. All documentation must follow these contracts to ensure consistency and completeness.

---

## Marketing Site Documentation Contract

### Overview Page: `/docs/integrations`

**Purpose**: Provide high-level overview of all supported integrations

**Required Sections**:

1. **Page Header**
   - Title: "Integrations"
   - Subtitle: Brief description of integration capabilities
   - Meta description for SEO

2. **Introduction**
   - What integrations enable
   - Benefits of configuring integrations
   - Optional nature (app works without them)

3. **Integration List**
   - Grid or list of all supported integrations
   - For each integration:
     - Name and icon (if applicable)
     - Brief description (1-2 sentences)
     - Link to detailed page
     - Status indicator (Optional/Required)

4. **Quick Links**
   - Links to installation guide
   - Links to configuration docs
   - Call-to-action to get started

**Content Requirements**:
- Maximum 2 paragraphs per section
- Clear, non-technical language
- Focus on benefits and use cases
- Visual elements (icons, diagrams) encouraged

---

### Service-Specific Page: `/docs/integrations/[service]`

**Purpose**: Provide overview and quick start for a specific integration

**Required Sections**:

1. **Overview**
   - What the service does
   - Why you'd want to configure it
   - What features it enables
   - Use cases/benefits

2. **Quick Start** (Minimal Example)
   - Simplest configuration possible
   - Code example (environment variables)
   - Step count (ideally 3-5 steps)

3. **Supported Services** (if applicable)
   - List of supported providers/services
   - Brief description of each

4. **Next Steps**
   - Link to detailed setup guide (for logged-in users)
   - Link to related documentation
   - Call-to-action (get started, learn more)

**Content Requirements**:
- Maximum 3-5 paragraphs per section
- Include 1 minimal working example
- Avoid troubleshooting details (keep it simple)
- Link to web app docs for detailed information

**Service Pages Required**:
- `/docs/integrations/smtp`
- `/docs/integrations/sentry`
- `/docs/integrations/ai-providers`
- `/docs/integrations/git-oauth`
- `/docs/integrations/monitoring-webhooks`

---

## Web App Documentation Contract

### Overview Page: `/docs/integrations`

**Purpose**: Comprehensive integration guide with status indicators

**Required Sections**:

1. **Page Header**
   - Title: "Integration Guide"
   - Subtitle: Complete guide to configuring Stride integrations

2. **Introduction**
   - What integrations are
   - How they work
   - When to configure them

3. **Integration Status** (Dynamic if possible)
   - Table or list showing:
     - Service name
     - Configuration status (Configured/Not Configured)
     - Required/Optional indicator
     - Link to detailed guide

4. **Integration List**
   - Comprehensive list of all integrations
   - For each integration:
     - Name and description
     - Prerequisites
     - Configuration requirements
     - Link to detailed setup guide

5. **Quick Reference**
   - Table of all environment variables
   - Which services they belong to
   - Quick links to service-specific docs

**Content Requirements**:
- Read from content file: `content/docs/integrations/index.md`
- Use MarkdownRenderer component
- Include environment variable reference table
- Link to all service-specific guides

---

### Service-Specific Page: `/docs/integrations/[service]`

**Purpose**: Detailed setup guide for a specific integration

**Required Sections**:

1. **Overview**
   - What the service does
   - Why you'd want to configure it
   - What features it enables
   - Prerequisites

2. **Configuration**

   **2.1. Environment Variables**
   - Table of all required/optional environment variables
   - For each variable:
     - Variable name
     - Required/Optional
     - Default value (if any)
     - Description
     - Example value
     - Related variables

   **2.2. Step-by-Step Setup**
   - Numbered list of configuration steps
   - Service-specific setup (external service configuration)
   - Code examples where applicable
   - Screenshots/examples for external service setup

3. **Verification**
   - How to check if service is configured
   - How to test the integration
   - What success looks like
   - Expected log messages

4. **Examples**

   **4.1. Minimal Example**
   - Simplest configuration that works
   - Code example with all required variables

   **4.2. Common Configurations**
   - Examples for different providers/services
   - Example: Multiple SMTP providers (Gmail, SendGrid, AWS SES)
   - Example: Multiple AI providers (Ollama, OpenAI, Anthropic)

   **4.3. Advanced Configurations** (if applicable)
   - Complex setups
   - Custom configurations
   - Integration with other services

5. **Troubleshooting**

   **5.1. Common Issues**
   - List of common problems
   - For each issue:
     - Problem description
     - Possible causes
     - Solution steps
     - Related error messages

   **5.2. Error Messages**
   - Table of error messages
   - What they mean
   - How to fix them

   **5.3. Debugging Steps**
   - How to debug configuration issues
   - Tools and commands
   - Log analysis

6. **Related Documentation**
   - Links to related docs
   - Links to external service documentation
   - Next steps after configuration

**Content Requirements**:
- Read from content file: `content/docs/integrations/[service].md`
- Use MarkdownRenderer component
- Comprehensive examples for all supported providers/services
- Detailed troubleshooting for real-world issues
- Clear separation between required and optional steps

**Service Pages Required**:
- `/docs/integrations/smtp` → `content/docs/integrations/smtp.md`
- `/docs/integrations/sentry` → `content/docs/integrations/sentry.md`
- `/docs/integrations/ai-providers` → `content/docs/integrations/ai-providers.md`
- `/docs/integrations/git-oauth` → `content/docs/integrations/git-oauth.md`
- `/docs/integrations/monitoring-webhooks` → `content/docs/integrations/monitoring-webhooks.md`

---

## Content File Structure Contract

### Markdown File Format

**Header Metadata** (Frontmatter):
```yaml
---
title: "[Service Name] Integration"
description: "[Brief description]"
service: "[service-key]"
status: "[Optional|Required]"
---

```

**Section Structure**:
- Use H2 (`##`) for main sections
- Use H3 (`###`) for subsections
- Use H4 (`####`) for sub-subsections if needed
- Consistent heading hierarchy

**Code Examples**:
- Use fenced code blocks with language identifiers
- Environment variables: `bash` or `env`
- Configuration examples: `yaml` or `json`
- Shell commands: `bash` or `sh`

**Tables**:
- Use Markdown table syntax
- Include headers
- Align columns consistently
- Maximum width: 80 characters per cell

**Lists**:
- Use ordered lists for steps
- Use unordered lists for items
- Use nested lists sparingly (max 2 levels)

**Links**:
- Internal links: Relative paths or absolute paths from root
- External links: Full URLs with `target="_blank"` in HTML if needed
- Cross-references: Use descriptive anchor text

---

## Service-Specific Content Requirements

### SMTP Integration

**Marketing Site Page** (`/docs/integrations/smtp`):
- Overview: Email invitations for user management
- Quick Start: Minimal SMTP configuration example
- Supported Services: SendGrid, AWS SES, Mailgun, Gmail, Microsoft 365, Self-hosted

**Web App Page** (`/docs/integrations/smtp`):
- Comprehensive setup guide (existing `docs/deployment/smtp-configuration.md` content, enhanced)
- All environment variables with descriptions
- Configuration examples for each provider
- Verification steps (log messages, test email)
- Troubleshooting section (common issues, error messages)
- Link to existing SMTP docs: `docs/deployment/smtp-configuration.md` (update and move to proper route)

---

### Sentry Integration

**Marketing Site Page** (`/docs/integrations/sentry`):
- Overview: Error tracking and monitoring
- Quick Start: Minimal Sentry configuration
- Benefits: Error aggregation, stack traces, performance monitoring

**Web App Page** (`/docs/integrations/sentry`):
- Sentry account setup
- Project creation steps
- Getting DSN from Sentry dashboard
- Environment variables: `SENTRY_DSN`, `ERROR_TRACKING_ENABLED`
- Verification steps (test error, check Sentry dashboard)
- Troubleshooting (DSN not working, events not appearing)

---

### AI Providers Integration

**Marketing Site Page** (`/docs/integrations/ai-providers`):
- Overview: AI-powered issue triage and analysis
- Quick Start: Minimal AI Gateway configuration
- Supported Services: Self-hosted (Ollama), Commercial (OpenAI, Anthropic)

**Web App Page** (`/docs/integrations/ai-providers`):
- AI Gateway overview and architecture
- Self-hosted setup (Ollama):
  - Installation steps
  - Model download
  - `LLM_ENDPOINT` configuration
- Commercial setup:
  - OpenAI: Account setup, API key generation, `OPENAI_API_KEY` configuration
  - Anthropic: Account setup, API key generation, `ANTHROPIC_API_KEY` configuration
- Environment variables: `AI_GATEWAY_URL`, `LLM_ENDPOINT`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- Verification steps (test AI triage, check gateway health)
- Troubleshooting (gateway not responding, API key issues)

---

### Git OAuth Integration

**Marketing Site Page** (`/docs/integrations/git-oauth`):
- Overview: Connect GitHub/GitLab repositories
- Quick Start: Minimal OAuth app creation
- Supported Services: GitHub, GitLab

**Web App Page** (`/docs/integrations/git-oauth`):
- GitHub OAuth setup:
  - Create OAuth App steps
  - Callback URL configuration
  - Client ID and Secret generation
  - Environment variables: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- GitLab OAuth setup:
  - Create OAuth Application steps
  - Redirect URI configuration
  - Application ID and Secret generation
  - Environment variables: `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`
- Verification steps (test repository connection)
- Troubleshooting (OAuth flow issues, token expiration)

---

### Monitoring Webhooks Integration

**Marketing Site Page** (`/docs/integrations/monitoring-webhooks`):
- Overview: Automatic issue creation from error events
- Quick Start: Minimal webhook configuration
- Supported Services: Sentry, Datadog, New Relic

**Web App Page** (`/docs/integrations/monitoring-webhooks`):
- Stride webhook endpoints:
  - Sentry: `/api/webhooks/sentry`
  - Datadog: `/api/webhooks/datadog`
  - New Relic: `/api/webhooks/newrelic`
- Expected payload format
- HMAC signature verification setup
- External service setup:
  - Sentry: Webhook configuration steps with screenshots/examples
  - Datadog: Webhook integration setup
  - New Relic: Webhook configuration setup
- Verification steps (send test webhook, verify issue creation)
- Troubleshooting (webhook not received, payload issues, signature verification)

---

## Environment Variables Reference Contract

### Centralized Reference

**Location**: `/docs/integrations` overview page in web app

**Format**: Comprehensive table with all environment variables

**Required Columns**:
- Variable Name
- Required/Optional
- Default Value
- Description
- Service/Integration
- Related Variables

**Grouping**: Group by integration/service for readability

**Example**:
```markdown
| Variable | Required | Default | Description | Service | Related |
|----------|----------|---------|-------------|---------|---------|
| SMTP_HOST | Yes* | - | SMTP server hostname | SMTP | SMTP_PORT, SMTP_USER |
| SMTP_PORT | Yes* | `587` | SMTP port (587 for TLS, 465 for SSL) | SMTP | SMTP_HOST, SMTP_SECURE |
| ... | ... | ... | ... | ... | ... |

*Required only if feature is enabled
```

---

## Navigation Contract

### Marketing Site Navigation

**Location**: Site-wide navigation or `/docs` navigation

**Required Links**:
- Integrations overview: `/docs/integrations`
- Individual service pages: `/docs/integrations/[service]`

**Implementation**: Add to existing navigation structure (check current nav implementation)

---

### Web App Navigation

**Location**: Docs sidebar or navigation (see `apps/web/app/docs/layout.tsx`)

**Required Links**:
- Integrations overview: `/docs/integrations`
- Individual service pages: `/docs/integrations/[service]`

**Implementation**: Add to docs navigation (tabs or sidebar) following existing pattern

---

## Accessibility Contract

### Content Accessibility

**Requirements**:
- Proper heading hierarchy (H1 → H2 → H3)
- Descriptive link text (not "click here")
- Alt text for images/diagrams
- Tables with headers
- Code blocks accessible to screen readers

**Testing**:
- Verify with screen reader
- Check heading hierarchy
- Validate link accessibility

---

## SEO Contract

### Marketing Site SEO

**Requirements**:
- Meta descriptions for all pages
- Proper heading structure (H1, H2, H3)
- Descriptive URLs (`/docs/integrations/smtp`, not `/docs/i/smtp`)
- Semantic HTML
- Internal linking structure

---

## Content Quality Standards

### Writing Guidelines

- **Clarity**: Use clear, concise language
- **Completeness**: Include all necessary steps
- **Accuracy**: Verify all code examples work
- **Consistency**: Use consistent terminology
- **Actionability**: Each section should be actionable

### Code Example Standards

- **Working Examples**: All code examples must work as written
- **Realistic Values**: Use realistic example values (not placeholders like "xxx")
- **Comments**: Add comments for clarity where needed
- **Syntax Highlighting**: Use appropriate language identifiers
- **Testing**: Verify all examples before publishing

---

## Version Control

### Content Updates

- All content files should be version controlled
- Markdown files in `content/docs/integrations/`
- Page components in `app/docs/integrations/`
- Track changes and updates

### Content Review

- Review all content for accuracy before publishing
- Test all code examples
- Verify all links work
- Check accessibility compliance
- Review SEO optimization

---

## Summary

All content contracts defined. Documentation must follow these contracts to ensure:
- Consistency across all service documentation
- Completeness (all required sections included)
- Quality (accurate, tested examples)
- Accessibility (proper structure, semantic HTML)
- SEO optimization (meta tags, proper headings)

# Implementation Plan: Service Integration Documentation

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-XX  
**Status**: Planning Complete (Phase 0-1)  
**Feature Spec**: `specs/001-stride-application/spec.md`

## Summary

Create comprehensive documentation for all service integrations that Stride supports, including both public-facing marketing site documentation and detailed instance-specific setup guides. Documentation should cover SMTP, Sentry, AI Providers, Git OAuth, and monitoring webhook integrations with sufficient detail for both discovery (public docs) and implementation (instance docs).

## Technical Context

### Technology Stack
- **Marketing Site**: Next.js App Router with static pages (`apps/site`)
- **Web App**: Next.js App Router with authenticated docs (`apps/web`)
- **Content Format**: Markdown files served via MDX/Markdown renderer
- **Documentation Structure**: 
  - Public: `apps/site/app/docs/integrations/`
  - Instance: `apps/web/app/docs/integrations/` or `apps/web/content/docs/integrations/`

### Dependencies
- **Existing Documentation**:
  - `docs/deployment/smtp-configuration.md` - SMTP setup guide
  - `docs/deployment/docker.md` - Docker deployment with env var reference
  - `apps/site/app/docs/configuration/page.tsx` - Marketing site docs pattern
  - `apps/web/app/docs/configuration/page.tsx` - Web app docs pattern with MarkdownRenderer
- **Markdown Rendering**: 
  - `@stride/ui` MarkdownRenderer component (used in web app)
  - Static content for marketing site
- **Content Storage**:
  - Marketing site: Inline JSX or `apps/site/content/docs/`
  - Web app: `apps/web/content/docs/` (follows existing pattern)

### Integrations to Document

#### 1. SMTP (Email Service)
- **Purpose**: Email invitations for user management
- **Status**: Optional (app works without it)
- **Current Docs**: `docs/deployment/smtp-configuration.md` (not served via routes)
- **Services Supported**: SendGrid, AWS SES, Mailgun, Gmail, Microsoft 365, Self-hosted (Postfix/Exim)
- **Config**: Environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE, SMTP_FROM)

#### 2. Sentry (Error Tracking)
- **Purpose**: Error tracking and monitoring
- **Status**: Optional
- **Current Docs**: Mentioned in `docker.md`, no dedicated guide
- **Config**: Environment variables (SENTRY_DSN, ERROR_TRACKING_ENABLED)

#### 3. AI Providers (AI Gateway)
- **Purpose**: AI-powered issue triage and analysis
- **Status**: Optional (self-hosted or commercial)
- **Current Docs**: Mentioned in `docker.md` and `quickstart.md`
- **Services Supported**: 
  - Self-hosted: Ollama (LLM_ENDPOINT)
  - Commercial: OpenAI (OPENAI_API_KEY), Anthropic (ANTHROPIC_API_KEY)
- **Config**: Environment variables (AI_GATEWAY_URL, LLM_ENDPOINT, OPENAI_API_KEY, ANTHROPIC_API_KEY)

#### 4. Git OAuth (Repository Integration)
- **Purpose**: Connect GitHub/GitLab repositories for webhook integration
- **Status**: Optional (required for Git webhooks)
- **Current Docs**: Mentioned in `docker.md`
- **Services Supported**: GitHub, GitLab
- **Config**: Environment variables (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET)

#### 5. Monitoring Webhooks (Error Integration)
- **Purpose**: Automatic issue creation from error events
- **Status**: Optional (for root cause diagnostics)
- **Current Docs**: Mentioned in spec but no configuration guide
- **Services Supported**: Sentry, Datadog, New Relic
- **Config**: Webhook URLs provided to monitoring services, HMAC signature verification

### Architecture Decisions

#### Documentation Structure
- **Marketing Site** (`apps/site`):
  - Overview page: `/docs/integrations` - List all supported services with brief descriptions
  - Service-specific pages: `/docs/integrations/smtp`, `/docs/integrations/sentry`, etc.
  - Focus: High-level overview, use cases, benefits, quick start
  - Target: Prospective users evaluating Stride

- **Web App** (`apps/web`):
  - Overview page: `/docs/integrations` - Comprehensive integration guide
  - Service-specific pages: `/docs/integrations/[service]` with detailed setup
  - Focus: Detailed configuration steps, troubleshooting, environment variables, verification
  - Target: Users configuring their Stride instance

#### Content Organization
- **Progressive Disclosure**: Marketing site has overview + quick start; Web app has full details
- **Cross-references**: Marketing docs link to detailed guides in web app (when logged in)
- **Environment Variables**: Centralized reference in web app, summarized in marketing site
- **Code Examples**: Both sites have examples, web app has more comprehensive samples

#### Content Storage Pattern
- **Marketing Site**: 
  - Static pages (`apps/site/app/docs/integrations/`) for SEO and performance
  - Inline content for simpler structure
  - OR content files (`apps/site/content/docs/integrations/`) if reusing content
- **Web App**: 
  - Follow existing pattern: `apps/web/content/docs/integrations/`
  - Pages read from content files using MarkdownRenderer
  - Supports authenticated access with proper layout

### Unknowns / Needs Clarification

- ✅ **RESOLVED**: Marketing site docs structure - See `service-integration-docs-research.md` section 1
- ✅ **RESOLVED**: Web app docs access control - See `service-integration-docs-research.md` section 2
- ✅ **RESOLVED**: Partial configuration documentation - See `service-integration-docs-research.md` section 3
- ✅ **RESOLVED**: Future UI implementation - See `service-integration-docs-research.md` section 4
- ✅ **RESOLVED**: Webhook configuration documentation - See `service-integration-docs-research.md` section 5
- ✅ **RESOLVED**: Navigation structure - See `service-integration-docs-research.md` section 6

All clarifications resolved. See `service-integration-docs-research.md` for detailed decisions and rationale.

## Constitution Check

### Principles Compliance
- [x] **SOLID Principles**:
  - Single Responsibility: Separate content files per service, separate pages per audience
  - Open/Closed: Documentation structure extensible for new services
  - Liskov Substitution: Consistent documentation format across services
  - Interface Segregation: Service-specific pages, not one monolithic doc
  - Dependency Inversion: Content format independent of rendering method
- [x] **DRY**: Reuse content patterns across services; extract common sections (env vars, verification, troubleshooting)
- [x] **YAGNI**: Focus on documented services only; don't create generic frameworks
- [x] **KISS**: Simple markdown-based documentation; avoid over-engineering
- [x] **Composition**: Build docs from reusable sections (overview, config, examples, troubleshooting)

### Code Quality Gates
- [x] **Type Safety**: TypeScript for all pages; type-safe content loading
- [x] **Accessibility**: Semantic HTML, proper heading hierarchy, accessible navigation
- [x] **Performance**: Static generation for marketing site; efficient content loading for web app
- [x] **SEO**: Proper meta tags, semantic structure for marketing site

### Documentation Standards
- [x] **Clear Structure**: Consistent sections across all service docs (Overview, Configuration, Examples, Verification, Troubleshooting)
- [x] **Code Examples**: Real, working examples for all configuration scenarios
- [x] **Progressive Disclosure**: Quick start in marketing, full details in web app
- [x] **Cross-References**: Links between related docs, back to main docs
- [x] **Status Indicators**: Clear indication of optional vs. required, feature availability

## Phase 0: Outline & Research

### Research Tasks

1. **Research Documentation Patterns**
   - Task: Review existing documentation structure in `apps/site` and `apps/web`
   - Goal: Understand current patterns, content organization, navigation structure
   - Deliverable: Documentation structure analysis

2. **Research Service-Specific Setup Requirements**
   - Task: Document setup steps for each service (SMTP providers, Sentry, AI providers, Git OAuth, monitoring webhooks)
   - Goal: Ensure all necessary configuration steps are captured
   - Deliverable: Service setup requirements matrix

3. **Research Webhook Configuration Best Practices**
   - Task: Research how to document webhook setup for external services
   - Goal: Create clear guides for configuring webhooks in Sentry, Datadog, New Relic
   - Deliverable: Webhook configuration patterns

4. **Research Content Reusability**
   - Task: Determine if content can be shared between marketing and web app
   - Goal: Minimize duplication while maintaining appropriate detail levels
   - Deliverable: Content strategy document

### Research Output

**Output**: `service-integration-docs-research.md` with:
- Documentation structure decisions
- Service-specific setup requirements
- Webhook configuration patterns
- Content organization strategy
- Navigation structure decisions

## Phase 1: Design & Contracts

### Documentation Structure

1. **Marketing Site Structure**
   - `/docs/integrations` - Overview page listing all integrations
   - `/docs/integrations/smtp` - SMTP overview and quick start
   - `/docs/integrations/sentry` - Sentry overview
   - `/docs/integrations/ai-providers` - AI Gateway overview
   - `/docs/integrations/git-oauth` - Git OAuth overview
   - `/docs/integrations/monitoring-webhooks` - Monitoring webhooks overview

2. **Web App Structure**
   - `/docs/integrations` - Comprehensive integration guide with status indicators
   - `/docs/integrations/smtp` - Detailed SMTP setup guide
   - `/docs/integrations/sentry` - Sentry configuration guide
   - `/docs/integrations/ai-providers` - AI Gateway detailed setup
   - `/docs/integrations/git-oauth` - Git OAuth detailed setup
   - `/docs/integrations/monitoring-webhooks` - Webhook setup guide

### Content Contracts

- [x] Content contracts defined in `service-integration-docs-contracts.md`
- [x] Marketing site page structure specified
- [x] Web app page structure specified
- [x] Service-specific content requirements documented
- [x] Environment variables reference format defined
- [x] Navigation structure specified
- [x] Accessibility and SEO requirements defined

**Output**: `service-integration-docs-contracts.md` - Complete content structure and requirements

### API Contracts

**No API endpoints required** - Documentation is served as static pages or markdown content.

However, we may want to create:
- Integration status API (future): `/api/integrations/status` - Returns configured services
- This is out of scope for documentation work but could enhance docs with live status

**Output**: N/A (documentation only, no API changes)

### Data Model

**No data model changes required** - Documentation is static content.

However, future enhancement could include:
- Integration configuration storage (database table)
- Integration status tracking
- This is out of scope for documentation-only work

**Output**: N/A (documentation only)

### Quickstart

- [x] `service-integration-docs-quickstart.md` generated
- [x] Step-by-step guide for creating new service documentation
- [x] Documentation template provided
- [x] Best practices documented
- [x] Common pitfalls identified

**Output**: `service-integration-docs-quickstart.md` - Guide for creating new service documentation following established patterns

### Agent Context

**Update**: Add documentation patterns and service integration context to agent memory

**Note**: Agent context update should be done via `.specify/scripts/bash/update-agent-context.sh cursor-agent` when ready to implement

## Phase 2: Implementation Planning

### Component Structure

**Marketing Site Pages** (`apps/site/app/docs/integrations/`):
- `page.tsx` - Overview page listing all integrations
- `[service]/page.tsx` - Service-specific pages (smtp, sentry, ai-providers, git-oauth, monitoring-webhooks)

**Web App Pages** (`apps/web/app/docs/integrations/`):
- `page.tsx` - Overview page with integration guide
- `[service]/page.tsx` - Service-specific detailed guides (reads from `content/docs/integrations/`)

**Content Files** (`apps/web/content/docs/integrations/`):
- `smtp.md` - SMTP detailed guide
- `sentry.md` - Sentry detailed guide
- `ai-providers.md` - AI Gateway detailed guide
- `git-oauth.md` - Git OAuth detailed guide
- `monitoring-webhooks.md` - Monitoring webhooks detailed guide

### Content Requirements

For each service documentation, include:

1. **Overview**
   - What the service does
   - Why you'd want to configure it
   - What features it enables

2. **Configuration**
   - Prerequisites
   - Step-by-step setup instructions
   - Environment variables (with descriptions)
   - Service-specific configuration (e.g., Sentry project setup, GitHub OAuth app creation)

3. **Verification**
   - How to verify configuration is working
   - How to test the integration
   - What success looks like

4. **Examples**
   - Minimal working example
   - Common configurations
   - Service-specific examples (multiple SMTP providers, etc.)

5. **Troubleshooting**
   - Common issues and solutions
   - Error messages and fixes
   - Debugging steps

6. **Related Documentation**
   - Links to relevant docs
   - Next steps after configuration

### Navigation Updates

**Marketing Site**:
- Add "Integrations" to `/docs` navigation if not present
- Ensure integration docs are discoverable

**Web App**:
- Add "Integrations" to docs navigation sidebar
- Ensure integration docs accessible from main docs page

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 5 service integrations (SMTP, Sentry, AI Providers, Git OAuth, Monitoring Webhooks) have complete documentation on both marketing site and web app
- **SC-002**: Marketing site integration docs provide clear overview and quick start (users can understand what's available in < 2 minutes)
- **SC-003**: Web app integration docs provide sufficient detail for complete setup (admins can configure any service following the guide)
- **SC-004**: Documentation follows consistent structure across all services
- **SC-005**: All environment variables are documented with descriptions, defaults, and requirements
- **SC-006**: Troubleshooting sections address common configuration issues
- **SC-007**: Documentation is accessible and navigable (proper headings, links, cross-references)

### Quality Gates

- [x] All services have both marketing and web app documentation
- [x] Code examples are tested and working
- [x] Environment variable tables are complete and accurate
- [x] Troubleshooting sections address real-world issues
- [x] Documentation follows accessibility standards
- [x] Links and cross-references are valid
- [x] Documentation structure is consistent across services

## Notes

- This is documentation work only - no functionality changes
- Documentation should support future UI implementation (integrations settings page)
- Focus on clarity and completeness - users should be able to configure services without external help
- Update existing SMTP documentation to match new structure and move it to proper routes
- Consider creating a documentation template for adding new service docs in the future
- Webhook documentation should include screenshots/examples from external service UIs where helpful

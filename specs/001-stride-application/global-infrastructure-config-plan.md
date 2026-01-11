# Implementation Plan: Global Infrastructure Configuration

**Feature Branch**: `001-stride-application`  
**Created**: 2026-01-23  
**Status**: Planning  
**Feature Spec**: `specs/001-stride-application/spec.md`  
**Input**: User requirement: "We already support per project git connections, but we are talking about global infrastructure as well as per project AI configuration. Per project is UI based, but globally, we need a way for an admin to configure git + ai providers either via UI or env vars or both. We need to not interfere with Phase 9 work, but need to augment this work or extend it for git. We need to make sure documentation is clear on this and onboarding is also clear."

## Summary

Implement global infrastructure configuration for Git and AI providers that supports both environment variable and UI-based configuration. This augments Phase 9 per-project AI provider configuration by adding global infrastructure-level settings while maintaining backward compatibility with existing environment variable patterns. Admins can configure global Git OAuth credentials (GitHub, GitLab) and AI Gateway infrastructure settings either via environment variables (infrastructure-as-code) or via Admin Settings UI (dynamic configuration), with clear precedence rules and comprehensive documentation.

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM (for UI-based configuration storage)
- **Authentication**: Admin-only access via role-based permissions
- **State Management**: Jotai for global state, TanStack Query for server state
- **Styling**: Tailwind CSS with custom design tokens
- **Configuration**: Hybrid approach - environment variables (infrastructure) + database (UI-based)

### Dependencies
- **Existing Infrastructure**:
  - Environment variables for Git OAuth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`
  - Environment variables for AI Gateway: `AI_GATEWAY_URL`, `LLM_ENDPOINT`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`
  - Per-project repository connections (UI-based, stored in database)
  - Phase 9 per-project AI provider configuration (UI-based, stored in database)
- **New Requirements**:
  - Global Git OAuth configuration (infrastructure-level, supports env vars + UI)
  - Global AI Gateway configuration (infrastructure-level, supports env vars + UI)
  - Admin Settings UI for global infrastructure configuration
  - Configuration precedence resolution (env vars vs UI settings)

### Integrations
- **Git OAuth Services**: GitHub, GitLab, Bitbucket (infrastructure-level credentials for OAuth flow initiation)
- **AI Gateway**: Infrastructure-level endpoint and provider configuration (service discovery and default settings)
- **Per-Project Overrides**: Per-project AI provider configuration (Phase 9) uses global defaults but can override

### Architecture Decisions

**NEEDS CLARIFICATION**: Several architectural decisions need resolution before implementation:

1. **Configuration Precedence**: When both environment variables and UI-based configuration exist, which takes precedence?
   - Option A: Environment variables always override UI settings (infrastructure-as-code first)
   - Option B: UI settings override environment variables (dynamic configuration first)
   - Option C: Merge strategy (env vars provide defaults, UI overrides specific values)
   - **DECISION**: Option A with per-provider precedence. Environment variables override UI settings per-provider (GitHub, GitLab, AI Gateway independently). Mixed sources allowed (e.g., GitHub via env vars, GitLab via UI).

2. **Database Schema**: Should global infrastructure configuration be stored in database?
   - Option A: New `GlobalInfrastructureConfig` table with encrypted credentials
   - Option B: System-wide settings table that can be extended
   - Option C: Per-service tables (`GlobalGitConfig`, `GlobalAIConfig`)
   - **RECOMMENDATION**: Option A with JSONB fields for extensibility (similar to existing `config` JSONB pattern)

3. **UI Location**: Where should Admin Settings UI be located?
   - Option A: `/settings/infrastructure` (global settings section)
   - Option B: `/admin/settings` (admin-specific settings page)
   - Option C: `/settings/system` (system-wide settings)
   - **RECOMMENDATION**: Option A (extends existing `/settings` pattern, maintains consistency with user/account settings)

4. **Encryption**: How should sensitive credentials be encrypted in database?
   - Option A: Use existing encryption utilities (if available)
   - Option B: Implement new encryption service using Node.js crypto
   - Option C: Store encrypted values at application level, database stores ciphertext
   - **NEEDS INVESTIGATION**: Check existing encryption patterns for `RepositoryConnection.accessToken` and `AI Provider Configuration` credentials

5. **Configuration Sync**: How should changes propagate?
   - Option A: Immediate application (restart required for env vars, hot-reload for UI)
   - Option B: Configuration cache with TTL
   - Option C: Event-driven updates with notification system
   - **DECISION**: Option A - UI changes apply immediately (hot-reload), env var changes require restart. Clear documentation explains when restart is needed.

6. **Backward Compatibility**: How to handle existing environment variable configuration?
   - Option A: Always read from env vars first, fallback to database
   - Option B: Migration utility to copy env vars to database (one-time)
   - Option C: Support both simultaneously with precedence rules
   - **DECISION**: Option C with per-provider precedence. Support both simultaneously with env vars overriding UI config per-provider. Mixed sources allowed for maximum flexibility.

### Unknowns / Needs Clarification

- **CLARIFICATION-001**: What encryption utilities/libraries are currently used for `RepositoryConnection.accessToken` and AI provider credentials? Need to identify existing encryption service or pattern.
- **CLARIFICATION-002**: Are there existing admin-only settings pages or patterns for system-wide configuration? Need to review `/settings` structure and admin access patterns.
- **CLARIFICATION-003**: How should global Git OAuth configuration relate to per-project repository connections? Do per-project connections inherit from global config or are they independent?
- **CLARIFICATION-004**: Should global AI Gateway configuration be used as defaults for per-project AI provider configuration (Phase 9), or are they completely independent?
- **CLARIFICATION-005**: What validation rules apply to global infrastructure configuration? (e.g., URL format, OAuth callback URL validation, API key format validation)
- **CLARIFICATION-006**: Should configuration changes require admin confirmation or audit logging? What level of audit trail is needed?
- **CLARIFICATION-007**: How should documentation distinguish between infrastructure-level (global) and project-level configuration? Need clear separation in onboarding/docs.

## Constitution Check

### Principles Compliance
- [x] **SOLID principles applied**
  - Single Responsibility: Separate concerns for global vs per-project configuration
  - Open/Closed: Extensible configuration system without modifying existing per-project patterns
  - Liskov Substitution: Configuration interface works with both env vars and database storage
  - Interface Segregation: Separate interfaces for Git and AI configuration
  - Dependency Inversion: Configuration service depends on abstractions (repository pattern)
- [x] **DRY, YAGNI, KISS followed**
  - Reuse existing encryption and validation patterns
  - Start with minimal viable configuration (Git + AI), extend later if needed
  - Simple precedence rules (env vars override UI)
- [x] **Type safety enforced**
  - TypeScript strict mode
  - Zod schemas for configuration validation
  - Prisma types for database access
- [x] **Security best practices**
  - Encrypted credential storage
  - Admin-only access enforcement
  - Input validation (URLs, API keys, OAuth credentials)
  - Audit logging for configuration changes
  - **Never expose secrets in UI**: Client secrets and API keys never displayed in UI responses or forms, even in read-only mode when env vars override
- [x] **Accessibility requirements met**
  - Admin Settings UI follows WCAG 2.1 AA
  - Form validation with clear error messages
  - Keyboard navigation support
- [x] **User visibility**
  - Admin users: Full read/write access to infrastructure configuration
  - Non-admin users: Read-only status view (configuration status, URLs, service endpoints) - no sensitive credentials exposed

### Code Quality Gates
- [x] **No `any` types**: Use proper TypeScript types and Zod schemas
- [x] **Proper error handling**: Graceful degradation, clear error messages
- [x] **Input validation**: Validate all configuration inputs (URLs, credentials, etc.)
  - Validation on UI save (immediate feedback)
  - Validation on application startup (catch env var errors early)
- [x] **Test coverage planned**: Unit tests for configuration service, integration tests for API routes, E2E tests for Admin UI

### Potential Violations / Justifications

**None identified** - This feature follows existing patterns (per-project configuration) and extends them to global scope with clear separation of concerns.

## Phase 0: Outline & Research

### Research Tasks

1. **Investigate existing encryption patterns**
   - Task: Review `packages/database` for encryption utilities used by `RepositoryConnection.accessToken`
   - Task: Review Phase 9 AI provider configuration implementation for encryption patterns
   - Task: Identify encryption library/service used (if any)
   - Output: Document encryption approach and create reusable encryption service

2. **Review existing settings structure**
   - Task: Review `/settings` route structure and admin access patterns
   - Task: Review `SettingsNavigation` component for extensibility
   - Task: Identify admin-only settings pattern (if exists)
   - Output: Document settings page structure and admin access enforcement

3. **Analyze per-project vs global configuration relationship**
   - Task: Review `RepositoryConnection` model and usage patterns
   - Task: Review Phase 9 AI provider configuration spec and implementation plan
   - Task: Identify inheritance/override patterns needed
   - Output: Document configuration precedence and inheritance model

4. **Research configuration validation patterns**
   - Task: Review existing Zod schemas for configuration validation
   - Task: Research OAuth callback URL validation requirements
   - Task: Research API key format validation (GitHub, GitLab, OpenAI, Anthropic, Google)
   - Output: Create comprehensive validation schemas

5. **Document environment variable patterns**
   - Task: Review `docker-compose.yml` for existing env var patterns
   - Task: Review `docs/integrations/` for environment variable documentation
   - Task: Identify all Git and AI-related environment variables
   - Output: Document current env var usage and create mapping to database fields

6. **Design configuration precedence and merge strategy**
   - Task: Research infrastructure-as-code best practices
   - Task: Design precedence rules (env vars vs UI)
   - Task: Design configuration merge strategy for partial overrides
   - Output: Document precedence rules and merge algorithm

7. **Design audit logging requirements**
   - Task: Review existing audit logging patterns (if any)
   - Task: Define required audit fields (who, when, what changed)
   - Task: Design audit log storage (database table vs separate service)
   - Output: Document audit logging schema and requirements

### Research Output
- [x] `research.md` generated with all clarifications resolved
- [x] All CLARIFICATION-001 through CLARIFICATION-007 items resolved
- [x] Encryption service identified or designed (reuse existing `apps/web/src/lib/integrations/storage.ts`)
- [x] Configuration precedence rules finalized (env vars override UI)
- [x] Validation schemas designed (Zod schemas for Git OAuth and AI Gateway)
- [x] Audit logging approach finalized (lightweight: `updatedBy` + `updatedAt`)

## Phase 1: Design & Contracts

### Data Model
- [x] `data-model.md` generated
- [x] `GlobalInfrastructureConfig` entity defined
  - Fields: `id`, `gitConfig` (JSONB), `aiConfig` (JSONB), `updatedBy` (userId, optional), `updatedAt`, `createdAt`
  - Relationships: Many-to-One (optional) with User (for audit trail)
  - Indexes: `updatedAt` for recent changes query, `updatedBy` for audit trail
- [x] Validation rules documented
  - Git OAuth: Client ID format, Client Secret (encrypted), Callback URL validation
  - AI Gateway: URL format, endpoint validation, API key format (provider-specific)
- [x] Encryption schema documented
  - Encrypted fields: `clientSecret` (GitHub/GitLab), API keys (OpenAI, Anthropic, Google)
  - Plain text fields: `clientId` (not sensitive), URLs (endpoints not sensitive)
  - Encryption method: Reuse existing AES-256-GCM from `apps/web/src/lib/integrations/storage.ts`

### API Contracts
- [x] REST endpoints defined in `/contracts/global-infrastructure-config-contracts.md`
  - `GET /api/admin/settings/infrastructure` - Get global infrastructure configuration (Admin only)
  - `PUT /api/admin/settings/infrastructure` - Update global infrastructure configuration (Admin only)
  - `GET /api/admin/settings/infrastructure/audit` - Get configuration change history (Admin only)
  - `POST /api/admin/settings/infrastructure/test` - Test configuration connectivity (Admin only)
- [x] Request/response schemas documented with Zod validation
- [x] Error responses documented (validation errors, permission denied, etc.)

### Quickstart
- [x] `quickstart.md` generated
- [x] Setup instructions documented
  - Environment variable configuration (existing pattern)
  - UI-based configuration (new Admin Settings)
  - Configuration precedence explanation (env vars override UI)
  - Troubleshooting guide

### Agent Context
- [ ] Agent context updated with new technologies (deferred to implementation phase)
- [x] Global infrastructure configuration patterns documented (in plan and research)
- [x] Configuration service architecture documented (precedence resolution pattern)

## Phase 2: Implementation Planning

### Component Structure
- [ ] Components identified
  - `AdminInfrastructureSettings` - Main settings page component
  - `GitInfrastructureConfigForm` - Git OAuth configuration form
  - `AIInfrastructureConfigForm` - AI Gateway configuration form
  - `ConfigTestButton` - Test configuration connectivity component
  - `ConfigAuditLog` - Configuration change history component
- [ ] Component hierarchy defined
- [ ] Props/interfaces designed with TypeScript

### State Management
- [ ] State requirements identified
  - Global infrastructure configuration (server state via TanStack Query)
  - Form state (local state for editing)
  - Test connection state (loading, success, error)
- [ ] State management strategy chosen
  - TanStack Query for server state (configuration fetch/update)
  - React Hook Form for form state management
  - Local state for UI interactions (test buttons, loading states)
- [ ] State flow documented

### Testing Strategy
- [ ] Unit test plan
  - Configuration service functions (precedence resolution, merge logic)
  - Validation schemas (Zod)
  - Encryption/decryption utilities
- [ ] Integration test plan
  - API route permission enforcement
  - Configuration update flow
  - Environment variable precedence
- [ ] E2E test scenarios
  - Admin can access infrastructure settings
  - Non-admin cannot access infrastructure settings
  - Configuration can be updated via UI
  - Environment variables override UI settings
  - Test connection functionality works
  - Audit log displays configuration changes

## Phase 3: Implementation

### Tasks
- [ ] Implementation tasks created in `tasks.md`
- [ ] Dependencies identified
  - Phase 9 AI provider configuration (per-project) must be complete or at least stable
  - Existing `/settings` structure must support admin-only sections
  - Encryption service must be available or implemented
- [ ] Estimated effort
  - Research: 2-3 days
  - Design: 1-2 days
  - Implementation: 5-7 days
  - Testing: 2-3 days
  - Documentation: 1-2 days
  - **Total**: ~2-3 weeks

## Clarifications

### Session 2026-01-23

- Q: When environment variables override UI-based configuration, how should the Admin Settings UI behave? → A: Show read-only fields with explanatory message "Configured via environment variables. Update GITHUB_CLIENT_ID in .env to change." **Critical**: Never expose secrets (client secrets, API keys) in UI, even in read-only mode. Only show non-sensitive identifiers (client IDs, URLs) and configuration status.
- Q: Should non-admin users (Members, Viewers) be able to see infrastructure configuration status? → A: Read-only status view. Non-admins can see configuration status (configured/not configured, URLs, service endpoints) but cannot edit. This helps users understand why certain features may not be available and provides transparency without exposing sensitive credentials.
- Q: When configuration is updated via Admin Settings UI, should changes take effect immediately or require restart? → A: Immediate for UI changes, restart required for env vars. UI-based configuration changes apply immediately (hot-reload pattern), while environment variable changes require application restart. Documentation must clearly explain when restart is needed.
- Q: If some providers are configured via environment variables and others via UI, how should the system handle mixed configuration? → A: Per-provider precedence. Each provider (GitHub, GitLab, AI Gateway) independently checks environment variables first, then UI config. Mixed sources are allowed (e.g., GitHub via env vars, GitLab via UI, AI Gateway via env vars).
- Q: When should the system validate infrastructure configuration? → A: On save and startup. Validate configuration when admin saves via UI AND on application startup to catch environment variable configuration errors early. Provides early error detection and prevents runtime failures.

## Notes

### Relationship to Phase 9

**Critical**: This work must not interfere with Phase 9 per-project AI provider configuration. Key principles:

1. **Separation of Concerns**:
   - Phase 9: Per-project AI provider configuration (project-specific API keys, models, endpoints)
   - This feature: Global AI Gateway infrastructure (service endpoint, default providers, infrastructure-level credentials)

2. **Configuration Precedence**:
   - Global infrastructure config provides defaults/fallbacks
   - Per-project config (Phase 9) can override global settings
   - Environment variables override both (infrastructure-as-code principle)

3. **Implementation Order**:
   - Phase 9 per-project AI configuration should be stable before implementing global infrastructure config UI
   - Can proceed in parallel if clear interfaces are defined
   - Must ensure database schema changes don't conflict

### Documentation Requirements

**Critical**: Clear separation between infrastructure-level and project-level configuration is essential for onboarding.

1. **Infrastructure Configuration** (this feature):
   - Global system-wide settings
   - Configured via environment variables or Admin Settings UI
   - Used by all projects as defaults
   - Required for OAuth flows and AI Gateway connectivity

2. **Project Configuration** (Phase 9):
   - Per-project specific settings
   - Configured via Project Settings → Integrations UI
   - Can override global defaults
   - Stored per-project in database

3. **Onboarding Flow**:
   - Step 1: Set up global infrastructure (env vars or UI)
   - Step 2: Create project and configure project-specific settings
   - Clear distinction in documentation and UI

### Git OAuth Configuration Relationship

**Question**: How does global Git OAuth configuration relate to per-project repository connections?

**Current Understanding**: Per-project repository connections use OAuth flow that requires global OAuth credentials. The global configuration provides:
- OAuth App credentials (Client ID, Client Secret)
- OAuth callback URL configuration
- Service-level authentication for initiating OAuth flows

Per-project repository connections use these global credentials to initiate OAuth flows, then store project-specific access tokens.

**Clarification Needed**: Verify this understanding and document the relationship in research phase.

### Extension Points

This implementation should be designed to support future infrastructure configuration:
- SMTP server configuration (currently env vars only)
- Monitoring webhook endpoints (currently per-project)
- Other infrastructure-level services

Design should allow easy extension without breaking changes.

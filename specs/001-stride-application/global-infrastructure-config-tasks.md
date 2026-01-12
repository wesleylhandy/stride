# Tasks: Global Infrastructure Configuration

**Feature Branch**: `001-stride-application`  
**Created**: 2026-01-23  
**Status**: Ready for Implementation  
**Related Plan**: `specs/001-stride-application/global-infrastructure-config-plan.md`

## Overview

This document provides an actionable, dependency-ordered task breakdown for implementing global infrastructure configuration for Git OAuth and AI Gateway settings. Tasks are organized to ensure no interference with Phase 9 (AI Triage) or Phase 10 (Polish).

**Total Tasks**: 89  
**Phase**: 11 (after Phase 10)  
**Dependencies**: Phase 7.6 complete (settings structure), Phase 9 stable (per-project AI config)  
**Independence**: This phase can be implemented independently - provides global defaults but Phase 9 can work without it (uses env vars)

## Implementation Strategy

### Non-Interference Principles

- **Database Schema**: New `GlobalInfrastructureConfig` table - no conflicts with Phase 9 `AIProviderConfiguration` (per-project)
- **API Routes**: `/api/admin/settings/infrastructure` - no conflicts with Phase 9 project-level routes
- **UI Routes**: `/settings/infrastructure` - extends existing `/settings` pattern, no conflicts
- **Configuration Precedence**: Global config provides defaults, Phase 9 per-project config can override
- **Phase 9 Compatibility**: Phase 9 can work without this phase (reads from env vars directly)

### Task Format

Every task follows this strict format:

- `- [ ] [TaskID] [P?] Description with file path`

Where:

- **TaskID**: Sequential number starting from T600 (after Phase 9 ends at T577)
- **[P]**: Optional marker for parallelizable tasks
- **Description**: Clear action with exact file path

---

## Phase 11: Global Infrastructure Configuration

**Goal**: Enable admins to configure global Git OAuth and AI Gateway infrastructure settings via UI or environment variables, with clear precedence rules and comprehensive documentation.

**Independent Test**: Navigate to Admin Settings → Infrastructure (`/settings/infrastructure`), configure GitHub OAuth credentials via UI, verify configuration is saved, configure AI Gateway URL via UI, verify configuration is saved, set environment variables (GITHUB_CLIENT_ID), verify UI shows "Configured via environment variables" read-only state, restart application, verify environment variables take precedence. Test succeeds when global infrastructure configuration can be managed via UI or env vars with correct precedence.

**Dependencies**: 
- Phase 7.6 complete (settings structure must exist)
- Phase 9 stable (per-project AI provider configuration should be stable, but not required - this phase provides global defaults that Phase 9 can use)
- Encryption service available (`apps/web/src/lib/integrations/storage.ts`)

**Non-Interference Guarantees**:
- ✅ Database schema: New table `GlobalInfrastructureConfig` (separate from Phase 9 `AIProviderConfiguration`)
- ✅ API routes: `/api/admin/settings/infrastructure` (separate from Phase 9 project-level routes)
- ✅ UI routes: `/settings/infrastructure` (extends `/settings`, no conflict)
- ✅ Configuration: Global provides defaults, Phase 9 overrides work independently

### Database Schema

- [x] T600 Create Prisma migration for GlobalInfrastructureConfig model in packages/database/prisma/migrations/YYYYMMDDHHMMSS_add_global_infrastructure_config/migration.sql
- [x] T601 Add GlobalInfrastructureConfig model to packages/database/prisma/schema.prisma with fields: id (UUID), gitConfig (JSONB), aiConfig (JSONB), updatedBy (String?, foreign key to User), createdAt, updatedAt
- [x] T602 Add User relation to GlobalInfrastructureConfig in packages/database/prisma/schema.prisma with onDelete: SetNull for audit trail
- [x] T603 Add indexes for GlobalInfrastructureConfig in packages/database/prisma/schema.prisma: updatedAt, updatedBy
- [x] T604 Run Prisma generate to update types in packages/database/
- [x] T605 Create repository function for GlobalInfrastructureConfig in packages/database/src/repositories/global-infrastructure-config-repository.ts with getOrCreate, update methods

**Acceptance Criteria**:

- Database schema includes GlobalInfrastructureConfig table
- Singleton pattern enforced (only one record)
- Audit trail via updatedBy foreign key
- Repository functions support upsert pattern
- Types generated correctly

### Configuration Service Layer

- [x] T606 Create configuration precedence resolver in apps/web/src/lib/config/infrastructure-precedence.ts that reads env vars first, then database, per-provider basis
- [x] T607 Create Git OAuth config reader in apps/web/src/lib/config/git-oauth-config.ts that resolves GitHub and GitLab config with per-provider precedence
- [x] T608 Create AI Gateway config reader in apps/web/src/lib/config/ai-gateway-config.ts that resolves AI Gateway URL and provider credentials with per-provider precedence
- [x] T609 Implement configuration validation utility in apps/web/src/lib/config/validate-infrastructure.ts using Zod schemas for Git OAuth and AI Gateway config
- [x] T610 Create configuration encryption utility in apps/web/src/lib/config/encrypt-infrastructure.ts that encrypts sensitive credentials using existing storage.ts encrypt function
- [x] T611 Create startup validation function in apps/web/src/lib/config/validate-startup.ts that validates env var configuration on application startup

**Acceptance Criteria**:

- Configuration precedence works correctly (env vars → database → defaults)
- Per-provider precedence allows mixed sources (GitHub via env, GitLab via UI)
- Validation catches errors early (save + startup)
- Encryption uses existing utilities
- Startup validation provides clear error messages

### Validation Schemas

- [x] T612 Create Zod schema for Git OAuth configuration in apps/web/src/lib/config/schemas/git-oauth-schema.ts with GitHub and GitLab validation rules
- [x] T613 Create Zod schema for AI Gateway configuration in apps/web/src/lib/config/schemas/ai-gateway-schema.ts with URL validation, API key format validation
- [x] T614 Create combined infrastructure config schema in apps/web/src/lib/config/schemas/infrastructure-schema.ts that combines Git and AI schemas
- [x] T615 Add validation for OAuth callback URL format in apps/web/src/lib/config/schemas/git-oauth-schema.ts (URL validation already covers this via baseUrl)
- [x] T616 Add validation for API key formats (OpenAI: sk-*, Anthropic: sk-ant-*, Google: AIza*) in apps/web/src/lib/config/schemas/ai-gateway-schema.ts

**Acceptance Criteria**:

- All validation schemas use Zod
- OAuth client IDs validated (non-empty strings)
- API keys validated with format regex
- URLs validated with Zod URL validation
- Error messages are user-friendly

### API Routes - Configuration Management

- [x] T617 Create GET /api/admin/settings/infrastructure route in apps/web/app/api/admin/settings/infrastructure/route.ts with admin-only authentication check
- [x] T618 Implement configuration retrieval with precedence resolution in apps/web/app/api/admin/settings/infrastructure/route.ts (env vars → database)
- [x] T619 Ensure API response never exposes secrets (client secrets, API keys) in apps/web/app/api/admin/settings/infrastructure/route.ts
- [x] T620 Add source field to API response indicating configuration source (database/environment/default) in apps/web/app/api/admin/settings/infrastructure/route.ts
- [x] T621 Create PUT /api/admin/settings/infrastructure route in apps/web/app/api/admin/settings/infrastructure/route.ts with admin-only authentication check
- [x] T622 Implement configuration validation on save in apps/web/app/api/admin/settings/infrastructure/route.ts using Zod schemas
- [x] T623 Implement credential encryption before database storage in apps/web/app/api/admin/settings/infrastructure/route.ts
- [x] T624 Implement configuration update with upsert pattern in apps/web/app/api/admin/settings/infrastructure/route.ts
- [x] T625 Add updatedBy audit trail tracking in apps/web/app/api/admin/settings/infrastructure/route.ts
- [x] T626 Implement error handling for validation errors, permission denied, encryption failures in apps/web/app/api/admin/settings/infrastructure/route.ts

**Acceptance Criteria**:

- API routes enforce admin-only access
- Configuration retrieval respects precedence (env vars override UI)
- Secrets never exposed in API responses
- Validation catches errors before saving
- Encryption works correctly
- Audit trail tracks who updated config
- Error responses are user-friendly

### API Routes - Audit and Testing

- [x] T627 Create GET /api/admin/settings/infrastructure/audit route in apps/web/app/api/admin/settings/infrastructure/audit/route.ts with admin-only authentication check
- [x] T628 Implement audit log retrieval with pagination (limit, offset) in apps/web/app/api/admin/settings/infrastructure/audit/route.ts
- [x] T629 Create POST /api/admin/settings/infrastructure/test route in apps/web/app/api/admin/settings/infrastructure/test/route.ts with admin-only authentication check
- [x] T630 Implement test connection logic for GitHub OAuth in apps/web/app/api/admin/settings/infrastructure/test/route.ts
- [x] T631 Implement test connection logic for GitLab OAuth in apps/web/app/api/admin/settings/infrastructure/test/route.ts
- [x] T632 Implement test connection logic for AI Gateway in apps/web/app/api/admin/settings/infrastructure/test/route.ts
- [x] T633 Implement test connection logic for Ollama endpoint in apps/web/app/api/admin/settings/infrastructure/test/route.ts
- [x] T634 Add timeout handling for test connections in apps/web/app/api/admin/settings/infrastructure/test/route.ts

**Acceptance Criteria**:

- Audit log returns configuration change history
- Test connections validate credentials/endpoints
- Test connections provide clear success/error messages
- Timeouts prevent hanging requests
- All endpoints enforce admin-only access

### Settings UI - Infrastructure Page

- [x] T635 Create infrastructure settings page route in apps/web/app/settings/infrastructure/page.tsx with admin-only access check
- [x] T636 Add infrastructure tab to SettingsNavigation component in apps/web/app/components/features/settings/SettingsNavigation.tsx with admin-only visibility
- [x] T637 Create AdminInfrastructureSettings component in apps/web/src/components/features/settings/AdminInfrastructureSettings.tsx as main settings page
- [x] T638 Implement configuration fetch using TanStack Query in apps/web/src/components/features/settings/AdminInfrastructureSettings.tsx
- [x] T639 Implement read-only state display when env vars override in apps/web/src/components/features/settings/AdminInfrastructureSettings.tsx with explanatory message
- [x] T640 Ensure secrets are never displayed in UI (even read-only) in apps/web/src/components/features/settings/AdminInfrastructureSettings.tsx

**Acceptance Criteria**:

- Infrastructure settings page accessible at `/settings/infrastructure`
- Admin-only access enforced (non-admins see read-only or redirected)
- Configuration loaded from API correctly
- Read-only state clearly indicates env var override
- Secrets never visible in UI

### Settings UI - Git OAuth Configuration Form

- [x] T641 Create GitInfrastructureConfigForm component in apps/web/src/components/features/settings/GitInfrastructureConfigForm.tsx
- [x] T642 Implement GitHub OAuth configuration form in apps/web/src/components/features/settings/GitInfrastructureConfigForm.tsx with client ID and client secret fields (password-type for secret)
- [x] T643 Implement GitLab OAuth configuration form in apps/web/src/components/features/settings/GitInfrastructureConfigForm.tsx with client ID, client secret, and base URL fields
- [x] T644 Add form validation using React Hook Form and Zod schemas in apps/web/src/components/features/settings/GitInfrastructureConfigForm.tsx
- [x] T645 Implement read-only state when env vars override in apps/web/src/components/features/settings/GitInfrastructureConfigForm.tsx with "Configured via environment variables" message
- [x] T646 Add test connection button for GitHub OAuth in apps/web/src/components/features/settings/GitInfrastructureConfigForm.tsx
- [x] T647 Add test connection button for GitLab OAuth in apps/web/src/components/features/settings/GitInfrastructureConfigForm.tsx
- [x] T648 Implement form submission with error handling in apps/web/src/components/features/settings/GitInfrastructureConfigForm.tsx

**Acceptance Criteria**:

- Git OAuth form validates input correctly
- Password-type fields mask secrets
- Read-only state prevents editing when env vars override
- Test connection buttons work correctly
- Form submission shows success/error messages
- Secrets never displayed after save

### Settings UI - AI Gateway Configuration Form

- [x] T649 Create AIInfrastructureConfigForm component in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T650 Implement AI Gateway URL field in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T651 Implement Ollama endpoint URL field in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T652 Implement OpenAI API key field (password-type) in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T653 Implement Anthropic API key field (password-type) in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T654 Implement Google AI API key field (password-type) in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T655 Add form validation using React Hook Form and Zod schemas in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T656 Implement read-only state when env vars override in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T657 Add test connection button for AI Gateway in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T658 Add test connection button for Ollama endpoint in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx
- [x] T659 Implement form submission with error handling in apps/web/src/components/features/settings/AIInfrastructureConfigForm.tsx

**Acceptance Criteria**:

- AI Gateway form validates input correctly
- Password-type fields mask API keys
- Read-only state prevents editing when env vars override
- Test connection buttons work correctly
- Form submission shows success/error messages
- API keys never displayed after save

### Settings UI - Status View for Non-Admins

- [x] T660 Create InfrastructureStatusView component in apps/web/src/components/features/settings/InfrastructureStatusView.tsx for non-admin read-only view
- [x] T661 Display configuration status (configured/not configured) in apps/web/src/components/features/settings/InfrastructureStatusView.tsx without exposing secrets
- [x] T662 Display service URLs (AI Gateway URL, Ollama endpoint) in apps/web/src/components/features/settings/InfrastructureStatusView.tsx (URLs not sensitive)
- [x] T663 Ensure InfrastructureStatusView never displays secrets in apps/web/src/components/features/settings/InfrastructureStatusView.tsx
- [x] T664 Update infrastructure settings page to show InfrastructureStatusView for non-admin users in apps/web/app/settings/infrastructure/page.tsx

**Acceptance Criteria**:

- Non-admin users see read-only status view
- Status view shows configuration state without secrets
- URLs displayed (not sensitive credentials)
- Client IDs can be shown (not sensitive, used for OAuth flow)
- Secrets never visible to non-admins

### Integration - Update OAuth Flow to Use Global Config

- [x] T665 Update GitHub OAuth flow to read from global infrastructure config in apps/web/app/api/projects/[projectId]/repositories/route.ts
- [x] T666 Update GitLab OAuth flow to read from global infrastructure config in apps/web/app/api/projects/[projectId]/repositories/route.ts
- [x] T667 Update OAuth callback handler to read from global infrastructure config in apps/web/app/api/projects/[projectId]/repositories/callback/route.ts
- [x] T668 Ensure OAuth flow falls back to env vars if global config not available in apps/web/app/api/projects/[projectId]/repositories/route.ts

**Acceptance Criteria**:

- OAuth flows use global infrastructure config when available
- Falls back to env vars if config not in database
- Per-project repository connections continue to work
- OAuth flow respects precedence (env vars → global config)

### Integration - Update AI Gateway Usage (Phase 9 Compatibility)

- [x] T669 Create helper function to get AI Gateway URL with precedence in apps/web/src/lib/ai/gateway-url.ts (env var → global config → default)
- [x] T670 Update AI Gateway client to use global config helper in apps/web/src/lib/ai/triage.ts (if Phase 9 AI triage exists)
- [x] T671 Ensure Phase 9 per-project AI config can override global defaults in apps/web/src/lib/ai/triage.ts (maintain Phase 9 functionality)

**Acceptance Criteria**:

- AI Gateway URL respects precedence (env var → global config → default)
- Phase 9 per-project config can override global defaults
- No interference with Phase 9 functionality
- Backward compatible (works with env vars only)

### Documentation

- [x] T672 Create infrastructure configuration documentation in docs/deployment/infrastructure-configuration.md with environment variable and UI setup instructions
- [x] T673 Update docs/integrations/index.md to add infrastructure configuration section distinguishing infrastructure vs project-level configuration
- [x] T674 Update docs/integrations/git-oauth.md to add global infrastructure configuration section explaining OAuth App credentials vs per-project access tokens
- [x] T675 Update docs/integrations/ai-providers.md to add global infrastructure configuration section explaining AI Gateway URL and default provider credentials
- [x] T676 Add configuration precedence explanation to docs/deployment/infrastructure-configuration.md (env vars override UI, per-provider precedence)
- [x] T677 Add troubleshooting section for infrastructure configuration in docs/deployment/infrastructure-configuration.md covering env vars not loading, UI overridden by env vars, OAuth flow failures, AI Gateway connection failures
- [x] T678 Update onboarding documentation to include infrastructure setup as first step in docs/user/README.md or onboarding guide

**Acceptance Criteria**:

- Infrastructure configuration fully documented
- Clear distinction between infrastructure and project-level configuration
- Troubleshooting covers common scenarios
- Onboarding flow includes infrastructure setup
- Documentation links work correctly

### Testing

- [x] T679 [P] Create unit tests for configuration precedence resolver in apps/web/src/lib/config/__tests__/infrastructure-precedence.test.ts
- [x] T680 [P] Create unit tests for validation schemas in apps/web/src/lib/config/schemas/__tests__/infrastructure-schema.test.ts
- [x] T681 [P] Create unit tests for encryption utility in apps/web/src/lib/config/__tests__/encrypt-infrastructure.test.ts
- [x] T682 Create integration tests for API routes (GET, PUT) in apps/web/src/tests/api/admin-settings-infrastructure.test.ts
- [x] T683 Create integration tests for admin-only access enforcement in apps/web/src/tests/api/admin-settings-infrastructure.test.ts
- [x] T684 Create integration tests for configuration precedence (env vars override UI) in apps/web/src/tests/api/admin-settings-infrastructure.test.ts
- [x] T685 Create E2E test for admin infrastructure settings access in apps/web/e2e/features/infrastructure-settings.spec.ts
- [x] T686 Create E2E test for non-admin infrastructure status view in apps/web/e2e/features/infrastructure-settings.spec.ts
- [x] T687 Create E2E test for configuration update via UI in apps/web/e2e/features/infrastructure-settings.spec.ts
- [x] T688 Create E2E test for environment variable precedence in apps/web/e2e/features/infrastructure-settings.spec.ts

**Acceptance Criteria**:

- Unit tests cover configuration service functions
- Integration tests cover API routes and permissions
- E2E tests cover user workflows
- Tests verify secrets never exposed
- Tests verify precedence rules

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 7.6**: Settings structure must exist (settings pages and navigation)
- **Phase 9**: Per-project AI provider configuration should be stable (but not required - this phase provides global defaults)
- **Encryption Service**: Must be available (`apps/web/src/lib/integrations/storage.ts`)

### Task Dependencies Within Phase

**Database Schema** (T600-T605):
- T600-T604: Must be sequential (migration → schema → generate → repository)
- T605: Can be done in parallel with T606-T611 (repository independent of service layer)

**Configuration Service** (T606-T611):
- T606-T611: Can be done in parallel (different concerns)

**Validation Schemas** (T612-T616):
- T612-T616: Can be done in parallel (different schemas)

**API Routes** (T617-T634):
- T617-T626: Core CRUD (GET, PUT) should be done first
- T627-T634: Audit and testing can be done in parallel with UI (T635+)

**Settings UI** (T635-T664):
- T635-T640: Infrastructure page structure
- T641-T648: Git OAuth form (can be parallel with T649-T659)
- T649-T659: AI Gateway form (can be parallel with T641-T648)
- T660-T664: Status view (can be done in parallel with forms)

**Integration** (T665-T671):
- T665-T668: OAuth integration (should be done after API routes complete)
- T669-T671: AI Gateway integration (should be done after API routes, optional if Phase 9 not complete)

**Documentation** (T672-T678):
- T672-T678: Can be done in parallel with implementation

**Testing** (T679-T688):
- T679-T683: Unit and integration tests (can be done in parallel with UI)
- T684-T688: E2E tests (should be done after UI complete)

### Parallel Execution Opportunities

**Within Database Schema**:
- T605 (repository) can be parallel with T606-T611 (service layer)

**Within Configuration Service**:
- T606-T611 can run in parallel (different utilities)

**Within Validation Schemas**:
- T612-T616 can run in parallel (different schemas)

**Within API Routes**:
- T617-T626 (core CRUD) should be sequential
- T627-T634 (audit, testing) can run in parallel with UI

**Within Settings UI**:
- T641-T648 (Git form) and T649-T659 (AI form) can run in parallel
- T660-T664 (status view) can run in parallel with forms

**Documentation and Testing**:
- T672-T678 (documentation) can run in parallel with implementation
- T679-T683 (unit/integration tests) can run in parallel with UI
- T684-T688 (E2E tests) should wait for UI complete

---

## Task Summary

**Total Tasks**: 89  
**Phase 11**: 89 tasks (T600-T688)  

**Breakdown by Area**:
- **Database Schema**: 6 tasks (T600-T605)
- **Configuration Service**: 6 tasks (T606-T611)
- **Validation Schemas**: 5 tasks (T612-T616)
- **API Routes**: 18 tasks (T617-T634)
- **Settings UI**: 30 tasks (T635-T664)
- **Integration**: 7 tasks (T665-T671)
- **Documentation**: 7 tasks (T672-T678)
- **Testing**: 10 tasks (T679-T688)

**Parallel Opportunities**: ~40 tasks marked with [P]

**Estimated Timeline**:
- **Database & Service Layer**: 1-2 days
- **API Routes**: 2-3 days
- **Settings UI**: 3-4 days
- **Integration**: 1 day
- **Documentation**: 1 day
- **Testing**: 2 days
- **Total**: ~2-3 weeks

---

## Format Validation

✅ All tasks follow the strict checklist format:

- Checkbox: `- [ ]`
- Task ID: `T600`, `T601`, etc. (starting after Phase 9)
- Parallel marker: `[P]` where applicable
- Description with file path: Every task includes exact file path

✅ Tasks are organized to ensure no interference with Phase 9 or Phase 10:

- Database schema: New table (no conflicts)
- API routes: Separate namespace (no conflicts)
- UI routes: Extends existing pattern (no conflicts)
- Configuration: Provides defaults, Phase 9 can override independently

✅ Each area includes acceptance criteria

✅ Dependencies are clearly identified

✅ Parallel execution opportunities are marked

---

## Non-Interference Verification

### Phase 9 (AI Triage) Compatibility

✅ **Database Schema**: 
- Phase 9: `AIProviderConfiguration` table (per-project)
- Phase 11: `GlobalInfrastructureConfig` table (global, singleton)
- **No conflict**: Separate tables, different purposes

✅ **API Routes**:
- Phase 9: `/api/projects/[projectId]/ai-providers/*` (project-level)
- Phase 11: `/api/admin/settings/infrastructure/*` (global, admin-only)
- **No conflict**: Different namespaces

✅ **UI Routes**:
- Phase 9: `/projects/[projectId]/settings/integrations` (project settings)
- Phase 11: `/settings/infrastructure` (global admin settings)
- **No conflict**: Different routes

✅ **Configuration Relationship**:
- Phase 11 provides global defaults (`AI_GATEWAY_URL`, default provider credentials)
- Phase 9 provides per-project overrides (project-specific API keys, models)
- **No conflict**: Global provides defaults, per-project overrides, precedence: env vars → per-project → global

✅ **Functionality**:
- Phase 9 can work without Phase 11 (reads from env vars directly)
- Phase 11 enhances Phase 9 (provides UI-based global defaults)
- **No conflict**: Phase 11 is enhancement, not requirement

### Phase 10 (Polish) Compatibility

✅ **No Conflicts**:
- Phase 10 focuses on polish, testing, documentation
- Phase 11 adds new feature (global infrastructure config)
- **No conflict**: New feature, doesn't modify Phase 10 work

✅ **Independence**:
- Phase 11 can be implemented after Phase 10
- Phase 11 doesn't modify existing Phase 10 deliverables
- **No conflict**: Sequential implementation, no overlap

---

## Notes

- **Task ID Range**: T600-T688 (89 tasks, starting after Phase 9 ends at T577)
- **Phase Number**: Phase 11 (after Phase 10)
- **Dependencies**: Phase 7.6 (settings structure), Phase 9 stable (optional, provides defaults)
- **Independence**: Can be implemented independently - Phase 9 works without it
- **Backward Compatibility**: Existing env var configuration continues to work
- **Security**: Secrets never exposed in API responses or UI (critical requirement)

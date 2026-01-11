# Research: Global Infrastructure Configuration

**Feature**: Global infrastructure configuration for Git and AI providers  
**Created**: 2026-01-23  
**Status**: Research Complete

## Overview

Research findings for implementing global infrastructure configuration that supports both environment variable and UI-based configuration for Git OAuth credentials and AI Gateway infrastructure settings.

## Clarification 1: Encryption Utilities

**Question**: What encryption utilities/libraries are currently used for `RepositoryConnection.accessToken` and AI provider credentials?

**Finding**: Encryption utilities exist in `apps/web/src/lib/integrations/storage.ts`:
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with SHA-512, 100,000 iterations
- **Key Source**: `ENCRYPTION_SECRET` environment variable, falls back to `JWT_SECRET`, with production warning if default used
- **Functions**: `encrypt(text: string)`, `decrypt(encryptedText: string)`, `hash(text: string)`
- **Format**: Base64-encoded combined format: `salt + iv + authTag + encryptedData`

**Decision**: Reuse existing encryption utilities from `apps/web/src/lib/integrations/storage.ts` for global infrastructure configuration credentials.

**Rationale**: 
- Consistent encryption approach across application
- Already tested and in production use
- Uses industry-standard AES-256-GCM
- Proper key derivation with PBKDF2

**Implementation**: Import `encrypt` and `decrypt` functions from `apps/web/src/lib/integrations/storage.ts` for storing/retrieving global infrastructure credentials in database.

**Alternative Considered**: Creating separate encryption service
- **Rejected Because**: Unnecessary duplication, existing utilities are sufficient and proven

---

## Clarification 2: Admin Settings Structure

**Question**: Are there existing admin-only settings pages or patterns for system-wide configuration?

**Finding**: Admin settings pattern exists in `/settings/[section]`:
- **Location**: `apps/web/app/settings/[section]/page.tsx`
- **Admin Check Pattern**: 
  ```typescript
  const userData = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!userData || userData.role !== UserRole.Admin) {
    redirect('/settings/account');
  }
  ```
- **Navigation**: `SettingsNavigation` component in `apps/web/app/components/features/settings/SettingsNavigation.tsx` supports admin-only tabs:
  ```typescript
  ...(userRole === 'Admin' ? [{ id: 'users', label: 'Users', href: '/settings/users', adminOnly: true }] : [])
  ```
- **Existing Admin Sections**: `/settings/users` for user management

**Decision**: Extend existing `/settings/[section]` pattern with `/settings/infrastructure` section.

**Rationale**:
- Consistent with existing settings structure
- Reuses authentication and layout patterns
- Maintains UX consistency
- Easy to add to existing navigation component

**Implementation**: 
- Add `infrastructure` section handler in `/settings/[section]/page.tsx`
- Add admin-only tab in `SettingsNavigation` component
- Follow same admin check pattern as `/settings/users`

**Alternative Considered**: Separate `/admin/infrastructure` route
- **Rejected Because**: Inconsistent with existing settings pattern, requires separate layout

---

## Clarification 3: Git OAuth Configuration Relationship

**Question**: How should global Git OAuth configuration relate to per-project repository connections?

**Finding**: Current OAuth flow implementation:
- Global OAuth credentials (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`) are read from environment variables
- OAuth flow initiation (`/api/projects/[projectId]/repositories?action=oauth`) uses global credentials to generate OAuth authorization URL
- After OAuth callback, per-project access tokens are obtained and stored in `RepositoryConnection.accessToken` (encrypted)
- Each project stores its own access token for repository-specific operations

**Decision**: Global Git OAuth configuration provides infrastructure-level OAuth App credentials used to initiate OAuth flows for all projects. Per-project repository connections store project-specific access tokens obtained through OAuth flow.

**Rationale**:
- OAuth App credentials are infrastructure-level (one OAuth App per Git service for entire Stride instance)
- Per-project access tokens allow project-specific repository access
- Separation of concerns: global config (OAuth App) vs per-project config (access tokens)
- Maintains existing pattern while adding UI-based global configuration option

**Relationship**:
- **Global Config**: OAuth App Client ID/Secret (infrastructure)
- **Per-Project Config**: Access Token (obtained via OAuth flow using global credentials)
- **Flow**: Use global OAuth App credentials → Initiate OAuth → Get per-project access token → Store in `RepositoryConnection`

**Implementation**: 
- Global config provides default OAuth credentials (from env vars or UI)
- Per-project OAuth flow uses global credentials (reads from env vars first, then database if not in env vars)
- Per-project repository connections continue to store project-specific access tokens

**Alternative Considered**: Per-project OAuth App credentials
- **Rejected Because**: Most organizations use one OAuth App per service for all projects, per-project OAuth Apps would be unusual and complex

---

## Clarification 4: AI Gateway Configuration Relationship

**Question**: Should global AI Gateway configuration be used as defaults for per-project AI provider configuration (Phase 9), or are they completely independent?

**Finding**: Current Phase 9 AI provider configuration (per-project):
- Stored in database per-project (via `AIProviderConfiguration` entity in Phase 9 plan)
- Includes provider type, API keys, endpoints, models, default model selection
- Admin-only configuration via Project Settings → Integrations UI

Current infrastructure-level AI Gateway config:
- `AI_GATEWAY_URL` - AI Gateway service endpoint (infrastructure)
- `LLM_ENDPOINT`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` - Provider credentials (infrastructure)

**Decision**: Global AI Gateway configuration provides infrastructure-level service endpoint and default provider settings. Per-project AI provider configuration (Phase 9) can override global defaults but uses global `AI_GATEWAY_URL` as service endpoint.

**Rationale**:
- `AI_GATEWAY_URL` is infrastructure-level (one AI Gateway service for entire Stride instance)
- Provider credentials can be infrastructure-level (defaults) or project-level (overrides)
- Allows flexibility: use global defaults for all projects OR configure per-project providers
- Maintains Phase 9 per-project configuration pattern while adding global defaults

**Relationship**:
- **Global Config**: `AI_GATEWAY_URL` (service endpoint), default provider credentials (optional)
- **Per-Project Config** (Phase 9): Provider type, API keys, endpoints, models (can override global defaults)
- **Flow**: Read global `AI_GATEWAY_URL` → Check per-project provider config → Use per-project credentials if configured, otherwise use global defaults

**Implementation**:
- Global config stores `AI_GATEWAY_URL` and optional default provider credentials
- Per-project AI triage reads global `AI_GATEWAY_URL` (from env var or database)
- Per-project provider configuration (Phase 9) provides project-specific overrides
- Configuration precedence: Per-project config → Global config → Environment variables (env vars override both)

**Alternative Considered**: Completely independent global and per-project configs
- **Rejected Because**: Less flexible, requires duplicating `AI_GATEWAY_URL` per project, not infrastructure-as-code friendly

---

## Clarification 5: Validation Rules

**Question**: What validation rules apply to global infrastructure configuration?

**Finding**: Existing validation patterns:
- **Zod schemas**: Used for runtime validation (`z.string()`, `z.url()`, `z.enum()`, etc.)
- **Repository URL validation**: URL format validation in repository connection schemas
- **OAuth callback URL**: Must match configured OAuth App callback URL

**Decision**: Comprehensive validation schema using Zod for all global infrastructure configuration fields.

**Validation Rules**:

**Git OAuth Configuration**:
- `clientId`: String, required, non-empty, matches provider format (GitHub: alphanumeric, GitLab: numeric or UUID format)
- `clientSecret`: String, required, non-empty (encrypted in storage)
- `baseUrl` (GitLab only): String, optional, must be valid URL if provided
- `callbackUrl`: String, auto-generated based on `NEXT_PUBLIC_APP_URL`, validated to ensure matches OAuth App configuration

**AI Gateway Configuration**:
- `aiGatewayUrl`: String, required if AI features enabled, must be valid HTTP/HTTPS URL
- `llmEndpoint` (Ollama): String, optional, must be valid URL if provided
- `openaiApiKey`: String, optional, must match OpenAI key format (`sk-` prefix) if provided (encrypted in storage)
- `anthropicApiKey`: String, optional, must match Anthropic key format (`sk-ant-` prefix) if provided (encrypted in storage)
- `googleAiApiKey`: String, optional, must match Google AI key format (`AIza` prefix) if provided (encrypted in storage)

**Implementation**: Create Zod schemas in `apps/web/src/lib/config/global-infrastructure-schema.ts`:
```typescript
const gitOAuthConfigSchema = z.object({
  github: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
  }).optional(),
  gitlab: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    baseUrl: z.string().url().optional(),
  }).optional(),
});

const aiGatewayConfigSchema = z.object({
  aiGatewayUrl: z.string().url(),
  llmEndpoint: z.string().url().optional(),
  openaiApiKey: z.string().regex(/^sk-/).optional(),
  anthropicApiKey: z.string().regex(/^sk-ant-/).optional(),
  googleAiApiKey: z.string().regex(/^AIza/).optional(),
});
```

**Alternative Considered**: Minimal validation (only required fields)
- **Rejected Because**: Too permissive, allows invalid configurations that fail at runtime

---

## Clarification 6: Audit Logging

**Question**: Should configuration changes require admin confirmation or audit logging? What level of audit trail is needed?

**Finding**: Existing audit patterns:
- **Database timestamps**: `createdAt`, `updatedAt` fields on models
- **User tracking**: Some models track `updatedBy` (e.g., configuration changes could track admin user)
- **No dedicated audit log table**: No separate audit log entity found

**Decision**: Implement lightweight audit logging for global infrastructure configuration changes.

**Audit Requirements**:
- **Who**: Track `updatedBy` (admin user ID who made change)
- **When**: `updatedAt` timestamp (existing)
- **What**: Track which configuration sections changed (Git OAuth, AI Gateway, or both)
- **Storage**: Store in `GlobalInfrastructureConfig` entity with `updatedBy` field and optional JSONB `changeHistory` for detailed audit trail

**Implementation**:
- Add `updatedBy` (userId, foreign key to User) to `GlobalInfrastructureConfig` model
- Optionally add `changeHistory` JSONB field for detailed change log (if full audit trail needed)
- Simple approach: `updatedBy` + `updatedAt` sufficient for basic audit trail
- Full audit trail (if needed later): Separate `ConfigAuditLog` table with fields: `id`, `configId`, `changedBy`, `changedAt`, `section` (Git/AI), `changes` (JSONB), `previousValue` (JSONB), `newValue` (JSONB)

**Initial Implementation**: Start with `updatedBy` + `updatedAt` (minimal, follows existing patterns)

**Future Enhancement**: Add full audit log table if detailed change history required

**Rationale**:
- Minimal implementation follows existing patterns
- Can be enhanced later if audit requirements grow
- `updatedBy` + `updatedAt` sufficient for basic "who changed what and when" tracking

**Alternative Considered**: Full audit log table from start
- **Rejected Because**: YAGNI - start simple, add complexity only if needed

---

## Clarification 7: Documentation Distinction

**Question**: How should documentation distinguish between infrastructure-level (global) and project-level configuration?

**Decision**: Clear separation in documentation with distinct sections and explicit labeling.

**Documentation Structure**:

1. **Infrastructure Configuration** (Global):
   - Location: `/docs/deployment/infrastructure-configuration.md` (new file)
   - Content: Environment variables OR Admin Settings UI
   - Labeling: "Infrastructure-Level" or "Global" configuration
   - Use cases: Initial setup, system-wide defaults

2. **Project Configuration** (Per-Project):
   - Location: Existing project settings documentation
   - Content: Project Settings → Integrations UI
   - Labeling: "Project-Level" or "Per-Project" configuration
   - Use cases: Project-specific overrides

3. **Onboarding Flow**:
   - Step 1: Configure global infrastructure (env vars or UI)
   - Step 2: Create project
   - Step 3: Configure project-specific settings (optional, uses global defaults if not configured)

**Visual Indicators**:
- Infrastructure config: System-wide settings icon, "Global" badge
- Project config: Project-specific settings icon, "Per-Project" badge

**Documentation Sections**:
```markdown
## Infrastructure Configuration (Global)

Configure system-wide defaults for Git OAuth and AI Gateway...

### Option 1: Environment Variables (Infrastructure-as-Code)
[Environment variable setup instructions]

### Option 2: Admin Settings UI (Dynamic Configuration)
[UI-based configuration instructions]

## Project Configuration (Per-Project)

Configure project-specific settings that override global defaults...

### Git Repository Connections
[Per-project repository connection instructions - existing]

### AI Provider Configuration
[Per-project AI provider configuration instructions - Phase 9]
```

**Onboarding Documentation Updates**:
- Update `docs/deployment/docker.md` to include infrastructure configuration section
- Update `docs/integrations/index.md` to distinguish infrastructure vs project-level
- Create `docs/integrations/infrastructure-configuration.md` (new file) with comprehensive guide

**Implementation**: 
- Create new documentation file: `docs/deployment/infrastructure-configuration.md`
- Update existing integration docs to clearly label infrastructure vs project-level sections
- Update onboarding flow documentation to include infrastructure setup as first step

**Alternative Considered**: Single combined documentation file
- **Rejected Because**: Too confusing, doesn't clearly separate concerns, makes onboarding harder

---

## Configuration Precedence

**Decision**: Environment variables override UI-based configuration (infrastructure-as-code principle).

**Precedence Order** (highest to lowest):
1. **Environment Variables** (infrastructure-as-code, immutable, requires deployment)
2. **Database (UI-based)** (dynamic, can be changed without deployment)
3. **Default Values** (hardcoded fallbacks)

**Rationale**:
- Infrastructure-as-code: Environment variables are version-controlled (via deployment configs) and immutable
- Deployment consistency: Environment variables ensure consistent configuration across environments
- Dynamic overrides: UI-based config allows runtime changes for testing/troubleshooting
- Clear precedence: Simple rule - env vars always win

**Implementation**:
- Configuration service reads from environment variables first
- If env var not set, read from database
- If neither exists, use hardcoded defaults (if any)
- UI should indicate when env vars override UI settings (show readonly state with "Set via environment variable" message)

**Alternative Considered**: UI overrides environment variables
- **Rejected Because**: Violates infrastructure-as-code principle, makes deployments inconsistent, harder to troubleshoot

---

## Database Schema Design

**Decision**: Single `GlobalInfrastructureConfig` table with JSONB fields for extensibility.

**Schema**:
```prisma
model GlobalInfrastructureConfig {
  id        String   @id @default(uuid())
  gitConfig Json     @default("{}") // { github: { clientId, clientSecret }, gitlab: { clientId, clientSecret, baseUrl } }
  aiConfig  Json     @default("{}") // { aiGatewayUrl, llmEndpoint, openaiApiKey, anthropicApiKey, googleAiApiKey }
  updatedBy String?  // userId (foreign key to User)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  updatedByUser User? @relation("ConfigUpdater", fields: [updatedBy], references: [id], onDelete: SetNull)

  @@unique([id]) // Only one global config record
  @@map("global_infrastructure_config")
}
```

**Fields**:
- `id`: UUID (always single record, can use fixed UUID or check for existence on upsert)
- `gitConfig`: JSONB object with GitHub/GitLab OAuth configuration
- `aiConfig`: JSONB object with AI Gateway configuration
- `updatedBy`: Optional user ID for audit trail
- `updatedAt`: Automatic timestamp for change tracking

**Storage Strategy**:
- **Sensitive fields** (client secrets, API keys): Encrypted using existing `encrypt()` function before storing in JSONB
- **Non-sensitive fields** (URLs, endpoints): Stored as plain text in JSONB
- **Encryption format**: Encrypted values stored in JSONB as `"encrypted:base64string"` for identification, or separate encryption flag field

**Alternative Considered**: Separate tables for Git and AI config
- **Rejected Because**: More complex, requires joins, JSONB is sufficient for extensibility

**Alternative Considered**: Flat table with individual columns
- **Rejected Because**: Less flexible, harder to extend, requires schema migrations for new fields

---

## Summary

All clarifications resolved. Key decisions:
1. **Encryption**: Reuse existing AES-256-GCM utilities from `apps/web/src/lib/integrations/storage.ts`
2. **Settings Structure**: Extend existing `/settings/[section]` pattern with `/settings/infrastructure`
3. **Git OAuth Relationship**: Global config provides OAuth App credentials, per-project stores access tokens
4. **AI Gateway Relationship**: Global config provides service endpoint and defaults, per-project can override
5. **Validation**: Comprehensive Zod schemas for all configuration fields
6. **Audit Logging**: Lightweight approach with `updatedBy` + `updatedAt`, can enhance later
7. **Documentation**: Clear separation between infrastructure-level and project-level configuration

Ready for Phase 1: Design & Contracts.

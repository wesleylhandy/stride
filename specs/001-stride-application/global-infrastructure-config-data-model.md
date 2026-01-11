# Data Model: Global Infrastructure Configuration

**Feature**: Global infrastructure configuration for Git and AI providers  
**Created**: 2026-01-23

## Overview

Database schema for storing global infrastructure configuration that supports both environment variable and UI-based configuration for Git OAuth credentials and AI Gateway infrastructure settings.

## New Models

### GlobalInfrastructureConfig

**Purpose**: System-wide infrastructure configuration for Git OAuth and AI Gateway services.

**Schema**:
```prisma
model GlobalInfrastructureConfig {
  id        String   @id @default(uuid())
  gitConfig Json     @default("{}") // { github: { clientId, clientSecret }, gitlab: { clientId, clientSecret, baseUrl } }
  aiConfig  Json     @default("{}") // { aiGatewayUrl, llmEndpoint, openaiApiKey, anthropicApiKey, googleAiApiKey }
  updatedBy String?  // userId (foreign key to User, nullable for initial setup)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  updatedByUser User? @relation("ConfigUpdater", fields: [updatedBy], references: [id], onDelete: SetNull)

  @@unique([id]) // Only one global config record (enforced by application logic)
  @@map("global_infrastructure_config")
}
```

**Fields**:
- `id`: UUID (primary key). Application enforces single record (singleton pattern).
- `gitConfig`: JSONB object containing Git OAuth configuration:
  - `github`: Optional object with `clientId` (string, encrypted), `clientSecret` (string, encrypted)
  - `gitlab`: Optional object with `clientId` (string, encrypted), `clientSecret` (string, encrypted), `baseUrl` (string, optional, plain text)
- `aiConfig`: JSONB object containing AI Gateway configuration:
  - `aiGatewayUrl`: String (required if AI enabled, plain text URL)
  - `llmEndpoint`: String (optional, plain text URL for Ollama)
  - `openaiApiKey`: String (optional, encrypted)
  - `anthropicApiKey`: String (optional, encrypted)
  - `googleAiApiKey`: String (optional, encrypted)
- `updatedBy`: Optional user ID (foreign key to User) for audit trail. Nullable for initial setup via environment variables.
- `createdAt`: Creation timestamp (auto-set)
- `updatedAt`: Last update timestamp (auto-updated)

**Relationships**:
- Many-to-One (optional): `GlobalInfrastructureConfig.updatedBy` → `User.id`
  - Cascade: `onDelete: SetNull` (if admin user deleted, keep config but clear updatedBy)

**Indexes**:
- `id`: Primary key (automatic)
- `updatedAt`: For querying recent changes (if audit log needed)
- `updatedBy`: For querying changes by user (if audit log needed)

**Validation Rules**:
- **Singleton Pattern**: Application enforces only one record exists (check existence on create, use upsert pattern)
- **gitConfig Structure**:
  - `github.clientId`: String, required if github configured, non-empty
  - `github.clientSecret`: String, required if github configured, encrypted before storage
  - `gitlab.clientId`: String, required if gitlab configured, non-empty
  - `gitlab.clientSecret`: String, required if gitlab configured, encrypted before storage
  - `gitlab.baseUrl`: String, optional, must be valid URL if provided
- **aiConfig Structure**:
  - `aiGatewayUrl`: String, required if AI enabled, must be valid HTTP/HTTPS URL
  - `llmEndpoint`: String, optional, must be valid URL if provided
  - `openaiApiKey`: String, optional, must match format `sk-*` if provided, encrypted before storage
  - `anthropicApiKey`: String, optional, must match format `sk-ant-*` if provided, encrypted before storage
  - `googleAiApiKey`: String, optional, must match format `AIza*` if provided, encrypted before storage

**Encryption Rules**:
- **Encrypted Fields**: `github.clientSecret`, `gitlab.clientSecret`, `openaiApiKey`, `anthropicApiKey`, `googleAiApiKey`
- **Encryption Method**: Use existing `encrypt()` function from `apps/web/src/lib/integrations/storage.ts` (AES-256-GCM)
- **Storage Format**: Encrypted values stored as base64-encoded strings in JSONB
- **Plain Text Fields**: `gitlab.baseUrl`, `aiGatewayUrl`, `llmEndpoint` (URLs are not sensitive credentials)

**Singleton Pattern Implementation**:
```typescript
// Application enforces single record
async function getOrCreateGlobalConfig() {
  let config = await prisma.globalInfrastructureConfig.findFirst();
  if (!config) {
    config = await prisma.globalInfrastructureConfig.create({
      data: {
        gitConfig: {},
        aiConfig: {},
      },
    });
  }
  return config;
}
```

## Data Access Patterns

### Get Global Configuration
```typescript
// Get global config (singleton)
const config = await prisma.globalInfrastructureConfig.findFirst({
  include: { updatedByUser: { select: { id: true, name: true, email: true } } },
});
```

### Update Global Configuration (Upsert Pattern)
```typescript
// Update global config (singleton - always updates existing or creates if not exists)
const config = await prisma.globalInfrastructureConfig.upsert({
  where: { id: existingConfigId || 'default-id' }, // Use fixed ID or check existence first
  update: {
    gitConfig: encryptedGitConfig,
    aiConfig: encryptedAiConfig,
    updatedBy: userId,
    updatedAt: new Date(),
  },
  create: {
    gitConfig: encryptedGitConfig,
    aiConfig: encryptedAiConfig,
    updatedBy: userId,
  },
});
```

### Configuration Precedence Resolution
```typescript
// Read config with precedence: env vars > database > defaults
async function getGitOAuthConfig(provider: 'github' | 'gitlab') {
  // 1. Check environment variables first (highest precedence)
  const envClientId = provider === 'github' 
    ? process.env.GITHUB_CLIENT_ID 
    : process.env.GITLAB_CLIENT_ID;
  const envClientSecret = provider === 'github'
    ? process.env.GITHUB_CLIENT_SECRET
    : process.env.GITLAB_CLIENT_SECRET;

  if (envClientId && envClientSecret) {
    return { clientId: envClientId, clientSecret: envClientSecret };
  }

  // 2. Check database (UI-based config)
  const config = await prisma.globalInfrastructureConfig.findFirst();
  if (config?.gitConfig?.[provider]) {
    const dbConfig = config.gitConfig[provider];
    return {
      clientId: dbConfig.clientId, // Stored encrypted, decrypt when used
      clientSecret: decrypt(dbConfig.clientSecret),
    };
  }

  // 3. Return null (no default, configuration required)
  return null;
}
```

### Encryption Before Storage
```typescript
import { encrypt } from '@/lib/integrations/storage';

// Before saving to database
const encryptedConfig = {
  github: {
    clientId: gitConfig.github.clientId, // Plain text (not sensitive)
    clientSecret: encrypt(gitConfig.github.clientSecret), // Encrypted
  },
  gitlab: {
    clientId: gitConfig.gitlab.clientId, // Plain text
    clientSecret: encrypt(gitConfig.gitlab.clientSecret), // Encrypted
    baseUrl: gitConfig.gitlab.baseUrl, // Plain text (URL not sensitive)
  },
};

await prisma.globalInfrastructureConfig.upsert({
  // ... update with encryptedConfig
});
```

### Decryption When Reading
```typescript
import { decrypt } from '@/lib/integrations/storage';

// When reading from database (for use in API, not returned to client)
const config = await prisma.globalInfrastructureConfig.findFirst();
const decryptedConfig = {
  github: config.gitConfig.github ? {
    clientId: config.gitConfig.github.clientId,
    clientSecret: decrypt(config.gitConfig.github.clientSecret),
  } : null,
  gitlab: config.gitConfig.gitlab ? {
    clientId: config.gitConfig.gitlab.clientId,
    clientSecret: decrypt(config.gitConfig.gitlab.clientSecret),
    baseUrl: config.gitConfig.gitlab.baseUrl,
  } : null,
};
```

## Security Considerations

### Encryption
- **Sensitive Fields**: All OAuth client secrets and API keys encrypted at rest using AES-256-GCM
- **Key Management**: Encryption key derived from `ENCRYPTION_SECRET` or `JWT_SECRET` environment variable
- **Never Return**: Encrypted values never returned in API responses
- **Decryption**: Only performed server-side when credentials needed for API calls

### Access Control
- **Admin Only**: Only Admin users can create/update global infrastructure configuration
- **Read Access**: Configuration values (sans secrets) may be readable by authenticated users for UI display
- **Audit Trail**: `updatedBy` field tracks which admin made changes

### API Response Models

### Global Infrastructure Config (Public - Secrets Hidden)
```typescript
interface GlobalInfrastructureConfigInfo {
  id: string;
  gitConfig: {
    github?: {
      clientId: string; // Plain text (not sensitive, used for OAuth flow)
      // clientSecret omitted (never returned)
    };
    gitlab?: {
      clientId: string; // Plain text
      baseUrl?: string; // Plain text (URL not sensitive)
      // clientSecret omitted (never returned)
    };
  };
  aiConfig: {
    aiGatewayUrl?: string; // Plain text (URL not sensitive)
    llmEndpoint?: string; // Plain text (URL not sensitive)
    // All API keys omitted (never returned)
  };
  updatedBy: string | null; // User ID
  updatedByUser?: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

**Note**: Sensitive fields (`clientSecret`, API keys) are never returned in API responses. Only non-sensitive identifiers (clientId, URLs) are returned for UI display.

## Migration Requirements

**New Migration**: Create `GlobalInfrastructureConfig` table

**Migration SQL**:
```sql
CREATE TABLE global_infrastructure_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  git_config JSONB NOT NULL DEFAULT '{}',
  ai_config JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_global_infrastructure_config_updated_at ON global_infrastructure_config(updated_at);
CREATE INDEX idx_global_infrastructure_config_updated_by ON global_infrastructure_config(updated_by);

-- Optional: Create unique constraint to enforce singleton pattern at database level
-- CREATE UNIQUE INDEX idx_global_infrastructure_config_singleton ON global_infrastructure_config((1));
-- But application-level enforcement is preferred for flexibility
```

**Prisma Migration**:
```bash
pnpm --filter @stride/database prisma migrate dev --name add_global_infrastructure_config
```

## Relationship to Existing Models

### User Model
- **Relationship**: `GlobalInfrastructureConfig.updatedBy` → `User.id` (optional, nullable)
- **Purpose**: Track which admin user made configuration changes (audit trail)
- **Cascade**: `onDelete: SetNull` (preserve config if admin user deleted)

### RepositoryConnection Model (Per-Project)
- **Relationship**: Independent (no direct foreign key)
- **Usage**: Global Git OAuth config provides OAuth App credentials used to initiate OAuth flows that result in per-project `RepositoryConnection.accessToken`
- **Pattern**: Global config (OAuth App) → OAuth flow → Per-project access token stored in `RepositoryConnection`

### AI Provider Configuration (Phase 9, Per-Project)
- **Relationship**: Independent (no direct foreign key)
- **Usage**: Global AI Gateway config provides service endpoint and default provider credentials, per-project config can override
- **Pattern**: Global config (`AI_GATEWAY_URL`, defaults) → Per-project config (overrides) → AI triage uses per-project or global config

## Notes

- **Singleton Pattern**: Application enforces single record (check existence on create, use upsert pattern). Database unique constraint not enforced at schema level for flexibility.
- **Backward Compatibility**: Existing environment variable configuration continues to work. Database configuration is optional enhancement.
- **Migration Safety**: New table, no existing data to migrate. Safe to add without affecting existing functionality.
- **Phase 9 Compatibility**: This schema does not interfere with Phase 9 per-project AI provider configuration. They are independent entities with clear separation of concerns.

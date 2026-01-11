# API Contracts: Global Infrastructure Configuration

**Feature**: Global infrastructure configuration for Git and AI providers  
**Created**: 2026-01-23  
**Base URL**: `/api/admin/settings/infrastructure`

## Overview

RESTful API endpoints for managing global infrastructure configuration (Git OAuth and AI Gateway settings). All endpoints require Admin role authentication.

## Authentication

**All endpoints require**:
- Valid session cookie (HTTP-only cookie)
- User role: `Admin` (checked at route level)
- Non-admin users receive `403 Forbidden` response

**Authentication Pattern**:
```typescript
const authResult = await requireAuth(request);
if (authResult instanceof NextResponse) {
  return authResult; // Unauthenticated
}

const session = authResult;
const user = await prisma.user.findUnique({
  where: { id: session.userId },
  select: { role: true },
});

if (!user || user.role !== UserRole.Admin) {
  return NextResponse.json(
    { error: 'Forbidden: Admin access required' },
    { status: 403 }
  );
}
```

## Endpoints

### 1. GET /api/admin/settings/infrastructure

Get global infrastructure configuration (without sensitive credentials).

**Authentication**: Required (Admin only)

**Request**:
```http
GET /api/admin/settings/infrastructure
Cookie: session=...
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "gitConfig": {
    "github": {
      "clientId": "github_client_id",
      "configured": true
    },
    "gitlab": {
      "clientId": "gitlab_client_id",
      "baseUrl": "https://gitlab.com",
      "configured": true
    }
  },
  "aiConfig": {
    "aiGatewayUrl": "http://ai-gateway:3001",
    "llmEndpoint": "http://localhost:11434",
    "configured": true
  },
  "updatedBy": "user-uuid",
  "updatedByUser": {
    "id": "user-uuid",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "createdAt": "2026-01-23T00:00:00Z",
  "updatedAt": "2026-01-23T00:00:00Z",
  "source": "database" | "environment" | "default"
}
```

**Response Fields**:
- `id`: UUID of configuration record
- `gitConfig.github`: GitHub OAuth config (clientId only, clientSecret never returned)
- `gitConfig.github.configured`: Boolean indicating if GitHub OAuth is configured (env var or database)
- `gitConfig.gitlab`: GitLab OAuth config (clientId, baseUrl only, clientSecret never returned)
- `gitConfig.gitlab.configured`: Boolean indicating if GitLab OAuth is configured
- `aiConfig.aiGatewayUrl`: AI Gateway service URL
- `aiConfig.llmEndpoint`: Ollama endpoint URL (optional)
- `aiConfig.configured`: Boolean indicating if AI Gateway is configured
- `updatedBy`: User ID who last updated (null if set via env vars)
- `updatedByUser`: User details (null if set via env vars)
- `source`: Configuration source (`"database"` = UI-based, `"environment"` = env vars override, `"default"` = defaults)

**Error Responses**:
- `401 Unauthorized`: No valid session
- `403 Forbidden`: User is not Admin
- `500 Internal Server Error`: Server error

---

### 2. PUT /api/admin/settings/infrastructure

Update global infrastructure configuration (UI-based, environment variables override this).

**Authentication**: Required (Admin only)

**Request**:
```http
PUT /api/admin/settings/infrastructure
Content-Type: application/json
Cookie: session=...

{
  "gitConfig": {
    "github": {
      "clientId": "github_client_id",
      "clientSecret": "github_client_secret"
    },
    "gitlab": {
      "clientId": "gitlab_client_id",
      "clientSecret": "gitlab_client_secret",
      "baseUrl": "https://gitlab.com"
    }
  },
  "aiConfig": {
    "aiGatewayUrl": "http://ai-gateway:3001",
    "llmEndpoint": "http://localhost:11434",
    "openaiApiKey": "sk-...",
    "anthropicApiKey": "sk-ant-...",
    "googleAiApiKey": "AIza..."
  }
}
```

**Request Schema** (Zod):
```typescript
const updateInfrastructureConfigSchema = z.object({
  gitConfig: z.object({
    github: z.object({
      clientId: z.string().min(1, 'GitHub Client ID is required'),
      clientSecret: z.string().min(1, 'GitHub Client Secret is required'),
    }).optional(),
    gitlab: z.object({
      clientId: z.string().min(1, 'GitLab Client ID is required'),
      clientSecret: z.string().min(1, 'GitLab Client Secret is required'),
      baseUrl: z.string().url().optional(),
    }).optional(),
  }).optional(),
  aiConfig: z.object({
    aiGatewayUrl: z.string().url('AI Gateway URL must be valid URL'),
    llmEndpoint: z.string().url().optional(),
    openaiApiKey: z.string().regex(/^sk-/, 'Invalid OpenAI API key format').optional(),
    anthropicApiKey: z.string().regex(/^sk-ant-/, 'Invalid Anthropic API key format').optional(),
    googleAiApiKey: z.string().regex(/^AIza/, 'Invalid Google AI API key format').optional(),
  }).optional(),
});
```

**Validation Rules**:
- `github.clientId`: Required if github object provided, non-empty string
- `github.clientSecret`: Required if github object provided, non-empty string (will be encrypted)
- `gitlab.clientId`: Required if gitlab object provided, non-empty string
- `gitlab.clientSecret`: Required if gitlab object provided, non-empty string (will be encrypted)
- `gitlab.baseUrl`: Optional, must be valid URL if provided
- `aiConfig.aiGatewayUrl`: Required if aiConfig provided, must be valid HTTP/HTTPS URL
- `aiConfig.llmEndpoint`: Optional, must be valid URL if provided
- `aiConfig.openaiApiKey`: Optional, must match format `sk-*` if provided (will be encrypted)
- `aiConfig.anthropicApiKey`: Optional, must match format `sk-ant-*` if provided (will be encrypted)
- `aiConfig.googleAiApiKey`: Optional, must match format `AIza*` if provided (will be encrypted)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "gitConfig": {
    "github": {
      "clientId": "github_client_id",
      "configured": true
    },
    "gitlab": {
      "clientId": "gitlab_client_id",
      "baseUrl": "https://gitlab.com",
      "configured": true
    }
  },
  "aiConfig": {
    "aiGatewayUrl": "http://ai-gateway:3001",
    "llmEndpoint": "http://localhost:11434",
    "configured": true
  },
  "updatedBy": "user-uuid",
  "updatedByUser": {
    "id": "user-uuid",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "updatedAt": "2026-01-23T00:00:00Z",
  "message": "Configuration updated successfully"
}
```

**Note**: Response does not include sensitive credentials (clientSecret, API keys). Only non-sensitive identifiers returned.

**Error Responses**:
- `400 Bad Request`: Validation error
  ```json
  {
    "error": "Validation failed",
    "details": {
      "gitConfig.github.clientId": ["GitHub Client ID is required"],
      "aiConfig.aiGatewayUrl": ["AI Gateway URL must be valid URL"]
    }
  }
  ```
- `401 Unauthorized`: No valid session
- `403 Forbidden`: User is not Admin
- `500 Internal Server Error`: Server error (encryption failure, database error)

---

### 3. GET /api/admin/settings/infrastructure/audit

Get configuration change history (audit log).

**Authentication**: Required (Admin only)

**Request**:
```http
GET /api/admin/settings/infrastructure/audit?limit=10&offset=0
Cookie: session=...
```

**Query Parameters**:
- `limit`: Number of records to return (default: 10, max: 100)
- `offset`: Number of records to skip (default: 0, for pagination)

**Response** (200 OK):
```json
{
  "changes": [
    {
      "id": "uuid",
      "updatedBy": "user-uuid",
      "updatedByUser": {
        "id": "user-uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "updatedAt": "2026-01-23T00:00:00Z",
      "sectionsChanged": ["gitConfig", "aiConfig"]
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

**Response Fields**:
- `changes`: Array of configuration change records
  - `id`: Configuration record ID
  - `updatedBy`: User ID who made change
  - `updatedByUser`: User details
  - `updatedAt`: Timestamp of change
  - `sectionsChanged`: Array of sections that changed (`"gitConfig"`, `"aiConfig"`)
- `total`: Total number of changes
- `limit`: Query limit
- `offset`: Query offset

**Error Responses**:
- `401 Unauthorized`: No valid session
- `403 Forbidden`: User is not Admin
- `500 Internal Server Error`: Server error

**Note**: Initial implementation provides basic audit trail via `updatedAt` and `updatedBy`. Full change history (previous/new values) deferred to future enhancement if needed.

---

### 4. POST /api/admin/settings/infrastructure/test

Test infrastructure configuration connectivity.

**Authentication**: Required (Admin only)

**Request**:
```http
POST /api/admin/settings/infrastructure/test
Content-Type: application/json
Cookie: session=...

{
  "type": "github" | "gitlab" | "aiGateway" | "ollama",
  "config": {
    // Provider-specific test configuration
  }
}
```

**Request Schema**:
```typescript
const testConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('github'),
    config: z.object({
      clientId: z.string().min(1),
      clientSecret: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal('gitlab'),
    config: z.object({
      clientId: z.string().min(1),
      clientSecret: z.string().min(1),
      baseUrl: z.string().url().optional(),
    }),
  }),
  z.object({
    type: z.literal('aiGateway'),
    config: z.object({
      aiGatewayUrl: z.string().url(),
    }),
  }),
  z.object({
    type: z.literal('ollama'),
    config: z.object({
      llmEndpoint: z.string().url(),
    }),
  }),
]);
```

**Test Types**:

**GitHub OAuth Test**:
```json
{
  "type": "github",
  "config": {
    "clientId": "github_client_id",
    "clientSecret": "github_client_secret"
  }
}
```
- Tests: OAuth App credentials validity by attempting to exchange a test code or checking app permissions

**GitLab OAuth Test**:
```json
{
  "type": "gitlab",
  "config": {
    "clientId": "gitlab_client_id",
    "clientSecret": "gitlab_client_secret",
    "baseUrl": "https://gitlab.com"
  }
}
```
- Tests: OAuth App credentials validity and baseUrl connectivity

**AI Gateway Test**:
```json
{
  "type": "aiGateway",
  "config": {
    "aiGatewayUrl": "http://ai-gateway:3001"
  }
}
```
- Tests: AI Gateway endpoint connectivity (health check)

**Ollama Endpoint Test**:
```json
{
  "type": "ollama",
  "config": {
    "llmEndpoint": "http://localhost:11434"
  }
}
```
- Tests: Ollama endpoint connectivity and model availability

**Response** (200 OK):
```json
{
  "success": true,
  "type": "github",
  "message": "GitHub OAuth configuration is valid",
  "details": {
    "appName": "Stride Integration",
    "scopes": ["repo", "read:org"]
  }
}
```

**Response** (200 OK, Failed):
```json
{
  "success": false,
  "type": "aiGateway",
  "message": "AI Gateway connection failed",
  "error": "Connection timeout after 5 seconds",
  "details": {
    "url": "http://ai-gateway:3001",
    "attemptedAt": "2026-01-23T00:00:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid test type or configuration
  ```json
  {
    "error": "Validation failed",
    "details": {
      "type": ["Invalid test type"],
      "config.aiGatewayUrl": ["AI Gateway URL must be valid URL"]
    }
  }
  ```
- `401 Unauthorized`: No valid session
- `403 Forbidden`: User is not Admin
- `500 Internal Server Error`: Server error

---

## Configuration Precedence

**Important**: Environment variables always override UI-based configuration.

**Precedence Order** (highest to lowest):
1. Environment variables (infrastructure-as-code)
2. Database (UI-based configuration)
3. Default values (hardcoded fallbacks)

**Implementation**:
- API reads from environment variables first
- If env var not set, reads from database
- UI displays which source is active (`source` field in GET response)
- UI indicates when env vars override UI settings (readonly state)

**Example**:
```typescript
// GET /api/admin/settings/infrastructure returns:
{
  "gitConfig": {
    "github": {
      "clientId": "env_var_client_id", // From GITHUB_CLIENT_ID env var
      "configured": true
    }
  },
  "source": "environment" // Indicates env vars are active
}

// UI should show readonly state with message:
// "GitHub OAuth is configured via environment variables. 
//  Update GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to change."
```

---

## Error Response Format

All error responses follow consistent format:

```json
{
  "error": "Error message",
  "details": {
    // Optional: Field-specific validation errors
    "field": ["Error message"]
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authorization failed (not Admin)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Security Considerations

1. **Never Return Secrets**: API responses never include `clientSecret` or API keys
2. **Admin Only**: All endpoints require Admin role (checked at route level)
3. **Input Validation**: All inputs validated using Zod schemas
4. **Encryption**: Sensitive credentials encrypted before storage
5. **HTTPS Required**: All endpoints should be accessed via HTTPS in production

---

## Notes

- **Singleton Pattern**: Only one global infrastructure configuration record exists (enforced by application logic)
- **Backward Compatibility**: Existing environment variable configuration continues to work
- **Phase 9 Compatibility**: These endpoints do not interfere with Phase 9 per-project AI provider configuration endpoints
- **Future Enhancement**: Full audit log with previous/new values can be added if needed

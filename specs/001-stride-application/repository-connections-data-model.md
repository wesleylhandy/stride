# Data Model: Repository Connection Management

**Feature**: Post-onboarding repository connection configuration  
**Created**: 2024-12-19

## Overview

No database schema changes are required. This feature uses the existing `RepositoryConnection` model and extends the UI/API usage patterns.

## Existing Models

### RepositoryConnection

**Purpose**: Git repository integration configuration for projects.

**Schema** (from `packages/database/prisma/schema.prisma`):
```prisma
model RepositoryConnection {
  id            String                @id @default(uuid())
  projectId     String
  repositoryUrl String                @unique
  serviceType   RepositoryServiceType
  accessToken   String // Encrypted
  webhookSecret String // Encrypted
  webhookId     String?
  isActive      Boolean               @default(true)
  lastSyncAt    DateTime?
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("repository_connections")
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `projectId`: Foreign key to Project (required)
- `repositoryUrl`: Git repository URL (unique, required)
- `serviceType`: Enum (GitHub | GitLab | Bitbucket)
- `accessToken`: Encrypted access token (required)
- `webhookSecret`: Encrypted webhook secret for signature verification (required)
- `webhookId`: External webhook ID from Git service (optional)
- `isActive`: Connection status flag (default: true)
- `lastSyncAt`: Timestamp of last successful sync (optional)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- Many-to-One: `RepositoryConnection.projectId` → `Project.id`
- Cascade delete: When project is deleted, connections are deleted

**Indexes**:
- `projectId`: For querying connections by project
- `repositoryUrl`: Unique constraint

**Validation Rules**:
- `repositoryUrl` must be valid Git repository URL format
- `accessToken` must be encrypted before storage
- `webhookSecret` must be encrypted before storage
- `serviceType` must match repository URL domain

## Data Access Patterns

### Query Existing Connection
```typescript
// Get connection for a project
const connection = await prisma.repositoryConnection.findFirst({
  where: { projectId },
});
```

### Create/Update Connection (Upsert)
```typescript
// Upsert connection (creates if new, updates if exists)
const connection = await prisma.repositoryConnection.upsert({
  where: { repositoryUrl },
  update: {
    accessToken: encryptedToken,
    webhookSecret: encryptedSecret,
    webhookId: webhookResult.webhookId,
    isActive: true,
    lastSyncAt: new Date(),
  },
  create: {
    projectId,
    repositoryUrl,
    serviceType,
    accessToken: encryptedToken,
    webhookSecret: encryptedSecret,
    webhookId: webhookResult.webhookId,
    isActive: true,
    lastSyncAt: new Date(),
  },
});
```

### Check Connection Existence
```typescript
// Check if project has connection
const hasConnection = await prisma.repositoryConnection.findFirst({
  where: { projectId },
  select: { id: true },
});
```

## Security Considerations

### Encryption
- `accessToken`: Must be encrypted using application encryption key
- `webhookSecret`: Must be encrypted using application encryption key
- Never return encrypted values in API responses

### Access Control
- Only Admin users can create/update connections
- Connections are project-scoped (users must have project access)

## API Response Models

### Connection Info (Public)
```typescript
interface RepositoryConnectionInfo {
  id: string;
  repositoryUrl: string;
  serviceType: 'GitHub' | 'GitLab' | 'Bitbucket';
  isActive: boolean;
  lastSyncAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
}
```

**Note**: Sensitive fields (`accessToken`, `webhookSecret`) are never returned in API responses.

## Migration Requirements

**None required** - Using existing schema.

## Future Enhancements (Out of Scope)

If disconnect functionality is added later:
- DELETE operation on `RepositoryConnection`
- Webhook removal via Git service API
- Optional: Soft delete with `isActive: false` instead of hard delete

If health monitoring is added:
- New table: `WebhookEvent` for tracking webhook deliveries
- New field: `lastHealthCheckAt` on `RepositoryConnection`
- New field: `healthStatus` enum (healthy | degraded | failed)


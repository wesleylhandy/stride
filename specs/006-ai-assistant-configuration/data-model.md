# Data Model: AI Assistant for Project Configuration

**Created**: 2026-01-23  
**Purpose**: Define database schema for AI configuration assistant feature

## Entity Overview

### New Entities
1. **ConfigurationAssistantSession** - Represents a conversation session with the AI assistant
2. **AssistantMessage** - Individual messages in a conversation
3. **ConfigurationSuggestion** - AI-generated configuration recommendations (optional, can be stored in message metadata)

## Entity Definitions

### ConfigurationAssistantSession

**Purpose**: Represents a conversation session between a user and the AI configuration assistant. Sessions can be project-specific or infrastructure-level.

**Attributes**:
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → User, Required)
- `projectId` (UUID, Foreign Key → Project, Optional) - Null for infrastructure context
- `contextType` (String, Required) - "project" or "infrastructure"
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `ConfigurationAssistantSession.userId` → User
- Many-to-One: `ConfigurationAssistantSession.projectId` → Project (optional)
- One-to-Many: `ConfigurationAssistantSession.messages` → AssistantMessage

**Validation Rules**:
- `contextType` must be either "project" or "infrastructure"
- If `contextType` is "project", `projectId` must be provided
- If `contextType` is "infrastructure", `projectId` must be null

**Indexes**:
- `(userId, projectId)` - For efficient session lookup
- `updatedAt` - For sorting recent sessions
- `(userId, contextType)` - For filtering sessions by context

**Schema**:
```prisma
model ConfigurationAssistantSession {
  id          String   @id @default(uuid())
  userId      String
  projectId   String?
  contextType String   // "project" or "infrastructure"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user     User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  project  Project?          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  messages AssistantMessage[]

  @@index([userId, projectId])
  @@index([updatedAt])
  @@index([userId, contextType])
  @@map("configuration_assistant_sessions")
}
```

---

### AssistantMessage

**Purpose**: Represents an individual message in a conversation with the AI assistant. Stores both user messages and assistant responses.

**Attributes**:
- `id` (UUID, Primary Key)
- `sessionId` (UUID, Foreign Key → ConfigurationAssistantSession, Required)
- `role` (String, Required) - "user" or "assistant"
- `content` (Text, Required) - Message content (markdown supported)
- `metadata` (JSONB, Optional) - Additional metadata:
  - `configReferences`: Array of configuration paths referenced
  - `documentationLinks`: Array of documentation section references
  - `suggestions`: Array of configuration suggestions (if applicable)
  - `comparisonResults`: Configuration comparison results (if applicable)
- `createdAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `AssistantMessage.sessionId` → ConfigurationAssistantSession

**Validation Rules**:
- `role` must be either "user" or "assistant"
- `content` must not be empty
- `metadata` is optional but must be valid JSON if provided

**Indexes**:
- `(sessionId, createdAt)` - For efficient message retrieval in chronological order
- `sessionId` - For session-based queries

**Schema**:
```prisma
model AssistantMessage {
  id        String   @id @default(uuid())
  sessionId String
  role      String   // "user" or "assistant"
  content   String   @db.Text
  metadata  Json?    // Config references, doc links, suggestions
  createdAt DateTime @default(now())

  // Relations
  session ConfigurationAssistantSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
  @@map("assistant_messages")
}
```

**Metadata Schema** (JSONB structure):
```typescript
interface AssistantMessageMetadata {
  configReferences?: Array<{
    path: string;        // e.g., "workflow.statuses[0]"
    type: 'yaml' | 'database' | 'both';
  }>;
  documentationLinks?: Array<{
    file: string;       // e.g., "docs/configuration/reference.md"
    section?: string;   // Optional section anchor
  }>;
  suggestions?: Array<{
    type: 'workflow' | 'custom_field' | 'automation_rule' | 'infrastructure';
    config: Record<string, unknown>;  // Suggested configuration
    explanation: string;
  }>;
  comparisonResults?: {
    differences: Array<{
      path: string;
      yamlValue: unknown;
      dbValue: unknown;
      type: 'missing_in_db' | 'missing_in_yaml' | 'value_mismatch';
    }>;
  };
}
```

---

## Relationships Summary

```
User
  └── ConfigurationAssistantSession (many-to-one)
        └── AssistantMessage (one-to-many)

Project (optional)
  └── ConfigurationAssistantSession (many-to-one, nullable)
        └── AssistantMessage (one-to-many)
```

## Data Access Patterns

### Common Queries

1. **Get or create session for user/project**:
   ```typescript
   // Find existing session or create new
   const session = await db.configurationAssistantSession.findFirst({
     where: {
       userId,
       projectId: projectId || null,
       contextType,
     },
     orderBy: { updatedAt: 'desc' },
   }) || await db.configurationAssistantSession.create({
     data: { userId, projectId, contextType },
   });
   ```

2. **Get recent messages for session** (paginated):
   ```typescript
   const messages = await db.assistantMessage.findMany({
     where: { sessionId },
     orderBy: { createdAt: 'asc' },
     take: 50,  // Last 50 messages
     skip: offset,
   });
   ```

3. **Get all sessions for user**:
   ```typescript
   const sessions = await db.configurationAssistantSession.findMany({
     where: { userId },
     orderBy: { updatedAt: 'desc' },
     include: {
       messages: {
         orderBy: { createdAt: 'desc' },
         take: 1,  // Latest message preview
       },
     },
   });
   ```

## Migration Strategy

### Initial Migration
1. Create `ConfigurationAssistantSession` table
2. Create `AssistantMessage` table
3. Add foreign key constraints
4. Add indexes

### Future Enhancements
- Consider archiving old sessions (>30 days) to separate table for performance
- Add full-text search index on `content` field if search functionality needed
- Consider adding `deletedAt` soft delete field for user-initiated session deletion

## Validation Rules

### Session Validation
- User must exist (enforced by foreign key)
- If `contextType` is "project", project must exist (enforced by foreign key)
- `contextType` must be validated at application level (enum check)

### Message Validation
- Session must exist (enforced by foreign key)
- `role` must be validated at application level (enum check)
- `content` must be non-empty (application-level validation)
- `metadata` must be valid JSON structure (application-level validation with Zod)

## Performance Considerations

- **Indexes**: Optimized for common query patterns (session lookup, message retrieval)
- **Pagination**: Messages retrieved in batches to prevent loading entire conversation
- **Cascade Deletes**: Sessions and messages automatically deleted when user/project deleted
- **JSONB Metadata**: Flexible structure, can be queried with PostgreSQL JSONB operators if needed

## Security Considerations

- **Access Control**: Users can only access their own sessions (enforced at application level)
- **Project Access**: Users can only create sessions for projects they have access to (enforced at application level)
- **Data Isolation**: Foreign key constraints ensure data integrity
- **Metadata Sanitization**: Validate and sanitize metadata before storage (prevent injection)

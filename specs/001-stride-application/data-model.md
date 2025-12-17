# Data Model: Stride Core Application

**Created**: 2024-12-19  
**Purpose**: Define database schema, entities, relationships, and validation rules

## Entity Overview

### Core Entities
1. **User** - Team members with access to the system
2. **Project** - Represents a project with configuration
3. **Issue** - Work items (bugs, features, tasks)
4. **Cycle/Sprint** - Time-bounded work periods
5. **Comment** - Issue discussions and updates
6. **Attachment** - File uploads linked to issues
7. **RepositoryConnection** - Git repository integrations
8. **Webhook** - External service webhook configurations
9. **Session** - User authentication sessions

## Entity Definitions

### User

**Purpose**: Represents team members with role-based access control.

**Attributes**:
- `id` (UUID, Primary Key)
- `email` (String, Unique, Required)
- `username` (String, Unique, Required)
- `passwordHash` (String, Required) - bcrypt/argon2 hash
- `role` (Enum: Admin | Member | Viewer, Required)
- `name` (String, Optional)
- `avatarUrl` (String, Optional)
- `emailVerified` (Boolean, Default: false)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- One-to-Many: `Issue.reporterId` → User
- One-to-Many: `Issue.assigneeId` → User
- One-to-Many: `Comment.userId` → User
- One-to-Many: `Session.userId` → User

**Validation Rules**:
- Email must be valid format
- Username: 3-50 characters, alphanumeric + underscore
- Password: Minimum 8 characters (enforced at application level)
- Role must be one of: Admin, Member, Viewer

**Indexes**:
- `email` (unique)
- `username` (unique)
- `role` (for permission queries)

---

### Project

**Purpose**: Represents a project with workflow configuration.

**Attributes**:
- `id` (UUID, Primary Key)
- `key` (String, Unique, Required) - Project identifier (e.g., "APP")
- `name` (String, Required)
- `description` (String, Optional)
- `configYaml` (Text, Required) - Raw YAML configuration
- `config` (JSONB, Required) - Parsed configuration for fast access
- `configVersion` (String, Optional) - Git commit hash or version
- `repositoryUrl` (String, Optional)
- `repositoryType` (Enum: GitHub | GitLab | Bitbucket, Optional)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- One-to-Many: `Issue.projectId` → Project
- One-to-Many: `Cycle.projectId` → Project
- One-to-Many: `RepositoryConnection.projectId` → Project

**Validation Rules**:
- `key`: 2-10 uppercase characters, alphanumeric
- `configYaml` must be valid YAML syntax
- `config` must match schema defined in `stride.config.yaml`
- `key` must be unique across all projects

**Indexes**:
- `key` (unique)
- `repositoryUrl` (for webhook lookups)

**Configuration Schema** (stored in `config` JSONB):
```json
{
  "project_key": "APP",
  "project_name": "My App",
  "workflow": {
    "default_status": "todo",
    "statuses": [
      { "key": "todo", "name": "To Do", "type": "open" },
      { "key": "in_progress", "name": "In Progress", "type": "in_progress" },
      { "key": "done", "name": "Done", "type": "closed" }
    ]
  },
  "custom_fields": [
    { "key": "priority", "name": "Priority", "type": "dropdown", "options": ["Low", "Medium", "High"], "required": false }
  ],
  "automation_rules": []
}
```

---

### Issue

**Purpose**: Represents work items, bugs, features, or tasks.

**Attributes**:
- `id` (UUID, Primary Key)
- `key` (String, Required) - Format: `{PROJECT_KEY}-{NUMBER}` (e.g., "APP-123")
- `projectId` (UUID, Foreign Key → Project, Required)
- `title` (String, Required, Max: 255)
- `description` (Text, Optional) - Markdown with Mermaid/PlantUML support
- `status` (String, Required) - References workflow status key
- `type` (Enum: Bug | Feature | Task | Epic, Default: Task)
- `priority` (Enum: Low | Medium | High | Critical, Optional)
- `reporterId` (UUID, Foreign Key → User, Required)
- `assigneeId` (UUID, Foreign Key → User, Optional)
- `cycleId` (UUID, Foreign Key → Cycle, Optional)
- `customFields` (JSONB, Default: {}) - Dynamic fields from configuration
- `storyPoints` (Integer, Optional) - For sprint planning
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)
- `closedAt` (DateTime, Optional)

**Relationships**:
- Many-to-One: `Issue.projectId` → Project
- Many-to-One: `Issue.reporterId` → User
- Many-to-One: `Issue.assigneeId` → User
- Many-to-One: `Issue.cycleId` → Cycle
- One-to-Many: `Comment.issueId` → Issue
- One-to-Many: `Attachment.issueId` → Issue
- Many-to-Many: `IssueBranch.issueId` → Issue (via junction table)

**Validation Rules**:
- `key` format: `{PROJECT_KEY}-{NUMBER}` where NUMBER is auto-incrementing per project
- `key` must be unique within project (enforced by composite unique index)
- `status` must exist in project's workflow configuration
- `customFields` must validate against project's custom field definitions
- `storyPoints` must be positive integer if provided

**Indexes**:
- `(projectId, key)` (unique composite) - Ensures unique keys per project
- `projectId` (for project issue queries)
- `status` (for Kanban board queries)
- `assigneeId` (for user assignment queries)
- `cycleId` (for sprint queries)
- `createdAt` (for sorting)
- `customFields` (GIN index for JSONB queries)

**Custom Fields Example** (stored in `customFields` JSONB):
```json
{
  "priority": "High",
  "component": "Authentication",
  "estimated_hours": 8
}
```

---

### Cycle (Sprint)

**Purpose**: Represents time-bounded work periods for planning and tracking.

**Attributes**:
- `id` (UUID, Primary Key)
- `projectId` (UUID, Foreign Key → Project, Required)
- `name` (String, Required)
- `description` (String, Optional)
- `startDate` (Date, Required)
- `endDate` (Date, Required)
- `goal` (String, Optional)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `Cycle.projectId` → Project
- One-to-Many: `Issue.cycleId` → Cycle

**Validation Rules**:
- `endDate` must be after `startDate`
- `name` must be unique within project
- Dates cannot be in the past for active cycles (enforced at application level)

**Indexes**:
- `projectId` (for project cycle queries)
- `startDate`, `endDate` (for date range queries)
- `(projectId, name)` (unique composite)

**Computed Metrics** (not stored, calculated on demand):
- Total story points assigned
- Completed story points
- Remaining story points
- Burndown chart data
- Cycle time average

---

### Comment

**Purpose**: Issue discussions, updates, and activity log.

**Attributes**:
- `id` (UUID, Primary Key)
- `issueId` (UUID, Foreign Key → Issue, Required)
- `userId` (UUID, Foreign Key → User, Required)
- `content` (Text, Required) - Markdown supported
- `isSystem` (Boolean, Default: false) - System-generated comments
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Optional)

**Relationships**:
- Many-to-One: `Comment.issueId` → Issue
- Many-to-One: `Comment.userId` → User

**Validation Rules**:
- `content` cannot be empty
- System comments cannot be edited

**Indexes**:
- `issueId` (for issue comment queries)
- `userId` (for user activity queries)
- `createdAt` (for chronological sorting)

---

### Attachment

**Purpose**: File uploads linked to issues.

**Attributes**:
- `id` (UUID, Primary Key)
- `issueId` (UUID, Foreign Key → Issue, Required)
- `userId` (UUID, Foreign Key → User, Required) - Uploader
- `filename` (String, Required)
- `mimeType` (String, Required)
- `size` (Integer, Required) - Bytes
- `storagePath` (String, Required) - File system or object storage path
- `createdAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `Attachment.issueId` → Issue
- Many-to-One: `Attachment.userId` → User

**Validation Rules**:
- File size limit: 10MB (configurable)
- Allowed MIME types: images, PDFs, documents (configurable)
- Filename sanitization required

**Indexes**:
- `issueId` (for issue attachment queries)
- `userId` (for user upload queries)

---

### RepositoryConnection

**Purpose**: Git repository integration configuration.

**Attributes**:
- `id` (UUID, Primary Key)
- `projectId` (UUID, Foreign Key → Project, Required)
- `repositoryUrl` (String, Required)
- `serviceType` (Enum: GitHub | GitLab | Bitbucket, Required)
- `accessToken` (String, Required) - Encrypted
- `webhookSecret` (String, Required) - Encrypted, for signature verification
- `webhookId` (String, Optional) - External webhook ID
- `isActive` (Boolean, Default: true)
- `lastSyncAt` (DateTime, Optional)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `RepositoryConnection.projectId` → Project

**Validation Rules**:
- `repositoryUrl` must be valid Git repository URL
- `accessToken` must be encrypted at rest
- `webhookSecret` must be encrypted at rest

**Indexes**:
- `projectId` (for project repository queries)
- `repositoryUrl` (unique)

---

### IssueBranch

**Purpose**: Junction table linking issues to Git branches and pull requests.

**Attributes**:
- `id` (UUID, Primary Key)
- `issueId` (UUID, Foreign Key → Issue, Required)
- `branchName` (String, Required)
- `pullRequestUrl` (String, Optional)
- `pullRequestNumber` (Integer, Optional)
- `pullRequestStatus` (Enum: Open | Merged | Closed, Optional)
- `lastCommitSha` (String, Optional)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `IssueBranch.issueId` → Issue

**Validation Rules**:
- `branchName` must match issue key pattern: `{PROJECT_KEY}-{NUMBER}`
- `pullRequestStatus` required if `pullRequestUrl` provided

**Indexes**:
- `issueId` (for issue branch queries)
- `branchName` (for branch lookup)
- `pullRequestUrl` (unique, if provided)

---

### Webhook

**Purpose**: External service webhook endpoint configurations.

**Attributes**:
- `id` (UUID, Primary Key)
- `projectId` (UUID, Foreign Key → Project, Required)
- `serviceType` (Enum: Sentry | Datadog | NewRelic, Required)
- `endpointUrl` (String, Required) - Internal endpoint
- `secret` (String, Required) - Encrypted, for signature verification
- `isActive` (Boolean, Default: true)
- `lastReceivedAt` (DateTime, Optional)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `Webhook.projectId` → Project

**Validation Rules**:
- `endpointUrl` must be valid URL
- `secret` must be encrypted at rest

**Indexes**:
- `projectId` (for project webhook queries)
- `serviceType` (for service-specific queries)

---

### Session

**Purpose**: User authentication sessions.

**Attributes**:
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → User, Required)
- `token` (String, Required, Unique) - JWT token ID or session token
- `expiresAt` (DateTime, Required)
- `ipAddress` (String, Optional)
- `userAgent` (String, Optional)
- `createdAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `Session.userId` → User

**Validation Rules**:
- `token` must be unique
- `expiresAt` must be in the future when created

**Indexes**:
- `token` (unique, for session lookup)
- `userId` (for user session queries)
- `expiresAt` (for cleanup queries)

---

## Relationships Summary

```
User
  ├──→ Issue (reporter, assignee)
  ├──→ Comment
  ├──→ Attachment
  └──→ Session

Project
  ├──→ Issue
  ├──→ Cycle
  ├──→ RepositoryConnection
  └──→ Webhook

Issue
  ├──→ Comment
  ├──→ Attachment
  ├──→ IssueBranch
  └──→ Cycle (via cycleId)

Cycle
  └──→ Issue (many issues per cycle)
```

## Database Constraints

### Unique Constraints
- `User.email` (unique)
- `User.username` (unique)
- `Project.key` (unique)
- `Issue(projectId, key)` (composite unique)
- `Cycle(projectId, name)` (composite unique)
- `RepositoryConnection.repositoryUrl` (unique)
- `Session.token` (unique)

### Foreign Key Constraints
- All foreign keys have `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- `Issue.projectId` → `CASCADE` (delete project deletes issues)
- `Issue.assigneeId` → `SET NULL` (delete user unassigns issues)
- `Comment.userId` → `SET NULL` (preserve comments if user deleted)

### Check Constraints
- `Cycle.endDate > Cycle.startDate`
- `Issue.storyPoints > 0` (if provided)
- `Attachment.size > 0`

## Migration Strategy

### Initial Schema
1. Create all tables with basic structure
2. Add indexes after data population
3. Add constraints incrementally

### Future Considerations
- Partition `Issue` table by `projectId` for large deployments
- Archive old `Comment` and `Attachment` records
- Add full-text search indexes on `Issue.title` and `Issue.description`

## Validation Rules Summary

### Application-Level Validation
- Issue key format: Validated against project key pattern
- Custom fields: Validated against project configuration schema
- Workflow transitions: Validated against automation rules
- File uploads: Size and MIME type validation
- YAML configuration: Syntax and schema validation

### Database-Level Validation
- Foreign key integrity
- Unique constraints
- Check constraints for data integrity
- Not null constraints for required fields


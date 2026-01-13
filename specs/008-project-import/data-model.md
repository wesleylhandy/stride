# Data Model: Project Import from Git Providers

**Created**: 2026-01-23  
**Purpose**: Define data requirements and entities for project import feature

## Entity Overview

**No new database entities required** - This feature uses existing Project and RepositoryConnection entities.

## Entity Usage

### Project Entity (Existing)

**Source**: Defined in `packages/database/prisma/schema.prisma`  
**Purpose**: Represents projects created through manual creation or repository import

**Fields Used**:
- `id` (UUID) - Primary key
- `key` (String, Unique) - Project identifier (e.g., "APP", "MYREPO")
- `name` (String) - Project display name
- `description` (String, Optional) - Project description
- `repositoryUrl` (String, Optional) - Git repository URL
- `repositoryType` (Enum, Optional) - GitHub, GitLab, or Bitbucket
- `configYaml` (Text) - Raw YAML configuration
- `config` (JSONB) - Parsed configuration for fast access
- `configVersion` (String, Optional) - Git commit hash or version
- `createdAt` (DateTime) - Project creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relationships Used**:
- `repositoryConnections` (One-to-Many) - Links to RepositoryConnection entries

**Validation Rules**:
- `key`: 2-10 uppercase alphanumeric characters, must be unique
- `configYaml` must be valid YAML syntax
- `config` must match schema defined in `stride.config.yaml`
- `key` must be unique across all projects

**New Usage Patterns**:
- Project key can be auto-generated from repository name during import
- Repository URL and type are populated during import
- Configuration is synced from repository if `stride.config.yaml` exists

### RepositoryConnection Entity (Existing)

**Source**: Defined in `packages/database/prisma/schema.prisma`  
**Purpose**: Links projects to git repositories with authentication and webhook configuration

**Fields Used**:
- `id` (UUID) - Primary key
- `projectId` (UUID, Foreign Key) - References Project.id
- `repositoryUrl` (String, Unique) - Git repository URL (used for duplicate detection)
- `serviceType` (Enum) - GitHub, GitLab, or Bitbucket
- `accessToken` (String, Encrypted) - OAuth access token
- `webhookSecret` (String, Encrypted) - Webhook secret for signature verification
- `webhookId` (String, Optional) - Webhook ID from git service
- `isActive` (Boolean) - Connection active status
- `lastSyncAt` (DateTime, Optional) - Last synchronization timestamp
- `createdAt` (DateTime) - Connection creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relationships Used**:
- `project` (Many-to-One) - References Project entity

**Validation Rules**:
- `repositoryUrl` must be unique across all connections (prevents duplicate imports)
- `accessToken` and `webhookSecret` are encrypted before storage

**New Usage Patterns**:
- Created automatically during repository import
- Used to check for duplicate repository connections before import
- Webhooks registered during import for branch and PR events

## Data Requirements

### Repository Listing Data

**Source**: GitHub/GitLab API responses  
**Temporary Storage**: Session state or API response caching (not persisted)

**Displayed Information**:
- Repository name
- Repository description
- Repository URL
- Repository visibility (private/public)
- Default branch
- Last updated timestamp

**Filtering**:
- Filter out archived repositories (optional)
- Sort by last updated (most recent first)
- Paginate results (100 per page)

### Project Import Data

**Input Data**:
- Repository URL (required)
- Repository type (GitHub/GitLab/Bitbucket, required)
- Access token (required, from OAuth flow)
- Project key (optional, auto-generated if not provided)
- Project name (auto-populated from repository name)
- Project description (auto-populated from repository description)

**Processing**:
- Validate repository URL format
- Check for existing repository connection (duplicate prevention)
- Generate project key if not provided
- Fetch repository metadata from git provider API
- Sync configuration from repository (if `stride.config.yaml` exists)
- Create project record
- Create repository connection record
- Register webhooks

**Output Data**:
- Created Project entity with all fields populated
- Created RepositoryConnection entity with encrypted credentials
- Configuration synced or generated

## Data Access Patterns

### Repository Listing

**Method**: Direct API calls to GitHub/GitLab APIs  
**Authentication**: OAuth access token (from OAuth flow)  
**Caching**: Client-side caching for current session (no database persistence)  
**Pagination**: API-level pagination (per_page, page parameters)

### Duplicate Repository Check

**Method**: Database query on RepositoryConnection table  
**Query**: `SELECT * FROM repository_connections WHERE repository_url = ?`  
**Purpose**: Prevent importing repositories that are already connected  
**Timing**: Before project creation, during import validation

### Project Creation

**Method**: `projectRepository.create()`  
**Transaction**: Atomic operation (project + repository connection)  
**Validation**: Project key uniqueness, repository URL format, repository connection uniqueness

### Configuration Sync

**Method**: `syncConfigFromRepository()` (existing function)  
**Source**: Repository file (`stride.config.yaml`)  
**Fallback**: Default configuration generation if file doesn't exist  
**Storage**: Project.configYaml and Project.config fields

## Data Flow

### Repository Import Flow

1. **User selects repository** from listing
2. **System validates** repository URL and checks for duplicates
3. **System fetches** repository metadata from git provider API
4. **System generates** project key from repository name (or uses provided key)
5. **System syncs** configuration from repository (or generates default)
6. **System creates** Project record (transaction start)
7. **System creates** RepositoryConnection record (same transaction)
8. **System registers** webhooks with git service
9. **System commits** transaction (all or nothing)
10. **System returns** created project with connection status

### Error Handling

**Validation Errors** (before transaction):
- Invalid repository URL format
- Repository already connected
- Project key conflicts
- Repository access denied

**Transaction Errors** (during creation):
- Database constraint violations
- Webhook registration failures
- Configuration sync failures
- Network timeouts

**Rollback Strategy**:
- If transaction fails, all database changes are rolled back
- Webhook registration failures trigger transaction rollback
- User sees error message with actionable guidance

## Indexes

**Existing indexes are sufficient**:
- `Project.key` (unique index) - For key uniqueness validation
- `RepositoryConnection.repositoryUrl` (unique index) - For duplicate detection
- `RepositoryConnection.projectId` (index) - For project-repository queries

## Notes

- No schema changes required
- All functionality uses existing entities
- Repository listing data is transient (not persisted)
- Import combines existing project creation and repository connection patterns
- Duplicate prevention uses existing unique constraint on RepositoryConnection.repositoryUrl

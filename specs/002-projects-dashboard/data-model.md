# Data Model: Projects Dashboard and Listing Page

**Created**: 2024-12-19  
**Purpose**: Define data requirements and entities for projects listing page

## Entity Overview

**No new database entities required** - This feature uses existing Project entity.

## Entity Usage

### Project Entity (Existing)

**Source**: Defined in `packages/database/prisma/schema.prisma`  
**Purpose**: Represents projects displayed on the listing page

**Fields Used**:
- `id` (UUID) - Used for navigation to project detail pages
- `key` (String) - Project identifier (e.g., "APP")
- `name` (String) - Project display name
- `description` (String, Optional) - Project description
- `repositoryUrl` (String, Optional) - Git repository URL
- `repositoryType` (Enum, Optional) - GitHub, GitLab, or Bitbucket
- `createdAt` (DateTime) - Project creation timestamp
- `updatedAt` (DateTime) - Last update timestamp (used as "last activity")

**Relationships Used**:
- `issues` (One-to-Many) - Used to calculate issue count via aggregation

## Data Requirements

### Project Listing Data

**Displayed Information**:
- Project name
- Project key
- Description (truncated if long)
- Issue count (calculated from `issues` relation)
- Last activity (uses `updatedAt`)
- Repository info (if available)

### Computed Fields

#### Issue Count
**Calculation**: Count of issues associated with project
**Implementation**: Use Prisma `_count` or count relation:
```typescript
include: {
  _count: {
    select: { issues: true }
  }
}
```

#### Last Activity
**Source**: `Project.updatedAt`
**Display**: Formatted as relative time (e.g., "2 hours ago", "3 days ago")

## Data Access Patterns

### Fetching Projects

**Method**: `projectRepository.findManyPaginated()`
**Filters**: None (shows all projects accessible to user)
**Ordering**: By `createdAt` descending (newest first)
**Pagination**: Page-based (20 items per page default)

**Authentication**: Projects are fetched for authenticated user only
**Authorization**: User sees all projects (no per-project access control at listing level)

## Validation Rules

**No new validation required** - Uses existing Project entity validation:
- Project key must be unique
- Project name is required
- All validation handled at project creation time

## Performance Considerations

### Query Optimization

**Current Approach**: 
- Single query with relation counting
- Pagination to limit results

**Future Enhancements** (if needed):
- Add indexes if filtering/search is added
- Cache project counts if frequently accessed
- Lazy load additional project metadata

### Data Volume

**Expected Scale**:
- Typical user: 1-10 projects
- Power user: 10-50 projects
- Edge case: 100+ projects (pagination handles this)

## Summary

This feature requires no database schema changes. It leverages the existing Project entity and extends it with computed fields (issue count, formatted dates) for display purposes only.


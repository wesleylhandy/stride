# Research: User Assignment & Issue Clone Features

**Feature**: User Assignment and Issue Clone  
**Date**: 2025-01-XX  
**Status**: Complete

## Research Questions

### 1. User Fetching Strategy

**Question**: How should users be fetched for the assignee dropdown?

**Decision**: Simple GET /api/users endpoint returning all users

**Rationale**:
- Self-hosted system with small teams (typically 5-50 users per instance)
- No performance concerns with fetching <100 users
- Simpler implementation without pagination/filtering complexity
- Follows YAGNI principle - can add filtering/pagination later if needed

**Alternatives considered**:
- Paginated endpoint: Rejected - unnecessary overhead for expected scale
- Project-based filtering: Rejected - all users can be assigned to any issue (simpler model for self-hosted)
- Search/filter query params: Deferred - can add later if user count grows

**Implementation**: Single GET endpoint returning array of user objects with id, username, name, avatarUrl for display purposes.

---

### 2. User Display Format

**Question**: How should users be displayed in the assignee dropdown?

**Decision**: Display format: "{name} ({username})" if name exists, otherwise "{username}"

**Rationale**:
- Shows most identifying information
- Consistent with common UX patterns
- Handles cases where name might not be set (fallback to username)

**Example**:
- User with name: "John Doe (johndoe)"
- User without name: "johndoe"

**Future enhancement**: Include avatar thumbnails in dropdown for visual identification.

---

### 3. Clone Data Mapping

**Question**: What fields should be copied when cloning an issue?

**Decision**: Copy all user-editable fields, exclude all metadata

**Fields to copy**:
- title
- description  
- type
- priority
- status
- assigneeId
- cycleId (if assigned)
- storyPoints
- customFields

**Fields to exclude**:
- id (new UUID generated)
- key (new key auto-generated per project)
- createdAt (current timestamp)
- updatedAt (current timestamp)
- closedAt (null for new issue)
- reporterId (current user becomes reporter)

**Rationale**:
- Users expect cloned issues to be similar to original
- Metadata should reflect new issue creation
- Current user becomes reporter (makes sense for cloned issues)

**Edge cases handled**:
- Custom fields are deep-copied (can contain complex nested data)
- Empty/null values are preserved appropriately

---

### 4. Clone UI/UX Pattern

**Question**: How should clone functionality be exposed in the UI?

**Decision**: Clone button in IssueDetail header next to Edit button, opens CreateIssueModal prefilled

**Rationale**:
- Follows common pattern (e.g., GitHub, Linear)
- Reuses existing CreateIssueModal component (DRY)
- User can review/edit before saving
- Consistent with create flow

**Implementation**:
- Button label: "Clone"
- Button variant: ghost (secondary action)
- Opens modal with prefilled data
- User can edit any field before saving
- Submit button shows "Create Issue" (not "Clone")

**Alternative considered**:
- Direct clone with confirmation: Rejected - users should review/edit before creating

---

### 5. Assignment Field Placement

**Question**: Where should assignee field appear in the form?

**Decision**: After Priority field, before Story Points

**Rationale**:
- Logical grouping: status-related fields (Type, Status, Priority) → assignment → planning (Story Points, Cycle)
- Consistent with common issue tracker patterns

**Visual hierarchy**:
1. Title (required)
2. Description
3. Type
4. Status
5. Priority
6. **Assignee** ← New field
7. Story Points
8. Custom Fields

---

## Technical Decisions

### API Endpoint Design

**Endpoint**: `GET /api/users`

**Auth**: Required (any authenticated user can see user list for assignment)

**Response format**: Simple array wrapper for consistency with other list endpoints
```json
{
  "users": [...]
}
```

**Performance**: Expected <50 users → <200ms response time. No pagination needed.

**Future scalability**: Can add query params later:
- `search` - filter by name/username
- `page`, `pageSize` - pagination
- `role` - filter by role (if needed)

### Component Reuse

**Decision**: Reuse existing CreateIssueModal for clone functionality

**Benefits**:
- No duplicate code
- Consistent UX
- Single source of truth for form validation

**Modification**: Pass `initialValues` prop to modal to prefill form

---

## Open Questions / Future Considerations

1. **User avatars in dropdown**: Consider showing avatars next to names for visual identification (future enhancement)

2. **Recent assignees**: Quick-select for recently assigned users (future enhancement)

3. **Assign to me**: Shortcut button to quickly assign to current user (future enhancement)

4. **User availability status**: Show user status (online/offline, busy) if real-time status tracking is added later

5. **Project-based filtering**: If multi-project RBAC is needed later, add project-based user filtering

---

## References

- Existing IssueForm component: `packages/ui/src/organisms/IssueForm.tsx`
- Existing IssueDetail component: `packages/ui/src/organisms/IssueDetail.tsx`
- Existing CreateIssueModal: `apps/web/src/components/CreateIssueModal.tsx`
- User model: `packages/database/prisma/schema.prisma` (User model)
- Issue model: `packages/database/prisma/schema.prisma` (Issue model with assigneeId)


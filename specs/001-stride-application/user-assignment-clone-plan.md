# Implementation Plan: User Assignment & Issue Clone Features

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-XX  
**Status**: Planning (Phase 0-1)  
**Feature Spec**: `specs/001-stride-application/spec.md`  
**Related**: Enhancement to existing issue management functionality

## Summary

Add two missing features to issue management:
1. **User Assignment**: Add assignee dropdown field to issue creation/edit forms with ability to select from all system users
2. **Issue Clone**: Add clone functionality that opens create modal prefilled with issue data (excluding metadata like id, key, timestamps)

Both features are simple enhancements since this is a self-hosted system with small team sizes initially. No project-based user filtering or complex RBAC needed at this stage.

## Technical Context

**Language/Version**: TypeScript (strict mode), Next.js 16+ with App Router  
**Primary Dependencies**: 
- Existing: React Hook Form, Zod, Prisma
- No new dependencies required
**Storage**: PostgreSQL (existing User and Issue models)  
**Testing**: Existing test infrastructure (unit, integration, E2E)  
**Target Platform**: Web application (Next.js)  
**Project Type**: Monorepo (existing structure)  
**Performance Goals**: 
- User list fetch: <200ms p95
- Clone operation: <100ms (client-side data prep)
**Constraints**: 
- Self-hosted, small teams (typically <50 users)
- Simple user listing (no filtering/pagination needed initially)
- No project-based user permissions (all users can be assigned)
**Scale/Scope**: 
- Expected user count: 5-50 users per instance
- Simple list endpoint (no pagination needed)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principles Compliance
- [x] SOLID principles applied
  - Single Responsibility: Separate API endpoint, UI component updates
  - Open/Closed: Extend existing IssueForm and IssueDetail without breaking changes
  - Dependency Inversion: Use repository pattern (already exists)
- [x] DRY, YAGNI, KISS followed
  - Reuse existing form infrastructure (IssueForm)
  - Simple user list endpoint (YAGNI: no filtering/pagination yet)
  - KISS: Direct user assignment, no complex permission checks
- [x] Type safety enforced
  - TypeScript strict mode (existing)
  - Zod validation for user IDs
  - Prisma for type-safe queries
- [x] Security best practices
  - Auth required for user list endpoint
  - Input validation (Zod) for assigneeId
  - Existing permission checks for issue creation/editing apply

### Code Quality Gates
- [x] No `any` types
  - Use existing User type from Prisma
  - Proper typing for user list response
- [x] Proper error handling
  - Try/catch in API routes
  - Client-side error handling in components
- [x] Input validation
  - Zod schema for assigneeId (already exists in issue validation)
  - UUID validation for user IDs
- [x] Test coverage planned
  - Unit tests for user list endpoint
  - Integration tests for assignment flow
  - E2E test for clone functionality

## Project Structure

### Documentation (this feature)

```text
specs/001-stride-application/
├── user-assignment-clone-plan.md  # This file
├── research.md                     # Phase 0 output (if needed)
├── data-model.md                   # Phase 1 updates (if schema changes)
└── contracts/                      # Phase 1 API contract additions
    └── api.yaml                    # Update with user list endpoint
```

### Source Code Changes

**API Routes** (new):
- `apps/web/app/api/users/route.ts` - GET endpoint for listing users

**Component Updates**:
- `packages/ui/src/organisms/IssueForm.tsx` - Add assignee dropdown field
- `packages/ui/src/organisms/IssueDetail.tsx` - Add clone button/action

**Page Updates**:
- `apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx` - Pass clone handler to IssueDetail

**Repository** (if needed):
- `packages/database/src/repositories/user-repository.ts` - Optional: repository for user queries (or use Prisma directly)

**Types** (if needed):
- `packages/types/src/user.ts` - Export User type if not already exported

## Phase 0: Outline & Research

### Research Tasks

- [x] **User fetching strategy**: Since self-hosted and small teams, simple GET /api/users endpoint returning all users is sufficient. No pagination, filtering, or project-based restrictions needed at this stage. This can be enhanced later if scale requires it.
- [x] **User display format**: Show user name (or username if name not set) in dropdown. Include avatar if available.
- [x] **Clone data mapping**: Clone should copy: title, description, type, priority, status, assigneeId, cycleId (optional), storyPoints, customFields. Exclude: id, key, createdAt, updatedAt, closedAt, reporterId (new issue will have current user as reporter).
- [x] **UI/UX patterns**: 
  - Assignee dropdown: Standard select element with "Unassigned" option
  - Clone button: Secondary button in IssueDetail header next to Edit button
  - Clone opens existing CreateIssueModal with prefilled data

**No additional research needed** - straightforward implementation using existing patterns.

## Phase 1: Design & Contracts

### Data Model

**No schema changes required** - User and Issue models already support assigneeId relationship.

**User Model** (existing):
- `id`: UUID (primary key)
- `username`: String (unique)
- `email`: String (unique)
- `name`: String? (optional display name)
- `avatarUrl`: String? (optional)
- `role`: UserRole enum

**Issue Model** (existing):
- `assigneeId`: UUID? (foreign key to User, nullable)

### API Contracts

**New Endpoint**: `GET /api/users`

**Purpose**: List all users in the system for assignment dropdown

**Request**:
- Method: GET
- Auth: Required (any authenticated user)
- Query params: None (for now - can add search/filter later)

**Response**:
```typescript
{
  users: Array<{
    id: string;
    username: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: "Admin" | "Member" | "Viewer";
  }>;
}
```

**Error Responses**:
- 401: Unauthorized
- 500: Internal server error

**OpenAPI Specification**:
```yaml
/api/users:
  get:
    summary: List all users
    description: Returns list of all users in the system for assignment purposes
    security:
      - cookieAuth: []
    responses:
      '200':
        description: List of users
        content:
          application/json:
            schema:
              type: object
              properties:
                users:
                  type: array
                  items:
                    $ref: '#/components/schemas/User'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '500':
        $ref: '#/components/responses/InternalServerError'
```

**Existing Endpoints** (no changes needed):
- `POST /api/projects/[projectId]/issues` - Already accepts assigneeId
- `PUT /api/projects/[projectId]/issues/[issueKey]` - Already accepts assigneeId

### Component Design

**IssueForm Updates**:

Add assignee field after Priority field:
```typescript
{/* Assignee */}
<div>
  <label htmlFor="assignee" className="block text-sm font-medium mb-1">
    Assignee
  </label>
  <select
    id="assignee"
    {...register('assigneeId')}
    className={cn(...)}
  >
    <option value="">Unassigned</option>
    {users?.map((user) => (
      <option key={user.id} value={user.id}>
        {user.name || user.username} {user.name ? `(${user.username})` : ''}
      </option>
    ))}
  </select>
</div>
```

Props addition:
```typescript
export interface IssueFormProps {
  // ... existing props
  /**
   * List of users for assignment dropdown
   */
  users?: Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
}
```

**IssueDetail Updates**:

Add clone button in header:
```typescript
{canEdit && (
  <div className="flex gap-2">
    <Button
      variant="ghost"
      onClick={handleClone}
      disabled={isUpdating}
    >
      Clone
    </Button>
    <Button
      variant="secondary"
      onClick={() => setIsEditing(true)}
      disabled={isUpdating}
    >
      Edit
    </Button>
  </div>
)}
```

Props addition:
```typescript
export interface IssueDetailProps {
  // ... existing props
  /**
   * Callback when issue is cloned
   */
  onClone?: () => void;
}
```

**Page Updates**:

In `apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx`, add clone handler:
- Fetch users for dropdown
- Handle clone action (open CreateIssueModal with prefilled data)
- Use existing CreateIssueModal component

### Quickstart

**No new setup steps required** - this is an enhancement to existing functionality.

Users will:
1. See assignee dropdown in issue create/edit forms
2. See "Clone" button on issue detail pages
3. Be able to select users from dropdown (fetched from `/api/users`)
4. Be able to clone issues (opens create modal with data prefilled)

## Phase 2: Implementation Tasks

*(This will be generated by `/speckit.tasks` command)*

### High-Level Tasks

1. **Create User List API Endpoint**
   - Create `apps/web/app/api/users/route.ts`
   - Implement GET handler with auth check
   - Return user list (id, username, name, avatarUrl, role)
   - Add validation and error handling

2. **Add Assignee Field to IssueForm**
   - Add `users` prop to IssueFormProps
   - Add assignee dropdown field in form
   - Handle empty/unassigned state
   - Style consistently with other form fields

3. **Update Create/Edit Flows**
   - Fetch users in CreateIssueModal
   - Fetch users in IssueDetail edit mode
   - Pass users prop to IssueForm
   - Handle loading states

4. **Implement Clone Functionality**
   - Add clone button to IssueDetail
   - Add onClone handler prop
   - Create clone handler in page component
   - Open CreateIssueModal with prefilled data
   - Map issue data to CreateIssueInput (excluding metadata)

5. **Update IssueDetail Display**
   - Improve assignee display (show name/username instead of ID)
   - Add visual indication for unassigned issues

## Implementation Notes

### User Fetching Strategy

**Decision**: Simple GET /api/users endpoint returning all users

**Rationale**: 
- Self-hosted system with small teams (5-50 users typically)
- No performance concerns with small user list
- Simpler implementation (no pagination, filtering logic)
- Can be enhanced later if needed (YAGNI principle)

**Alternatives considered**:
- Paginated endpoint: Unnecessary for expected scale
- Project-based user filtering: Not needed - all users can be assigned to any project
- Search/filter params: Can be added later if needed

### Clone Data Mapping

**Decision**: Copy all editable fields, exclude metadata

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
- key (new key generated)
- createdAt (current timestamp)
- updatedAt (current timestamp)
- closedAt (null for new issue)
- reporterId (current user)

### Future Enhancements

- User search/filter in assignee dropdown (when user count grows)
- Pagination for user list (if >100 users)
- Project-based user filtering (if multi-project RBAC needed)
- User avatars in dropdown (visual enhancement)
- Recent assignees (quick selection)
- Assign to me shortcut button

## Risks & Mitigations

**Risk**: User list endpoint could be slow with many users
**Mitigation**: Add pagination/search later if needed. For now, <50 users is acceptable.

**Risk**: Clone might copy sensitive or temporary data in customFields
**Mitigation**: Users can edit before saving. Consider adding "exclude custom fields" option later.

**Risk**: Assignee dropdown might be too long with many users
**Mitigation**: Add search/filter if user count grows beyond reasonable UI limits.

## Success Criteria

- [ ] Users can select assignee from dropdown in create/edit forms
- [ ] Assignee selection persists correctly (create and update)
- [ ] Clone button appears on issue detail pages for users with edit permission
- [ ] Clone opens create modal with all relevant fields prefilled
- [ ] Cloned issues get new key and have current user as reporter
- [ ] User list endpoint returns data in <200ms for typical team sizes
- [ ] All existing functionality continues to work
- [ ] Tests cover assignment and clone flows


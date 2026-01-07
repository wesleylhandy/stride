# Implementation Plan: Admin User Management

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-XX  
**Status**: Planning Complete (Phase 0-1)  
**Feature Spec**: `specs/001-stride-application/spec.md`  
**Related**: Enhancement to existing authentication and authorization functionality

## Summary

Add user management functionality that allows admin users to create and invite new users to the system. This addresses a critical gap where admins currently have no way to add team members after the initial deployment. The feature will support direct user creation and email-based invitations with role assignment (Member or Viewer, not Admin).

## Technical Context

**Language/Version**: TypeScript (strict mode), Next.js 16+ with App Router  
**Primary Dependencies**: 
- Existing: Prisma, bcrypt/argon2 (password hashing), Zod
- New: Email sending library (nodemailer or similar) for invitations
- Optional: JWT library for invitation tokens (if using crypto.randomBytes, can use Node.js built-in)
**Storage**: PostgreSQL (existing User model - no schema changes needed initially)  
**Testing**: Existing test infrastructure (unit, integration, E2E)  
**Target Platform**: Web application (Next.js)  
**Project Type**: Monorepo (existing structure)  
**Performance Goals**: 
- User creation: <500ms p95
- Invitation email send: <2s p95
- User invitation page load: <200ms p95
**Constraints**: 
- Self-hosted, small teams (typically <50 users)
- Admin-only access for user creation/invitation
- Email configuration required for invitations (optional if SMTP not configured)
- No Organization entity (single-tenant system)
**Scale/Scope**: 
- Expected user count: 5-50 users per instance
- Simple user management UI (no complex filtering/pagination initially)
- Direct creation + invitation flow

**Unknowns / Needs Clarification**:
- ✅ **RESOLVED**: Support both direct user creation and email invitations (see research.md)
- ✅ **RESOLVED**: Start with SMTP support, create abstraction layer for future providers (see research.md)
- ✅ **RESOLVED**: Invitation tokens expire after 7 days (see research.md)
- ✅ **RESOLVED**: User list page in MVP (view only), role updates/deactivation deferred to future (see research.md)
- ✅ **RESOLVED**: MVP: create/invite only. Role updates and deactivation deferred to future (see research.md)
- ✅ **RESOLVED**: Settings → Users (follows Project Settings pattern) (see research.md)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principles Compliance
- [x] SOLID principles applied
  - Single Responsibility: Separate API endpoints for create vs invite, dedicated UI components
  - Open/Closed: Extend existing User model and auth system without breaking changes
  - Liskov Substitution: New user creation endpoints follow existing auth patterns
  - Interface Segregation: Separate interfaces for create vs invite operations
  - Dependency Inversion: Use repository pattern (already exists), abstract email service
- [x] DRY, YAGNI, KISS followed
  - Reuse existing password validation and hashing logic
  - Simple user creation form (YAGNI: no bulk import yet)
  - KISS: Start with direct creation + simple invitation flow
- [x] Type safety enforced
  - TypeScript strict mode (existing)
  - Zod validation for user creation/invitation inputs
  - Prisma for type-safe queries
- [x] Security best practices
  - Admin-only access enforced at API level
  - Password validation and hashing (existing patterns)
  - Invitation tokens: cryptographically secure, expire after reasonable time
  - Email validation on invitation emails
  - Rate limiting on invitation endpoint (prevent abuse)

### Code Quality Gates
- [x] No `any` types
  - Use existing User type from Prisma
  - Proper typing for invitation tokens and email payloads
- [x] Proper error handling
  - Try/catch in API routes
  - Client-side error handling in components
  - Graceful degradation if email service unavailable
- [x] Input validation
  - Zod schemas for user creation and invitation inputs
  - Email format validation
  - Role validation (Member/Viewer only, not Admin)
  - Username uniqueness check
- [x] Test coverage planned
  - Unit tests for user creation/invitation endpoints
  - Integration tests for invitation flow
  - E2E tests for admin user management UI
  - Tests for permission checks (admin-only)

## Project Structure

### Documentation (this feature)

```text
specs/001-stride-application/
├── user-management-plan.md     # This file
├── user-management-research.md  # Phase 0 output
├── user-management-data-model.md # Phase 1 updates (if schema changes)
└── contracts/                   # Phase 1 API contract additions
    └── api.yaml                 # Update with user management endpoints
```

### Source Code Changes

**API Routes** (new/updated):
- `apps/web/app/api/users/route.ts` - POST endpoint for creating users (admin-only)
- `apps/web/app/api/users/invite/route.ts` - POST endpoint for sending invitations (admin-only)
- `apps/web/app/api/users/invite/[token]/route.ts` - GET/POST endpoints for accepting invitations

**Pages** (new):
- `apps/web/app/settings/users/page.tsx` - User management page (admin-only)
- `apps/web/app/invite/[token]/page.tsx` - Invitation acceptance page

**Components** (new):
- `apps/web/src/components/CreateUserForm.tsx` - Form for creating users directly
- `apps/web/src/components/InviteUserForm.tsx` - Form for sending invitations
- `apps/web/src/components/UserList.tsx` - List of users for admin view
- `apps/web/src/components/InviteAcceptForm.tsx` - Form for accepting invitation

**Services** (new):
- `apps/web/src/lib/services/email-service.ts` - Email sending abstraction
- `apps/web/src/lib/services/invitation-service.ts` - Invitation token generation/validation

**Types** (if needed):
- `packages/types/src/user.ts` - Export CreateUserInput, InviteUserInput types if not already
- `packages/types/src/invitation.ts` - Invitation token and payload types

**Repository** (if needed):
- `packages/database/src/repositories/user-repository.ts` - User creation methods (or extend existing)

**Database** (possible schema additions):
- If storing invitation tokens in DB: Add `Invitation` model or `invitationToken` field to User model

## Phase 0: Outline & Research

### Research Tasks

- [x] **User creation vs invitation**: Determine if both flows are needed or if invitations are sufficient
  - **Decision**: Support both direct creation and email invitations (see research.md)
  
- [x] **Email service configuration**: Determine email service support and configuration approach
  - **Decision**: Start with SMTP support, create abstraction layer for future providers (see research.md)
  
- [x] **Invitation token storage**: Determine where to store invitation tokens
  - **Decision**: Database-stored tokens in Invitation model (see research.md)
  
- [x] **Invitation expiration**: Determine token expiration strategy
  - **Decision**: 7-day expiration (see research.md)
  
- [x] **User management UI scope**: Determine what admin can do with users
  - **Decision**: MVP: create/invite only. Role updates and deactivation deferred (see research.md)
  
- [x] **UI location**: Determine where user management lives
  - **Decision**: Settings → Users (follows Project Settings pattern) (see research.md)
  
- [x] **Graceful degradation**: Determine behavior when email unavailable
  - **Decision**: Allow invitation creation but return token with warning, support manual sharing (see research.md)

### Research Output

- [x] `user-management-research.md` generated with all decisions resolved
- [x] All decisions documented with rationale and alternatives considered
- [x] Implementation recommendations provided
- [x] Future enhancement considerations documented

## Phase 1: Design & Contracts

**Prerequisites**: Phase 0 research complete, all NEEDS CLARIFICATION resolved

### Data Model

**User Model** (existing - verify no changes needed):
- Current fields: id, email, username, passwordHash, role, name, avatarUrl, emailVerified, createdAt, updatedAt
- **Potential Addition**: If using database-stored invitations, add `invitationToken` and `invitationExpiresAt` fields
- **Alternative**: Separate `Invitation` model if tracking invitations separately

**Invitation Model** (if using database storage):
- `id`: UUID (primary key)
- `email`: String (unique per invitation)
- `token`: String (unique, indexed)
- `role`: UserRole (Member or Viewer)
- `invitedById`: UUID (foreign key to User - who sent invitation)
- `expiresAt`: DateTime
- `acceptedAt`: DateTime? (nullable, set when accepted)
- `createdAt`: DateTime

**Relationship**:
- Invitation → User (invitedById) - many-to-one
- Invitation → User (email) - identifies which user will be created

### API Contracts

**Endpoint 1**: `POST /api/users` (create user directly)

**Purpose**: Allow admin to create a user with a password set by admin

**Request**:
- Method: POST
- Auth: Required (Admin role only)
- Body:
```typescript
{
  email: string;
  username: string;
  password: string;
  name?: string;
  role: "Member" | "Viewer"; // Admin not allowed
}
```

**Response** (201 Created):
```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: "Admin" | "Member" | "Viewer";
    createdAt: string;
  }
}
```

**Error Responses**:
- 400: Validation error (invalid email, weak password, etc.)
- 401: Unauthorized
- 403: Forbidden (not admin)
- 409: Conflict (email or username already exists)
- 500: Internal server error

---

**Endpoint 2**: `POST /api/users/invite` (send invitation)

**Purpose**: Allow admin to send email invitation to a user

**Request**:
- Method: POST
- Auth: Required (Admin role only)
- Body:
```typescript
{
  email: string;
  role: "Member" | "Viewer"; // Admin not allowed
}
```

**Response** (201 Created):
```typescript
{
  invitation: {
    id: string;
    email: string;
    role: "Member" | "Viewer";
    expiresAt: string;
    // Don't return token in response (security)
  },
  message: "Invitation sent successfully"
}
```

**Error Responses**:
- 400: Validation error (invalid email, email already exists as user)
- 401: Unauthorized
- 403: Forbidden (not admin)
- 409: Conflict (pending invitation already exists)
- 503: Service unavailable (email service not configured)
- 500: Internal server error

---

**Endpoint 3**: `GET /api/users/invite/[token]` (get invitation details)

**Purpose**: Allow user to view invitation details before accepting

**Request**:
- Method: GET
- Auth: Not required (public endpoint, but token is secret)
- Params: `token` (invitation token)

**Response** (200 OK):
```typescript
{
  invitation: {
    email: string;
    role: "Member" | "Viewer";
    invitedByName: string | null;
    expiresAt: string;
  }
}
```

**Error Responses**:
- 400: Invalid token format
- 404: Invitation not found or expired
- 410: Invitation already accepted

---

**Endpoint 4**: `POST /api/users/invite/[token]` (accept invitation)

**Purpose**: Allow user to accept invitation and create account

**Request**:
- Method: POST
- Auth: Not required (public endpoint, but token is secret)
- Params: `token` (invitation token)
- Body:
```typescript
{
  username: string;
  password: string;
  name?: string;
}
```

**Response** (201 Created):
```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: "Member" | "Viewer";
  },
  session: {
    token: string; // Auto-login after accepting
    expiresAt: string;
  }
}
```

**Error Responses**:
- 400: Validation error (invalid username, weak password, token expired)
- 404: Invitation not found
- 409: Conflict (username already exists)
- 410: Invitation already accepted
- 500: Internal server error

---

**Endpoint 5**: `GET /api/users` (list users - may already exist)

**Purpose**: Allow admin to view all users in system

**Request**:
- Method: GET
- Auth: Required (Admin role only)
- Query params: None initially (can add pagination/search later)

**Response** (200 OK):
```typescript
{
  users: Array<{
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: "Admin" | "Member" | "Viewer";
    emailVerified: boolean;
    createdAt: string;
  }>
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not admin)
- 500: Internal server error

---

**OpenAPI Specification**:
```yaml
/api/users:
  post:
    summary: Create new user (Admin only)
    description: Allows admin to create a user account directly with password
    security:
      - cookieAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateUserInput'
    responses:
      '201':
        description: User created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                user:
                  $ref: '#/components/schemas/User'
      '400':
        $ref: '#/components/responses/BadRequest'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '403':
        $ref: '#/components/responses/Forbidden'
      '409':
        description: Email or username already exists
  get:
    summary: List all users (Admin only)
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

/api/users/invite:
  post:
    summary: Send user invitation (Admin only)
    description: Sends an email invitation to create a user account
    security:
      - cookieAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - role
            properties:
              email:
                type: string
                format: email
              role:
                type: string
                enum: [Member, Viewer]
    responses:
      '201':
        description: Invitation sent successfully
      '400':
        $ref: '#/components/responses/BadRequest'
      '403':
        $ref: '#/components/responses/Forbidden'
      '503':
        description: Email service not configured

/api/users/invite/{token}:
  get:
    summary: Get invitation details
    description: Returns invitation details for a token (public endpoint)
    parameters:
      - name: token
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Invitation details
      '404':
        description: Invitation not found or expired
  post:
    summary: Accept invitation
    description: Accepts invitation and creates user account (public endpoint)
    parameters:
      - name: token
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - username
              - password
            properties:
              username:
                type: string
              password:
                type: string
              name:
                type: string
    responses:
      '201':
        description: User created and logged in
      '404':
        description: Invitation not found
      '410':
        description: Invitation already accepted
```

### Component Design

**User Management Page** (`apps/web/app/settings/users/page.tsx`):

Layout:
- Page title: "User Management"
- Tabs or sections: "Users" and "Invitations"
- User list table: email, username, name, role, created date, actions (edit/delete - if supported)
- Invitation form: email, role dropdown, "Send Invitation" button
- Create user form: email, username, password, name, role dropdown, "Create User" button

Permission check:
- Server component checks if user is admin
- Redirect to 403 if not admin
- Display permission error message

**Create User Form** (`apps/web/src/components/CreateUserForm.tsx`):

Fields:
- Email (required, validated)
- Username (required, validated, unique check)
- Password (required, strength validation)
- Confirm Password (required, must match)
- Name (optional)
- Role (required, dropdown: Member or Viewer)

Validation:
- Email format
- Username: 3-50 chars, alphanumeric + underscore
- Password: min 8 chars (use existing validation)
- Confirm password must match
- Username uniqueness (async check)

Submit:
- POST to `/api/users`
- Show loading state
- Handle errors (display field-specific errors)
- On success: show success message, optionally add to user list

**Invite User Form** (`apps/web/src/components/InviteUserForm.tsx`):

Fields:
- Email (required, validated)
- Role (required, dropdown: Member or Viewer)

Validation:
- Email format
- Email not already a user (async check)
- No pending invitation for email (async check)

Submit:
- POST to `/api/users/invite`
- Show loading state
- Handle errors (display message)
- On success: show success message, optionally add to invitation list

**Invitation Acceptance Page** (`apps/web/app/invite/[token]/page.tsx`):

Layout:
- Page title: "Accept Invitation"
- Display invitation details: email, role, invited by, expiration
- Form: username, password, confirm password, name
- "Create Account" button

Validation:
- Token validity (check expiration)
- Username uniqueness
- Password strength

Submit:
- POST to `/api/users/invite/[token]`
- On success: auto-login and redirect to dashboard
- Handle errors (expired, already accepted, etc.)

**User List Component** (`apps/web/src/components/UserList.tsx`):

Display:
- Table or card list
- Columns/cards: email, username, name, role badge, created date
- Actions: Edit (if supported), Delete (if supported)

Sorting:
- By created date (default: newest first)
- By name/username (optional)

Filtering:
- By role (optional, can add later)
- Search by email/username (optional, can add later)

### Quickstart

**For Admins**:
1. Navigate to Settings → Users
2. **Create User Directly**:
   - Fill in user creation form (email, username, password, role)
   - Click "Create User"
   - User account is immediately active
3. **Invite User**:
   - Fill in invitation form (email, role)
   - Click "Send Invitation"
   - User receives email with invitation link
   - User clicks link, fills in username/password, creates account

**For Invited Users**:
1. Receive invitation email with link
2. Click invitation link (format: `/invite/[token]`)
3. View invitation details (email, role, expiration)
4. Fill in username, password, name (optional)
5. Click "Create Account"
6. Automatically logged in and redirected to dashboard

**Configuration** (if email invitations used):
- Set up email service (SMTP or provider)
- Configure environment variables:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (for SMTP)
  - Or provider-specific variables (SendGrid API key, etc.)
- Set `BASE_URL` for invitation links
- Test invitation flow

## Phase 2: Implementation Tasks

*(This will be generated by `/speckit.tasks` command)*

### High-Level Tasks

1. **Research Phase**
   - Resolve all NEEDS CLARIFICATION items
   - Document decisions in `user-management-research.md`
   - Determine email service approach
   - Determine invitation token strategy

2. **Database Schema** (if needed)
   - Add Invitation model or fields to User model
   - Create migration
   - Update Prisma schema

3. **Email Service**
   - Create email service abstraction
   - Implement SMTP provider (and/or others based on research)
   - Add email templates for invitations
   - Handle email service unavailability gracefully

4. **Invitation Service**
   - Create invitation token generation/validation
   - Implement expiration logic
   - Handle invitation acceptance flow

5. **API Endpoints**
   - Implement POST /api/users (create user)
   - Implement POST /api/users/invite (send invitation)
   - Implement GET/POST /api/users/invite/[token] (accept invitation)
   - Update GET /api/users (add admin check if not already)

6. **UI Components**
   - Create user management page
   - Create user creation form
   - Create invitation form
   - Create user list component
   - Create invitation acceptance page

7. **Integration**
   - Add navigation link to user management (Settings → Users)
   - Integrate with existing auth system
   - Add permission checks
   - Handle error states

8. **Testing**
   - Unit tests for services
   - Integration tests for API endpoints
   - E2E tests for user management flows
   - Test permission enforcement

## Implementation Notes

### Email Service Abstraction

**Decision**: Create abstraction layer for email sending

**Rationale**: 
- Self-hosted deployments have varying email configurations
- Support multiple providers (SMTP, SendGrid, SES) through abstraction
- Allow graceful degradation when email unavailable

**Interface**:
```typescript
interface EmailService {
  sendInvitation(params: {
    to: string;
    token: string;
    invitedByName: string | null;
    expiresAt: Date;
  }): Promise<void>;
}
```

**Implementation**: Start with SMTP, add providers based on research

### Invitation Token Strategy

**Decision**: TBD in research phase

**Options**:
1. **Database-stored tokens**: Better audit trail, can revoke, requires Invitation model
2. **Signed JWT tokens**: Stateless, simpler, but harder to revoke
3. **Cryptographic tokens**: Random bytes stored in DB, simpler than JWT for this use case

**Recommendation**: Will be determined in Phase 0 research

### Permission Enforcement

**Strategy**: Check admin role at API route level

**Implementation**:
```typescript
// In each API route
const session = await getSession(request);
if (!session || session.user.role !== UserRole.Admin) {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}
```

**UI**: Also check in server components for better UX (show error page vs redirect)

### Graceful Degradation

**Email Service Unavailable**:
- Show warning banner in invitation form
- Allow invitation creation but return token in response
- Admin can manually share invitation link
- Option: Store invitation and send email later when service available

**Future Enhancement**: Queue invitations for retry when email service recovers

## Risks & Mitigations

**Risk**: Email service not configured in self-hosted deployments
**Mitigation**: Support manual invitation link sharing, clear documentation on email setup

**Risk**: Invitation tokens could be compromised if URL leaked
**Mitigation**: Use cryptographically secure tokens, add expiration, consider one-time use only

**Risk**: Rate limiting needed on invitation endpoint (prevent spam)
**Mitigation**: Add rate limiting middleware (per admin user, e.g., max 10 invitations/hour)

**Risk**: Email delivery failures (bounces, spam filters)
**Mitigation**: Log delivery failures, provide manual link sharing option, consider webhook for delivery status (future)

**Risk**: User management UI could be overwhelming with many users
**Mitigation**: Start simple (list view), can add pagination/search later if needed (YAGNI)

**Risk**: Admins might accidentally create duplicate users
**Mitigation**: Real-time validation (check username/email uniqueness), clear error messages

## Success Criteria

- [ ] Admin users can create new users directly from Settings → Users
- [ ] Admin users can send email invitations from Settings → Users
- [ ] Invited users receive email with invitation link
- [ ] Invited users can accept invitation and create account
- [ ] Invitation tokens expire after configured time
- [ ] Permission checks prevent non-admins from accessing user management
- [ ] User creation completes in <500ms for typical scenarios
- [ ] Invitation emails send successfully when email service configured
- [ ] System gracefully handles email service unavailability
- [ ] All validation errors are clearly displayed to users
- [ ] Tests cover user creation, invitation, and acceptance flows
- [ ] Documentation includes email service configuration instructions

## Future Enhancements

- **User role updates**: Allow admins to change user roles (Member ↔ Viewer)
- **User deactivation**: Soft delete or deactivate users instead of hard delete
- **Bulk user import**: CSV import for adding multiple users at once
- **User groups**: Organize users into teams/groups (if multi-project RBAC added)
- **Invitation resend**: Allow admins to resend expired invitations
- **Invitation revocation**: Allow admins to revoke pending invitations
- **Email delivery tracking**: Track invitation email delivery status
- **User activity logs**: Audit trail of user management actions
- **Advanced user search**: Filter by role, search by name/email
- **User profile management**: Admins can edit user profiles


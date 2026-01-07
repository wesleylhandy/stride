# Implementation Tasks: Admin User Management

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-XX  
**Status**: Ready for Implementation  
**Related Plan**: `specs/001-stride-application/user-management-plan.md`  
**Related Spec**: `specs/001-stride-application/spec.md` (Enhancement to User Story 1)

## Overview

This document provides actionable, dependency-ordered tasks for implementing admin user management functionality that allows admins to create and invite new users to the system.

**Total Tasks**: 65  
**Phase 1**: Database Schema & Types (Tasks T481-T490, 10 tasks)  
**Phase 2**: Services & Utilities (Tasks T491-T505, 15 tasks)  
**Phase 3**: API Endpoints (Tasks T506-T525, 20 tasks)  
**Phase 4**: UI Components (Tasks T526-T545, 20 tasks)  
**Dependencies**: Requires existing authentication infrastructure (User Story 1) to be complete

## Implementation Strategy

### Enhancement Approach

This feature enhances existing User Story 1 (Authentication & User Management):

- **Direct User Creation**: Allows admin to create users with passwords directly
- **Email Invitations**: Allows admin to invite users via email (users set their own passwords)
- **User List**: Allows admin to view all users in the system

All features require admin permissions and can be implemented as enhancements to existing auth functionality.

### Task Format

Every task follows this strict format:

- `- [ ] [TaskID] [P?] [ENH] Description with file path`

Where:

- **TaskID**: Sequential number (T481, T482, T483...)
- **[P]**: Optional marker for parallelizable tasks
- **[ENH]**: Label indicating this is an enhancement
- **Description**: Clear action with exact file path

---

## Phase 1: Database Schema & Types

**Goal**: Create Invitation model and add necessary types for user management functionality.

**Dependencies**: Existing authentication infrastructure (User Story 1) must be complete

### Database Schema

- [ ] T481 [ENH] Add Invitation model to Prisma schema in packages/database/prisma/schema.prisma with fields: id (UUID), email (String unique), token (String unique), role (UserRole), invitedById (UUID foreign key), expiresAt (DateTime), acceptedAt (DateTime nullable), createdAt, updatedAt
- [ ] T482 [ENH] Add sentInvitations relation to User model in packages/database/prisma/schema.prisma with relation "SentInvitations" and onDelete Cascade
- [ ] T483 [ENH] Add indexes on Invitation model in packages/database/prisma/schema.prisma: token (index), expiresAt (index), invitedById (index)
- [ ] T484 [ENH] Create database migration for Invitation model in packages/database/prisma/migrations/
- [ ] T485 [ENH] Run migration to create invitations table in database

**Acceptance Criteria**:

- Invitation model is defined in Prisma schema
- Foreign key relationship to User model is established
- All required indexes are created
- Migration runs successfully
- Database table is created with correct structure

### Types

- [ ] T486 [P] [ENH] Create CreateUserInput type in packages/types/src/user.ts with fields: email (string), username (string), password (string), name (string optional), role ("Member" | "Viewer")
- [ ] T487 [P] [ENH] Create InviteUserInput type in packages/types/src/invitation.ts with fields: email (string), role ("Member" | "Viewer")
- [ ] T488 [P] [ENH] Create AcceptInvitationInput type in packages/types/src/invitation.ts with fields: username (string), password (string), name (string optional)
- [ ] T489 [P] [ENH] Create Invitation type in packages/types/src/invitation.ts with fields: id, email, token, role, invitedById, expiresAt, acceptedAt, createdAt, updatedAt
- [ ] T490 [P] [ENH] Export all invitation types from packages/types/src/invitation.ts

**Acceptance Criteria**:

- All types are defined with proper TypeScript types
- Types match API contracts
- Types are exported and available for use
- Type definitions include proper validation constraints

---

## Phase 2: Services & Utilities

**Goal**: Create email service abstraction, invitation service, and validation utilities.

**Dependencies**: Phase 1 complete (database schema and types)

### Email Service

- [ ] T491 [ENH] Create EmailService interface in apps/web/src/lib/services/email-service.ts with method sendInvitation(params) and isAvailable()
- [ ] T492 [ENH] Install nodemailer package in apps/web/package.json
- [ ] T493 [ENH] Implement SMTPEmailService class in apps/web/src/lib/services/email-service.ts with SMTP configuration from environment variables
- [ ] T494 [ENH] Implement sendInvitation method in SMTPEmailService in apps/web/src/lib/services/email-service.ts to send invitation email with token link
- [ ] T495 [ENH] Implement isAvailable method in SMTPEmailService in apps/web/src/lib/services/email-service.ts to check if SMTP is configured
- [ ] T496 [ENH] Create email template for invitations in apps/web/src/lib/services/email-templates.ts with variables: email, token, invitedByName, expiresAt, inviteUrl
- [ ] T497 [ENH] Add error handling for email service unavailability in apps/web/src/lib/services/email-service.ts with graceful degradation
- [ ] T498 [ENH] Export EmailService instance from apps/web/src/lib/services/email-service.ts

**Acceptance Criteria**:

- Email service interface is defined
- SMTP implementation works with configured credentials
- Invitation emails are sent with correct content and links
- Service gracefully handles unavailability
- Error handling is comprehensive

### Invitation Service

- [ ] T499 [ENH] Create InvitationService class in apps/web/src/lib/services/invitation-service.ts
- [ ] T500 [ENH] Implement generateInvitationToken method in InvitationService in apps/web/src/lib/services/invitation-service.ts using crypto.randomBytes(32).toString('hex')
- [ ] T501 [ENH] Implement createInvitation method in InvitationService in apps/web/src/lib/services/invitation-service.ts to create invitation with 7-day expiration
- [ ] T502 [ENH] Implement findInvitationByToken method in InvitationService in apps/web/src/lib/services/invitation-service.ts to find valid (not expired, not accepted) invitation
- [ ] T503 [ENH] Implement acceptInvitation method in InvitationService in apps/web/src/lib/services/invitation-service.ts to mark invitation as accepted and create user
- [ ] T504 [ENH] Implement validateInvitation method in InvitationService in apps/web/src/lib/services/invitation-service.ts to check if invitation is valid (not expired, not accepted)
- [ ] T505 [ENH] Export InvitationService instance from apps/web/src/lib/services/invitation-service.ts

**Acceptance Criteria**:

- Invitation tokens are generated securely (64-character hex)
- Invitations are created with 7-day expiration
- Token lookup is efficient (uses index)
- Invitation validation checks expiration and acceptance status
- Invitation acceptance creates user correctly

### Validation

- [ ] T506 [ENH] Create createUserSchema with Zod in apps/web/src/lib/validation/user.ts with validation for email, username (3-50 chars, alphanumeric + underscore), password (min 8 chars), name (optional), role (Member or Viewer only)
- [ ] T507 [ENH] Create inviteUserSchema with Zod in apps/web/src/lib/validation/user.ts with validation for email (format) and role (Member or Viewer only)
- [ ] T508 [ENH] Create acceptInvitationSchema with Zod in apps/web/src/lib/validation/user.ts with validation for username, password, name (optional)
- [ ] T509 [ENH] Add email uniqueness validation check in apps/web/src/lib/validation/user.ts for createUserSchema (check User table)
- [ ] T510 [ENH] Add username uniqueness validation check in apps/web/src/lib/validation/user.ts for createUserSchema and acceptInvitationSchema (check User table)

**Acceptance Criteria**:

- All Zod schemas validate inputs correctly
- Email format validation works
- Username format validation (3-50 chars, alphanumeric + underscore) works
- Password strength validation (min 8 chars) works
- Role validation (Member or Viewer only, Admin not allowed) works
- Uniqueness checks prevent duplicate emails/usernames

---

## Phase 3: API Endpoints

**Goal**: Implement API endpoints for user creation, invitations, and user listing.

**Dependencies**: Phase 2 complete (services and validation)

### Repository

- [ ] T511 [ENH] Create InvitationRepository class in packages/database/src/repositories/invitation-repository.ts with methods: create, findByToken, findByEmail, findPendingByEmail, update
- [ ] T512 [ENH] Implement create method in InvitationRepository in packages/database/src/repositories/invitation-repository.ts to create invitation record
- [ ] T513 [ENH] Implement findByToken method in InvitationRepository in packages/database/src/repositories/invitation-repository.ts to find invitation by token
- [ ] T514 [ENH] Implement findPendingByEmail method in InvitationRepository in packages/database/src/repositories/invitation-repository.ts to check for pending invitations
- [ ] T515 [ENH] Export InvitationRepository from packages/database/src/repositories/invitation-repository.ts

**Acceptance Criteria**:

- Invitation repository provides all needed CRUD operations
- Token lookup is efficient
- Pending invitation check works correctly
- Methods handle errors appropriately

### API Endpoints

- [ ] T516 [ENH] Create POST /api/users endpoint in apps/web/app/api/users/route.ts with admin-only authentication check
- [ ] T517 [ENH] Implement POST handler in /api/users route in apps/web/app/api/users/route.ts to create user with validation, password hashing, and user creation
- [ ] T518 [ENH] Add error handling in POST /api/users route in apps/web/app/api/users/route.ts for validation errors (400), unauthorized (401), forbidden (403), conflict (409), server errors (500)
- [ ] T519 [ENH] Update GET /api/users endpoint in apps/web/app/api/users/route.ts to add admin-only authentication check if not already present
- [ ] T520 [ENH] Create POST /api/users/invite endpoint in apps/web/app/api/users/invite/route.ts with admin-only authentication check
- [ ] T521 [ENH] Implement POST handler in /api/users/invite route in apps/web/app/api/users/invite/route.ts to create invitation, send email (if available), and return invitation or token for manual sharing
- [ ] T522 [ENH] Add error handling in POST /api/users/invite route in apps/web/app/api/users/invite/route.ts for validation errors (400), unauthorized (401), forbidden (403), conflict (409), service unavailable (503), server errors (500)
- [ ] T523 [ENH] Create GET /api/users/invite/[token] endpoint in apps/web/app/api/users/invite/[token]/route.ts (public endpoint, no auth required)
- [ ] T524 [ENH] Implement GET handler in /api/users/invite/[token] route in apps/web/app/api/users/invite/[token]/route.ts to return invitation details if valid (not expired, not accepted)
- [ ] T525 [ENH] Add error handling in GET /api/users/invite/[token] route in apps/web/app/api/users/invite/[token]/route.ts for invalid token (400), not found (404), already accepted (410)
- [ ] T526 [ENH] Create POST /api/users/invite/[token] endpoint in apps/web/app/api/users/invite/[token]/route.ts (public endpoint, no auth required)
- [ ] T527 [ENH] Implement POST handler in /api/users/invite/[token] route in apps/web/app/api/users/invite/[token]/route.ts to accept invitation, create user, mark invitation as accepted, and auto-login user
- [ ] T528 [ENH] Add error handling in POST /api/users/invite/[token] route in apps/web/app/api/users/invite/[token]/route.ts for validation errors (400), not found (404), conflict (409), already accepted (410), server errors (500)

**Acceptance Criteria**:

- POST /api/users creates users correctly with admin-only access
- POST /api/users/invite creates invitations and sends emails (or returns token)
- GET /api/users/invite/[token] returns invitation details for valid tokens
- POST /api/users/invite/[token] accepts invitations and creates users
- All endpoints have proper authentication/authorization checks
- Error responses are correct and helpful
- Rate limiting is considered (future enhancement)

---

## Phase 4: UI Components

**Goal**: Create UI components for user management forms and displays.

**Dependencies**: Phase 3 complete (API endpoints)

### Forms

- [ ] T529 [ENH] Create CreateUserForm component in apps/web/src/components/CreateUserForm.tsx with fields: email, username, password, confirmPassword, name, role (Member/Viewer dropdown)
- [ ] T530 [ENH] Implement form validation in CreateUserForm in apps/web/src/components/CreateUserForm.tsx with real-time email/username uniqueness checks
- [ ] T531 [ENH] Add form submission handler in CreateUserForm in apps/web/src/components/CreateUserForm.tsx to POST to /api/users with loading state and error handling
- [ ] T532 [ENH] Create InviteUserForm component in apps/web/src/components/InviteUserForm.tsx with fields: email, role (Member/Viewer dropdown)
- [ ] T533 [ENH] Implement form validation in InviteUserForm in apps/web/src/components/InviteUserForm.tsx with email format check and pending invitation check
- [ ] T534 [ENH] Add form submission handler in InviteUserForm in apps/web/src/components/InviteUserForm.tsx to POST to /api/users/invite with loading state and error handling
- [ ] T535 [ENH] Display invitation token/URL in InviteUserForm in apps/web/src/components/InviteUserForm.tsx when email unavailable for manual sharing
- [ ] T536 [ENH] Create InviteAcceptForm component in apps/web/src/components/InviteAcceptForm.tsx with fields: username, password, confirmPassword, name
- [ ] T537 [ENH] Implement form validation in InviteAcceptForm in apps/web/src/components/InviteAcceptForm.tsx with username uniqueness check and password strength validation
- [ ] T538 [ENH] Add form submission handler in InviteAcceptForm in apps/web/src/components/InviteAcceptForm.tsx to POST to /api/users/invite/[token] with loading state and error handling

**Acceptance Criteria**:

- All forms have proper field validation
- Forms display error messages clearly
- Forms handle loading states
- Forms handle success (show success message, optionally redirect)
- Username/email uniqueness checks work in real-time
- Invitation form shows token/URL when email unavailable

### Display Components

- [ ] T539 [ENH] Create UserList component in apps/web/src/components/UserList.tsx to display users in table/card format with columns: email, username, name, role badge, created date
- [ ] T540 [ENH] Add sorting to UserList component in apps/web/src/components/UserList.tsx by created date (newest first by default)
- [ ] T541 [ENH] Style UserList component in apps/web/src/components/UserList.tsx with consistent styling matching existing UI patterns
- [ ] T542 [ENH] Display invitation details in InviteAcceptForm in apps/web/src/components/InviteAcceptForm.tsx showing email, role, invited by name, expiration date

**Acceptance Criteria**:

- User list displays all users correctly
- User list shows proper role badges
- Sorting works correctly
- Invitation details display correctly
- Styling is consistent with existing UI

---

## Phase 5: Pages & Integration

**Goal**: Create pages and integrate user management into Settings navigation.

**Dependencies**: Phase 4 complete (UI components)

### Pages

- [ ] T543 [ENH] Create user management page in apps/web/app/settings/users/page.tsx with admin-only access check (server component)
- [ ] T544 [ENH] Add page layout in apps/web/app/settings/users/page.tsx with title "User Management" and sections for user list, create form, and invite form
- [ ] T545 [ENH] Integrate UserList component in apps/web/app/settings/users/page.tsx with user data from GET /api/users
- [ ] T546 [ENH] Integrate CreateUserForm component in apps/web/app/settings/users/page.tsx with success handler to refresh user list
- [ ] T547 [ENH] Integrate InviteUserForm component in apps/web/app/settings/users/page.tsx with success handler to show success message
- [ ] T548 [ENH] Create invitation acceptance page in apps/web/app/invite/[token]/page.tsx (server component, public access)
- [ ] T549 [ENH] Fetch invitation details in invitation acceptance page in apps/web/app/invite/[token]/page.tsx using GET /api/users/invite/[token]
- [ ] T550 [ENH] Handle expired/invalid invitation in invitation acceptance page in apps/web/app/invite/[token]/page.tsx with error message and redirect to home
- [ ] T551 [ENH] Integrate InviteAcceptForm component in invitation acceptance page in apps/web/app/invite/[token]/page.tsx with success handler to redirect to dashboard after auto-login

**Acceptance Criteria**:

- User management page is accessible at /settings/users
- Page checks for admin access and shows 403 for non-admins
- User list loads and displays correctly
- Forms work correctly and refresh list on success
- Invitation acceptance page loads with invitation details
- Invalid/expired invitations show appropriate errors
- Successful invitation acceptance redirects to dashboard

### Navigation & Integration

- [ ] T552 [ENH] Add "Users" link to Settings navigation in apps/web/app/settings/layout.tsx (or settings navigation component)
- [ ] T553 [ENH] Ensure Settings navigation shows Users link only to admin users in apps/web/app/settings/layout.tsx
- [ ] T554 [ENH] Add environment variables documentation for SMTP configuration in .env.example with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE, SMTP_FROM, BASE_URL
- [ ] T555 [ENH] Update API contracts documentation in specs/001-stride-application/contracts/api.yaml with user management endpoints

**Acceptance Criteria**:

- Users link appears in Settings navigation for admins
- Navigation is properly secured (admin-only visibility)
- Environment variables are documented
- API documentation is updated

---

## Phase 6: Error Handling & Polish

**Goal**: Add comprehensive error handling, edge cases, and polish.

**Dependencies**: Phase 5 complete (pages and integration)

### Error Handling

- [ ] T556 [ENH] Add comprehensive error handling for email service failures in apps/web/src/lib/services/email-service.ts with clear error messages
- [ ] T557 [ENH] Add error handling for invitation token generation collisions in apps/web/src/lib/services/invitation-service.ts with retry logic
- [ ] T558 [ENH] Add error handling for concurrent invitation acceptance in apps/web/src/lib/services/invitation-service.ts to prevent duplicate user creation
- [ ] T559 [ENH] Add user-friendly error messages in all API endpoints in apps/web/app/api/users/route.ts and apps/web/app/api/users/invite/route.ts
- [ ] T560 [ENH] Handle edge case: expired invitation in GET /api/users/invite/[token] in apps/web/app/api/users/invite/[token]/route.ts with clear error message

**Acceptance Criteria**:

- All error cases are handled gracefully
- Error messages are user-friendly
- Edge cases (expired invitations, duplicate emails, etc.) are handled
- Concurrent access issues are prevented

### Polish & Edge Cases

- [ ] T561 [ENH] Add loading states to all forms in apps/web/src/components/CreateUserForm.tsx, InviteUserForm.tsx, InviteAcceptForm.tsx
- [ ] T562 [ENH] Add success messages with toast notifications in apps/web/src/components/CreateUserForm.tsx and InviteUserForm.tsx after successful operations
- [ ] T563 [ENH] Handle email service unavailability gracefully in invitation flow in apps/web/src/components/InviteUserForm.tsx with clear warning and manual sharing option
- [ ] T564 [ENH] Add confirmation before creating users directly in apps/web/src/components/CreateUserForm.tsx (optional enhancement)
- [ ] T565 [ENH] Add validation for invitation expiration display in apps/web/src/components/InviteAcceptForm.tsx showing countdown or expiration date

**Acceptance Criteria**:

- All forms have loading states
- Success messages are clear and visible
- Email unavailability is handled gracefully
- User experience is polished and intuitive

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Database Schema & Types): Requires existing authentication infrastructure (User Story 1)
- **Phase 2** (Services & Utilities): Requires Phase 1 complete
- **Phase 3** (API Endpoints): Requires Phase 2 complete
- **Phase 4** (UI Components): Requires Phase 3 complete
- **Phase 5** (Pages & Integration): Requires Phase 4 complete
- **Phase 6** (Error Handling & Polish): Requires Phase 5 complete

### Task Dependencies

**Phase 1**:

- T481-T483 (Schema): Can be done in parallel after T481
- T484-T485 (Migration): Must be sequential (migration depends on schema)
- T486-T490 (Types): Can be done in parallel

**Phase 2**:

- T491-T498 (Email Service): T491 must be first (interface), then T492-T498 can be done in parallel with T493 depending on T492
- T499-T505 (Invitation Service): T499 must be first (class), then T500-T505 can be done in parallel
- T506-T510 (Validation): Can be done in parallel

**Phase 3**:

- T511-T515 (Repository): Must be sequential (methods depend on class)
- T516-T528 (API Endpoints): Can be done in parallel after repository (T511-T515)

**Phase 4**:

- T529-T538 (Forms): Can be done in parallel after API endpoints
- T539-T542 (Display Components): Can be done in parallel

**Phase 5**:

- T543-T551 (Pages): T543 must be first, then can be done in parallel
- T552-T555 (Navigation): Can be done in parallel

**Phase 6**:

- T556-T565 (Error Handling & Polish): Can be done in parallel

### Parallel Opportunities

- **Phase 1**: Types (T486-T490) can be done in parallel
- **Phase 2**: Email service implementation (T493-T497), invitation service methods (T500-T505), validation schemas (T506-T510) can be done in parallel
- **Phase 3**: API endpoints (T516-T528) can be done in parallel after repository
- **Phase 4**: Forms (T529-T538) and display components (T539-T542) can be done in parallel
- **Phase 5**: Page integrations (T545-T551) and navigation (T552-T555) can be done in parallel
- **Phase 6**: All error handling and polish tasks can be done in parallel

### Integration Points

- **Existing Auth System**: Uses existing authentication (sessions, permissions)
- **Existing User Model**: No changes needed, Invitation model is new
- **Existing Validation**: Reuses password validation, adds user-specific validation
- **Settings Navigation**: Extends existing Settings navigation pattern

---

## Implementation Strategy

### Incremental Delivery

1. **Step 1**: Database Schema & Types (Phase 1)
   - Create Invitation model
   - Add types
   - Test database changes

2. **Step 2**: Services & Validation (Phase 2)
   - Implement email service
   - Implement invitation service
   - Add validation schemas
   - Test services independently

3. **Step 3**: API Endpoints (Phase 3)
   - Implement repository
   - Implement all API endpoints
   - Test endpoints with Postman/curl

4. **Step 4**: UI Components (Phase 4)
   - Create forms
   - Create display components
   - Test components in isolation

5. **Step 5**: Pages & Integration (Phase 5)
   - Create pages
   - Integrate components
   - Add navigation
   - Test full flow

6. **Step 6**: Error Handling & Polish (Phase 6)
   - Add error handling
   - Polish UI/UX
   - Test edge cases

### Testing Strategy

**Unit Tests** (future):

- Email service tests
- Invitation service tests
- Validation schema tests
- Repository tests

**Integration Tests** (future):

- API endpoint tests
- Invitation flow tests
- User creation flow tests

**E2E Tests** (future):

- Admin creates user directly
- Admin sends invitation
- User accepts invitation
- Permission checks

---

## Success Criteria

- [ ] Admin users can create new users directly from Settings → Users
- [ ] Admin users can send email invitations from Settings → Users
- [ ] Invited users receive email with invitation link (if email configured)
- [ ] Invited users can accept invitation and create account
- [ ] Invitation tokens expire after 7 days
- [ ] Permission checks prevent non-admins from accessing user management
- [ ] User creation completes in <500ms for typical scenarios
- [ ] Invitation emails send successfully when email service configured
- [ ] System gracefully handles email service unavailability
- [ ] All validation errors are clearly displayed to users
- [ ] User list displays all users correctly
- [ ] All forms have loading states and error handling

---

## Future Enhancements

- **User role updates**: Allow admins to change user roles (Member ↔ Viewer)
- **User deactivation**: Soft delete or deactivate users
- **Bulk user import**: CSV import for multiple users
- **Invitation resend**: Allow admins to resend expired invitations
- **Invitation revocation**: Allow admins to revoke pending invitations
- **Email delivery tracking**: Track invitation email delivery status
- **User activity logs**: Audit trail of user management actions
- **Advanced user search**: Filter by role, search by name/email
- **User profile management**: Admins can edit user profiles
- **Rate limiting**: Add rate limiting to invitation endpoint to prevent spam

---

## Format Validation

✅ All tasks follow the strict checklist format:

- Checkbox: `- [ ]`
- Task ID: `T481`, `T482`, etc.
- Parallel marker: `[P]` where applicable
- Enhancement label: `[ENH]` for all tasks
- Description with file path: Every task includes exact file path

✅ All tasks are organized by implementation phase

✅ Dependencies are clearly identified

✅ Parallel execution opportunities are marked

✅ Each phase is independently testable

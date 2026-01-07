# Data Model: Admin User Management

**Created**: 2025-01-XX  
**Purpose**: Define database schema changes, entities, relationships, and validation rules for user management

## Schema Changes

### New Model: Invitation

**Purpose**: Store pending user invitations with tokens, expiration, and audit trail.

**Attributes**:
- `id` (UUID, Primary Key)
- `email` (String, Unique, Required) - Email address of invited user
- `token` (String, Unique, Required, Indexed) - Cryptographically secure invitation token (64 hex characters)
- `role` (UserRole Enum, Required) - Role to assign (Member or Viewer, Admin not allowed)
- `invitedById` (UUID, Foreign Key → User, Required) - Admin user who sent invitation
- `expiresAt` (DateTime, Required, Indexed) - Expiration time (7 days from creation)
- `acceptedAt` (DateTime, Optional) - Set when invitation is accepted (null until accepted)
- `createdAt` (DateTime, Required)
- `updatedAt` (DateTime, Required)

**Relationships**:
- Many-to-One: `Invitation.invitedById` → User (who sent invitation)
- One-to-One (implicit): `Invitation.email` → User.email (when invitation is accepted, user is created with this email)

**Validation Rules**:
- Email must be valid format (validated at application level)
- Email must be unique per pending invitation (can't invite same email twice)
- Token must be unique (64 hex characters)
- Role must be Member or Viewer (Admin not allowed)
- ExpiresAt must be in future (7 days from creation)
- AcceptedAt must be null until accepted

**Indexes**:
- `email` (unique) - Prevents duplicate invitations
- `token` (unique, indexed) - Fast lookups by token for acceptance
- `expiresAt` (indexed) - Efficient queries for expired invitation cleanup
- `invitedById` (indexed) - Efficient queries for admin's sent invitations

**Prisma Schema**:
```prisma
model Invitation {
  id          String   @id @default(uuid())
  email       String   @unique
  token       String   @unique
  role        UserRole
  invitedById String
  expiresAt   DateTime
  acceptedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  invitedBy User @relation("SentInvitations", fields: [invitedById], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([expiresAt])
  @@index([invitedById])
  @@map("invitations")
}
```

**User Model Update** (add relation):

```prisma
model User {
  // ... existing fields ...

  // Relations
  // ... existing relations ...
  sentInvitations Invitation[] @relation("SentInvitations")

  // ... rest of model ...
}
```

---

### User Model (No Changes Needed)

**Existing Model** (from `packages/database/prisma/schema.prisma`):

The existing User model already supports all needed fields:
- `id`: UUID (primary key)
- `email`: String (unique)
- `username`: String (unique)
- `passwordHash`: String
- `role`: UserRole enum (Admin, Member, Viewer)
- `name`: String? (optional)
- `avatarUrl`: String? (optional)
- `emailVerified`: Boolean (default: false)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**No schema changes needed** - existing model is sufficient.

**Future Enhancement**: If deactivation is added, could add `deactivatedAt` field (soft delete).

---

## Entity Definitions

### Invitation

**Purpose**: Represents a pending invitation to create a user account.

**State Transitions**:
1. **Created**: Invitation created by admin, `acceptedAt` is null, `expiresAt` is 7 days in future
2. **Expired**: Current time > `expiresAt`, `acceptedAt` is null (invitation no longer valid)
3. **Accepted**: User accepts invitation, account created, `acceptedAt` is set to current time

**Business Rules**:
- Invitation is only valid if `acceptedAt` is null AND `expiresAt` is in future
- One invitation per email at a time (unique email constraint)
- Once accepted, invitation cannot be reused (check `acceptedAt` before acceptance)
- Expired invitations can be cleaned up (future: cleanup job)

**Validation**:
- Email format validated at application level
- Token uniqueness enforced at database level
- Role validation: Only Member or Viewer allowed (Admin cannot be invited, only created directly)

---

## Relationships

### Invitation → User (invitedBy)

**Relationship**: Many-to-One

**Description**: Each invitation is sent by one admin user.

**Foreign Key**: `Invitation.invitedById` → `User.id`

**Cascade**: `onDelete: Cascade` - If admin user is deleted, delete their sent invitations (though admins shouldn't be deleted in practice)

**Use Cases**:
- Track who invited whom (audit trail)
- Display "invited by" information in invitation details
- Filter invitations by admin

---

### Invitation → User (email)

**Relationship**: One-to-One (implicit, when accepted)

**Description**: When invitation is accepted, a user is created with the invitation's email.

**Implementation**: 
- When accepting invitation, create User with `email` matching `Invitation.email`
- Set `acceptedAt` to current time
- Invitation remains in database for audit trail

**Note**: This is an implicit relationship (no foreign key) because:
- User doesn't exist until invitation is accepted
- Invitation might expire without being accepted
- Invitation can be queried independently

---

## Data Validation

### Invitation Creation Validation

**Application-Level** (before database insert):
- Email format: Valid email address format
- Email uniqueness: Check no pending invitation exists for email (query Invitation where email = X and acceptedAt is null)
- Email not existing user: Check no User exists with email (query User where email = X)
- Role validation: Role must be Member or Viewer (not Admin)
- Token generation: Generate unique 64-character hex token

**Database-Level** (constraints):
- Email unique constraint
- Token unique constraint
- Foreign key constraint on invitedById
- Not null constraints on required fields

---

### Invitation Acceptance Validation

**Application-Level** (before user creation):
- Token validity: Invitation exists, not expired, not already accepted
  - Query: `Invitation.where(token = X).where(expiresAt > now()).where(acceptedAt is null)`
- Username uniqueness: Check no User exists with username
- Password strength: Use existing password validation (min 8 chars, etc.)
- Email matching: Ensure invitation email matches (if provided in request, though email comes from invitation)

**Database-Level** (constraints):
- Username unique constraint (existing User model)
- Email unique constraint (existing User model)
- Foreign key constraints (if applicable)

---

### User Creation Validation (Direct)

**Application-Level** (before database insert):
- Email format: Valid email address format
- Email uniqueness: Check no User exists with email
- Username uniqueness: Check no User exists with username
- Username format: 3-50 characters, alphanumeric + underscore (existing validation)
- Password strength: Min 8 characters (existing validation)
- Role validation: Role must be Member or Viewer (not Admin for created users)
- Admin check: Only admin users can create users (API-level check)

**Database-Level** (constraints):
- Email unique constraint (existing)
- Username unique constraint (existing)
- Not null constraints on required fields (existing)

---

## Indexes

### Invitation Indexes

**Primary Index**: `id` (UUID primary key)

**Unique Indexes**:
- `email` - Prevents duplicate invitations for same email
- `token` - Ensures token uniqueness (critical for security)

**Performance Indexes**:
- `token` - Fast lookups when accepting invitation by token
- `expiresAt` - Efficient queries for expired invitation cleanup
- `invitedById` - Fast queries for admin's sent invitations

**Query Patterns**:
1. Lookup by token: `WHERE token = ?` (acceptance flow) - Index on `token`
2. Check email exists: `WHERE email = ? AND acceptedAt IS NULL` (duplicate check) - Index on `email`
3. Find expired: `WHERE expiresAt < NOW() AND acceptedAt IS NULL` (cleanup) - Index on `expiresAt`
4. List admin's invitations: `WHERE invitedById = ?` (admin view) - Index on `invitedById`

---

## Migration Strategy

### Initial Migration

**Create Invitation table**:
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Member', 'Viewer')),
  invited_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX idx_invitations_invited_by_id ON invitations(invited_by_id);
```

**Add relation to User**:
- No schema change needed (Prisma handles relations)
- Application-level relation only

---

### Data Migration

**No data migration needed** - new feature, no existing data to migrate.

**Future**: If cleanup job is added, create migration to delete expired invitations older than 30 days (optional maintenance).

---

## Data Integrity

### Referential Integrity

**Invitation.invitedById** → **User.id**:
- Foreign key constraint with `onDelete: Cascade`
- If admin user is deleted, invitations are deleted (though admins shouldn't be deleted)

**Enforcement**:
- Database foreign key constraint
- Application-level validation before insert/update

---

### Business Logic Integrity

**One invitation per email**:
- Database unique constraint on `email`
- Application-level check before creating invitation

**Invitation can only be accepted once**:
- Application-level check: `acceptedAt IS NULL` before acceptance
- Set `acceptedAt` when accepting (atomic update)

**Invitation must not be expired**:
- Application-level check: `expiresAt > NOW()` before acceptance
- Database doesn't enforce this (application logic)

**Email must not already exist as user**:
- Application-level check before creating invitation
- Check `User` table for existing email

---

## Audit Trail

### Invitation Audit

**Fields tracked**:
- `invitedById`: Who sent invitation
- `createdAt`: When invitation was sent
- `acceptedAt`: When invitation was accepted (or null if not accepted)
- `expiresAt`: When invitation expires

**Use Cases**:
- Track who invited whom (admin accountability)
- Track invitation lifecycle (sent, pending, accepted, expired)
- Generate reports on invitation acceptance rates
- Audit trail for user creation method (direct vs invitation)

**Future Enhancement**: Add `revokedAt` field for manual revocation audit trail.

---

## Performance Considerations

### Query Optimization

**Invitation Lookup by Token**:
- Index on `token` ensures O(log n) lookup
- Critical path for invitation acceptance flow

**Email Uniqueness Check**:
- Unique index on `email` ensures fast duplicate checks
- Used when creating invitation

**Expired Invitation Cleanup**:
- Index on `expiresAt` for efficient cleanup queries
- Future: Scheduled job to delete expired invitations older than 30 days

**Admin's Invitations List**:
- Index on `invitedById` for fast queries
- Used in user management UI to show sent invitations

---

### Scaling Considerations

**Current Scale**: 5-50 users per instance, so invitations are infrequent.

**If Scale Increases**:
- Consider pagination for invitation list if >100 invitations
- Consider archiving accepted invitations (move to separate table after 90 days)
- Consider cleanup job for expired invitations (delete after 30 days)

**No Performance Concerns for MVP**: Expected volume is low.

---

## Security Considerations

### Token Security

**Token Generation**:
- Cryptographically secure: `crypto.randomBytes(32)` (256 bits of entropy)
- 64-character hex string: Sufficient entropy, collision probability negligible
- Unique constraint: Database enforces uniqueness

**Token Storage**:
- Stored in database (hashed tokens not needed, token is already secret)
- Not logged in application logs (security best practice)
- Only returned in response when email unavailable (admin can manually share)

---

### Data Protection

**Email Validation**:
- Validate email format before storing
- Prevent SQL injection via parameterized queries (Prisma handles this)

**Expiration Enforcement**:
- Application-level check (database doesn't enforce)
- Expired invitations return 404 (don't reveal existence of expired invitations)

**Acceptance Protection**:
- Check `acceptedAt IS NULL` before accepting
- Atomic update when accepting (set `acceptedAt` in same transaction as user creation)

---

## Future Schema Enhancements

### Potential Additions

**Deactivation Support** (future):
- Add `deactivatedAt` field to User model (soft delete)
- Or: Add `isActive` boolean field (simpler query)

**Invitation Revocation** (future):
- Add `revokedAt` field to Invitation model
- Check revocation before acceptance

**Invitation Resend** (future):
- Track `resendCount` in Invitation model
- Update `expiresAt` when resent (extend expiration)

**Bulk Invitation** (future):
- Create `BulkInvitation` model to group invitations
- Link individual invitations to bulk invitation for tracking

---

## Summary

**Schema Changes**:
- ✅ New `Invitation` model (required)
- ✅ Relation: `Invitation.invitedById` → `User.id` (required)
- ❌ No changes to existing `User` model (sufficient as-is)

**Migration Required**: Yes, create Invitation table and indexes.

**Backward Compatibility**: Fully backward compatible (additive changes only).

**Performance Impact**: Minimal (indexes support all query patterns).

**Security**: Secure token generation, proper validation, expiration enforcement.


# Research: Admin User Management

**Feature**: Admin User Management  
**Date**: 2025-01-XX  
**Status**: Complete

## Research Questions

### 1. User Creation vs Invitation

**Question**: Should we support both direct user creation (admin sets password) and email invitations (user sets their own password)?

**Decision**: Support both flows - direct creation for immediate onboarding, invitations for standard team expansion

**Rationale**:
- **Direct creation** provides immediate access when admin needs to set up accounts quickly (e.g., during onboarding, for contractors)
- **Email invitations** are standard practice for team expansion and allow users to set their own passwords (better security practice)
- Both patterns are common in tools like Linear (invitations), GitHub (both), and Jira (both)
- Self-hosted deployments benefit from flexibility (some may not have email configured initially)

**Alternatives considered**:
- Invitations only: Rejected - too restrictive, some deployments may not have email configured
- Direct creation only: Rejected - less secure, doesn't allow users to set own passwords

**Implementation**:
- Both flows will be available in Settings → Users
- Direct creation: Admin sets password, user account immediately active
- Invitation: Admin sends invitation, user receives email, sets password, account created

---

### 2. Email Service Configuration

**Question**: What email service configuration should be supported?

**Decision**: Start with SMTP support, create abstraction layer for future providers

**Rationale**:
- SMTP is the most universal and flexible for self-hosted deployments
- Self-hosted setups often have existing SMTP servers (internal mail servers, Postfix, etc.)
- Abstraction layer allows adding providers (SendGrid, SES, Mailgun) later without API changes
- Follows YAGNI principle - start simple, extend if needed

**Alternatives considered**:
- Multiple providers from start (SendGrid, SES, SMTP): Rejected - unnecessary complexity for MVP
- Provider-specific implementations only: Rejected - too limiting for self-hosted deployments

**Implementation**:
- Email service interface/abstraction
- SMTP implementation using `nodemailer` library
- Environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` (TLS)
- Optional: `SMTP_FROM` for custom sender address (defaults to user email or system email)
- Future: Add provider-specific implementations (SendGrid, AWS SES) behind abstraction

**Graceful degradation**:
- If email service not configured, show warning in invitation form
- Allow invitation creation but return invitation token in response
- Admin can manually share invitation link
- Consider adding email queue for retry when service becomes available (future)

---

### 3. Invitation Token Storage

**Question**: Where should invitation tokens be stored?

**Decision**: Database-stored tokens in `Invitation` model

**Rationale**:
- Better audit trail (who invited whom, when, expiration)
- Ability to revoke invitations (can mark as invalid in database)
- Can track invitation status (pending, accepted, expired)
- Easier to query and manage (list pending invitations, cleanup expired)
- Stateless JWT tokens would require separate token store for revocation anyway

**Alternatives considered**:
- Signed JWT tokens (stateless): Rejected - harder to revoke, no audit trail, no way to track pending invitations
- Cryptographic tokens (random bytes) in separate table: Similar to Invitation model, but Invitation model provides more context

**Implementation**:
- Create `Invitation` model in Prisma schema:
  - `id`: UUID (primary key)
  - `email`: String (unique, for preventing duplicate invitations)
  - `token`: String (unique, cryptographically secure random token, indexed for lookups)
  - `role`: UserRole (Member or Viewer)
  - `invitedById`: UUID (foreign key to User - admin who sent invitation)
  - `expiresAt`: DateTime (expiration time)
  - `acceptedAt`: DateTime? (nullable, set when accepted)
  - `createdAt`: DateTime
  - `updatedAt`: DateTime
- Token generation: Use `crypto.randomBytes(32).toString('hex')` for 64-character hex token
- Index on `token` for fast lookups
- Index on `email` for duplicate prevention
- Index on `expiresAt` for cleanup queries

**Future enhancement**: Add `revokedAt` field for manual revocation

---

### 4. Invitation Expiration

**Question**: Should invitation tokens expire? If so, what expiration time?

**Decision**: Yes, tokens expire after 7 days

**Rationale**:
- Security: Reduces risk if invitation link is leaked or compromised
- Best practice: Most systems use 7-14 days (GitHub uses 7 days for organization invitations)
- Balance: 7 days is long enough for users to check email, short enough to minimize security risk
- Not too short: Users may not check email immediately

**Alternatives considered**:
- 14 days: Too long for self-hosted environments (higher security risk)
- 3 days: Too short, users may miss invitation emails
- No expiration: Rejected - security risk if token leaked

**Implementation**:
- Set `expiresAt` to 7 days from creation time
- Check expiration when fetching invitation details
- Check expiration when accepting invitation
- Return 404 with appropriate error message if expired
- Consider cleanup job to remove expired invitations (future enhancement)

**Future enhancement**: Make expiration configurable via environment variable

---

### 5. User Management UI Scope

**Question**: What should admins be able to do with users? Create/invite only, or also update roles, deactivate, delete?

**Decision**: MVP: Create/invite only. Role updates and deactivation deferred to future

**Rationale**:
- **YAGNI principle**: Start with what's needed now (adding users)
- Role updates are less common and can be added later if needed
- Deactivation/deletion is complex (what happens to assigned issues, comments, etc.)
- Focus on core functionality first (add users), then enhance with management features

**Alternatives considered**:
- Full user lifecycle management: Rejected - too complex for MVP, adds unnecessary scope
- Role updates only: Rejected - still complex, not highest priority

**Implementation (MVP)**:
- Create user directly
- Send invitation
- View user list
- View invitation list (optional)

**Future enhancements**:
- Update user role (Member ↔ Viewer)
- Deactivate user (soft delete, keeps history but prevents login)
- Delete user (hard delete, complex - requires handling assigned issues)
- Resend invitation
- Revoke invitation

---

### 6. UI Location

**Question**: Where should user management live? Settings → Users, or separate Admin section?

**Decision**: Settings → Users (similar to Project Settings pattern)

**Rationale**:
- Follows existing pattern: Project Settings is in Settings → Configuration
- Settings is logical place for administrative functions
- Consistent with common patterns (GitHub: Settings → Members, Linear: Settings → Team)
- No need for separate Admin section (only one admin function for now)

**Alternatives considered**:
- Separate Admin section: Rejected - unnecessary complexity, Settings is sufficient
- Dashboard → Admin: Rejected - less discoverable, Settings is more intuitive

**Implementation**:
- Add "Users" link to Settings navigation
- Route: `/settings/users`
- Page: `apps/web/app/settings/users/page.tsx`
- Access control: Admin-only (redirect to 403 if not admin)
- Display user list and invitation/create forms

**Future**: If more admin functions are added (system configuration, etc.), consider consolidating in Settings → Admin

---

### 7. Graceful Degradation for Email

**Question**: What should happen when email service is unavailable?

**Decision**: Allow invitation creation but return token in response, with clear warning and manual sharing option

**Rationale**:
- **Flexibility**: Some self-hosted deployments may not have email configured initially
- **Usability**: Don't block admin from inviting users if email temporarily unavailable
- **Security**: Token is still secure, just requires manual sharing instead of email
- **Transparency**: Clear warning so admin knows email wasn't sent

**Alternatives considered**:
- Block invitations when email unavailable: Rejected - too restrictive, blocks functionality
- Queue invitations for later: Considered but deferred - adds complexity, can add later if needed

**Implementation**:
- Check email service availability on invitation endpoint
- If unavailable:
  - Return 503 Service Unavailable with message
  - OR: Allow invitation creation but include token in response with warning
  - Show warning banner in UI: "Email service not configured. Share invitation link manually: [link]"
  - Display invitation token/URL prominently in response
- Clear documentation on email configuration
- Option to configure email later and resend invitations (future enhancement)

**Recommendation**: Start with allowing creation but returning token with warning. If email unavailable, provide clear manual sharing path.

---

## Technical Decisions

### Email Service Abstraction

**Decision**: Create `EmailService` interface with SMTP implementation

**Interface**:
```typescript
interface EmailService {
  /**
   * Send invitation email to user
   * @throws EmailServiceError if service unavailable or send fails
   */
  sendInvitation(params: {
    to: string;
    token: string;
    invitedByName: string | null;
    expiresAt: Date;
    inviteUrl: string; // Full URL for invitation acceptance
  }): Promise<void>;

  /**
   * Check if email service is configured and available
   */
  isAvailable(): Promise<boolean>;
}
```

**Implementation**: SMTP using `nodemailer`
- Library: `nodemailer` (standard Node.js email library)
- Configuration via environment variables
- Error handling: Catch and wrap errors as `EmailServiceError`
- Availability check: Attempt connection or check env vars

**Future**: Add implementations for SendGrid, AWS SES, Mailgun behind same interface

---

### Invitation Token Generation

**Decision**: Cryptographically secure random tokens using `crypto.randomBytes`

**Implementation**:
```typescript
import { randomBytes } from 'crypto';

function generateInvitationToken(): string {
  // Generate 32 random bytes, convert to hex (64 characters)
  return randomBytes(32).toString('hex');
}
```

**Security**:
- 64-character hex string = 256 bits of entropy
- Cryptographically secure (uses OS CSPRNG)
- Unique with very high probability (collision unlikely)

**Storage**: Store in `Invitation.token` field (unique, indexed)

---

### Invitation URL Format

**Decision**: `/invite/[token]` with full URL in email

**Format**:
- Route: `/invite/[token]`
- Example: `https://stride.example.com/invite/abc123def456...`

**Rationale**:
- Simple, clean URL
- Token is secret (cryptographically secure, 64 chars)
- Works with or without email (manual sharing)
- Standard pattern (similar to password reset links)

**Implementation**:
- Use `BASE_URL` environment variable for full URL in email
- Fallback to request origin if not configured
- Display full URL in admin response if email unavailable

---

### User List Display

**Decision**: Simple table/card list with basic information (MVP)

**Columns/Fields**:
- Email
- Username
- Name (if set)
- Role (badge: Admin, Member, Viewer)
- Created date
- Status (optional: Active, Pending Invitation)

**Rationale**:
- MVP: Simple list is sufficient for 5-50 users
- Can add search/pagination later if needed (YAGNI)
- Focus on core functionality first

**Future enhancements**:
- Search by email/username
- Filter by role
- Sort by name, created date, role
- Pagination (if >50 users)
- User actions (edit, deactivate) - future

---

## Open Questions / Future Considerations

1. **Invitation resend**: Should admins be able to resend expired invitations?
   - **Future enhancement**: Add "Resend" button for expired invitations
   - Regenerate token or extend expiration?

2. **Invitation revocation**: Should admins be able to revoke pending invitations?
   - **Future enhancement**: Add `revokedAt` field to Invitation model
   - Mark as revoked instead of deleting (audit trail)

3. **Bulk user import**: Should admins be able to import multiple users via CSV?
   - **Future enhancement**: CSV import with email invitations
   - Useful for onboarding large teams

4. **User profile management**: Should admins be able to edit user profiles (name, email)?
   - **Future enhancement**: Edit user details
   - Consider email change implications (requires re-verification)

5. **Email delivery tracking**: Should we track if invitation emails were delivered?
   - **Future enhancement**: Webhook from email provider
   - Mark invitation as "sent" or "delivered"

6. **Invitation reminders**: Should we send reminder emails for pending invitations?
   - **Future enhancement**: Automatic reminders after 3-5 days
   - Configurable via environment variable

7. **Role updates**: When should admins be able to change user roles?
   - **Future enhancement**: Add "Edit Role" action in user list
   - Consider implications (permissions change immediately)

8. **User deactivation**: What should happen to deactivated users' assigned issues?
   - **Future enhancement**: Soft delete or deactivate users
   - Unassign from issues, keep history
   - Consider: Prevent login vs keep access to assigned issues?

---

## References

- Existing User model: `packages/database/prisma/schema.prisma`
- Existing auth patterns: `apps/web/app/api/auth/register/route.ts`
- Existing permission checks: `apps/web/src/lib/auth/permissions.ts` (if exists)
- Settings navigation: `apps/web/app/settings/layout.tsx` (if exists)
- Password validation: `apps/web/src/lib/validation/user.ts` (if exists)

## Best Practices Researched

### Security Best Practices
- Invitation tokens should be cryptographically secure and unique
- Tokens should expire (7-14 days standard)
- Tokens should be one-time use (mark as accepted when used)
- Email validation prevents invalid invitations

### UX Best Practices
- Both creation and invitation flows are common patterns
- Clear error messages for common issues (duplicate email, expired token)
- Auto-login after invitation acceptance improves onboarding
- Manual link sharing provides fallback when email unavailable

### Self-Hosted Considerations
- SMTP is most flexible for self-hosted deployments
- Graceful degradation when email not configured
- Environment variable configuration is standard
- Abstraction layer allows flexibility for different deployments


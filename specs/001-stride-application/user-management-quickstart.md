# Quickstart: Admin User Management

**Feature**: Admin User Management  
**Created**: 2025-01-XX  
**Status**: Planning Complete

## Overview

This quickstart guide covers how to use the admin user management features to add new users to your Stride instance. Admins can either create users directly or send email invitations.

## Prerequisites

- Admin user account (first user created during onboarding becomes admin)
- (Optional) Email service configured if using invitations

## Email Service Configuration (Optional)

**The application works fully without SMTP configuration.** Email is only required for automatic invitation emails.

If SMTP is not configured:
- ✅ All core features work normally
- ✅ User creation works (direct creation only)
- ✅ Invitations can be created (manual link sharing)
- ❌ Automatic email invitations are disabled

**To enable email invitations**, configure SMTP in your environment variables. See the [SMTP Integration Guide](../../docs/integrations/smtp.md) for detailed setup instructions and troubleshooting.

**Quick setup** (add to your `.env` file):
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_SECURE=false  # false for STARTTLS (port 587), true for SSL (port 465)
SMTP_FROM=noreply@example.com  # Optional, defaults to SMTP_USER
```

**Supported SMTP services**: SendGrid, AWS SES, Mailgun, Gmail, Microsoft 365, or any self-hosted mail server (Postfix, Exim, etc.)

**If email is not configured**: You can still create invitations and manually share the invitation link via any communication method (Slack, Teams, direct email, etc.).

---

## Adding Users

### Option 1: Create User Directly

**When to use**: When you need immediate access for a user (e.g., during onboarding, contractors).

**Steps**:

1. **Navigate to User Management**:
   - Go to Settings → Users
   - Ensure you're logged in as admin

2. **Fill in User Creation Form**:
   - **Email**: User's email address (required)
   - **Username**: Unique username (required, 3-50 characters, alphanumeric + underscore)
   - **Password**: Set password for user (required, minimum 8 characters)
   - **Confirm Password**: Re-enter password (must match)
   - **Name**: Display name (optional)
   - **Role**: Select Member or Viewer (required, Admin not allowed)

3. **Create User**:
   - Click "Create User" button
   - User account is immediately created and active
   - User can log in with the email/username and password you set

**Example**:
```
Email: newuser@example.com
Username: newuser
Password: SecurePassword123!
Name: New User
Role: Member
```

**Result**: User account is created immediately. User can log in right away.

---

### Option 2: Send Email Invitation

**When to use**: Standard team expansion (recommended - allows users to set their own passwords).

**Steps**:

1. **Navigate to User Management**:
   - Go to Settings → Users
   - Ensure you're logged in as admin

2. **Fill in Invitation Form**:
   - **Email**: User's email address (required)
   - **Role**: Select Member or Viewer (required, Admin not allowed)

3. **Send Invitation**:
   - Click "Send Invitation" button
   - Invitation email is sent to the user (if email configured)
   - Invitation expires in 7 days

**Example**:
```
Email: invited@example.com
Role: Member
```

**Result**: 
- User receives email with invitation link
- User clicks link, sets username and password, account is created
- User is automatically logged in

**If Email Unavailable**:
- Invitation is still created
- Admin receives invitation token and link
- Admin can manually share the link with the user
- Link format: `https://stride.example.com/invite/[token]`

---

## Accepting Invitations (For Invited Users)

When a user receives an invitation email, they can accept it by following these steps:

1. **Open Invitation Email**:
   - Find email from Stride with subject "Invitation to join Stride"
   - Click invitation link (or copy/paste link if shared manually)

2. **View Invitation Details**:
   - Page shows invitation details: email, role, invited by, expiration
   - Verify details are correct

3. **Create Account**:
   - **Username**: Choose unique username (required, 3-50 characters, alphanumeric + underscore)
   - **Password**: Set password (required, minimum 8 characters)
   - **Confirm Password**: Re-enter password (must match)
   - **Name**: Display name (optional)
   - Click "Create Account" button

4. **Account Created**:
   - Account is created with role from invitation
   - User is automatically logged in
   - User is redirected to dashboard

**Example**:
```
Invitation Link: https://stride.example.com/invite/abc123def456...

Username: inviteduser
Password: MySecurePassword123!
Name: Invited User
```

**Result**: User account created, user is logged in automatically.

---

## Viewing Users

Admins can view all users in the system:

1. **Navigate to User Management**:
   - Go to Settings → Users
   - User list is displayed automatically

2. **View User List**:
   - Table shows: Email, Username, Name, Role, Created Date
   - Users are sorted by creation date (newest first)

3. **Filter/Search** (future):
   - Filter by role
   - Search by email/username

---

## Common Scenarios

### Scenario 1: Onboarding New Team Member

**Best Practice**: Use email invitation

1. Admin sends invitation to team member's email
2. Team member receives email, clicks link
3. Team member sets username and password
4. Team member has account with appropriate role

**Benefits**: User sets their own password (better security), standard onboarding flow

---

### Scenario 2: Setting Up Service Account or Bot

**Best Practice**: Use direct creation

1. Admin creates user account directly
2. Admin sets password
3. Account is immediately active
4. Credentials are stored securely for service use

**Benefits**: Immediate access, admin controls password

---

### Scenario 3: Email Not Configured

**Workaround**: Manual invitation sharing

1. Admin sends invitation (invitation is created but email not sent)
2. Admin receives invitation token/link in response
3. Admin shares link manually with user (e.g., Slack, email from personal account)
4. User clicks link and creates account

**Benefits**: Works without email service, same security

---

## Troubleshooting

### Invitation Expired

**Problem**: Invitation link shows "Invitation not found or expired"

**Solution**:
- Invitations expire after 7 days
- Admin can send new invitation
- Future: Admin can resend invitation (enhancement)

---

### Email Not Sending

**Problem**: Invitation form shows "Email service not configured"

**Solution**:
1. Check SMTP configuration in environment variables
2. Verify SMTP credentials are correct
3. Check network connectivity to SMTP server
4. Use manual invitation sharing as workaround

---

### Username Already Exists

**Problem**: Error when creating user or accepting invitation: "Username already exists"

**Solution**:
- Username must be unique across all users
- Choose different username
- System checks uniqueness before creating account

---

### Email Already in Use

**Problem**: Error when sending invitation: "Email already belongs to existing user"

**Solution**:
- Email address is already associated with a user account
- User may already have an account
- Check if user can log in with existing account

---

### Pending Invitation Exists

**Problem**: Error when sending invitation: "Pending invitation already exists for this email"

**Solution**:
- An invitation was already sent to this email and not yet accepted
- Wait for user to accept or resend invitation (future enhancement)
- Can create user directly instead of sending invitation

---

## Security Best Practices

1. **Use Invitations for Standard Onboarding**:
   - Allows users to set their own passwords
   - Standard security practice

2. **Direct Creation for Service Accounts**:
   - Only use for bots/service accounts
   - Store credentials securely

3. **Protect Invitation Links**:
   - Invitation links contain secret tokens
   - Share links securely (private channels)
   - Links expire after 7 days

4. **Role Assignment**:
   - Only assign appropriate roles (Member or Viewer)
   - Admin role cannot be assigned (only created during initial setup)

5. **Email Verification**:
   - Users created via invitation should verify email (future enhancement)
   - Directly created users may need manual verification

---

## API Usage (For Developers)

### Create User Programmatically

```typescript
// POST /api/users
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie // Admin session
  },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'newuser',
    password: 'SecurePassword123!',
    name: 'New User',
    role: 'Member'
  })
});
```

### Send Invitation Programmatically

```typescript
// POST /api/users/invite
const response = await fetch('/api/users/invite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie // Admin session
  },
  body: JSON.stringify({
    email: 'invited@example.com',
    role: 'Member'
  })
});
```

### Accept Invitation Programmatically

```typescript
// POST /api/users/invite/[token]
const response = await fetch(`/api/users/invite/${token}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'inviteduser',
    password: 'MySecurePassword123!',
    name: 'Invited User'
  })
});
```

---

## Next Steps

After adding users:

1. **User Login**: New users can log in with their credentials
2. **Role-Based Access**: Users have appropriate permissions based on role:
   - **Member**: Can create/edit issues, manage sprints
   - **Viewer**: Read-only access
   - **Admin**: Full access including user management

3. **Future Enhancements**:
   - Role updates (change user roles)
   - User deactivation
   - Bulk user import
   - Invitation resend
   - Email verification

---

## Related Documentation

- [Implementation Plan](./user-management-plan.md)
- [Research](./user-management-research.md)
- [Data Model](./user-management-data-model.md)
- [API Contracts](./user-management-contracts.md)


# Local Testing Guide: User Management Feature

**Purpose**: Step-by-step guide for testing user management features locally without paying for email services  
**Target Audience**: Developers testing the user management implementation  
**Last Updated**: 2025-01-09

## Table of Contents

- [Quick Start](#quick-start)
- [Testing Without Email (Manual Link Sharing)](#testing-without-email-manual-link-sharing)
- [Testing With Email (Free Local SMTP Server)](#testing-with-email-free-local-smtp-server)
- [Complete Testing Checklist](#complete-testing-checklist)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Quick Start

### Prerequisites

1. **Database running** (Docker or local PostgreSQL)
2. **Application running** in development mode
3. **Admin account created** (first user is admin)

### Start Everything

```bash
# 1. Start database
./scripts/db-start.sh
# OR: docker compose up -d stride-postgres

# 2. Run migrations
pnpm --filter @stride/database db:deploy

# 3. Start development server
pnpm --filter @stride/web dev
```

### Access Points

- **Application**: http://localhost:3000
- **User Management**: http://localhost:3000/settings/users (admin only)
- **Database Browser (Prisma Studio)**: http://localhost:5555 (run `pnpm --filter @stride/database db:studio`)

---

## Testing Without Email (Manual Link Sharing)

**This is the simplest approach** - no email service needed. Invitations will show a link that you can copy and share manually.

### Setup

1. **Ensure SMTP is NOT configured** in your `.env`:
   ```env
   # Don't set SMTP variables, or comment them out
   # SMTP_HOST=
   # SMTP_PORT=
   ```

2. **Start the application** (see Quick Start above)

### Testing Steps

#### 1. Create Admin Account (First User)

1. Navigate to http://localhost:3000
2. You should see the setup page (if no users exist)
3. Create your admin account:
   - Email: `admin@example.com`
   - Username: `admin`
   - Password: `password123`
   - Name: `Admin User`
4. Login with these credentials

#### 2. Test User Management Page

1. Navigate to http://localhost:3000/settings/users
2. You should see:
   - ✅ Page loads without errors
   - ✅ "Create User" and "Invite User" buttons visible
   - ✅ User list shows your admin user

#### 3. Test Direct User Creation

1. Click **"Create User"** button
2. Fill in the form:
   - Email: `member@example.com`
   - Username: `member1`
   - Password: `password123`
   - Confirm Password: `password123`
   - Name: `Test Member`
   - Role: `Member`
3. Click **"Create User"**
4. Verify:
   - ✅ Success toast appears
   - ✅ User appears in the user list
   - ✅ User can login with those credentials

#### 4. Test Invitation Flow (Manual Link)

1. Click **"Invite User"** button
2. Fill in the form:
   - Email: `viewer@example.com`
   - Role: `Viewer`
3. Click **"Send Invitation"**
4. Verify:
   - ✅ Warning message appears: "Email service not configured"
   - ✅ Invitation link is displayed in a text field
   - ✅ "Copy" button is available

5. **Copy the invitation link** (e.g., `http://localhost:3000/invite/abc123...`)

6. **Open the link in a new browser tab** (or incognito/private window)

7. Verify invitation page:
   - ✅ Page loads showing invitation details
   - ✅ Email: `viewer@example.com`
   - ✅ Role: `Viewer`
   - ✅ Expiration date is shown
   - ✅ Form fields for username, password, name are visible

8. **Accept the invitation**:
   - Username: `viewer1`
   - Password: `password123`
   - Confirm Password: `password123`
   - Name: `Test Viewer`
   - Click **"Create Account"**

9. Verify:
   - ✅ Success message appears
   - ✅ Auto-redirected to dashboard
   - ✅ User is logged in
   - ✅ User can access the application with Viewer role

#### 5. Test Role-Based Access

1. **Logout** from admin account
2. **Login as the Member** user (`member@example.com` / `password123`)
3. Navigate to http://localhost:3000/settings/users
4. Verify:
   - ✅ Redirected to `/settings` (403 - not admin)
   - ✅ No "Users" option in navigation

5. **Logout and login as Viewer** (`viewer@example.com` / `password123`)
6. Navigate to http://localhost:3000/settings/users
7. Verify:
   - ✅ Redirected to `/settings` (403 - not admin)

#### 6. Test Invalid/Expired Invitations

1. **Create an invitation** and copy the link
2. **Accept it** to create a user
3. **Try to use the same link again**
4. Verify:
   - ✅ Error message: "This invitation has already been accepted"

5. **Create another invitation**
6. **Manually expire it in database**:
   ```bash
   docker compose exec stride-postgres psql -U stride -d stride
   # In psql:
   UPDATE invitations SET "expiresAt" = NOW() - INTERVAL '1 day' WHERE email = 'test@example.com';
   ```
7. **Open the invitation link**
8. Verify:
   - ✅ Error message: "This invitation has expired"

---

## Testing With Email (Free Local SMTP Server)

**MailHog** is a free, open-source email testing tool that runs locally. It captures all emails and provides a web interface to view them.

### Setup MailHog

#### Option 1: Docker (Recommended)

Add to your `docker-compose.yml`:

```yaml
  mailhog:
    image: mailhog/mailhog:latest
    container_name: stride-mailhog
    ports:
      - "1025:1025"  # SMTP port
      - "8025:8025"  # Web UI port
    networks:
      - stride-network
```

Then start it:
```bash
docker compose up -d mailhog
```

#### Option 2: Local Installation

```bash
# macOS
brew install mailhog

# Linux (or download binary from GitHub)
# https://github.com/mailhog/MailHog/releases
```

Start MailHog:
```bash
mailhog
```

### Configure Application

Update your `.env` file:

```env
# SMTP Configuration for MailHog
SMTP_HOST=localhost          # Or 127.0.0.1
SMTP_PORT=1025               # MailHog SMTP port
SMTP_USER=                   # Leave empty (MailHog doesn't require auth)
SMTP_PASSWORD=               # Leave empty
SMTP_SECURE=false            # MailHog doesn't use TLS
SMTP_FROM=noreply@stride.local
```

**If using Docker Compose**, use the service name:
```env
SMTP_HOST=mailhog
SMTP_PORT=1025
```

### Restart Application

```bash
# Stop and restart the dev server
pnpm --filter @stride/web dev
```

### Access MailHog Web UI

Open http://localhost:8025 in your browser. All emails sent by the application will appear here.

### Test Email Invitations

1. Navigate to http://localhost:3000/settings/users
2. Click **"Invite User"**
3. Fill in:
   - Email: `newuser@example.com`
   - Role: `Member`
4. Click **"Send Invitation"**
5. Verify:
   - ✅ Success message: "Invitation sent successfully"
   - ✅ **No manual link shown** (email was sent)
6. **Check MailHog** at http://localhost:8025:
   - ✅ Email appears in the inbox
   - ✅ Email contains invitation link
   - ✅ Email has proper formatting
7. **Click the invitation link in the email** (or copy it)
8. **Complete the invitation acceptance** as described above

---

## Complete Testing Checklist

### ✅ User Management Page

- [ ] Page accessible at `/settings/users` (admin only)
- [ ] Non-admins redirected to `/settings`
- [ ] User list displays correctly
- [ ] Sorting works (by email, username, name, created date)
- [ ] Role badges display correctly (Admin=red, Member=green, Viewer=blue)
- [ ] Created date formatted correctly

### ✅ Create User Form

- [ ] Form displays all fields (email, username, password, confirmPassword, name, role)
- [ ] Email validation works
- [ ] Username validation works (min 3 chars, alphanumeric + underscore)
- [ ] Password validation works (min 8 chars)
- [ ] Password confirmation match validation works
- [ ] Role dropdown shows only "Member" and "Viewer" (no Admin option)
- [ ] Form submission shows loading state
- [ ] Success toast appears on success
- [ ] User list refreshes after successful creation
- [ ] Error messages display for duplicate email/username
- [ ] Can cancel form (hides form)

### ✅ Invite User Form

- [ ] Form displays email and role fields
- [ ] Email validation works
- [ ] Role dropdown shows "Member" and "Viewer"
- [ ] Form submission shows loading state
- [ ] **Without SMTP**: Manual link appears with copy button
- [ ] **With SMTP**: Success message appears, email sent (check MailHog)
- [ ] Error handling for duplicate email
- [ ] Error handling for existing user
- [ ] Can cancel form

### ✅ Invitation Acceptance Page

- [ ] Page accessible at `/invite/[token]` (public, no auth required)
- [ ] Valid invitation shows invitation details:
  - [ ] Email
  - [ ] Role badge
  - [ ] Invited by name (if available)
  - [ ] Expiration date
- [ ] Expired invitation shows error message
- [ ] Already-accepted invitation shows error message
- [ ] Invalid token shows 404 error
- [ ] Form fields work (username, password, confirmPassword, name)
- [ ] Username validation works
- [ ] Password validation works
- [ ] Form submission creates user account
- [ ] Auto-login works after acceptance
- [ ] Redirects to dashboard after success

### ✅ Role-Based Access Control

- [ ] Admin can access `/settings/users`
- [ ] Member cannot access `/settings/users` (redirected)
- [ ] Viewer cannot access `/settings/users` (redirected)
- [ ] Admin can create users
- [ ] Admin can invite users
- [ ] Non-admin cannot see "Users" in settings navigation (if implemented)

### ✅ API Endpoints

Test using curl or Postman:

```bash
# Get users (requires admin auth)
curl http://localhost:3000/api/users \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# Create user (requires admin auth)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "role": "Member"
  }'

# Create invitation (requires admin auth)
curl -X POST http://localhost:3000/api/users/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{
    "email": "invite@example.com",
    "role": "Viewer"
  }'

# Get invitation (public, no auth)
curl http://localhost:3000/api/users/invite/TOKEN_HERE

# Accept invitation (public, no auth)
curl -X POST http://localhost:3000/api/users/invite/TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "name": "New User"
  }'
```

---

## Common Issues & Troubleshooting

### Issue: "Email service not configured" even though SMTP is set

**Solution**:
1. Check that all SMTP variables are set in `.env`
2. Restart the development server (env vars are loaded at startup)
3. Check that `SMTP_HOST` is correct:
   - Local MailHog: `localhost` or `127.0.0.1`
   - Docker MailHog: `mailhog` (service name)

### Issue: Cannot access `/settings/users`

**Solution**:
1. Ensure you're logged in as an admin user
2. Check user role in database:
   ```sql
   SELECT id, email, role FROM users;
   ```
3. First user is automatically admin. Subsequent users need to be created as admin manually in database (for testing)

### Issue: Invitation link doesn't work

**Solution**:
1. Check that `NEXT_PUBLIC_APP_URL` is set correctly in `.env`
2. Ensure the token is valid (not expired, not already accepted)
3. Check browser console for errors
4. Verify the invitation exists in database:
   ```sql
   SELECT * FROM invitations WHERE token = 'YOUR_TOKEN';
   ```

### Issue: MailHog not receiving emails

**Solution**:
1. Check MailHog is running: http://localhost:8025
2. Verify SMTP configuration in `.env`
3. Check application logs for SMTP errors
4. If using Docker, ensure containers are on the same network
5. Test SMTP connection:
   ```bash
   # From within web container (if using Docker)
   docker compose exec web telnet mailhog 1025
   ```

### Issue: Database connection errors

**Solution**:
1. Ensure database is running: `docker compose ps stride-postgres`
2. Check `DATABASE_URL` in `.env` is correct
3. Verify migrations ran: `pnpm --filter @stride/database db:deploy`
4. Check database logs: `docker compose logs stride-postgres`

---

## Quick Testing Script

Create a simple test script to verify everything works:

```bash
#!/bin/bash
# test-user-management.sh

echo "🧪 Testing User Management Feature"
echo "=================================="

# Check if app is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Application not running on http://localhost:3000"
    exit 1
fi

echo "✅ Application is running"

# Check if database is accessible
if ! docker compose exec -T stride-postgres psql -U stride -d stride -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Database not accessible"
    exit 1
fi

echo "✅ Database is accessible"

# Check if admin user exists
ADMIN_COUNT=$(docker compose exec -T stride-postgres psql -U stride -d stride -t -c "SELECT COUNT(*) FROM users WHERE role = 'Admin';" | tr -d ' ')

if [ "$ADMIN_COUNT" -eq "0" ]; then
    echo "⚠️  No admin user found. Create one at http://localhost:3000/setup"
else
    echo "✅ Admin user exists"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Navigate to http://localhost:3000/settings/users"
echo "2. Test creating a user"
echo "3. Test inviting a user"
echo "4. Test accepting an invitation"
```

Save as `scripts/test-user-management.sh` and run:
```bash
chmod +x scripts/test-user-management.sh
./scripts/test-user-management.sh
```

---

## Tips for Effective Testing

1. **Use Browser DevTools**: Check Network tab for API requests, Console for errors
2. **Use Prisma Studio**: Visual database browser at http://localhost:5555
   ```bash
   pnpm --filter @stride/database db:studio
   ```
3. **Use Incognito/Private Windows**: Test invitation acceptance as a different user
4. **Check Server Logs**: Watch terminal where `pnpm dev` is running for errors
5. **Test Edge Cases**: Expired invitations, duplicate emails, invalid tokens
6. **Test Mobile Responsiveness**: Resize browser or use device emulation

---

## Need Help?

- Check application logs in terminal
- Check browser console for client errors
- Verify database state with Prisma Studio
- Review API responses in Network tab
- Check environment variables are loaded correctly

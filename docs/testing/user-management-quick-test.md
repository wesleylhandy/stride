---
purpose: 5-minute quick start guide for testing user management features locally
targetAudience: Developers testing the user management implementation
lastUpdated: 2026-01-12
---

# Quick Test Guide: User Management

**5-Minute Quick Start** for testing user management features locally.

## Prerequisites Check

```bash
# Check if database is running
docker compose ps stride-postgres

# Check if app is running
curl -s http://localhost:3000 > /dev/null && echo "✅ App running" || echo "❌ App not running"
```

## Option 1: Test Without Email (Fastest - 2 minutes)

**No setup needed!** Invitations work via manual link sharing.

### Steps:

1. **Start services**:
   ```bash
   ./scripts/db-start.sh
   pnpm --filter @stride/database db:deploy
   pnpm --filter @stride/web dev
   ```

2. **Create admin account** (if first run):
   - Go to http://localhost:3000
   - Create admin user

3. **Test User Management**:
   - Go to http://localhost:3000/settings/users
   - Click "Invite User"
   - Enter: `test@example.com`, Role: `Member`
   - **Copy the invitation link** shown in the warning box
   - Open link in new tab/incognito
   - Create account: username `testuser`, password `test123`
   - ✅ Should auto-login and redirect to dashboard

**Done!** You've tested the full invitation flow without any email setup.

---

## Option 2: Test With Email (5 minutes)

### Setup MailHog (Free Local Email Server)

1. **Start MailHog**:
   ```bash
   docker compose up -d mailhog
   ```

2. **Configure `.env`**:
   ```env
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_USER=test
   SMTP_PASSWORD=test
   SMTP_SECURE=false
   SMTP_FROM=noreply@stride.local
   ```

3. **Restart app**:
   ```bash
   # Stop current dev server (Ctrl+C) and restart
   pnpm --filter @stride/web dev
   ```

4. **Test**:
   - Go to http://localhost:3000/settings/users
   - Click "Invite User"
   - Enter: `test2@example.com`, Role: `Viewer`
   - ✅ Should show "Invitation sent successfully" (no manual link)
   - **Check MailHog** at http://localhost:8025
   - Click the invitation link in the email
   - Complete account creation

---

## Quick Test Checklist

- [ ] Can access `/settings/users` as admin
- [ ] Non-admin redirected from `/settings/users`
- [ ] Can create user directly (Create User button)
- [ ] Can invite user (Invite User button)
- [ ] Without SMTP: Manual link appears
- [ ] With SMTP: Email sent (check MailHog)
- [ ] Invitation link works
- [ ] Can create account via invitation
- [ ] Auto-login works after invitation acceptance
- [ ] User list shows all users
- [ ] Role badges display correctly

---

## Troubleshooting

**"Cannot access /settings/users"**
- Make sure you're logged in as admin
- First user is automatically admin

**"Email service not configured" (when SMTP is set)**
- Restart dev server after changing `.env`
- Check SMTP variables are correct

**Invitation link doesn't work**
- Check token is valid (not expired/used)
- Verify `NEXT_PUBLIC_APP_URL` in `.env`

**MailHog not receiving emails**
- Check it's running: http://localhost:8025
- Verify SMTP_HOST=localhost in `.env`

---

For detailed testing guide, see: [user-management-local-testing.md](./user-management-local-testing.md)

# SMTP Email Configuration

**Status**: Optional  
**Required For**: Email invitation feature  
**App Functionality**: Works fully without SMTP configuration

## Overview

Stride supports email invitations for user management. Email functionality is **optional** - the application works perfectly without it. When SMTP is not configured:

- ✅ All core features work normally
- ✅ User creation works (direct creation only)
- ✅ Invitations can be created (manual link sharing)
- ❌ Email invitations are disabled (no automatic email sending)

If you want to enable email invitations, configure SMTP using any SMTP-compatible email service.

---

## Quick Setup

### Option 1: Third-Party SMTP Service (Recommended)

**Popular Services**:
- **SendGrid**: Free tier (100 emails/day)
- **AWS SES**: Pay-as-you-go (free tier available)
- **Mailgun**: Free tier (5,000 emails/month)
- **Gmail SMTP**: Free (with app password)
- **Microsoft 365**: Requires Office 365 subscription

### Option 2: Self-Hosted Mail Server

- **Postfix**: Linux mail server
- **Exim**: Unix mail server
- **Internal corporate mail server**: Use existing infrastructure

---

## Configuration

Add these environment variables to your `.env` file:

```env
# SMTP Configuration (Optional)
SMTP_HOST=smtp.example.com          # SMTP server hostname
SMTP_PORT=587                        # SMTP port (587 for TLS, 465 for SSL, 25 for unencrypted)
SMTP_USER=your-email@example.com     # SMTP authentication username
SMTP_PASSWORD=your-smtp-password     # SMTP authentication password
SMTP_SECURE=false                    # true for SSL (port 465), false for STARTTLS (port 587)
SMTP_FROM=noreply@your-domain.com    # Optional: Sender email (defaults to SMTP_USER)
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | Yes* | - | SMTP server hostname (required if using email) |
| `SMTP_PORT` | Yes* | `587` | SMTP port: `587` (TLS), `465` (SSL), `25` (unencrypted) |
| `SMTP_USER` | Yes* | - | SMTP authentication username (required if using email) |
| `SMTP_PASSWORD` | Yes* | - | SMTP authentication password (required if using email) |
| `SMTP_SECURE` | No | `false` | Set to `true` for SSL (port 465), `false` for STARTTLS |
| `SMTP_FROM` | No | `SMTP_USER` | Default sender email address |

*Required only if you want to enable email invitations

---

## Configuration Examples

### Gmail (with App Password)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Generate in Google Account settings
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

**Note**: Gmail requires an [App Password](https://support.google.com/accounts/answer/185833) for third-party apps. Regular passwords won't work.

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-verified-domain.com
```

### Self-Hosted Postfix

```env
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your-mailbox-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

---

## Verification

### Check if SMTP is Configured

The application automatically detects SMTP configuration on startup. Check the logs:

```bash
# If configured correctly:
✅ SMTP email service initialized successfully

# If not configured:
⚠️ SMTP email service not configured. Missing required environment variables.
```

### Test Email Sending

1. **Via UI**: Go to Settings → Users → Send Invitation
   - If SMTP is configured: Email is sent automatically
   - If SMTP is not configured: You'll see a message with the invitation link to share manually

2. **Check Logs**: After sending an invitation:
   ```bash
   ✅ Invitation email sent successfully
   ```

---

## Troubleshooting

### "Email service is not available"

**Cause**: SMTP environment variables are missing or incorrect.

**Solution**: 
1. Verify all required environment variables are set
2. Check that variables are loaded correctly (restart application after changes)
3. Verify SMTP credentials are correct
4. Check firewall allows outbound connections on SMTP port

### "Failed to send invitation email"

**Common Causes**:
- **Authentication failed**: Check `SMTP_USER` and `SMTP_PASSWORD`
- **Connection timeout**: Check `SMTP_HOST` and `SMTP_PORT`
- **TLS/SSL issues**: Verify `SMTP_SECURE` matches your port (false for 587, true for 465)
- **Firewall blocking**: Ensure outbound SMTP connections are allowed

**Debugging**:
1. Test SMTP connection manually:
   ```bash
   telnet smtp.example.com 587
   ```
2. Check application logs for detailed error messages
3. Verify SMTP server allows connections from your application's IP

### Gmail-specific Issues

- **"Less secure app access"**: Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- **2FA required**: App Passwords only work with 2FA enabled
- **Rate limits**: Gmail has daily sending limits (~500 emails/day for free accounts)

---

## Security Best Practices

1. **Use App Passwords**: For services like Gmail, use app-specific passwords
2. **Encrypt Connections**: Always use TLS (`SMTP_SECURE=false` with port 587) or SSL (`SMTP_SECURE=true` with port 465)
3. **Protect Credentials**: Never commit SMTP credentials to version control
4. **Use Environment Variables**: Store credentials in `.env` file (not in code)
5. **Restrict Sender**: Set `SMTP_FROM` to a dedicated email address (e.g., `noreply@your-domain.com`)
6. **Verify Domain**: For production, ensure your sender domain is verified (prevents spam filtering)

---

## Without SMTP: Manual Invitation Sharing

If SMTP is not configured, you can still create invitations and share them manually:

1. **Create Invitation**: Go to Settings → Users → Send Invitation
2. **Get Invitation Link**: The system will display the invitation URL
3. **Share Manually**: Copy and share the link via:
   - Slack/Teams message
   - Internal messaging system
   - Direct email (from your own email client)
   - Any other communication method

**Invitation URL Format**: `https://your-domain.com/invite/[token]`

**Benefits**:
- No email service setup required
- Full control over delivery method
- Works in air-gapped environments
- No external dependencies

---

## References

- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid Setup Guide](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)
- [AWS SES SMTP Setup](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Postfix Documentation](http://www.postfix.org/documentation.html)

---

## Related Documentation

- [Docker Deployment](./docker.md) - Full deployment guide
- [User Management Quickstart](../../specs/001-stride-application/user-management-quickstart.md) - How to use user management features

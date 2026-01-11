# SMTP Email Integration

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

### Supported Services

- **SendGrid**: Free tier (100 emails/day), enterprise options
- **AWS SES**: Pay-as-you-go (free tier available), high volume
- **Mailgun**: Free tier (5,000 emails/month), developer-friendly
- **Gmail SMTP**: Free (with app password), personal/workspace
- **Microsoft 365**: Requires Office 365 subscription, enterprise
- **Self-hosted**: Postfix, Exim, or internal corporate mail servers

---

## Prerequisites

Before configuring SMTP:

1. **Email Service Account**: Access to an SMTP-compatible email service
   - For third-party services: Account with API credentials
   - For self-hosted: Mail server running and accessible

2. **SMTP Credentials**: Username and password (or API key for some services)
   - Gmail: Requires [App Password](https://support.google.com/accounts/answer/185833) (2FA must be enabled)
   - SendGrid: API key from SendGrid dashboard
   - AWS SES: SMTP username and password from AWS console

3. **Network Access**: Application must be able to reach SMTP server
   - Outbound connections on SMTP port (587, 465, or 25)
   - Firewall rules allow SMTP traffic

4. **Docker (if using Docker)**: Docker Compose set up and running
   - `.env` file configured
   - Docker network allows external connections

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | Yes* | - | SMTP server hostname (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`) |
| `SMTP_PORT` | Yes* | `587` | SMTP port: `587` (TLS/STARTTLS), `465` (SSL), `25` (unencrypted, not recommended) |
| `SMTP_USER` | Yes* | - | SMTP authentication username (or API key for SendGrid: `apikey`) |
| `SMTP_PASSWORD` | Yes* | - | SMTP authentication password (or API key value for SendGrid) |
| `SMTP_SECURE` | No | `false` | `true` for SSL (port 465), `false` for STARTTLS/TLS (port 587) |
| `SMTP_FROM` | No | `SMTP_USER` | Default sender email address (e.g., `noreply@your-domain.com`) |

*Required only if you want to enable email invitations

---

## Setup Instructions

### Docker Compose Setup

**Recommended for Docker deployments**. Configure SMTP via `docker-compose.yml` and `.env` file.

#### Step 1: Configure Environment Variables

Add SMTP variables to your `.env` file in the project root:

```env
# SMTP Configuration (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

#### Step 2: Update docker-compose.yml

The `docker-compose.yml` already includes SMTP environment variable mappings. Verify they're present:

```yaml
services:
  web:
    environment:
      # Email Configuration (optional)
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASSWORD: ${SMTP_PASSWORD:-}
      SMTP_SECURE: ${SMTP_SECURE:-false}
      SMTP_FROM: ${SMTP_FROM:-}
```

**Note**: The `${VAR:-}` syntax means "use value from .env file, or empty string if not set". The `${VAR:-default}` syntax provides a default value.

#### Step 3: Using Docker Secrets (Recommended for Production)

For production deployments, use Docker secrets instead of plain environment variables:

**docker-compose.yml**:
```yaml
services:
  web:
    secrets:
      - smtp_password
    environment:
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASSWORD_FILE: /run/secrets/smtp_password
      SMTP_SECURE: ${SMTP_SECURE:-false}
      SMTP_FROM: ${SMTP_FROM:-}

secrets:
  smtp_password:
    file: ./secrets/smtp_password.txt
```

Create `secrets/smtp_password.txt` (add to `.gitignore`):
```bash
mkdir -p secrets
echo "your-smtp-password" > secrets/smtp_password.txt
chmod 600 secrets/smtp_password.txt
```

**Note**: If using `SMTP_PASSWORD_FILE`, your application code must read from the file. For now, use `SMTP_PASSWORD` directly.

#### Step 4: Restart Containers

After updating environment variables, restart the web container:

```bash
# Restart only the web service (preserves database)
docker-compose restart web

# Or restart all services
docker-compose restart

# Or recreate containers (if environment variables changed during build)
docker-compose up -d --force-recreate web
```

#### Step 5: Verify Configuration

Check container logs to verify SMTP initialization:

```bash
# View web container logs
docker-compose logs web | grep -i smtp

# Expected output if configured correctly:
# ✅ SMTP email service initialized successfully

# Expected output if not configured:
# ⚠️ SMTP email service not configured. Missing required environment variables.
```

### Bare-Metal Setup

**For non-Docker deployments**. Configure SMTP via system environment variables or `.env` file.

#### Step 1: Create `.env` File

Create or update `.env` file in your application root:

```env
# SMTP Configuration (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

#### Step 2: Load Environment Variables

Ensure your application loads environment variables from `.env` file:

- **Next.js**: Automatically loads `.env` files (`.env.local`, `.env.production`, etc.)
- **Node.js**: Use `dotenv` package: `require('dotenv').config()`

#### Step 3: Restart Application

Restart your application to load new environment variables:

```bash
# PM2
pm2 restart stride-web

# systemd
sudo systemctl restart stride-web

# Manual
# Stop and start your Node.js process
```

#### Step 4: Verify Configuration

Check application logs:

```bash
# If using PM2
pm2 logs stride-web | grep -i smtp

# If using systemd
sudo journalctl -u stride-web -f | grep -i smtp

# Expected output if configured correctly:
# ✅ SMTP email service initialized successfully
```

---

## Configuration Examples

### Gmail (with App Password)

**Docker** (`.env` file):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

**Bare-Metal** (`.env` file):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

**Docker Compose Example**:
```yaml
services:
  web:
    environment:
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USER: your-email@gmail.com
      SMTP_PASSWORD: ${SMTP_PASSWORD}  # From .env file
      SMTP_SECURE: "false"
      SMTP_FROM: noreply@your-domain.com
```

**Note**: Gmail requires an [App Password](https://support.google.com/accounts/answer/185833). Regular passwords won't work. 2FA must be enabled on your Google account.

### SendGrid

**Docker** (`.env` file):
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

**Docker Compose Example**:
```yaml
services:
  web:
    environment:
      SMTP_HOST: smtp.sendgrid.net
      SMTP_PORT: 587
      SMTP_USER: apikey
      SMTP_PASSWORD: ${SENDGRID_API_KEY}  # From .env file (SENDGRID_API_KEY=SG.xxx)
      SMTP_SECURE: "false"
      SMTP_FROM: noreply@your-domain.com
```

**Getting API Key**: 
1. Log in to SendGrid dashboard
2. Go to Settings → API Keys
3. Create API Key with "Mail Send" permissions
4. Copy the key (starts with `SG.`)

### AWS SES

**Docker** (`.env` file):
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-verified-domain.com
```

**Docker Compose Example**:
```yaml
services:
  web:
    environment:
      SMTP_HOST: email-smtp.us-east-1.amazonaws.com
      SMTP_PORT: 587
      SMTP_USER: ${AWS_SES_SMTP_USERNAME}  # From .env file
      SMTP_PASSWORD: ${AWS_SES_SMTP_PASSWORD}  # From .env file
      SMTP_SECURE: "false"
      SMTP_FROM: noreply@your-verified-domain.com
```

**Getting SMTP Credentials**:
1. Go to AWS SES Console
2. Navigate to SMTP Settings
3. Create SMTP credentials (or use IAM user credentials)
4. Note: You must verify your sender email/domain in SES before sending

### Self-Hosted Postfix

**Docker** (`.env` file):
```env
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your-mailbox-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

**Docker Compose Example** (if mail server is on same network):
```yaml
services:
  web:
    environment:
      SMTP_HOST: mail.your-domain.com  # Or use service name if in same Docker network
      SMTP_PORT: 587
      SMTP_USER: noreply@your-domain.com
      SMTP_PASSWORD: ${SMTP_PASSWORD}  # From .env file
      SMTP_SECURE: "false"
      SMTP_FROM: noreply@your-domain.com
```

**Note**: If mail server is in same Docker Compose file, use service name as hostname:
```yaml
SMTP_HOST: postfix  # Service name, not domain
```

---

## Verification

### Check if SMTP is Configured

The application automatically detects SMTP configuration on startup. Check the logs:

**Docker**:
```bash
docker-compose logs web | grep -i smtp

# If configured correctly:
# ✅ SMTP email service initialized successfully

# If not configured:
# ⚠️ SMTP email service not configured. Missing required environment variables.
```

**Bare-Metal**:
```bash
# Check application logs
tail -f /var/log/stride/app.log | grep -i smtp

# Or if using PM2
pm2 logs stride-web | grep -i smtp
```

### Test Email Sending

#### Method 1: Via UI

1. **Navigate to Settings**: Go to Settings → Users → Send Invitation
2. **Send Invitation**:
   - If SMTP is configured: Email is sent automatically to the user's email address
   - If SMTP is not configured: You'll see a message with the invitation link to share manually

#### Method 2: Check Application Logs

After sending an invitation:

```bash
# Docker
docker-compose logs web | grep -i "invitation email"

# Bare-Metal
tail -f /var/log/stride/app.log | grep -i "invitation email"

# Expected output:
# ✅ Invitation email sent successfully to user@example.com
```

#### Method 3: Test SMTP Connection Manually

**From Docker Container**:
```bash
# Enter web container
docker-compose exec web sh

# Test SMTP connection (if telnet/netcat available)
nc -zv smtp.gmail.com 587

# Or use a simple Node.js script
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
transporter.verify((error, success) => {
  if (error) console.error('SMTP verification failed:', error);
  else console.log('SMTP connection successful');
});
"
```

**From Host System** (Bare-Metal):
```bash
# Test SMTP connection
telnet smtp.example.com 587

# Or use netcat
nc -zv smtp.example.com 587

# If connection succeeds, you should see:
# Connected to smtp.example.com.
```

---

## Examples

### Minimal Working Example (Gmail)

**`.env` file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

**docker-compose.yml** (if using Docker):
```yaml
services:
  web:
    environment:
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USER: your-email@gmail.com
      SMTP_PASSWORD: ${SMTP_PASSWORD}  # From .env
      SMTP_SECURE: "false"
      SMTP_FROM: noreply@your-domain.com
```

### Multiple Environment Setup

**Development** (`.env.development`):
```env
# Use MailHog for local testing
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
```

**Production** (`.env.production`):
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.production-api-key
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.com
```

**docker-compose.yml** (with environment-specific config):
```yaml
services:
  web:
    env_file:
      - .env.${NODE_ENV:-development}
    # Or specify explicitly
    # env_file:
    #   - .env.production
```

---

## Troubleshooting

### Docker-Specific Issues

#### Environment Variables Not Loading

**Problem**: Environment variables set in `.env` file are not available in container.

**Solution**:
1. **Verify .env file location**: Must be in same directory as `docker-compose.yml`
2. **Check variable syntax**: No spaces around `=` sign: `SMTP_HOST=value` (not `SMTP_HOST = value`)
3. **Restart containers**: Environment variables are loaded at container start:
   ```bash
   docker-compose down
   docker-compose up -d
   ```
4. **Check docker-compose.yml**: Verify environment variable mapping exists:
   ```yaml
   environment:
     SMTP_HOST: ${SMTP_HOST:-}
   ```
5. **Verify values**: Check if variables are actually loaded:
   ```bash
   docker-compose exec web env | grep SMTP
   ```

#### Container Logs Show "SMTP not configured" After Setting Variables

**Problem**: Set environment variables but logs still show SMTP not configured.

**Solution**:
1. **Restart container**: Variables are only loaded at container start:
   ```bash
   docker-compose restart web
   # Or force recreate
   docker-compose up -d --force-recreate web
   ```
2. **Check .env file encoding**: Ensure file is UTF-8, no BOM
3. **Verify variable names**: Must match exactly (case-sensitive): `SMTP_HOST`, not `smtp_host`
4. **Check for typos**: Verify no extra spaces or quotes in `.env` file

#### Secrets Not Working

**Problem**: Using Docker secrets but password not being read.

**Solution**:
1. **Check secrets file exists**: `secrets/smtp_password.txt`
2. **Verify file permissions**: `chmod 600 secrets/smtp_password.txt`
3. **Check docker-compose.yml**: Secrets section defined and service references it:
   ```yaml
   services:
     web:
       secrets:
         - smtp_password
   secrets:
     smtp_password:
       file: ./secrets/smtp_password.txt
   ```
4. **Note**: If using `SMTP_PASSWORD_FILE`, application must read from file. Current implementation uses `SMTP_PASSWORD` directly.

#### Docker Network Issues

**Problem**: Container cannot reach external SMTP server.

**Solution**:
1. **Check network connectivity**: Test from container:
   ```bash
   docker-compose exec web ping smtp.gmail.com
   docker-compose exec web nc -zv smtp.gmail.com 587
   ```
2. **Verify firewall rules**: Docker host firewall allows outbound connections
3. **Check DNS resolution**: Container can resolve SMTP hostname:
   ```bash
   docker-compose exec web nslookup smtp.gmail.com
   ```
4. **Use host network** (not recommended, but for testing):
   ```yaml
   services:
     web:
       network_mode: host
   ```

### Connection Problems

#### "Connection timeout" or "Connection refused"

**Problem**: Cannot connect to SMTP server.

**Causes**:
- Incorrect `SMTP_HOST` or `SMTP_PORT`
- Firewall blocking outbound SMTP connections
- SMTP server is down or unreachable
- Network connectivity issues (Docker or host)

**Solution**:
1. **Verify SMTP hostname and port**:
   - Gmail: `smtp.gmail.com:587`
   - SendGrid: `smtp.sendgrid.net:587`
   - AWS SES: `email-smtp.region.amazonaws.com:587`
2. **Test connection manually**:
   ```bash
   # From host
   telnet smtp.gmail.com 587
   # Or
   nc -zv smtp.gmail.com 587
   ```
3. **Check firewall**: Allow outbound connections on SMTP port (587, 465, or 25)
4. **Verify network**: Docker containers can reach external network (check Docker network settings)

#### "Authentication failed" or "Invalid login"

**Problem**: SMTP authentication fails.

**Causes**:
- Incorrect `SMTP_USER` or `SMTP_PASSWORD`
- Gmail using regular password instead of App Password
- Credentials expired or revoked
- Account locked or suspended

**Solution**:
1. **Verify credentials**: Check username and password are correct (no extra spaces)
2. **Gmail-specific**: Use [App Password](https://support.google.com/accounts/answer/185833), not regular password
   - Requires 2FA to be enabled
   - Generate in Google Account → Security → App Passwords
3. **Test credentials**: Try logging into SMTP server with same credentials using email client
4. **Check account status**: Verify account is not locked or suspended
5. **Rotate credentials**: If compromised, generate new API key/password

#### TLS/SSL Handshake Errors

**Problem**: TLS or SSL handshake fails.

**Causes**:
- `SMTP_SECURE` setting doesn't match port configuration
- SMTP server doesn't support TLS/SSL on specified port
- Certificate validation issues

**Solution**:
1. **Match port and secure setting**:
   - Port 587 + `SMTP_SECURE=false` (STARTTLS/TLS)
   - Port 465 + `SMTP_SECURE=true` (SSL)
2. **Verify server support**: Check SMTP provider documentation for correct port/encryption combination
3. **Try different port**: Some servers support multiple ports (587 and 465)

### Service-Specific Issues

#### Gmail Issues

**"Less secure app access" error**:
- **Cause**: Gmail blocked "less secure apps" (regular passwords)
- **Solution**: Use [App Password](https://support.google.com/accounts/answer/185833) instead of regular password
- **Requires**: 2FA must be enabled on Google account

**"2FA required"**:
- **Cause**: App Passwords only work with 2FA enabled
- **Solution**: Enable 2FA in Google Account → Security → 2-Step Verification

**Rate limits exceeded**:
- **Cause**: Gmail has daily sending limits (~500 emails/day for free accounts, 2,000 for workspace)
- **Solution**: Use SendGrid, AWS SES, or other service for higher volume

#### SendGrid Issues

**"API key invalid"**:
- **Cause**: API key incorrect or revoked
- **Solution**: 
  1. Log in to SendGrid dashboard
  2. Go to Settings → API Keys
  3. Verify key exists and has "Mail Send" permissions
  4. Generate new key if needed

**"Sender not verified"**:
- **Cause**: Sender email/domain not verified in SendGrid
- **Solution**: Verify sender email or domain in SendGrid → Settings → Sender Authentication

#### AWS SES Issues

**"Email address not verified"**:
- **Cause**: Sender email/domain not verified in AWS SES
- **Solution**: Verify sender email or domain in AWS SES Console → Verified Identities

**"Account in sandbox mode"**:
- **Cause**: AWS SES starts in sandbox mode (only verified emails)
- **Solution**: Request production access in AWS SES Console → Account Dashboard → Request Production Access

**"SMTP credentials not found"**:
- **Cause**: SMTP credentials not created in AWS SES
- **Solution**: 
  1. Go to AWS SES Console → SMTP Settings
  2. Create SMTP credentials
  3. Use provided username and password

### Debugging Techniques

#### Enable Verbose Logging

**Docker**:
```bash
# Check application logs with SMTP debug info
docker-compose logs web | grep -i -E "(smtp|email|mail)"
```

**Bare-Metal**:
```bash
# Set debug environment variable (if supported)
export DEBUG=nodemailer:*

# Or check application logs
tail -f /var/log/stride/app.log | grep -i smtp
```

#### Test SMTP Connection

**From Docker Container**:
```bash
# Enter container
docker-compose exec web sh

# Test connection (if netcat/telnet available)
nc -zv smtp.gmail.com 587

# Or use Node.js
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true,
  logger: true,
});
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP verification failed:');
    console.error(error);
  } else {
    console.log('SMTP connection successful!');
  }
});
"
```

#### Check Environment Variables

**Docker**:
```bash
# List all SMTP-related environment variables
docker-compose exec web env | grep SMTP

# Expected output:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-password
# SMTP_SECURE=false
```

**Bare-Metal**:
```bash
# Check environment variables (if using systemd)
systemctl show stride-web --property=Environment | grep SMTP

# Or check .env file
cat .env | grep SMTP
```

#### Network Diagnostics

**Docker**:
```bash
# Test DNS resolution
docker-compose exec web nslookup smtp.gmail.com

# Test connectivity
docker-compose exec web ping -c 3 smtp.gmail.com

# Test port connectivity
docker-compose exec web nc -zv smtp.gmail.com 587
```

**Bare-Metal**:
```bash
# Test DNS
nslookup smtp.gmail.com

# Test connectivity
ping -c 3 smtp.gmail.com

# Test port
telnet smtp.gmail.com 587
# Or
nc -zv smtp.gmail.com 587
```

---

## Security Best Practices

1. **Use App Passwords**: For services like Gmail, use app-specific passwords instead of regular passwords
2. **Encrypt Connections**: Always use TLS (`SMTP_SECURE=false` with port 587) or SSL (`SMTP_SECURE=true` with port 465). Avoid port 25 (unencrypted)
3. **Protect Credentials**: Never commit SMTP credentials to version control
   - Add `.env` to `.gitignore`
   - Use environment variables or secrets management
   - For Docker: Use Docker secrets or environment variable files (not committed)
4. **Use Environment Variables**: Store credentials in `.env` file (not in code)
5. **Restrict Sender**: Set `SMTP_FROM` to a dedicated email address (e.g., `noreply@your-domain.com`)
6. **Verify Domain**: For production, ensure your sender domain is verified (prevents spam filtering)
   - SPF record: `v=spf1 include:sendgrid.net ~all` (for SendGrid)
   - DKIM: Configure in your email service provider
   - DMARC: Set up DMARC policy for email authentication
7. **Rate Limiting**: Be aware of sending limits and implement rate limiting if sending high volumes
8. **Monitor**: Monitor email sending for failures and abuse

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

## Related Documentation

- [Integration Overview](/docs/integrations) - All integrations guide
- [Configuration Documentation](/docs/configuration) - YAML workflow configuration

**Note**: Docker deployment documentation is available in the repository's `docs/deployment/docker.md` file. For Docker Compose examples and deployment guides, refer to the deployment documentation in the repository.

---

## External Resources

- [Nodemailer Documentation](https://nodemailer.com/) - Node.js email library used by Stride
- [SendGrid Setup Guide](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp) - SendGrid SMTP configuration
- [AWS SES SMTP Setup](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html) - AWS SES SMTP configuration
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833) - How to generate Gmail App Passwords
- [Postfix Documentation](http://www.postfix.org/documentation.html) - Self-hosted mail server setup

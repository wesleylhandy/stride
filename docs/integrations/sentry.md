# Sentry Error Tracking Integration

**Status**: Optional  
**Required For**: Error tracking and performance monitoring  
**App Functionality**: Works fully without Sentry configuration

## Overview

Stride integrates with Sentry for error tracking and performance monitoring. This integration is **optional** - the application works perfectly without it. When Sentry is not configured:

- ✅ All core features work normally
- ✅ Errors are still logged to application logs
- ❌ Errors are not sent to Sentry dashboard
- ❌ Performance monitoring is disabled

If you want to enable error tracking and performance monitoring, configure Sentry.

### Supported Services

- **Sentry Cloud**: Hosted error tracking service (recommended)
- **Sentry Self-Hosted**: Self-hosted Sentry instance

---

## Prerequisites

Before configuring Sentry:

1. **Sentry Account**: Access to a Sentry account (free tier available)
   - Sign up at [sentry.io](https://sentry.io)
   - Or set up self-hosted Sentry instance

2. **Sentry Project**: Create a project in Sentry dashboard
   - Select platform: Node.js
   - Note the DSN (Data Source Name) after project creation

3. **Network Access**: Application must be able to reach Sentry server
   - Outbound HTTPS connections (Sentry uses HTTPS)
   - Firewall rules allow Sentry domain (`sentry.io` or your self-hosted domain)

4. **Docker (if using Docker)**: Docker Compose set up and running
   - `.env` file configured
   - Docker network allows external connections

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | Yes* | - | Sentry DSN (Data Source Name) from Sentry project settings (format: `https://xxx@sentry.io/xxx`) |
| `ERROR_TRACKING_ENABLED` | No | `false` | Set to `true` to enable error tracking (required even if DSN is set) |

*Required only if error tracking is enabled

---

## Setup Instructions

### Docker Compose Setup

**Recommended for Docker deployments**. Configure Sentry via `docker-compose.yml` and `.env` file.

#### Step 1: Get Sentry DSN

1. **Create Sentry Account**: Sign up at [sentry.io](https://sentry.io) (free tier available)
2. **Create Project**:
   - Go to Sentry dashboard
   - Click "Create Project"
   - Select "Node.js" platform
   - Name your project (e.g., "Stride")
   - Click "Create Project"
3. **Copy DSN**:
   - After project creation, Sentry displays the DSN
   - Format: `https://xxx@xxx.sentry.io/xxx`
   - Copy this value (you'll need it for configuration)

#### Step 2: Configure Environment Variables

Add Sentry variables to your `.env` file in the project root:

```env
# Sentry Error Tracking (Optional)
SENTRY_DSN=https://xxx@xxx.sentry.io/xxx
ERROR_TRACKING_ENABLED=true
```

#### Step 3: Update docker-compose.yml

The `docker-compose.yml` already includes Sentry environment variable mappings. Verify they're present:

```yaml
services:
  web:
    environment:
      # Error Tracking (optional)
      SENTRY_DSN: ${SENTRY_DSN:-}
      ERROR_TRACKING_ENABLED: ${ERROR_TRACKING_ENABLED:-false}
```

#### Step 4: Restart Containers

After updating environment variables, restart the web container:

```bash
# Restart only the web service
docker-compose restart web

# Or recreate containers
docker-compose up -d --force-recreate web
```

#### Step 5: Verify Configuration

Check container logs to verify Sentry initialization:

```bash
# View web container logs
docker-compose logs web | grep -i sentry

# Expected output if configured correctly:
# ✅ Sentry error tracking enabled

# Expected output if not configured:
# ⚠️ Sentry error tracking not configured
```

### Bare-Metal Setup

**For non-Docker deployments**. Configure Sentry via system environment variables or `.env` file.

#### Step 1: Get Sentry DSN

Follow the same steps as Docker setup (Steps 1-3 above) to get your Sentry DSN.

#### Step 2: Create `.env` File

Create or update `.env` file in your application root:

```env
# Sentry Error Tracking (Optional)
SENTRY_DSN=https://xxx@xxx.sentry.io/xxx
ERROR_TRACKING_ENABLED=true
```

#### Step 3: Load Environment Variables

Ensure your application loads environment variables from `.env` file:

- **Next.js**: Automatically loads `.env` files (`.env.local`, `.env.production`, etc.)
- **Node.js**: Use `dotenv` package: `require('dotenv').config()`

#### Step 4: Restart Application

Restart your application to load new environment variables:

```bash
# PM2
pm2 restart stride-web

# systemd
sudo systemctl restart stride-web

# Manual
# Stop and start your Node.js process
```

#### Step 5: Verify Configuration

Check application logs:

```bash
# If using PM2
pm2 logs stride-web | grep -i sentry

# If using systemd
sudo journalctl -u stride-web -f | grep -i sentry

# Expected output if configured correctly:
# ✅ Sentry error tracking enabled
```

---

## Configuration Examples

### Sentry Cloud (Recommended)

**Docker** (`.env` file):
```env
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
ERROR_TRACKING_ENABLED=true
```

**Docker Compose Example**:
```yaml
services:
  web:
    environment:
      SENTRY_DSN: ${SENTRY_DSN:-}
      ERROR_TRACKING_ENABLED: ${ERROR_TRACKING_ENABLED:-true}
```

**Bare-Metal** (`.env` file):
```env
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
ERROR_TRACKING_ENABLED=true
```

### Sentry Self-Hosted

**Docker** (`.env` file):
```env
SENTRY_DSN=https://abc123@sentry.your-domain.com/123456
ERROR_TRACKING_ENABLED=true
```

**Docker Compose Example**:
```yaml
services:
  web:
    environment:
      SENTRY_DSN: ${SENTRY_DSN:-}
      ERROR_TRACKING_ENABLED: ${ERROR_TRACKING_ENABLED:-true}
```

**Bare-Metal** (`.env` file):
```env
SENTRY_DSN=https://abc123@sentry.your-domain.com/123456
ERROR_TRACKING_ENABLED=true
```

---

## Verification

### Check if Sentry is Configured

The application automatically detects Sentry configuration on startup. Check the logs:

**Docker**:
```bash
docker-compose logs web | grep -i sentry

# If configured correctly:
# ✅ Sentry error tracking enabled

# If not configured:
# ⚠️ Sentry error tracking not configured
```

**Bare-Metal**:
```bash
tail -f /var/log/stride/app.log | grep -i sentry

# Or if using PM2
pm2 logs stride-web | grep -i sentry
```

### Test Error Tracking

#### Method 1: Trigger Test Error

The application may include a test error endpoint for verification. Check Sentry dashboard for error events.

#### Method 2: Check Sentry Dashboard

1. **Navigate to Sentry Dashboard**: Go to [sentry.io](https://sentry.io) and log in
2. **Select Project**: Click on your Stride project
3. **Check Issues**: If errors occur in the application, they should appear in the Issues tab
4. **Verify Event Details**: Click on an issue to see:
   - Error message and stack trace
   - User context (if available)
   - Request details
   - Performance data (if enabled)

#### Method 3: Application Logs

Check application logs for Sentry events:

```bash
# Docker
docker-compose logs web | grep -i "sentry"

# Bare-Metal
tail -f /var/log/stride/app.log | grep -i "sentry"

# Expected output when error is sent:
# ✅ Error sent to Sentry: [error-id]
```

---

## Examples

### Minimal Working Example

**`.env` file**:
```env
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
ERROR_TRACKING_ENABLED=true
```

**docker-compose.yml** (if using Docker):
```yaml
services:
  web:
    environment:
      SENTRY_DSN: ${SENTRY_DSN:-}
      ERROR_TRACKING_ENABLED: ${ERROR_TRACKING_ENABLED:-true}
```

### Environment-Specific Configuration

**Development** (`.env.development`):
```env
# Disable Sentry in development (optional)
ERROR_TRACKING_ENABLED=false
# Or use a separate Sentry project for development
# SENTRY_DSN=https://xxx@xxx.sentry.io/dev-project-id
```

**Production** (`.env.production`):
```env
SENTRY_DSN=https://xxx@xxx.sentry.io/production-project-id
ERROR_TRACKING_ENABLED=true
```

**docker-compose.yml** (with environment-specific config):
```yaml
services:
  web:
    env_file:
      - .env.${NODE_ENV:-development}
    environment:
      SENTRY_DSN: ${SENTRY_DSN:-}
      ERROR_TRACKING_ENABLED: ${ERROR_TRACKING_ENABLED:-false}
```

---

## Troubleshooting

### Docker-Specific Issues

#### Environment Variables Not Loading

**Problem**: `SENTRY_DSN` or `ERROR_TRACKING_ENABLED` set in `.env` file but not available in container.

**Solution**:
1. **Verify .env file location**: Must be in same directory as `docker-compose.yml`
2. **Check variable syntax**: No spaces around `=` sign
3. **Restart containers**: Variables loaded at container start:
   ```bash
   docker-compose down
   docker-compose up -d
   ```
4. **Verify docker-compose.yml**: Check environment variable mapping exists
5. **Check values**: Verify variables are loaded:
   ```bash
   docker-compose exec web env | grep SENTRY
   ```

#### Container Logs Show "Sentry not configured"

**Problem**: Set `SENTRY_DSN` and `ERROR_TRACKING_ENABLED=true` but logs still show Sentry not configured.

**Solution**:
1. **Restart container**: Variables only loaded at container start:
   ```bash
   docker-compose restart web
   # Or force recreate
   docker-compose up -d --force-recreate web
   ```
2. **Check ERROR_TRACKING_ENABLED**: Must be explicitly set to `true` (not just `1` or `yes`):
   ```env
   ERROR_TRACKING_ENABLED=true  # Correct
   ERROR_TRACKING_ENABLED=1     # May not work
   ```
3. **Verify DSN format**: DSN must be valid URL format:
   ```
   https://xxx@xxx.sentry.io/xxx
   ```
4. **Check for typos**: Verify variable names are correct (case-sensitive)

### Connection Problems

#### "Failed to send error to Sentry" or "Network error"

**Problem**: Cannot connect to Sentry server.

**Causes**:
- Incorrect `SENTRY_DSN` format
- Network connectivity issues (Docker or host)
- Firewall blocking HTTPS connections to Sentry
- Self-hosted Sentry server is down

**Solution**:
1. **Verify DSN format**: Must be valid HTTPS URL:
   ```
   https://xxx@xxx.sentry.io/xxx
   ```
2. **Test connectivity**:
   ```bash
   # Docker
   docker-compose exec web curl -I https://sentry.io
   # Or
   docker-compose exec web ping sentry.io
   ```
3. **Check firewall**: Allow outbound HTTPS connections (port 443)
4. **Verify self-hosted Sentry**: If using self-hosted, check server is accessible:
   ```bash
   curl -I https://sentry.your-domain.com
   ```

#### "Invalid DSN" or "DSN not found"

**Problem**: Sentry rejects the DSN.

**Causes**:
- DSN is incorrect or expired
- Project was deleted in Sentry
- DSN copied incorrectly (extra spaces, wrong characters)

**Solution**:
1. **Verify DSN in Sentry Dashboard**:
   - Go to Sentry dashboard
   - Navigate to Settings → Projects → Your Project → Client Keys (DSN)
   - Copy DSN again (ensure no extra spaces)
2. **Check project exists**: Verify project wasn't deleted
3. **Regenerate DSN**: If needed, create a new DSN key in Sentry dashboard
4. **Verify format**: DSN should be one continuous string with no line breaks

### Service-Specific Issues

#### Events Not Appearing in Sentry Dashboard

**Problem**: Errors occur but don't appear in Sentry dashboard.

**Causes**:
- `ERROR_TRACKING_ENABLED` not set to `true`
- DSN is incorrect
- Application errors not being caught/forwarded to Sentry
- Sentry rate limiting (free tier limits)

**Solution**:
1. **Check ERROR_TRACKING_ENABLED**: Must be `true`:
   ```bash
   docker-compose exec web env | grep ERROR_TRACKING_ENABLED
   # Should show: ERROR_TRACKING_ENABLED=true
   ```
2. **Verify DSN**: Check DSN is correct and project exists
3. **Check application logs**: Look for Sentry initialization and error sending logs
4. **Test with manual error**: Trigger a test error and check Sentry dashboard
5. **Check rate limits**: Free tier has rate limits, check Sentry dashboard for quota warnings

#### Performance Monitoring Not Working

**Problem**: Error tracking works but performance data not appearing.

**Causes**:
- Performance monitoring not enabled in Sentry SDK configuration
- Application doesn't instrument performance automatically
- Performance features may require Sentry plan upgrade

**Solution**:
1. **Check Sentry SDK version**: Ensure latest Sentry SDK supports performance monitoring
2. **Verify plan**: Some performance features require Sentry Team/Enterprise plan
3. **Check SDK configuration**: Performance monitoring may need explicit enabling in code
4. **Review Sentry documentation**: Check Sentry docs for Node.js/Next.js performance setup

### Debugging Techniques

#### Enable Sentry Debug Mode

**Docker** (`.env` file):
```env
SENTRY_DSN=https://xxx@xxx.sentry.io/xxx
ERROR_TRACKING_ENABLED=true
DEBUG=sentry:*  # Enable Sentry debug logging (if supported)
```

**Check logs**:
```bash
docker-compose logs web | grep -i sentry
```

#### Test Sentry Connection

**From Docker Container**:
```bash
# Enter container
docker-compose exec web sh

# Test Sentry endpoint (if curl available)
curl -I https://sentry.io

# Or test with Node.js
node -e "
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN, debug: true });
console.log('Sentry initialized');
"
```

#### Check Environment Variables

**Docker**:
```bash
# List Sentry-related environment variables
docker-compose exec web env | grep -E "(SENTRY|ERROR_TRACKING)"

# Expected output:
# SENTRY_DSN=https://xxx@xxx.sentry.io/xxx
# ERROR_TRACKING_ENABLED=true
```

**Bare-Metal**:
```bash
# Check environment variables
env | grep -E "(SENTRY|ERROR_TRACKING)"

# Or check .env file
cat .env | grep -E "(SENTRY|ERROR_TRACKING)"
```

---

## Security Best Practices

1. **Protect DSN**: Treat DSN as sensitive information (contains authentication)
   - Never commit DSN to version control
   - Use environment variables or secrets management
   - For Docker: Use Docker secrets or environment variable files (not committed)

2. **Restrict Access**: In Sentry dashboard, configure:
   - Project access controls (who can view errors)
   - IP allowlist (if self-hosted)
   - Rate limiting and quotas

3. **Filter Sensitive Data**: Configure Sentry to filter sensitive data:
   - PII (personally identifiable information)
   - Passwords and tokens
   - Credit card numbers
   - Configure data scrubbing in Sentry project settings

4. **Monitor Quotas**: Free tier has rate limits, monitor usage in Sentry dashboard

5. **Use Different Projects**: Use separate Sentry projects for:
   - Development vs production
   - Different applications/services

---

## Related Documentation

- [Integration Overview](/docs/integrations) - All integrations guide
- [Configuration Documentation](/docs/configuration) - YAML workflow configuration

**Note**: Docker deployment documentation is available in the repository's `docs/deployment/docker.md` file.

---

## External Resources

- [Sentry Documentation](https://docs.sentry.io/) - Complete Sentry documentation
- [Sentry Node.js Setup](https://docs.sentry.io/platforms/javascript/guides/nodejs/) - Node.js integration guide
- [Sentry Next.js Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/) - Next.js integration guide
- [Sentry Self-Hosted](https://develop.sentry.dev/self-hosted/) - Self-hosted Sentry setup

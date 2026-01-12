---
purpose: Configure webhooks from Sentry, Datadog, or New Relic to automatically create issues from error events
targetAudience: System administrators, DevOps engineers
lastUpdated: 2026-01-12
status: Optional
---

# Monitoring Webhooks Integration

**Status**: Optional  
**Required For**: Automatic issue creation from error events in monitoring services  
**App Functionality**: Works fully without monitoring webhooks configuration

## Overview

Stride integrates with monitoring services via webhooks to automatically create issues from error events. This integration is **optional** - the application works perfectly without it. When monitoring webhooks are not configured:

- ✅ All core features work normally
- ✅ Manual issue creation
- ❌ Automatic issue creation from error events is disabled
- ❌ Root cause diagnostics from monitoring services is disabled

If you want to enable automatic issue creation from error events, configure webhooks in your monitoring services.

### Supported Services

- **Sentry**: Error tracking and performance monitoring
- **Datadog**: Infrastructure and application monitoring
- **New Relic**: Application performance monitoring

---

## Prerequisites

Before configuring monitoring webhooks:

1. **Monitoring Service Account**: Access to Sentry, Datadog, or New Relic account
   - Sentry: Project in Sentry dashboard
   - Datadog: Datadog account with API access
   - New Relic: New Relic account with API access

2. **Webhook URL**: Know your Stride webhook endpoint:
   - Sentry: `https://your-domain.com/api/webhooks/sentry`
   - Datadog: `https://your-domain.com/api/webhooks/datadog`
   - New Relic: `https://your-domain.com/api/webhooks/newrelic`

3. **Network Access**: Monitoring service must be able to reach your Stride instance
   - Outbound HTTPS connections from monitoring service to your domain
   - Firewall rules allow inbound webhook requests

4. **Optional: Webhook Secret**: Configure HMAC signature verification (recommended for production)
   - Secret for signature verification
   - Stored in environment variable: `WEBHOOK_SECRET`

5. **Docker (if using Docker)**: Docker Compose set up and running
   - `.env` file configured (optional, for webhook secret)

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEBHOOK_SECRET` | No | - | HMAC secret for webhook signature verification (recommended for production) |

**Note**: Webhook endpoints don't require environment variables by default. The `WEBHOOK_SECRET` is optional but recommended for production to verify webhook authenticity.

---

## Setup Instructions

### Sentry Webhook Setup

#### Step 1: Get Stride Webhook URL

Your Stride webhook endpoint for Sentry is:
```
https://your-domain.com/api/webhooks/sentry
```

Replace `your-domain.com` with your actual Stride instance domain.

#### Step 2: Configure Sentry Webhook

1. **Navigate to Sentry Project Settings**:
   - Go to [Sentry Dashboard](https://sentry.io)
   - Select your Stride project
   - Go to Settings → Integrations

2. **Configure Webhook Integration**:
   - Find "Webhooks" in integrations list
   - Click "Configure" or "Add Integration"
   - Enter webhook URL: `https://your-domain.com/api/webhooks/sentry`
   - Select events: "Issue Created", "Issue Updated" (or all events)
   - Click "Save Changes"

3. **Optional: Configure Secret** (recommended for production):
   - Generate a secret: Use a random string (e.g., `openssl rand -hex 32`)
   - Add secret to Sentry webhook configuration
   - Add secret to Stride `.env` file:
     ```env
     WEBHOOK_SECRET=your-webhook-secret-here
     ```

#### Step 3: Update docker-compose.yml (Optional)

If using webhook secret, add to `docker-compose.yml`:

```yaml
services:
  web:
    environment:
      WEBHOOK_SECRET: ${WEBHOOK_SECRET:-}
```

#### Step 4: Restart Containers (if secret added)

If you added `WEBHOOK_SECRET`, restart the web container:

```bash
docker-compose restart web
```

### Datadog Webhook Setup

#### Step 1: Get Stride Webhook URL

Your Stride webhook endpoint for Datadog is:
```
https://your-domain.com/api/webhooks/datadog
```

#### Step 2: Configure Datadog Webhook

1. **Navigate to Datadog Integrations**:
   - Go to [Datadog Dashboard](https://app.datadoghq.com)
   - Go to Integrations → Webhooks
   - Click "New Webhook" or "Add Integration"

2. **Configure Webhook**:
   - **Name**: `Stride` (or your app name)
   - **URL**: `https://your-domain.com/api/webhooks/datadog`
   - **Payload**: Configure payload template (if needed)
   - Click "Save"

3. **Configure Alert/Event Rules**:
   - Create alert or event rule that triggers on errors
   - Set action to send webhook to your Stride endpoint
   - Configure payload format to match Stride's expected format

4. **Optional: Configure Secret** (recommended for production):
   - Add secret to Datadog webhook configuration (if supported)
   - Add secret to Stride `.env` file (same as Sentry setup)

### New Relic Webhook Setup

#### Step 1: Get Stride Webhook URL

Your Stride webhook endpoint for New Relic is:
```
https://your-domain.com/api/webhooks/newrelic
```

#### Step 2: Configure New Relic Webhook

1. **Navigate to New Relic Webhooks**:
   - Go to [New Relic Dashboard](https://one.newrelic.com)
   - Go to Alerts & AI → Webhooks
   - Click "Create webhook"

2. **Configure Webhook**:
   - **Name**: `Stride` (or your app name)
   - **URL**: `https://your-domain.com/api/webhooks/newrelic`
   - **Payload**: Configure payload template (if needed)
   - Click "Save"

3. **Configure Alert Policies**:
   - Create alert policy for errors
   - Add webhook notification channel
   - Select your Stride webhook

4. **Optional: Configure Secret** (recommended for production):
   - Add secret to New Relic webhook configuration (if supported)
   - Add secret to Stride `.env` file (same as Sentry setup)

---

## Verification

### Check if Webhooks are Configured

Webhooks don't require environment variables by default, so checking configuration means verifying webhook endpoints are accessible.

**Test Webhook Endpoint**:
```bash
# Test Sentry webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/sentry \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Test Datadog webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/datadog \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Test New Relic webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/newrelic \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Test Webhook from Monitoring Service

#### Sentry Test

1. **Trigger Test Event**: In Sentry, create a test error or use "Send Test Webhook"
2. **Check Application Logs**: Verify webhook was received:
   ```bash
   docker-compose logs web | grep -i "webhook"
   # Or
   tail -f /var/log/stride/app.log | grep -i "webhook"
   ```
3. **Check Issue Created**: Verify issue was created in Stride from the error event

#### Datadog Test

1. **Trigger Test Alert**: Create a test alert in Datadog that triggers webhook
2. **Check Application Logs**: Same as Sentry test
3. **Check Issue Created**: Verify issue was created in Stride

#### New Relic Test

1. **Trigger Test Alert**: Create a test alert in New Relic that triggers webhook
2. **Check Application Logs**: Same as Sentry test
3. **Check Issue Created**: Verify issue was created in Stride

---

## Examples

### Sentry Webhook (Minimal Example)

**Sentry Configuration**:
- Webhook URL: `https://your-domain.com/api/webhooks/sentry`
- Events: Issue Created, Issue Updated

**Stride Configuration** (Optional):
```env
WEBHOOK_SECRET=your-webhook-secret-here
```

**docker-compose.yml** (if using secret):
```yaml
services:
  web:
    environment:
      WEBHOOK_SECRET: ${WEBHOOK_SECRET:-}
```

### Datadog Webhook (Minimal Example)

**Datadog Configuration**:
- Webhook URL: `https://your-domain.com/api/webhooks/datadog`
- Alert Rule: Trigger on error events

**Stride Configuration** (Optional):
```env
WEBHOOK_SECRET=your-webhook-secret-here
```

### New Relic Webhook (Minimal Example)

**New Relic Configuration**:
- Webhook URL: `https://your-domain.com/api/webhooks/newrelic`
- Alert Policy: Trigger on error events

**Stride Configuration** (Optional):
```env
WEBHOOK_SECRET=your-webhook-secret-here
```

---

## Troubleshooting

### Docker-Specific Issues

#### Webhook Secret Not Loading

**Problem**: `WEBHOOK_SECRET` set in `.env` file but not available in container.

**Solution**: See Docker troubleshooting in the [SMTP Integration guide](/docs/integrations/smtp#docker-specific-issues) for same solutions.

### Connection Problems

#### "Webhook not received" or "Timeout"

**Problem**: Monitoring service cannot reach Stride webhook endpoint.

**Causes**:
- Stride instance is not accessible from monitoring service
- Firewall blocking inbound webhook requests
- Incorrect webhook URL
- HTTPS certificate issues

**Solution**:
1. **Verify Webhook URL**: Check URL is correct and accessible:
   ```bash
   curl https://your-domain.com/api/webhooks/sentry
   ```
2. **Check Firewall**: Allow inbound HTTPS connections (port 443) to Stride instance
3. **Test Accessibility**: From monitoring service network, test webhook URL:
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/sentry \
     -H "Content-Type: application/json" \
     -d '{"test": "webhook"}'
   ```
4. **Check HTTPS Certificate**: Ensure valid SSL certificate (required for webhooks)

#### "Signature verification failed"

**Problem**: Webhook signature verification fails when `WEBHOOK_SECRET` is configured.

**Causes**:
- Secret mismatch between monitoring service and Stride
- HMAC algorithm mismatch
- Secret not configured correctly

**Solution**:
1. **Verify Secret**: Check secret matches in both monitoring service and Stride `.env`:
   ```bash
   docker-compose exec web env | grep WEBHOOK_SECRET
   ```
2. **Check Secret Format**: Ensure no extra spaces or line breaks
3. **Regenerate Secret**: If needed, generate new secret and update both sides
4. **Check HMAC Algorithm**: Verify same HMAC algorithm used (usually SHA-256)

### Service-Specific Issues

#### Sentry Webhook Issues

**"Invalid payload format"**:
- **Cause**: Sentry webhook payload doesn't match Stride's expected format
- **Solution**: Check Stride webhook handler for expected payload format, update if needed

**"Webhook not triggering"**:
- **Cause**: Events not selected in Sentry webhook configuration
- **Solution**: Verify "Issue Created" and "Issue Updated" events are selected

#### Datadog Webhook Issues

**"Payload format mismatch"**:
- **Cause**: Datadog webhook payload doesn't match Stride's expected format
- **Solution**: Configure Datadog webhook payload template to match Stride's format

#### New Relic Webhook Issues

**"Webhook not triggering"**:
- **Cause**: Alert policy not configured to send webhook
- **Solution**: Verify alert policy includes webhook notification channel

### Debugging Techniques

#### Enable Webhook Debug Logging

**Docker**:
```bash
# Check webhook logs
docker-compose logs web | grep -i "webhook"

# Or follow logs
docker-compose logs -f web | grep -i "webhook"
```

**Bare-Metal**:
```bash
# Check application logs
tail -f /var/log/stride/app.log | grep -i "webhook"
```

#### Test Webhook Manually

**From Command Line**:
```bash
# Test Sentry webhook
curl -X POST https://your-domain.com/api/webhooks/sentry \
  -H "Content-Type: application/json" \
  -H "X-Sentry-Signature: test-signature" \
  -d '{
    "action": "created",
    "data": {
      "issue": {
        "id": "test-123",
        "title": "Test Error",
        "culprit": "test.ts:1",
        "level": "error"
      }
    }
  }'

# Check response and logs
```

#### Check Environment Variables

**Docker**:
```bash
# List webhook-related environment variables
docker-compose exec web env | grep WEBHOOK

# Expected output (if configured):
# WEBHOOK_SECRET=your-webhook-secret-here
```

**Bare-Metal**:
```bash
# Check environment variables
env | grep WEBHOOK

# Or check .env file
cat .env | grep WEBHOOK
```

---

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS for webhook endpoints (required by most providers)

2. **Enable Signature Verification**: Configure `WEBHOOK_SECRET` for HMAC signature verification:
   - Protects against unauthorized webhook requests
   - Verifies webhook authenticity
   - Recommended for production

3. **Protect Webhook Secret**: Treat webhook secret as sensitive information:
   - Never commit to version control
   - Use environment variables or secrets management
   - For Docker: Use Docker secrets or environment variable files (not committed)

4. **Validate Payloads**: Validate webhook payloads before processing:
   - Check required fields exist
   - Verify payload structure
   - Sanitize input data

5. **Rate Limiting**: Implement rate limiting on webhook endpoints to prevent abuse

6. **Monitor Webhooks**: Monitor webhook requests for suspicious activity:
   - Track failed requests
   - Monitor webhook frequency
   - Alert on anomalies

---

## Related Documentation

- [Integration Overview](/docs/integrations) - All integrations guide
- [Git OAuth](/docs/integrations/git-oauth) - Repository integration setup
- [Sentry Integration](/docs/integrations/sentry) - Sentry error tracking setup
- [Configuration Documentation](/docs/configuration) - YAML workflow configuration

**Note**: Docker deployment documentation is available in the repository's `docs/deployment/docker.md` file.

---

## External Resources

- [Sentry Webhooks](https://docs.sentry.io/product/integrations/integration-platform/webhooks/) - Sentry webhook documentation
- [Datadog Webhooks](https://docs.datadoghq.com/integrations/webhooks/) - Datadog webhook integration
- [New Relic Webhooks](https://docs.newrelic.com/docs/alerts-applied-intelligence/notifications/webhooks/) - New Relic webhook setup

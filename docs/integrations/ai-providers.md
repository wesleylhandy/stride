# AI Providers Integration

**Status**: Optional  
**Required For**: AI-powered issue triage and analysis  
**App Functionality**: Works fully without AI provider configuration

## Overview

Stride integrates with AI providers to enable AI-powered issue triage, analysis, and intelligent automation. This integration is **optional** - the application works perfectly without it. When AI providers are not configured:

- ✅ All core features work normally
- ✅ Manual issue triage and assignment
- ❌ AI-powered issue triage is disabled
- ❌ Automated issue analysis is disabled

If you want to enable AI features, configure one or more AI providers.

### Supported Services

- **Ollama** (Self-hosted): Free, open-source LLM hosting (recommended for privacy)
- **OpenAI**: Commercial AI service (GPT-3.5, GPT-4)
- **Anthropic**: Commercial AI service (Claude)
- **Google Gemini**: Commercial AI service (Gemini Pro, Gemini Ultra)

---

## Prerequisites

Before configuring AI providers:

1. **AI Provider Access**: Access to at least one AI provider:
   - **Ollama**: Install and run Ollama locally or on server
   - **OpenAI**: Account with API key ([platform.openai.com](https://platform.openai.com))
   - **Anthropic**: Account with API key ([console.anthropic.com](https://console.anthropic.com))
   - **Google Gemini**: Account with API key ([ai.google.dev](https://ai.google.dev))

2. **AI Gateway Service**: AI Gateway service must be running (for Docker, included in docker-compose.yml)

3. **Network Access**: Application must be able to reach AI Gateway and provider endpoints
   - AI Gateway: `http://ai-gateway:3001` (Docker) or `http://localhost:3001` (bare-metal)
   - Ollama: `http://localhost:11434` (default) or custom endpoint
   - OpenAI: `https://api.openai.com` (public API)
   - Anthropic: `https://api.anthropic.com` (public API)
   - Google Gemini: `https://generativelanguage.googleapis.com` (public API)

4. **Docker (if using Docker)**: Docker Compose set up and running
   - `.env` file configured
   - AI Gateway service included in docker-compose.yml

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_GATEWAY_URL` | No | `http://ai-gateway:3001` (Docker) or `http://localhost:3001` (bare-metal) | AI Gateway service URL |
| `LLM_ENDPOINT` | Yes* | - | Ollama endpoint URL (self-hosted, e.g., `http://localhost:11434`) |
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key (if using OpenAI) |
| `ANTHROPIC_API_KEY` | Yes* | - | Anthropic API key (if using Anthropic) |
| `GOOGLE_AI_API_KEY` | Yes* | - | Google AI (Gemini) API key (if using Gemini) |

*At least one AI provider configuration is required if AI features are enabled

---

## Setup Instructions

### Docker Compose Setup

**Recommended for Docker deployments**. Configure AI providers via `docker-compose.yml` and `.env` file.

#### Step 1: Choose AI Provider

**Option 1: Ollama (Self-Hosted) - Recommended for Privacy**
- Free and open-source
- Full control over data
- Requires local/server hosting

**Option 2: OpenAI (Commercial)**
- High-quality models (GPT-3.5, GPT-4)
- Requires API key and payment
- Data sent to OpenAI

**Option 3: Anthropic (Commercial)**
- High-quality models (Claude)
- Requires API key and payment
- Data sent to Anthropic

**Option 4: Google Gemini (Commercial)**
- High-quality models (Gemini Pro, Gemini Ultra)
- Requires API key and payment
- Data sent to Google AI

#### Step 2: Configure AI Provider

**For Ollama**:
1. **Install Ollama**: Follow [Ollama installation guide](https://ollama.ai/download)
2. **Run Ollama**: Start Ollama service:
   ```bash
   ollama serve
   ```
3. **Download Model**: Download a model:
   ```bash
   ollama pull llama2  # Or mistral, codellama, etc.
   ```
4. **Verify Endpoint**: Test Ollama endpoint:
   ```bash
   curl http://localhost:11434/api/tags
   ```

**For OpenAI**:
1. **Create Account**: Sign up at [platform.openai.com](https://platform.openai.com)
2. **Generate API Key**:
   - Go to API Keys section
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)
   - **Important**: Save key immediately, it won't be shown again

**For Anthropic**:
1. **Create Account**: Sign up at [console.anthropic.com](https://console.anthropic.com)
2. **Generate API Key**:
   - Go to API Keys section
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-`)
   - **Important**: Save key immediately, it won't be shown again

**For Google Gemini**:
1. **Create Account**: Sign up at [ai.google.dev](https://ai.google.dev) or use Google Cloud Console
2. **Generate API Key**:
   - Go to Google AI Studio or Google Cloud Console
   - Navigate to API Keys section
   - Click "Create API Key" or "Get API Key"
   - Copy the key (starts with `AIza`)
   - **Important**: Save key immediately, restrict key to specific APIs for security

#### Step 3: Configure Environment Variables

Add AI provider variables to your `.env` file in the project root:

**For Ollama**:
```env
# AI Gateway Configuration (Optional)
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://localhost:11434
# OPENAI_API_KEY and ANTHROPIC_API_KEY not needed for Ollama
```

**For OpenAI**:
```env
# AI Gateway Configuration (Optional)
AI_GATEWAY_URL=http://ai-gateway:3001
OPENAI_API_KEY=sk-your-openai-api-key
# LLM_ENDPOINT not needed for OpenAI
```

**For Anthropic**:
```env
# AI Gateway Configuration (Optional)
AI_GATEWAY_URL=http://ai-gateway:3001
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
# LLM_ENDPOINT not needed for Anthropic
```

**For Google Gemini**:
```env
# AI Gateway Configuration (Optional)
AI_GATEWAY_URL=http://ai-gateway:3001
GOOGLE_AI_API_KEY=AIza-your-google-ai-api-key
# LLM_ENDPOINT not needed for Gemini
```

**For Multiple Providers** (can configure multiple, application selects one):
```env
# AI Gateway Configuration (Optional)
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://localhost:11434
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
GOOGLE_AI_API_KEY=AIza-your-google-ai-api-key
```

#### Step 4: Update docker-compose.yml

The `docker-compose.yml` already includes AI Gateway service and environment variable mappings. Verify they're present:

**AI Gateway Service**:
```yaml
services:
  ai-gateway:
    build:
      context: .
      dockerfile: packages/ai-gateway/Dockerfile
    container_name: stride-ai-gateway
    restart: unless-stopped
    environment:
      LLM_ENDPOINT: ${LLM_ENDPOINT:-http://localhost:11434}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY:-}
      NODE_ENV: ${NODE_ENV:-development}
    ports:
      - "3001:3001"
    networks:
      - stride-network
```

**Web Service** (AI Gateway URL):
```yaml
services:
  web:
    environment:
      AI_GATEWAY_URL: ${AI_GATEWAY_URL:-http://ai-gateway:3001}
```

**Note**: If Ollama is running on host machine (not in Docker), use `host.docker.internal`:
```env
LLM_ENDPOINT=http://host.docker.internal:11434
```

#### Step 5: Start AI Gateway Service

Start AI Gateway service (if not already running):

```bash
# Start all services (includes AI Gateway)
docker-compose up -d

# Or start only AI Gateway
docker-compose up -d ai-gateway
```

#### Step 6: Restart Web Container

After updating environment variables, restart the web container:

```bash
# Restart only the web service
docker-compose restart web

# Or recreate containers
docker-compose up -d --force-recreate web
```

#### Step 7: Verify Configuration

Check container logs to verify AI Gateway initialization:

```bash
# View AI Gateway container logs
docker-compose logs ai-gateway | grep -i "ai gateway"

# View web container logs
docker-compose logs web | grep -i "ai gateway"

# Expected output if configured correctly:
# ✅ AI Gateway service initialized successfully

# Expected output if not configured:
# ⚠️ AI Gateway not configured
```

### Bare-Metal Setup

**For non-Docker deployments**. Configure AI providers via system environment variables or `.env` file.

#### Step 1: Install and Configure AI Provider

Follow the same steps as Docker setup (Steps 1-2 above) to set up your AI provider.

#### Step 2: Install and Run AI Gateway

**If AI Gateway is part of application**:
- AI Gateway should be started automatically with the application
- Check application documentation for AI Gateway setup

**If AI Gateway is separate service**:
- Install and run AI Gateway service
- Configure AI Gateway to connect to your AI provider
- Verify AI Gateway is accessible at `http://localhost:3001`

#### Step 3: Create `.env` File

Create or update `.env` file in your application root:

**For Ollama**:
```env
AI_GATEWAY_URL=http://localhost:3001
LLM_ENDPOINT=http://localhost:11434
```

**For OpenAI**:
```env
AI_GATEWAY_URL=http://localhost:3001
OPENAI_API_KEY=sk-your-openai-api-key
```

**For Anthropic**:
```env
AI_GATEWAY_URL=http://localhost:3001
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

#### Step 4: Load Environment Variables

Ensure your application loads environment variables from `.env` file:

- **Next.js**: Automatically loads `.env` files (`.env.local`, `.env.production`, etc.)
- **Node.js**: Use `dotenv` package: `require('dotenv').config()`

#### Step 5: Restart Application

Restart your application to load new environment variables:

```bash
# PM2
pm2 restart stride-web
pm2 restart stride-ai-gateway  # If separate service

# systemd
sudo systemctl restart stride-web
sudo systemctl restart stride-ai-gateway  # If separate service

# Manual
# Stop and start your Node.js processes
```

#### Step 6: Verify Configuration

Check application logs:

```bash
# If using PM2
pm2 logs stride-web | grep -i "ai gateway"
pm2 logs stride-ai-gateway | grep -i "ai gateway"

# If using systemd
sudo journalctl -u stride-web -f | grep -i "ai gateway"

# Expected output if configured correctly:
# ✅ AI Gateway service initialized successfully
```

---

## Configuration Examples

### Ollama (Self-Hosted)

**Docker** (`.env` file):
```env
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://host.docker.internal:11434  # If Ollama on host
# Or if Ollama in Docker network:
# LLM_ENDPOINT=http://ollama:11434
```

**Docker Compose Example** (with Ollama in Docker):
```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: stride-ollama
    restart: unless-stopped
    volumes:
      - ollama-data:/root/.ollama
    ports:
      - "11434:11434"
    networks:
      - stride-network

  ai-gateway:
    environment:
      LLM_ENDPOINT: http://ollama:11434  # Use service name
    depends_on:
      - ollama

volumes:
  ollama-data:
```

**Bare-Metal** (`.env` file):
```env
AI_GATEWAY_URL=http://localhost:3001
LLM_ENDPOINT=http://localhost:11434
```

### OpenAI

**Docker** (`.env` file):
```env
AI_GATEWAY_URL=http://ai-gateway:3001
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Docker Compose Example**:
```yaml
services:
  ai-gateway:
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
```

**Bare-Metal** (`.env` file):
```env
AI_GATEWAY_URL=http://localhost:3001
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Anthropic

**Docker** (`.env` file):
```env
AI_GATEWAY_URL=http://ai-gateway:3001
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
```

**Docker Compose Example**:
```yaml
services:
  ai-gateway:
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
```

**Bare-Metal** (`.env` file):
```env
AI_GATEWAY_URL=http://localhost:3001
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
```

### Google Gemini

**Docker** (`.env` file):
```env
AI_GATEWAY_URL=http://ai-gateway:3001
GOOGLE_AI_API_KEY=AIza-your-google-ai-api-key-here
```

**Docker Compose Example**:
```yaml
services:
  ai-gateway:
    environment:
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY:-}
```

**Bare-Metal** (`.env` file):
```env
AI_GATEWAY_URL=http://localhost:3001
GOOGLE_AI_API_KEY=AIza-your-google-ai-api-key-here
```

---

## Verification

### Check if AI Gateway is Configured

The application automatically detects AI Gateway configuration on startup. Check the logs:

**Docker**:
```bash
docker-compose logs ai-gateway | grep -i "ai gateway"
docker-compose logs web | grep -i "ai gateway"

# If configured correctly:
# ✅ AI Gateway service initialized successfully

# If not configured:
# ⚠️ AI Gateway not configured
```

**Bare-Metal**:
```bash
tail -f /var/log/stride/app.log | grep -i "ai gateway"

# Or if using PM2
pm2 logs stride-ai-gateway | grep -i "ai gateway"
```

### Test AI Provider Connection

#### Method 1: Test Ollama Connection

**From Docker Container**:
```bash
# Enter AI Gateway container
docker-compose exec ai-gateway sh

# Test Ollama endpoint
curl http://localhost:11434/api/tags  # If Ollama in same network
# Or
curl http://host.docker.internal:11434/api/tags  # If Ollama on host
```

**From Host System** (Bare-Metal):
```bash
# Test Ollama endpoint
curl http://localhost:11434/api/tags

# Expected output: JSON list of available models
```

#### Method 2: Test OpenAI Connection

**From Docker Container**:
```bash
# Enter AI Gateway container
docker-compose exec ai-gateway sh

# Test OpenAI API (if curl available)
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**From Host System** (Bare-Metal):
```bash
# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### Method 3: Test Anthropic Connection

**From Docker Container**:
```bash
# Enter AI Gateway container
docker-compose exec ai-gateway sh

# Test Anthropic API (if curl available)
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-opus-20240229", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'
```

**From Host System** (Bare-Metal):
```bash
# Test Anthropic API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-opus-20240229", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'
```

#### Method 4: Test Google Gemini Connection

**From Docker Container**:
```bash
# Enter AI Gateway container
docker-compose exec ai-gateway sh

# Test Google Gemini API (if curl available)
curl "https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_AI_API_KEY"
```

**From Host System** (Bare-Metal):
```bash
# Test Google Gemini API
curl "https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_AI_API_KEY"

# Expected output: JSON list of available models
```

#### Method 5: Test AI Gateway Health

**From Docker Container**:
```bash
# Enter web container
docker-compose exec web sh

# Test AI Gateway health endpoint
curl http://ai-gateway:3001/health

# Or from host
curl http://localhost:3001/health
```

#### Method 6: Test AI Triage Feature

1. **Navigate to Application**: Go to issues page
2. **Create Test Issue**: Create a new issue with description
3. **Check AI Triage**: If AI triage is enabled, issue should be automatically analyzed and prioritized
4. **Check Logs**: Verify AI Gateway logs show API calls

---

## Examples

### Minimal Working Example (Ollama)

**`.env` file**:
```env
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://host.docker.internal:11434
```

**docker-compose.yml** (if using Docker):
```yaml
services:
  ai-gateway:
    environment:
      LLM_ENDPOINT: http://host.docker.internal:11434
```

### Environment-Specific Configuration

**Development** (`.env.development`):
```env
# Use Ollama for local development
AI_GATEWAY_URL=http://localhost:3001
LLM_ENDPOINT=http://localhost:11434
```

**Production** (`.env.production`):
```env
# Use OpenAI for production (or Anthropic, Google Gemini)
AI_GATEWAY_URL=http://ai-gateway:3001
OPENAI_API_KEY=sk-production-openai-key
# Or
# ANTHROPIC_API_KEY=sk-ant-production-anthropic-key
# Or
# GOOGLE_AI_API_KEY=AIza-production-google-ai-key
```

**docker-compose.yml** (with environment-specific config):
```yaml
services:
  ai-gateway:
    env_file:
      - .env.${NODE_ENV:-development}
```

---

## Troubleshooting

### Docker-Specific Issues

#### Ollama Connection Fails (Docker)

**Problem**: Cannot connect to Ollama from Docker container.

**Causes**:
- Ollama running on host but container can't reach it
- Incorrect `LLM_ENDPOINT` URL
- Ollama not running

**Solution**:
1. **If Ollama on host**: Use `host.docker.internal`:
   ```env
   LLM_ENDPOINT=http://host.docker.internal:11434
   ```
   **Note**: `host.docker.internal` works on Docker Desktop (Mac/Windows) but may not work on Linux. For Linux, use host IP:
   ```env
   LLM_ENDPOINT=http://172.17.0.1:11434  # Default Docker bridge IP
   # Or
   LLM_ENDPOINT=http://<host-ip>:11434
   ```

2. **If Ollama in Docker**: Use service name:
   ```env
   LLM_ENDPOINT=http://ollama:11434
   ```
   Ensure Ollama service is in same Docker network.

3. **Test connection**:
   ```bash
   docker-compose exec ai-gateway curl http://host.docker.internal:11434/api/tags
   ```

#### AI Gateway Service Not Starting

**Problem**: AI Gateway container fails to start.

**Causes**:
- Environment variables not set correctly
- Port conflict (3001 already in use)
- Build errors

**Solution**:
1. **Check logs**:
   ```bash
   docker-compose logs ai-gateway
   ```
2. **Verify environment variables**:
   ```bash
   docker-compose exec ai-gateway env | grep -E "(LLM_ENDPOINT|OPENAI|ANTHROPIC)"
   ```
3. **Check port availability**:
   ```bash
   lsof -i :3001  # Check if port 3001 is in use
   ```
4. **Rebuild service**:
   ```bash
   docker-compose build ai-gateway
   docker-compose up -d ai-gateway
   ```

### Connection Problems

#### "AI Gateway connection failed"

**Problem**: Web application cannot connect to AI Gateway.

**Causes**:
- AI Gateway service not running
- Incorrect `AI_GATEWAY_URL`
- Network connectivity issues (Docker or host)

**Solution**:
1. **Check AI Gateway is running**:
   ```bash
   # Docker
   docker-compose ps ai-gateway
   
   # Bare-Metal
   ps aux | grep ai-gateway
   ```

2. **Verify AI_GATEWAY_URL**:
   - Docker: `http://ai-gateway:3001` (service name)
   - Bare-Metal: `http://localhost:3001` (localhost)

3. **Test connection**:
   ```bash
   # Docker
   docker-compose exec web curl http://ai-gateway:3001/health
   
   # Bare-Metal
   curl http://localhost:3001/health
   ```

4. **Check network**: Ensure services are in same Docker network (if using Docker)

#### "API key invalid" (OpenAI/Anthropic/Google Gemini)

**Problem**: OpenAI, Anthropic, or Google Gemini API key is rejected.

**Causes**:
- API key incorrect or expired
- API key doesn't have required permissions
- Account suspended or billing issues
- API key restrictions (for Google Gemini, key may be restricted to specific APIs)

**Solution**:
1. **Verify API key**: Check key is correct (no extra spaces, correct format)
   - OpenAI: Starts with `sk-`
   - Anthropic: Starts with `sk-ant-`
   - Google Gemini: Starts with `AIza`
2. **Check account status**: Log into provider console and verify:
   - Account is active
   - Billing is set up (if required)
   - API key exists and has correct permissions
   - For Google Gemini: Check API restrictions in Google Cloud Console
3. **Test API key manually**:
   ```bash
   # OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   
   # Anthropic
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "Content-Type: application/json" \
     -d '{"model": "claude-3-opus-20240229", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'
   
   # Google Gemini
   curl "https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_AI_API_KEY"
   ```
4. **Regenerate API key**: If needed, create new API key in provider console

### Service-Specific Issues

#### Ollama Model Not Found

**Problem**: Ollama endpoint works but model not available.

**Causes**:
- Model not downloaded
- Wrong model name
- Ollama service issue

**Solution**:
1. **List available models**:
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. **Download model**:
   ```bash
   ollama pull llama2  # Or mistral, codellama, etc.
   ```
3. **Verify model name**: Use exact model name from Ollama

#### OpenAI Rate Limits

**Problem**: OpenAI API requests are rate-limited.

**Causes**:
- Free tier rate limits
- High request volume
- Account tier limitations

**Solution**:
1. **Check rate limits**: Review OpenAI dashboard for quota and limits
2. **Upgrade plan**: Consider upgrading OpenAI plan for higher limits
3. **Implement retries**: Application should handle rate limits with exponential backoff
4. **Use caching**: Cache AI responses to reduce API calls

#### Google Gemini API Issues

**Problem**: Google Gemini API requests fail or are rejected.

**Causes**:
- API key restrictions (key restricted to specific APIs/IPs)
- API not enabled in Google Cloud project
- Billing not enabled for Google Cloud project
- Rate limits or quota exceeded
- Incorrect API endpoint or model name

**Solution**:
1. **Check API Restrictions**: In Google Cloud Console, verify:
   - API key is not restricted (or restricted correctly)
   - Gemini API is enabled in the project
   - API key has access to Generative Language API
2. **Verify Billing**: Ensure billing is enabled for Google Cloud project
3. **Check Quota**: Review quota limits in Google Cloud Console
4. **Verify API Key Format**: Google Gemini keys start with `AIza` and are longer than OpenAI/Anthropic keys
5. **Test API Key**: Use the test command from verification section
6. **Check Model Availability**: Verify model name is correct (e.g., `gemini-pro`, `gemini-ultra`)

#### Anthropic Rate Limits

**Problem**: Anthropic API requests are rate-limited.

**Causes**:
- Free tier rate limits (if applicable)
- High request volume
- Account tier limitations

**Solution**:
1. **Check rate limits**: Review Anthropic dashboard for quota and limits
2. **Upgrade plan**: Consider upgrading Anthropic plan for higher limits (if available)
3. **Implement retries**: Application should handle rate limits with exponential backoff
4. **Use caching**: Cache AI responses to reduce API calls

### Debugging Techniques

#### Enable AI Gateway Debug Logging

**Docker** (`.env` file):
```env
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://host.docker.internal:11434
DEBUG=ai-gateway:*  # Enable debug logging (if supported)
```

**Check logs**:
```bash
docker-compose logs ai-gateway | grep -i debug
docker-compose logs web | grep -i "ai gateway"
```

#### Check Environment Variables

**Docker**:
```bash
# List AI-related environment variables
docker-compose exec ai-gateway env | grep -E "(LLM_ENDPOINT|OPENAI|ANTHROPIC|GOOGLE_AI)"
docker-compose exec web env | grep AI_GATEWAY_URL

# Expected output:
# LLM_ENDPOINT=http://host.docker.internal:11434
# OPENAI_API_KEY=sk-xxx (if using OpenAI)
# ANTHROPIC_API_KEY=sk-ant-xxx (if using Anthropic)
# GOOGLE_AI_API_KEY=AIza-xxx (if using Gemini)
# AI_GATEWAY_URL=http://ai-gateway:3001
```

**Bare-Metal**:
```bash
# Check environment variables
env | grep -E "(AI_GATEWAY_URL|LLM_ENDPOINT|OPENAI|ANTHROPIC|GOOGLE_AI)"

# Or check .env file
cat .env | grep -E "(AI_GATEWAY_URL|LLM_ENDPOINT|OPENAI|ANTHROPIC|GOOGLE_AI)"
```

---

## Security Best Practices

1. **Protect API Keys**: Treat API keys as sensitive information
   - Never commit API keys to version control
   - Use environment variables or secrets management
   - For Docker: Use Docker secrets or environment variable files (not committed)

2. **Use Self-Hosted When Possible**: Ollama provides better privacy (data stays local)
   - Commercial providers (OpenAI, Anthropic, Google Gemini) send data to their servers
   - Self-hosted avoids data privacy concerns

3. **Monitor Usage**: Track AI API usage and costs
   - Commercial providers charge per token/request
   - Set up billing alerts
   - Monitor usage in provider dashboards

4. **Filter Sensitive Data**: Configure AI Gateway to filter sensitive data before sending to AI:
   - PII (personally identifiable information)
   - Passwords and tokens
   - Credit card numbers
   - Configure data scrubbing in AI Gateway

5. **Rate Limiting**: Implement rate limiting to prevent abuse and control costs

---

## Related Documentation

- [Integration Overview](/docs/integrations) - All integrations guide
- [Configuration Documentation](/docs/configuration) - YAML workflow configuration

**Note**: Docker deployment documentation is available in the repository's `docs/deployment/docker.md` file.

---

## External Resources

- [Ollama Documentation](https://ollama.ai/docs) - Ollama setup and model guide
- [OpenAI API Documentation](https://platform.openai.com/docs) - OpenAI API reference
- [Anthropic API Documentation](https://docs.anthropic.com/) - Anthropic API reference
- [Google Gemini API Documentation](https://ai.google.dev/docs) - Google Gemini API reference and setup guide
# Docker Deployment Guide: Stride

**Purpose**: Complete guide for deploying Stride using Docker Compose  
**Target Audience**: System administrators, DevOps engineers, self-hosting users  
**Last Updated**: 2024-12-19

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Starting Services](#starting-services)
- [Database Initialization](#database-initialization)
- [Verifying Deployment](#verifying-deployment)
- [Production Deployment](#production-deployment)
- [Service Management](#service-management)
- [Updating Stride](#updating-stride)
- [Troubleshooting](#troubleshooting)
- [Backup and Recovery](#backup-and-recovery)

## Prerequisites

### Required Software

- **Docker**: Version 20.10+ ([Installation Guide](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0+ (included with Docker Desktop, or install separately)
- **Git**: For cloning the repository
- **Minimum Resources**:
  - 2 CPU cores
  - 4 GB RAM
  - 10 GB disk space (more for production workloads)

### System Requirements

- Linux, macOS, or Windows (with WSL2)
- Docker daemon running
- Ports available:
  - `3000`: Web application
  - `3001`: AI Gateway (optional)
  - `5433`: PostgreSQL (if exposed externally)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/stride.git
cd stride
```

### 2. Configure Environment

Create a `.env` file in the project root (see [Environment Configuration](#environment-configuration) for details):

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Note**: Docker Compose automatically loads environment variables from the `.env` file in the project root. All variables are documented in `.env.example` with descriptions and default values. The `docker-compose.yml` file uses these variables with appropriate defaults for development.

### 3. Start Services

```bash
docker compose up -d
```

This starts all services in detached mode:
- PostgreSQL database
- Next.js web application
- AI Gateway (optional)

### 4. Initialize Database

```bash
docker compose exec web pnpm --filter @stride/database prisma migrate deploy
```

### 5. Access Application

Open your browser to:
- **Web Application**: http://localhost:3000
- **AI Gateway** (if enabled): http://localhost:3001

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DB_PASSWORD=your_secure_database_password
DATABASE_URL=postgresql://stride:${DB_PASSWORD}@stride-postgres:5432/stride

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_VERSION=1.0.0

# Authentication Secrets (REQUIRED - Change in production!)
JWT_SECRET=your-jwt-secret-min-32-characters
SESSION_SECRET=your-session-secret-min-32-characters

# AI Gateway (Optional)
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://localhost:11434
# Or use commercial APIs:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Email Configuration (Optional - see docs/deployment/smtp-configuration.md)
# The application works fully without SMTP. Email is only needed for automatic invitation emails.
# If SMTP is not configured, you can still create invitations and share links manually.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@your-domain.com

# OAuth Configuration (Optional - for repository integration)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret

# Marketing Site Configuration (Optional - for apps/site)
NEXT_PUBLIC_GITHUB_REPOSITORY_URL=https://github.com/your-org/stride

# Rate Limiting (Optional)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Logging (Optional)
LOG_LEVEL=info
LOG_FORMAT=json

# Error Tracking (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
ERROR_TRACKING_ENABLED=true
```

### Security Notes

⚠️ **CRITICAL**: Before deploying to production:

1. **Generate secure secrets**:
   ```bash
   # Generate random secrets (use these commands or a password manager)
   openssl rand -hex 32  # For JWT_SECRET
   openssl rand -hex 32  # For SESSION_SECRET
   openssl rand -hex 32  # For DB_PASSWORD
   ```

2. **Set strong database password**: Use a strong, unique password for `DB_PASSWORD`

3. **Use HTTPS**: Set `NEXT_PUBLIC_APP_URL` to your HTTPS URL

4. **Restrict access**: Do not expose database port (5433) to the internet

5. **Protect .env file**: Ensure `.env` has proper file permissions:
   ```bash
   chmod 600 .env
   ```

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_PASSWORD` | Yes | `stride_dev_password` | PostgreSQL database password |
| `DATABASE_URL` | Yes | Auto-generated | Full database connection string |
| `NODE_ENV` | Yes | `development` | Environment mode (`production`, `development`) |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Public URL of the application |
| `APP_VERSION` | No | - | Application version (used for error tracking) |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing (min 32 chars) |
| `SESSION_SECRET` | Yes | - | Secret for session encryption (min 32 chars) |
| `AI_GATEWAY_URL` | No | `http://ai-gateway:3001` | AI Gateway service URL |
| `LLM_ENDPOINT` | No | `http://localhost:11434` | Local LLM endpoint (Ollama) |
| `OPENAI_API_KEY` | No | - | OpenAI API key (alternative to local LLM) |
| `ANTHROPIC_API_KEY` | No | - | Anthropic API key (alternative to local LLM) |
| `SMTP_HOST` | No* | - | SMTP server hostname (required only if using email invitations) |
| `SMTP_PORT` | No* | `587` | SMTP server port (required only if using email invitations) |
| `SMTP_USER` | No* | - | SMTP authentication username (required only if using email invitations) |
| `SMTP_PASSWORD` | No* | - | SMTP authentication password (required only if using email invitations) |
| `SMTP_FROM` | No | `SMTP_USER` | Default sender email address |

**Note**: SMTP configuration is optional. The application works fully without it. See [SMTP Configuration Guide](./smtp-configuration.md) for setup instructions and troubleshooting.
| `GITHUB_CLIENT_ID` | No | - | GitHub OAuth client ID (for repository integration) |
| `GITHUB_CLIENT_SECRET` | No | - | GitHub OAuth client secret |
| `GITLAB_CLIENT_ID` | No | - | GitLab OAuth client ID (for repository integration) |
| `GITLAB_CLIENT_SECRET` | No | - | GitLab OAuth client secret |
| `NEXT_PUBLIC_GITHUB_REPOSITORY_URL` | No | `https://github.com` | GitHub repository URL for marketing site's "View on GitHub" button |
| `RATE_LIMIT_ENABLED` | No | `true` | Enable rate limiting |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Maximum requests per time window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit time window (milliseconds) |
| `LOG_LEVEL` | No | `info` | Logging level (`debug`, `info`, `warn`, `error`) |
| `LOG_FORMAT` | No | `json` | Log format (`json`, `pretty`) |
| `SENTRY_DSN` | No | - | Sentry DSN for error tracking |
| `ERROR_TRACKING_ENABLED` | No | `false` | Enable error tracking |

## Starting Services

### Start All Services

```bash
docker compose up -d
```

The `-d` flag runs services in detached mode (background).

### Start Specific Services

```bash
# Start only database
docker compose up -d stride-postgres

# Start database and web application (skip AI Gateway)
docker compose up -d stride-postgres web
```

### View Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f web
docker compose logs -f stride-postgres
docker compose logs -f ai-gateway
```

### Check Service Status

```bash
docker compose ps
```

Expected output shows all services as "Up (healthy)" or "Up":

```
NAME                 STATUS
stride-postgres      Up (healthy)
stride-web           Up
stride-ai-gateway    Up
```

## Database Initialization

### Running Migrations

After starting services for the first time, initialize the database schema:

```bash
# Production migrations (use for Docker deployments)
docker compose exec web pnpm --filter @stride/database prisma migrate deploy
```

This applies all pending migrations to create the database schema.

### Verifying Database Connection

```bash
# Access PostgreSQL shell
docker compose exec stride-postgres psql -U stride -d stride

# Test connection from web container
docker compose exec web pnpm --filter @stride/database prisma db pull
```

### Creating Admin Account

After database initialization, access the application at http://localhost:3000. On first access, you'll be prompted to create an admin account:

1. Navigate to the setup page (usually `/setup`)
2. Enter admin credentials:
   - Email: `admin@your-domain.com`
   - Username: `admin`
   - Password: (choose a strong password)
3. Complete the setup wizard

⚠️ **Note**: Only the first user account created will have admin privileges.

## Verifying Deployment

### Health Checks

1. **Application Health**:
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"ok"}
   ```

2. **Database Health**:
   ```bash
   docker compose exec stride-postgres pg_isready -U stride -d stride
   # Should return: stride-postgres:5432 - accepting connections
   ```

3. **Service Logs** (check for errors):
   ```bash
   docker compose logs web | tail -50
   docker compose logs stride-postgres | tail -50
   ```

### Functional Verification

1. **Access Web UI**: http://localhost:3000
2. **Login**: Use admin credentials created during setup
3. **Create Project**: Verify you can create a new project
4. **Check API**: Verify API endpoints respond correctly

## Production Deployment

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Set `NODE_ENV=production`
- [ ] Configure `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set up HTTPS (reverse proxy recommended)
- [ ] Configure backup strategy (see [Backup and Recovery](#backup-and-recovery))
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules
- [ ] Review security settings
- [ ] Test disaster recovery procedures

### Recommended Production Architecture

For production, consider:

1. **Reverse Proxy**: Use Nginx or Traefik in front of the web service
2. **SSL/TLS**: Terminate SSL at the reverse proxy
3. **External Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
4. **Volume Backups**: Regular backups of `stride-postgres-data` volume
5. **Resource Limits**: Configure Docker resource limits in `docker-compose.yml`
6. **Monitoring**: Set up health checks and monitoring (Prometheus, Grafana)

### Example Production docker-compose.yml Overrides

Create `docker-compose.prod.yml`:

```yaml
services:
  web:
    environment:
      NODE_ENV: production
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    restart: always

  stride-postgres:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: always
```

Start with production overrides:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Service Management

### Stop Services

```bash
# Stop all services (keeps containers)
docker compose stop

# Stop and remove containers (keeps volumes)
docker compose down

# Stop and remove containers and volumes (⚠️ DELETES DATA)
docker compose down -v
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart web
```

### Update Service Configuration

```bash
# Rebuild and restart service after code changes
docker compose up -d --build web

# Force recreate containers
docker compose up -d --force-recreate
```

### View Resource Usage

```bash
docker stats
```

### Access Container Shells

```bash
# Web application shell
docker compose exec web sh

# Database shell
docker compose exec stride-postgres psql -U stride -d stride
```

## Updating Stride

### Update Process

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Rebuild images**:
   ```bash
   docker compose build
   ```

3. **Apply database migrations**:
   ```bash
   docker compose exec web pnpm --filter @stride/database prisma migrate deploy
   ```

4. **Restart services**:
   ```bash
   docker compose up -d
   ```

5. **Verify deployment** (see [Verifying Deployment](#verifying-deployment))

### Zero-Downtime Updates

For zero-downtime updates:

```bash
# Build new images without stopping services
docker compose build

# Rolling restart (restart one service at a time)
docker compose up -d --no-deps web
# Wait for web to be healthy, then restart other services if needed
```

⚠️ **Note**: Zero-downtime updates require proper health checks and load balancing configuration.

## Troubleshooting

### Service Won't Start

**Problem**: Service exits immediately or fails to start

**Solutions**:
1. Check logs: `docker compose logs <service-name>`
2. Verify environment variables are set correctly
3. Check port conflicts: `lsof -i :3000` (or port in use)
4. Verify Docker has enough resources (CPU/memory)

### Database Connection Errors

**Problem**: `Can't reach database server` or connection timeout

**Solutions**:
1. Verify database is running: `docker compose ps stride-postgres`
2. Check database logs: `docker compose logs stride-postgres`
3. Verify `DATABASE_URL` matches docker-compose service name
4. Ensure database health check passes: `docker compose exec stride-postgres pg_isready`
5. Check network connectivity: `docker compose exec web ping stride-postgres`

### Migration Errors

**Problem**: `Migration failed` or schema errors

**Solutions**:
1. Check migration logs: `docker compose logs web | grep -i migration`
2. Verify database is accessible
3. Run migrations manually: `docker compose exec web pnpm --filter @stride/database prisma migrate deploy`
4. Check for pending migrations: `docker compose exec web pnpm --filter @stride/database prisma migrate status`

### Out of Memory Errors

**Problem**: Containers crash with OOM (Out of Memory) errors

**Solutions**:
1. Increase Docker memory limit
2. Check resource usage: `docker stats`
3. Reduce concurrent operations
4. Consider upgrading server resources

### Port Already in Use

**Problem**: `Port 3000 is already in use`

**Solutions**:
1. Find process using port: `lsof -i :3000`
2. Stop conflicting service
3. Change port in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Map host port 3001 to container port 3000
   ```

### Application Not Accessible

**Problem**: Cannot access http://localhost:3000

**Solutions**:
1. Verify service is running: `docker compose ps`
2. Check service logs: `docker compose logs web`
3. Verify port mapping in `docker-compose.yml`
4. Check firewall rules
5. Try accessing from container: `docker compose exec web curl localhost:3000`

## Backup and Recovery

### Database Backup

**Manual Backup**:

```bash
# Create backup
docker compose exec stride-postgres pg_dump -U stride stride > backup_$(date +%Y%m%d_%H%M%S).sql

# Or backup to compressed file
docker compose exec stride-postgres pg_dump -U stride stride | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Automated Backup Script**:

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"
docker compose exec -T stride-postgres pg_dump -U stride stride | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to cron for daily backups:
```bash
0 2 * * * /path/to/stride/scripts/backup-db.sh
```

### Volume Backup

```bash
# Backup Docker volume
docker run --rm -v stride-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-backup.tar.gz -C /data .
```

### Database Restore

**From SQL Dump**:

```bash
# Restore from SQL file
docker compose exec -T stride-postgres psql -U stride stride < backup_20241219_120000.sql

# Restore from compressed file
gunzip -c backup_20241219_120000.sql.gz | docker compose exec -T stride-postgres psql -U stride stride
```

**From Volume Backup**:

```bash
# Stop services
docker compose down

# Restore volume
docker run --rm -v stride-postgres-data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/postgres-data-backup.tar.gz"

# Start services
docker compose up -d
```

⚠️ **Warning**: Restoring backups will overwrite existing data. Always test restore procedures in a non-production environment first.

### Backup Best Practices

1. **Automate backups**: Schedule regular automated backups
2. **Off-site storage**: Store backups in separate location
3. **Test restores**: Regularly test backup restoration
4. **Retention policy**: Keep backups for appropriate retention period
5. **Encryption**: Encrypt sensitive backups

## Additional Resources

- [Quickstart Guide](../specs/001-stride-application/quickstart.md) - Development setup
- [Database Setup](../../README-DATABASE.md) - Database-specific documentation
- [Implementation Plan](../specs/001-stride-application/impl-plan.md) - Technical architecture
- [Docker Documentation](https://docs.docker.com/) - Official Docker docs
- [Docker Compose Documentation](https://docs.docker.com/compose/) - Docker Compose reference

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review service logs: `docker compose logs`
3. Check GitHub Issues
4. Consult documentation in `docs/` directory


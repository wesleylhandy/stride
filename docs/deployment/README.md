---
purpose: Overview of deployment options and guides for Stride
targetAudience: System administrators, DevOps engineers, self-hosting users
lastUpdated: 2026-01-12
---

# Deployment Guide

This directory contains deployment guides for Stride.

## Available Guides

- **[Docker Deployment](/docs/deployment/docker)** - Complete guide for deploying Stride using Docker Compose
- **[Infrastructure Configuration](/docs/deployment/infrastructure-configuration)** - Global infrastructure settings (Git OAuth and AI Gateway)

## Quick Start

For a quick deployment using Docker Compose:

1. **Prerequisites**: Docker 20.10+ and Docker Compose 2.0+
2. **Configure**: Copy `.env.example` to `.env` and set required variables
3. **Deploy**: Run `docker compose up -d`
4. **Initialize**: Run migrations: `docker compose exec web pnpm --filter @stride/database prisma migrate deploy`
5. **Access**: Open http://localhost:3000 and create your admin account

For detailed instructions, see [Docker Deployment Guide](/docs/deployment/docker).

## Deployment Options

### Docker Compose (Recommended)

Best for:
- Small to medium deployments
- Self-hosting
- Development environments
- Single-server deployments

See [Docker Deployment Guide](/docs/deployment/docker) for complete instructions.

### Kubernetes (Advanced)

For production-scale deployments with multiple servers:

1. Use Helm charts (if available)
2. Configure Kubernetes secrets for environment variables
3. Set up ingress controllers for HTTPS
4. Configure persistent volumes for database storage
5. Set up horizontal pod autoscaling

### Manual Deployment

For custom deployment scenarios:

1. Install Node.js 20+ and pnpm
2. Install PostgreSQL 16+
3. Configure environment variables
4. Run `pnpm install` and `pnpm build`
5. Start the application with `pnpm start`

## Environment Configuration

All deployment methods require configuration via environment variables. Key variables:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `SESSION_SECRET` - Session encryption secret (min 32 characters)
- `NEXT_PUBLIC_APP_URL` - Public URL of your application

**Optional:**
- `SMTP_*` - Email configuration (see [SMTP Integration](/docs/integrations/smtp))
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth integration (see [Git OAuth Integration](/docs/integrations/git-oauth))
- `SENTRY_DSN` - Error tracking (see [Sentry Integration](/docs/integrations/sentry))
- `AI_GATEWAY_URL` - AI features integration (see [AI Providers Integration](/docs/integrations/ai-providers))

See `.env.example` for a complete list of configuration options.

## Security Checklist

Before deploying to production:

- [ ] Generate secure secrets (`JWT_SECRET`, `SESSION_SECRET`, `DB_PASSWORD`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS (use reverse proxy if needed)
- [ ] Set strong database password
- [ ] Restrict database access (don't expose port 5433 to internet)
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Enable error tracking (Sentry)
- [ ] Review and configure rate limiting
- [ ] Test disaster recovery procedures

## Support

For deployment issues:

1. Check the relevant guide's troubleshooting section
2. Review application logs
3. Verify environment variables are set correctly
4. Check GitHub Issues for known problems

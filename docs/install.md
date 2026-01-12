---
purpose: Quick start guide for installing and running Stride with Docker Compose
targetAudience: System administrators, DevOps engineers, developers
lastUpdated: 2026-01-12
---

## Prerequisites

- Docker and Docker Compose installed
- At least 2GB of available RAM
- Port 3000 available (or configure a different port)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/stride.git
cd stride

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Run database migrations
docker compose exec web pnpm --filter @stride/database prisma migrate deploy

# Access the application
open http://localhost:3000
```

## Configuration

Edit the `.env` file to configure:

- Database connection settings
- JWT secret key
- OAuth credentials for GitHub/GitLab
- AI Gateway endpoint (optional)

For detailed configuration options, see the [Configuration Documentation](/docs/configuration).

## Next Steps

Once Stride is running, you'll be prompted to:

1. Create your admin account
2. Link your first repository
3. Create your first project

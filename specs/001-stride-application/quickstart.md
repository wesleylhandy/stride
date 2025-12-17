# Quickstart Guide: Stride Core Application

**Created**: 2024-12-19  
**Purpose**: Get Stride up and running quickly for development

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- Node.js 18+ and pnpm (for local development)
- PostgreSQL 16+ (if not using Docker)

## Quick Start with Docker Compose

### 1. Clone Repository

```bash
git clone https://github.com/your-org/stride.git
cd stride
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://stride:stride_password@postgres:5432/stride
DB_PASSWORD=stride_password

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=your-session-secret-change-in-production

# AI Gateway (optional)
AI_GATEWAY_URL=http://ai-gateway:3001
LLM_ENDPOINT=http://localhost:11434  # For local LLM (Ollama)
# Or use commercial API:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Email (optional, for email verification)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
```

### 3. Start Services

```bash
docker compose up -d
```

This starts:
- PostgreSQL database on port 5432
- Next.js application on port 3000
- AI Gateway on port 3001 (optional)

### 4. Initialize Database

Run Prisma migrations:

```bash
# If running locally (not in Docker)
pnpm --filter @stride/database prisma migrate dev

# Or if in Docker container
docker compose exec web pnpm --filter @stride/database prisma migrate deploy
```

### 5. Access Application

Open your browser to:
- **Application**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs (if Swagger UI is configured)

### 6. Create Admin Account

On first access, you'll be prompted to create an admin account:
- Email: `admin@example.com`
- Username: `admin`
- Password: (choose a secure password)

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

```bash
# Start PostgreSQL (or use Docker)
docker run -d \
  --name stride-postgres \
  -e POSTGRES_DB=stride \
  -e POSTGRES_USER=stride \
  -e POSTGRES_PASSWORD=stride_password \
  -p 5432:5432 \
  postgres:16

# Run migrations
pnpm --filter @stride/database prisma migrate dev

# Generate Prisma client
pnpm --filter @stride/database prisma generate
```

### 3. Start Development Servers

```bash
# Start all services in development mode
pnpm dev

# Or start individually:
pnpm --filter @stride/web dev        # Main application
pnpm --filter @stride/site dev       # Marketing site
pnpm --filter @stride/ai-gateway dev # AI Gateway (optional)
```

### 4. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Project Structure

```
stride/
├── apps/
│   ├── web/              # Main Next.js application
│   └── site/             # Marketing website
├── packages/
│   ├── ui/               # Shared component library
│   ├── database/         # Prisma schema and client
│   ├── yaml-config/      # YAML parsing and validation
│   ├── ai-gateway/       # AI integration service
│   └── types/            # Shared TypeScript types
├── specs/
│   └── 001-stride-application/
│       ├── spec.md       # Feature specification
│       ├── impl-plan.md  # Implementation plan
│       ├── data-model.md # Database schema
│       ├── contracts/    # API contracts
│       └── quickstart.md # This file
└── docker-compose.yml    # Docker Compose configuration
```

## First Steps After Setup

### 1. Create Your First Project

1. Log in with your admin account
2. Navigate to Projects
3. Click "Create Project"
4. Enter:
   - **Key**: `APP` (2-10 uppercase characters)
   - **Name**: `My Application`
   - **Repository URL**: (optional) Your GitHub/GitLab repository

### 2. Configure Workflow

1. Go to Project Settings → Configuration
2. Edit the `stride.config.yaml` file
3. Define your workflow statuses, custom fields, and automation rules
4. Save and validate

Example configuration:

```yaml
project_key: APP
project_name: My Application

workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
    - key: in_progress
      name: In Progress
      type: in_progress
    - key: done
      name: Done
      type: closed

custom_fields:
  - key: priority
    name: Priority
    type: dropdown
    options: [Low, Medium, High, Critical]
    required: false
```

### 3. Create Your First Issue

1. Press `Cmd/Ctrl + K` to open command palette
2. Type "create issue"
3. Fill in title and description
4. Save

### 4. Link Git Repository (Optional)

1. Go to Project Settings → Integrations
2. Connect your GitHub or GitLab repository
3. Configure webhook (automatic or manual)
4. Test webhook connection

## Common Tasks

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @stride/web test

# Run with coverage
pnpm test --coverage
```

### Database Management

```bash
# View database in Prisma Studio
pnpm --filter @stride/database prisma studio

# Reset database (WARNING: deletes all data)
pnpm --filter @stride/database prisma migrate reset

# Create new migration
pnpm --filter @stride/database prisma migrate dev --name migration_name
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @stride/web build

# Build Docker image
docker build -t stride:latest .
```

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running: `docker ps`
2. Check DATABASE_URL in `.env`
3. Test connection: `psql $DATABASE_URL`

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill process or change port in .env
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Migration Errors

**Error**: `Migration failed`

**Solution**:
```bash
# Reset database (development only)
pnpm --filter @stride/database prisma migrate reset

# Or manually fix migration
pnpm --filter @stride/database prisma migrate dev
```

### YAML Configuration Errors

**Error**: `Invalid YAML syntax`

**Solution**:
1. Use a YAML validator (e.g., yamllint)
2. Check indentation (must use spaces, not tabs)
3. Verify all required fields are present
4. Check for duplicate keys

## Next Steps

- Read the [Feature Specification](./spec.md) for detailed requirements
- Review the [Implementation Plan](./impl-plan.md) for technical details
- Check the [Data Model](./data-model.md) for database schema
- Explore [API Contracts](./contracts/api.yaml) for endpoint documentation

## Getting Help

- **Documentation**: See `docs/` directory
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Community**: Discord/Slack (if configured)

## Production Deployment

For production deployment, see:
- `docs/deployment/docker.md` - Docker deployment guide
- `docs/deployment/kubernetes.md` - Kubernetes deployment guide
- `docs/deployment/vercel.md` - Vercel deployment (marketing site only)

**Important**: Change all default secrets and passwords before deploying to production!


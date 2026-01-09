# Testing and Running Guide: Stride Application

This guide provides step-by-step instructions for running and testing the Stride application locally to verify your progress.

## Prerequisites

- **Node.js**: Version 24+ (check with `node --version`)
- **pnpm**: Version 10.26.0+ (check with `pnpm --version`)
- **Docker & Docker Compose**: For database (optional but recommended)
- **PostgreSQL**: Version 16+ (if not using Docker)

## Quick Start (Recommended)

### Option 1: Full Docker Setup (Easiest)

This runs everything in Docker containers:

```bash
# 1. Ensure .env file exists with required secrets
# (See Environment Setup section below)

# 2. Start all services
docker compose up -d

# 3. Run database migrations
docker compose exec web pnpm --filter @stride/database db:deploy

# 4. Access the application
# Open http://localhost:3000 in your browser
```

### Option 2: Local Development (Database in Docker)

This runs the database in Docker but the app locally:

```bash
# 1. Start database only
./scripts/db-start.sh
# OR: docker compose up -d stride-postgres

# 2. Set DATABASE_URL in .env
# DATABASE_URL=postgresql://stride:stride_dev_password@localhost:5433/stride

# 3. Install dependencies (if not already done)
pnpm install

# 4. Generate Prisma client
pnpm --filter @stride/database db:generate

# 5. Run migrations
pnpm --filter @stride/database db:deploy

# 6. Start development server
pnpm dev

# 7. Access the application
# Open http://localhost:3000 in your browser
```

## Environment Setup

### 1. Check/Create .env File

The `.env` file should exist. If not, copy from `.env.example`:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

Minimum required variables for development:

```env
# Database (if using local Docker)
DATABASE_URL=postgresql://stride:stride_dev_password@localhost:5433/stride
DB_PASSWORD=stride_dev_password

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication (REQUIRED - generate secure secrets)
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
```

**Generate secrets** (run these commands and add to .env):

```bash
openssl rand -hex 32  # Copy output to JWT_SECRET
openssl rand -hex 32  # Copy output to SESSION_SECRET
```

### 3. Verify Environment Variables

```bash
# Check if .env file exists and has required variables
grep -E "JWT_SECRET|SESSION_SECRET|DATABASE_URL" .env
```

## Database Setup

### Initialize Database Schema

After starting the database, run migrations:

```bash
# If using Docker Compose (all services)
docker compose exec web pnpm --filter @stride/database db:deploy

# If using local development (database in Docker)
pnpm --filter @stride/database db:deploy

# Generate Prisma client (if needed)
pnpm --filter @stride/database db:generate
```

### Verify Database Connection

```bash
# Test database connection
docker compose exec stride-postgres psql -U stride -d stride -c "SELECT 1;"

# OR if using local connection
psql postgresql://stride:stride_dev_password@localhost:5433/stride -c "SELECT 1;"
```

### Database Management Tools

```bash
# Open Prisma Studio (visual database browser)
pnpm --filter @stride/database db:studio
# Opens at http://localhost:5555

# Reset database (WARNING: deletes all data)
./scripts/db-reset.sh
# OR: pnpm --filter @stride/database exec npx prisma migrate reset
```

## Running the Application

### Development Mode

```bash
# Start all services (web app, marketing site)
pnpm dev

# Start specific service
pnpm --filter @stride/web dev        # Main application (port 3000)
pnpm --filter @stride/site dev       # Marketing site (port 3001)
```

The main application will be available at:

- **Web Application**: http://localhost:3000
- **Marketing Site**: http://localhost:3001 (if started)

### Production Build (Testing)

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @stride/web build

# Start production server
pnpm --filter @stride/web start
```

## Testing Progress

### 1. Verify Services are Running

```bash
# Check Docker containers (if using Docker)
docker compose ps

# Check if ports are in use
lsof -i :3000  # Web app
lsof -i :5433  # Database
```

### 2. Test Database Connection

```bash
# From web container
docker compose exec web pnpm --filter @stride/database exec npx prisma db pull

# OR from local
pnpm --filter @stride/database exec npx prisma db pull
```

### 3. Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Metrics endpoint
curl http://localhost:3000/api/metrics

# Auth endpoints (will require authentication)
curl http://localhost:3000/api/auth/me
```

### 4. Manual Testing Checklist

Based on completed User Stories (US1 & US2), test the following:

#### User Story 1: Deployment & Onboarding

- [ ] **Marketing Site**: Access http://localhost:3000 (or marketing site URL)
  - [ ] Site loads without errors
  - [ ] Navigation works
  - [ ] Dark/light theme toggle works
- [ ] **First Run Setup**:
  - [ ] Navigate to `/setup` or root URL
  - [ ] Create admin account form appears
  - [ ] Can create first admin user
  - [ ] Subsequent users cannot become admin
- [ ] **Authentication**:
  - [ ] Can register new user
  - [ ] Can login with credentials
  - [ ] Session persists after login
  - [ ] Can logout
  - [ ] `/api/auth/me` returns current user
- [ ] **Project Management**:
  - [ ] Can create new project
  - [ ] Project key must be unique
  - [ ] Can list projects
  - [ ] Can view project details
- [ ] **Repository Connection** (if OAuth configured):
  - [ ] Can connect GitHub/GitLab repository
  - [ ] OAuth flow completes
  - [ ] Repository connection is stored

#### User Story 2: Issue Creation and Management

- [ ] **Command Palette**:
  - [ ] Press `Cmd/Ctrl + K` opens command palette
  - [ ] Fuzzy search works
  - [ ] Can find "create issue" command
  - [ ] Navigation commands work
- [ ] **Issue Creation**:
  - [ ] Issue form opens from command palette
  - [ ] Form validates correctly (title required)
  - [ ] Markdown editor works for description
  - [ ] Can select issue type, priority, status
  - [ ] Custom fields render (if configured)
  - [ ] Can save issue successfully
- [ ] **Issue Display**:
  - [ ] Issue detail page loads
  - [ ] All fields display correctly
  - [ ] Custom fields show
  - [ ] Markdown renders correctly
  - [ ] Can edit issue (if authorized)
  - [ ] Status change works
- [ ] **Markdown Features**:
  - [ ] Markdown renders with formatting
  - [ ] Code blocks have syntax highlighting
  - [ ] Tables render correctly
  - [ ] GFM features work (strikethrough, etc.)
- [ ] **Mermaid Diagrams**:
  - [ ] Mermaid code blocks render as diagrams
  - [ ] Invalid diagrams show error gracefully
  - [ ] Diagrams load efficiently
- [ ] **Link Previews**:
  - [ ] Links in markdown are detected
  - [ ] Link previews display (for supported services)
  - [ ] Falls back to plain link if preview fails
- [ ] **Kanban Board**:
  - [ ] Board displays at `/projects/[projectId]/board`
  - [ ] Columns generated from workflow statuses
  - [ ] Issues organized by status
  - [ ] Drag-and-drop works
  - [ ] Status updates on drop
  - [ ] Keyboard navigation works
  - [ ] Issue count badges show
- [ ] **Workflow Validation**:
  - [ ] Invalid status transitions are blocked
  - [ ] Required fields enforced before status change
  - [ ] Validation errors display clearly

### 5. Automated Testing (If Available)

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @stride/web test
pnpm --filter @stride/ui test

# Run with coverage
pnpm test --coverage
```

**Note**: Test setup (Vitest, Playwright) is planned but may not be fully implemented yet (Phase 10).

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server` or `Connection refused`

```bash
# Check if database is running
docker compose ps stride-postgres

# Check database logs
docker compose logs stride-postgres

# Verify DATABASE_URL in .env matches Docker setup
# For Docker Compose: postgresql://stride:password@stride-postgres:5432/stride
# For local: postgresql://stride:stride_dev_password@localhost:5433/stride
```

**Solution**: Start database with `./scripts/db-start.sh` or `docker compose up -d stride-postgres`

### Migration Errors

**Error**: `Migration failed` or `Migration already applied`

```bash
# Check migration status
pnpm --filter @stride/database exec npx prisma migrate status

# Reset database (development only - deletes data!)
pnpm --filter @stride/database exec npx prisma migrate reset

# Apply migrations fresh
pnpm --filter @stride/database db:deploy
```

### Port Already in Use

**Error**: `Port 3000 is already in use`

```bash
# Find process using port
lsof -i :3000

# Kill process (replace PID with actual process ID)
kill -9 <PID>

# OR change port in .env
# NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Build Errors

**Error**: Type errors or missing dependencies

```bash
# Clean and reinstall
pnpm clean
pnpm install

# Generate Prisma client
pnpm --filter @stride/database db:generate

# Type check
pnpm --filter @stride/web type-check
```

### Missing Environment Variables

**Error**: `JWT_SECRET is required` or similar

```bash
# Check .env file exists
ls -la .env

# Verify required variables
grep -E "JWT_SECRET|SESSION_SECRET|DATABASE_URL" .env

# Generate missing secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For SESSION_SECRET
```

## Development Workflow

### Typical Development Session

```bash
# 1. Start database
./scripts/db-start.sh

# 2. Verify .env is configured
cat .env | grep -E "JWT_SECRET|SESSION_SECRET|DATABASE_URL"

# 3. Start development server
pnpm dev

# 4. Make changes to code
# (files auto-reload in development mode)

# 5. Test changes in browser
# http://localhost:3000

# 6. Check logs for errors
# (in terminal running pnpm dev)
```

### Database Changes

When modifying Prisma schema:

```bash
# 1. Edit packages/database/prisma/schema.prisma

# 2. Create migration
pnpm --filter @stride/database db:migrate --name description_of_change

# 3. Migration runs automatically in dev mode
# Client regenerates automatically
```

### Viewing Logs

```bash
# Development server logs
# (shown in terminal running pnpm dev)

# Docker logs
docker compose logs -f web
docker compose logs -f stride-postgres

# Specific service logs (last 50 lines)
docker compose logs --tail=50 web
```

## Manual Testing: Default Configuration

### Test Default Configuration with Reopened Status

This test verifies that the default configuration includes the "reopened" status and allows reopening closed issues.

**Prerequisites**:
- Application is running (see Quick Start above)
- You have completed onboarding and created a project

**Steps**:

1. **Create a new project**:
   ```bash
   # Navigate to the application
   http://localhost:3000
   
   # Complete onboarding if not already done
   # Create a new project through the UI
   ```

2. **Verify default configuration includes reopened status**:
   - Navigate to project settings: `/projects/[projectId]/settings/config`
   - View the configuration YAML
   - Verify the configuration includes a "reopened" status:
     ```yaml
     workflow:
       statuses:
         - key: todo
           name: To Do
           type: open
         - key: in_progress
           name: In Progress
           type: in_progress
         - key: in_review
           name: In Review
           type: in_progress
         - key: done
           name: Done
           type: closed
         - key: reopened  # Should be present
           name: Reopened
           type: in_progress
     ```

3. **Verify default configuration has no required custom fields**:
   - In the configuration, check the `custom_fields` section
   - All custom fields should have `required: false`
   - Example:
     ```yaml
     custom_fields:
       - key: priority
         name: Priority
         type: dropdown
         options: [Low, Medium, High, Critical]
         required: false  # Should be false
     ```

4. **Test status transitions on Kanban board**:
   - Navigate to the Kanban board: `/projects/[projectId]/board`
   - Create a new issue (if needed)
   - Test moving issue between statuses:
     - **todo → in_progress**: Should work
     - **in_progress → in_review**: Should work
     - **in_review → done**: Should work
     - **done → reopened**: Should work (reopens closed issue)
     - **reopened → todo**: Should work
     - **reopened → in_progress**: Should work
     - **reopened → done**: Should work

5. **Test that direct closed → open transition is blocked**:
   - Move an issue to "done" status
   - Try to drag it directly to "todo" status
   - **Expected**: Error message suggesting to use "reopened" status
   - Move issue to "reopened" first, then to "todo"
   - **Expected**: Should work without errors

6. **Verify permissive defaults**:
   - Move issues between any statuses (except closed → open)
   - **Expected**: All transitions should work without requiring custom fields
   - **Expected**: No errors about missing required fields

7. **Test reopen workflow**:
   - Move an issue through: `todo → in_progress → done`
   - Then move: `done → reopened → in_progress`
   - **Expected**: Should complete successfully
   - **Expected**: Issue should be reopened and ready to work on again

**Success Criteria**:
- ✅ Default configuration includes "reopened" status
- ✅ All custom fields have `required: false`
- ✅ Status transitions work as expected
- ✅ Closed → reopened transition works
- ✅ Reopened → open/in_progress transitions work
- ✅ Direct closed → open transition is blocked (with helpful error)
- ✅ No errors when moving issues without filling custom fields

**If tests fail**:
- Check browser console for errors
- Check server logs: `docker compose logs -f web`
- Verify configuration matches expected structure
- Review troubleshooting guide: `/docs/configuration-troubleshooting`

## Next Steps

After verifying the application runs:

1. **Test User Story 1**: Complete onboarding flow
2. **Test User Story 2**: Create issues, use Kanban board
3. **Test Default Configuration**: Verify permissive defaults work (see above)
4. **Check for Errors**: Review browser console and server logs
5. **Performance**: Check page load times, API response times
6. **Document Issues**: Note any bugs or missing features

## Additional Resources

- **Quickstart Guide**: `specs/001-stride-application/quickstart.md`
- **Deployment Guide**: `docs/deployment/docker.md`
- **API Documentation**: `specs/001-stride-application/contracts/api.yaml`
- **Specification**: `specs/001-stride-application/spec.md`

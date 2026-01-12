# Developer Guide

Welcome to the Stride developer guide. This document provides comprehensive information for developers working on the Stride codebase.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Database](#database)
- [API Development](#api-development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Getting Started

### Prerequisites

- **Node.js**: Version 24+ ([Install Node.js](https://nodejs.org/))
- **pnpm**: Version 10.26.0+ ([Install pnpm](https://pnpm.io/installation))
- **Docker & Docker Compose**: For database (recommended)
- **PostgreSQL**: Version 16+ (if not using Docker)
- **Git**: For version control

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/stride.git
   cd stride
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   **Required variables**:
   ```env
   DATABASE_URL=postgresql://stride:stride_dev_password@localhost:5433/stride
   JWT_SECRET=$(openssl rand -hex 32)
   SESSION_SECRET=$(openssl rand -hex 32)
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start database** (using Docker):
   ```bash
   docker compose up -d stride-postgres
   # OR use the helper script
   ./scripts/db-start.sh
   ```

5. **Run database migrations**:
   ```bash
   pnpm --filter @stride/database db:generate
   pnpm --filter @stride/database db:deploy
   ```

6. **Start development server**:
   ```bash
   pnpm dev
   ```

7. **Access the application**:
   - Web app: http://localhost:3000
   - Marketing site: http://localhost:3001 (optional)

### First-Time Setup

On first access, you'll need to create an admin account:

1. Navigate to http://localhost:3000
2. You should see the setup page
3. Create your admin account:
   - Email: `admin@example.com`
   - Username: `admin`
   - Password: (choose a secure password)

## Project Structure

Stride is a Turborepo monorepo with the following structure:

```
stride/
├── apps/
│   ├── web/              # Main Next.js application
│   │   ├── app/          # Next.js App Router pages
│   │   ├── src/          # Application source code
│   │   │   ├── components/  # React components
│   │   │   ├── lib/         # Utilities and services
│   │   │   └── middleware/  # Next.js middleware
│   │   └── public/       # Static assets
│   └── site/             # Marketing website (MDX)
│
├── packages/
│   ├── ui/               # Shared UI component library
│   │   ├── src/
│   │   │   ├── atoms/    # Basic components (Button, Input)
│   │   │   ├── molecules/# Composite components (Card, Form)
│   │   │   └── organisms/# Complex components (KanbanBoard)
│   │   └── dist/         # Built package
│   ├── database/         # Prisma schema and client
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       └── repositories/  # Data access layer
│   ├── types/            # Shared TypeScript types
│   ├── yaml-config/      # YAML configuration parser/validator
│   ├── ai-gateway/       # AI integration service
│   └── tsconfig/         # Shared TypeScript configs
│
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── specs/                # Feature specifications
└── turbo.json           # Turborepo configuration
```

### Key Directories

- **`apps/web`**: Main application using Next.js 16+ with App Router
- **`packages/ui`**: Shared component library following atomic design
- **`packages/database`**: Prisma schema and repository pattern implementation
- **`packages/types`**: Shared TypeScript types for type safety across packages
- **`packages/yaml-config`**: YAML configuration parsing and validation

## Development Workflow

### Available Scripts

From the project root:

```bash
# Development
pnpm dev              # Start all development servers
pnpm dev --filter @stride/web  # Start only web app

# Building
pnpm build            # Build all packages and apps
pnpm build --filter @stride/web  # Build specific package

# Code Quality
pnpm lint             # Lint all packages
pnpm lint:fix         # Auto-fix linting issues
pnpm type-check       # Type check all packages
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting

# Testing
pnpm test             # Run all tests
pnpm test --filter @stride/web  # Run tests for specific package

# Database
pnpm --filter @stride/database db:generate  # Generate Prisma client
pnpm --filter @stride/database db:deploy    # Run migrations
pnpm --filter @stride/database db:studio    # Open Prisma Studio (http://localhost:5555)
pnpm --filter @stride/database db:migrate   # Create new migration
pnpm --filter @stride/database db:reset     # Reset database (WARNING: deletes data)
```

### Turborepo Filtering

Use `--filter` to target specific packages:

```bash
# Filter by package name
pnpm --filter @stride/web dev

# Filter by directory
pnpm --filter ./apps/web dev

# Filter with dependencies
pnpm build --filter @stride/web...
```

### Hot Reload

Development servers support hot reload:
- **Next.js**: Fast Refresh for React components
- **TypeScript**: Incremental compilation
- **Prisma**: Regenerate client with `db:generate`

### Database Development

#### Running Migrations

```bash
# Create a new migration
pnpm --filter @stride/database db:migrate --name migration_name

# Apply migrations
pnpm --filter @stride/database db:deploy

# Generate Prisma client after schema changes
pnpm --filter @stride/database db:generate
```

#### Prisma Studio

Visual database browser:

```bash
pnpm --filter @stride/database db:studio
# Opens at http://localhost:5555
```

#### Database Scripts

Helper scripts in `scripts/`:

```bash
./scripts/db-start.sh   # Start PostgreSQL in Docker
./scripts/db-stop.sh    # Stop PostgreSQL
./scripts/db-reset.sh   # Reset database (WARNING: deletes data)
```

## Code Standards

### TypeScript

- **Strict mode**: Enabled in all packages
- **No `any` types**: Use `unknown` if type is uncertain
- **Type safety**: Leverage TypeScript's type system fully
- **Interfaces vs Types**: Use interfaces for objects, types for unions/primitives

### React/Next.js

- **Server Components first**: Default to server-side rendering
- **Client Components**: Use `'use client'` only when needed (interactivity, hooks)
- **File naming**: Match component names (PascalCase for components)
- **Component organization**: Follow atomic design in `packages/ui`

### Code Style

- **Formatting**: Prettier (automatically formats on save)
- **Linting**: ESLint with Next.js config
- **Naming**:
  - Components: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: Match component/export names

### Comments

- **Document WHY, not WHAT**: Explain decisions and context
- **No TODOs**: Create tickets instead
- **Reference tickets**: When fixing bugs, reference issue numbers

### Functions

- **Max 20 lines** (guideline, not strict)
- **Single responsibility**: One purpose per function
- **Max 3 parameters**: Use objects for more parameters
- **Early returns**: Prefer over nested conditionals

## Testing

### Test Types

- **Unit tests**: Pure functions, utilities, business logic
- **Integration tests**: API routes, database operations
- **E2E tests**: Critical user flows (using Playwright)

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm test --filter @stride/web

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Writing Tests

**Unit Test Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-utils';

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

**API Route Test Example**:
```typescript
import { POST } from '@/app/api/example/route';
import { NextRequest } from 'next/server';

describe('POST /api/example', () => {
  it('should handle valid request', async () => {
    const request = new NextRequest('http://localhost/api/example', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

## Database

### Prisma Schema

The database schema is defined in `packages/database/prisma/schema.prisma`.

**Key Models**:
- `User`: User accounts and authentication
- `Project`: Projects/workflows
- `Issue`: Work items/tickets
- `Cycle`: Sprints/iterations
- `Invitation`: User invitations

### Repository Pattern

Data access uses the repository pattern for abstraction:

```typescript
import { projectRepository } from '@stride/database';

// Find by ID
const project = await projectRepository.findById(id);

// Create
const newProject = await projectRepository.create(data);

// Update
const updated = await projectRepository.update(id, data);
```

See `packages/database/src/repositories/` for implementations.

### Custom Fields (JSONB)

Projects support custom fields stored as JSONB:

```typescript
// Custom fields are validated against YAML config schema
const issue = await issueRepository.create({
  title: 'Test Issue',
  customFields: {
    'custom-field-1': 'value',
    'priority': 'high',
  },
});
```

## API Development

### API Routes

API routes are in `apps/web/app/api/` following Next.js App Router conventions:

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── me/route.ts
├── projects/
│   ├── route.ts          # GET, POST /api/projects
│   └── [projectId]/
│       └── route.ts      # GET, PATCH /api/projects/[id]
```

### Route Handler Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Validation
    const body = await request.json();
    const validated = schema.parse(body);
    
    // Business logic
    const result = await doSomething(validated);
    
    // Response
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Authentication

Use `requireAuth` middleware:

```typescript
import { requireAuth } from '@/middleware/auth';

const authResult = await requireAuth(request);
if (authResult instanceof NextResponse) {
  return authResult; // Unauthorized response
}
const session = authResult; // SessionPayload
```

### Authorization

Check user roles:

```typescript
import { UserRole } from '@stride/types';

if (session.role !== UserRole.Admin) {
  return NextResponse.json(
    { error: 'Forbidden: Admin access required' },
    { status: 403 }
  );
}
```

## Contributing

### Development Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**: Follow code standards and write tests

3. **Test your changes**:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push and create PR**: Push to your fork and create a pull request

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

### Code Review Checklist

Before submitting a PR:

- [ ] Code follows style guide
- [ ] Tests pass (`pnpm test`)
- [ ] Type checks pass (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Documentation updated if needed
- [ ] No console.logs or debug code
- [ ] Error handling implemented
- [ ] Security considerations addressed

## Additional Resources

- [API Documentation](../api/README.md) - Complete API reference
- [Deployment Guide](../deployment/README.md) - Production deployment
- [User Guide](../user/README.md) - End-user documentation
- [Testing Guide](../../TESTING_GUIDE.md) - Testing instructions
- [Architecture Decision Records](../) - Technical decisions

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Documentation**: Check `docs/` directory for more guides

Happy coding! 🚀

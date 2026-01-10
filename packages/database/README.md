# @stride/database

Database access layer for Stride using Prisma ORM with repository pattern.

## Overview

This package provides:
- Prisma schema definition
- Database connection management
- Repository pattern implementation for data access
- Type-safe database queries

## Installation

```bash
pnpm add @stride/database
```

## Prerequisites

- PostgreSQL 16+
- Environment variable: `DATABASE_URL`

## Usage

### Database Connection

```typescript
import { prisma } from '@stride/database';

// Use Prisma client directly
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

### Repository Pattern

```typescript
import { projectRepository, issueRepository } from '@stride/database';

// Find project by ID
const project = await projectRepository.findById(projectId);

// Create issue
const issue = await issueRepository.create({
  title: 'New Issue',
  projectId,
  status: 'todo',
});

// Update issue
const updated = await issueRepository.update(issueId, {
  status: 'in_progress',
});
```

## Available Repositories

- `projectRepository`: Project CRUD operations
- `issueRepository`: Issue management
- `cycleRepository`: Sprint/cycle management
- `userRepository`: User management
- `invitationRepository`: Invitation handling

## Database Scripts

```bash
# Generate Prisma client (after schema changes)
pnpm db:generate

# Create new migration
pnpm db:migrate --name migration_name

# Apply migrations
pnpm db:deploy

# Open Prisma Studio (database browser)
pnpm db:studio
```

## Schema Location

The Prisma schema is located at:
- `prisma/schema.prisma`

## Key Models

- **User**: User accounts and authentication
- **Project**: Projects/workflows
- **Issue**: Work items/tickets
- **Cycle**: Sprints/iterations
- **Session**: User sessions
- **Invitation**: User invitations

## Repository Pattern

Repositories abstract database access:

```typescript
interface Repository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: Filter): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
}
```

This allows:
- Easy testing (mock repositories)
- Database abstraction
- Centralized query logic

## Development

```bash
# Generate Prisma client
pnpm db:generate

# Type check (includes Prisma generation)
pnpm type-check

# Lint
pnpm lint
```

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string

Example:
```
DATABASE_URL=postgresql://user:password@localhost:5432/stride
```

## Migrations

Migrations are stored in `prisma/migrations/`. To create a new migration:

1. Edit `prisma/schema.prisma`
2. Run `pnpm db:migrate --name descriptive_name`
3. Review the generated migration file
4. Apply with `pnpm db:deploy`

## Type Safety

All database operations are fully type-safe thanks to Prisma:

```typescript
// Prisma generates types from schema
import type { User, Project, Issue } from '@prisma/client';

// Repository methods return typed results
const user: User = await userRepository.findById(userId);
```

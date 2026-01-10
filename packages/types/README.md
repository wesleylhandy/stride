# @stride/types

Shared TypeScript types and interfaces for the Stride monorepo.

## Overview

This package provides type definitions used across all Stride packages, ensuring type safety and consistency.

## Installation

```bash
pnpm add @stride/types
```

## Usage

### Basic Imports

```typescript
import type { User, Project, Issue, Cycle } from '@stride/types';
import { UserRole, IssueType, Priority } from '@stride/types';
```

### Subpath Imports

The package supports subpath exports for better tree-shaking:

```typescript
// Import specific type modules
import type { User } from '@stride/types/user';
import type { Project } from '@stride/types/project';
import type { Issue, IssueType, Priority } from '@stride/types/issue';
import type { Cycle } from '@stride/types/cycle';

// API types
import type { ApiResponse, PaginatedResponse } from '@stride/types/api';

// Configuration types
import type { WorkflowConfig } from '@stride/types/config';

// Logger types
import type { LogLevel, LogContext } from '@stride/types/logger';
```

## Type Categories

### Domain Types

- **User**: User account information
- **Project**: Project/workflow definitions
- **Issue**: Work items/tickets
- **Cycle**: Sprint/iteration types
- **Invitation**: User invitation types

### Enums

- `UserRole`: Admin, Member, Viewer
- `IssueType`: Bug, Feature, Task, Epic
- `Priority`: Low, Medium, High, Critical

### API Types

- `ApiResponse<T>`: Standard API response wrapper
- `PaginatedResponse<T>`: Paginated list response
- `ErrorResponse`: Error response structure

### Configuration Types

- `WorkflowConfig`: Workflow configuration structure
- `StatusConfig`: Status definition
- `CustomFieldConfig`: Custom field definitions

### Logger Types

- `LogLevel`: debug, info, warn, error
- `LogContext`: Additional logging context

## Development

```bash
# Type check
pnpm type-check

# Lint
pnpm lint
```

## Dependencies

- `@prisma/client`: For generated Prisma types

## Extending Types

When adding new types:

1. Add to appropriate file in `src/`
2. Export from `src/index.ts`
3. Add to subpath exports in `package.json` if needed
4. Update this README if adding new categories

## Type Safety

All types are strictly typed with no `any` types. This ensures:

- Compile-time type checking
- Better IDE autocomplete
- Safer refactoring
- Clearer API contracts

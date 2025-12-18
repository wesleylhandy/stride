# Implementation Notes: Zod v4 & Prisma v7 Compatibility

**Date**: 2024-12-19  
**Purpose**: Document compatibility updates and code patterns for Zod v4 and Prisma v7

## Summary

All code has been updated to be compatible with:
- **Zod v4.2.1**: Latest version with breaking changes from v3
- **Prisma v7.2.0**: Latest version with breaking changes from v5

## Zod v4 Implementation

### Files Created
- `packages/yaml-config/src/schema.ts`: Zod v4 schemas using `z.strictObject()`
- `packages/yaml-config/src/validator.ts`: Validation logic with proper error handling
- `packages/yaml-config/src/parser.ts`: YAML parsing with Zod validation
- `packages/yaml-config/src/default-config.ts`: Default configuration generator

### Key Patterns Used
- `z.strictObject()` instead of `z.object().strict()`
- `z.record(z.string(), z.unknown())` with both key and value schemas
- Proper error handling with `safeParse()` and `parse()`
- Type inference with `z.infer<>`

### References
- [Zod v4 Documentation](https://zod.dev/)
- [Zod v4 Changelog](https://zod.dev/v4/changelog)
- See `docs/ZOD_V4_COMPATIBILITY.md` for detailed migration guide

## Prisma v7 Implementation

### Schema Changes
- **Removed `url` from datasource**: Prisma v7 requires URL in `prisma/config.ts` or via adapter
- **Fixed JSONB index**: Changed from `@@index([customFields(ops: JsonbPathOps)])` to `@@index([customFields], type: Gin)`
- **Created `prisma/config.ts`**: Configuration file for migrations

### Client Changes
- **Added PostgreSQL adapter**: `@prisma/adapter-postgres` with `pg` pool
- **Updated connection.ts**: Now uses adapter pattern for PrismaClient initialization

### Dependencies Added
- `@prisma/adapter-postgres`: ^7.2.0
- `pg`: ^8.11.0
- `@types/pg`: ^8.10.0

### References
- [Prisma v7 Documentation](https://www.prisma.io/docs/)
- See `docs/PRISMA_V7_COMPATIBILITY.md` for detailed migration guide

## Code Examples

### Zod v4 Schema (YAML Config)
```typescript
import { z } from 'zod';

export const ProjectConfigSchema = z.strictObject({
  project_key: z.string().regex(/^[A-Z0-9]{2,10}$/),
  project_name: z.string().min(1),
  workflow: z.strictObject({
    default_status: z.string().min(1),
    statuses: z.array(StatusConfigSchema).min(1),
  }),
  custom_fields: z.array(CustomFieldConfigSchema).default([]),
});
```

### Prisma v7 Client
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPostgres } from '@prisma/adapter-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPostgres(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

## Next Steps

1. **Install dependencies**: Run `pnpm install` to install adapter packages
2. **Generate Prisma Client**: Run `pnpm --filter @stride/database prisma generate`
3. **Test migrations**: Run `pnpm --filter @stride/database prisma migrate dev`
4. **Test Zod schemas**: Verify YAML config validation works
5. **Update any existing code**: Review for deprecated Zod v3 patterns

## Warnings to Address

### Prisma Schema Warnings
- `onDelete: SetNull` with required fields: Consider making fields optional or using different referential action
- These are warnings, not errors, but should be reviewed

## Files Modified

- `packages/database/prisma/schema.prisma`: Removed URL, fixed JSONB index
- `packages/database/prisma/config.ts`: Created for migrations
- `packages/database/src/connection.ts`: Updated to use adapter
- `packages/database/package.json`: Added adapter dependencies
- `packages/yaml-config/src/*.ts`: Created Zod v4 schemas and validators

## Documentation

- `docs/ZOD_V4_COMPATIBILITY.md`: Zod v4 migration guide
- `docs/PRISMA_V7_COMPATIBILITY.md`: Prisma v7 migration guide
- `docs/VERSION_COMPATIBILITY.md`: Overall version compatibility reference


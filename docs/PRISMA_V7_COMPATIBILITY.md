# Prisma v7 Compatibility Guide

**Version**: Prisma 7.2.0  
**Reference**: [Prisma Documentation](https://www.prisma.io/docs/)  
**Migration from**: Prisma 5.0.0 → 7.2.0

## Key Changes

### 1. Datasource URL Configuration

**BREAKING CHANGE**: In Prisma v7, the `url` property is **no longer supported** in `schema.prisma`. Connection URLs must be configured in a separate `prisma.config.ts` file:

- **For Migrations**: Create `prisma.config.ts` in the package root with datasource URL configuration
- **For Client**: Pass adapter to `PrismaClient` constructor (runtime connection)

**Schema.prisma** (no URL):
```prisma
datasource db {
  provider = "postgresql"
  // URL is configured in prisma.config.ts
}
```

**prisma.config.ts** (for migrations - must be in package root):
```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
    // directUrl is optional - only needed when using connection poolers
    ...(process.env.DIRECT_URL && { directUrl: env('DIRECT_URL') }),
  },
});
```

**Important**: 
- The config file must use `defineConfig` and `env` from `'prisma/config'`
- Install `dotenv` package: `pnpm add -D dotenv`
- The file must be named `prisma.config.ts` (not `.js`) and located in the package root

### 2. Client Initialization

Prisma Client works directly with environment variables - no adapter required:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// PrismaClient automatically reads DATABASE_URL from environment variables
```

**Note**: Adapters are optional in Prisma v7 and only needed for specific use cases like connection pooling with custom drivers.

### 3. Schema Compatibility

Our Prisma schema is compatible with v7. Key features used:
- JSONB fields (customFields, config)
- Enums (UserRole, IssueType, Priority, etc.)
- Relations (foreign keys, cascades)
- Indexes (unique, composite, GIN for JSONB)

**Important**: JSONB indexes must use `type: Gin` instead of `ops: JsonbPathOps`:

```prisma
// Correct (Prisma v7)
@@index([customFields], type: Gin)

// Incorrect (Prisma v5)
@@index([customFields(ops: JsonbPathOps)])
```

### 3. Query API

The query API remains largely the same. All our planned queries should work:
- `prisma.user.findMany()`
- `prisma.issue.create()`
- `prisma.project.update()`
- Transaction support
- Raw queries

### 4. Migration Commands

Migration commands are unchanged:
- `prisma migrate dev` - Create and apply migrations
- `prisma migrate deploy` - Apply migrations in production
- `prisma generate` - Generate Prisma Client
- `prisma studio` - Open Prisma Studio

### 5. Type Exports

Type exports work the same way:
```typescript
export * from '@prisma/client';
```

## New Features in Prisma v7

### 1. Enhanced Performance
- Improved query performance
- Better connection pooling
- Optimized migrations

### 2. Better TypeScript Support
- Improved type inference
- Better error messages
- Enhanced IDE support

### 3. Schema Improvements
- Better validation
- Improved error messages
- Enhanced migration system

## Migration Checklist

- [x] Updated `@prisma/client` to `^7.2.0`
- [x] Updated `prisma` to `^7.2.0`
- [x] Removed `url` from datasource in schema.prisma (not supported in v7)
- [x] Created `prisma/config.ts` for migration datasource configuration
- [x] Updated client initialization (no adapter required)
- [x] Fixed JSONB index to use `type: Gin`
- [x] Schema validated successfully
- [ ] Run `pnpm install` to install adapter dependencies
- [ ] Run `prisma generate` after installation
- [ ] Test migrations with `prisma migrate dev`
- [ ] Verify all queries work correctly

## Potential Issues

### 1. Generated Client
After updating, regenerate the Prisma Client:
```bash
pnpm --filter @stride/database prisma generate
```

### 2. Migrations
Existing migrations should work, but test them:
```bash
pnpm --filter @stride/database prisma migrate dev
```

### 3. Type Imports
Type imports should work the same, but verify:
```typescript
import type { User, Issue, Project } from '@prisma/client';
```

## Best Practices

1. **Always regenerate client** after schema changes
2. **Test migrations** in development before production
3. **Use transactions** for multi-step operations
4. **Leverage JSONB** for flexible custom fields
5. **Use indexes** for performance (already in schema)
6. **Handle connection pooling** properly (already configured)

## Usage in Stride

Prisma is used in:
- `packages/database`: Core database package
- Repository pattern: Abstract data access layer
- Type exports: Shared Prisma types
- Migrations: Database schema versioning

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Migration Guide](https://www.prisma.io/docs/guides/upgrade-guides)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)


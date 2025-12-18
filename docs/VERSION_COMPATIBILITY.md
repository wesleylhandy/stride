# Version Compatibility Reference

**Last Updated**: 2024-12-19  
**Purpose**: Track compatibility and migration notes for major dependency versions

## Current Versions

### Core Runtime
- **Node.js**: 24.x (LTS)
- **pnpm**: 10.26.0
- **TypeScript**: 5.9.3

### Framework & Libraries
- **Next.js**: 16.0.10
- **React**: 19.2.3
- **React DOM**: 19.2.3

### Database & Validation
- **Prisma**: 7.2.0
- **@prisma/client**: 7.2.0
- **Zod**: 4.2.1

### Development Tools
- **Turborepo**: 2.6.3
- **Prettier**: 3.7.4
- **eslint-config-prettier**: 10.1.8

## Compatibility Guides

### Zod v4
- **Guide**: [docs/ZOD_V4_COMPATIBILITY.md](./ZOD_V4_COMPATIBILITY.md)
- **Key Changes**: 
  - Use `z.strictObject()` instead of `.strict()`
  - Use `z.looseObject()` for allowing extra keys
  - `z.record()` requires both key and value schemas
  - `.merge()` deprecated, use `.extend()` or `.safeExtend()`
- **Performance**: 14x faster string parsing, 7x faster arrays, 6.5x faster objects

### Prisma v7
- **Guide**: [docs/PRISMA_V7_COMPATIBILITY.md](./PRISMA_V7_COMPATIBILITY.md)
- **Key Changes**: 
  - Schema syntax remains compatible
  - Client API unchanged
  - Improved performance and TypeScript support
- **Migration**: Run `prisma generate` after updating

## Usage Patterns

### Zod v4 Patterns

```typescript
// Strict object (default behavior)
const schema = z.strictObject({
  name: z.string(),
  age: z.number(),
});

// Loose object (allows extra keys)
const looseSchema = z.looseObject({
  name: z.string(),
});

// Record with key and value schemas
const record = z.record(z.string(), z.unknown());

// Extend instead of merge
const extended = baseSchema.extend({
  email: z.string().email(),
});
```

### Prisma v7 Patterns

```typescript
// Client initialization (unchanged)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// JSONB queries
const issues = await prisma.issue.findMany({
  where: {
    customFields: {
      path: ['priority'],
      equals: 'High',
    },
  },
});
```

## Migration Checklist

### Zod v3 → v4
- [x] Updated package.json to `^4.2.1`
- [x] Created Zod v4 schemas using `z.strictObject()`
- [x] Updated record schemas to include value schema
- [ ] Review existing code for deprecated methods
- [ ] Test all validation schemas

### Prisma v5 → v7
- [x] Updated package.json to `^7.2.0`
- [x] Schema validated for compatibility
- [x] Client initialization verified
- [ ] Run `prisma generate` after installation
- [ ] Test all database queries
- [ ] Verify migrations work correctly

## Breaking Changes Summary

### Zod v4 Breaking Changes
1. `.strict()` → `z.strictObject()`
2. `.passthrough()` → `z.looseObject()`
3. `.strip()` → Deprecated
4. `.merge()` → `.extend()` or `.safeExtend()`
5. `z.record(key)` → `z.record(key, value)`
6. `.nonempty()` type changed
7. `z.promise()` → Deprecated
8. `ctx.path` removed from refinements

### Prisma v7 Breaking Changes
- Minimal breaking changes
- Schema syntax remains compatible
- Client API unchanged
- Improved error messages

## References

- [Zod v4 Documentation](https://zod.dev/)
- [Zod v4 Changelog](https://zod.dev/v4/changelog)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Migration Guide](https://www.prisma.io/docs/guides/upgrade-guides)

## Notes

- All compatibility guides are in the `docs/` directory
- Example implementations follow v4/v7 patterns
- Performance improvements are significant in Zod v4
- Prisma v7 maintains backward compatibility for our use case


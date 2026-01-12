# Development Troubleshooting Guide

Common development issues and how to resolve them.

## Table of Contents

- [Database Issues](#database-issues)
  - [Prisma Client Cache Issues](#prisma-client-cache-issues)
  - [Migration Errors](#migration-errors)
  - [Connection Errors](#connection-errors)
- [Build Issues](#build-issues)
- [Runtime Errors](#runtime-errors)

---

## Database Issues

### Prisma Client Cache Issues

**Symptom**: Prisma errors like "The column `(not available)` does not exist" or "Unknown column" after schema changes, even though the database table exists.

**Cause**: Next.js/Turbopack bundles Prisma client and may cache an old version after schema changes. The Prisma client needs to be regenerated, and Next.js cache needs to be cleared.

**Solution**:

1. **Stop the dev server** (Ctrl+C in the terminal running `pnpm dev`)

2. **Clear caches and regenerate Prisma client**:
   ```bash
   # Clear Next.js cache
   rm -rf apps/web/.next
   
   # Clear Prisma client cache (pnpm)
   rm -rf node_modules/.pnpm/@prisma+client@*
   
   # Regenerate Prisma client
   pnpm --filter @stride/database db:generate
   
   # Reinstall dependencies (ensures Prisma client is linked correctly)
   pnpm install
   ```

3. **Restart the dev server**:
   ```bash
   pnpm dev
   ```

**If the error persists**:

```bash
# Kill any running node processes
pkill -f "next dev" || true
pkill -f "turbo" || true

# Clear pnpm store cache
pnpm store prune

# Full clean rebuild
rm -rf node_modules/.pnpm/@prisma+client@*
rm -rf apps/web/.next
pnpm install
pnpm --filter @stride/database db:generate
pnpm dev
```

**Prevention**: Always regenerate Prisma client after schema changes and restart the dev server. See [Database Development](#database-development) in the main development guide.

### Migration Errors

**Symptom**: Migration fails with database errors.

**Common Causes**:
- Migration is out of sync with database state
- Database connection issues
- Permission errors

**Solution**:

1. **Check database connection**:
   ```bash
   docker compose ps stride-postgres
   ```

2. **Check migration status**:
   ```bash
   pnpm --filter @stride/database db:deploy
   ```

3. **Reset database** (⚠️ **WARNING**: Deletes all data):
   ```bash
   ./scripts/db-reset.sh
   pnpm --filter @stride/database db:deploy
   ```

### Connection Errors

**Symptom**: "Can't reach database server" or "Connection refused"

**Solution**:

1. **Check if database is running**:
   ```bash
   docker compose ps stride-postgres
   ```

2. **Start database**:
   ```bash
   ./scripts/db-start.sh
   # OR
   docker compose up -d stride-postgres
   ```

3. **Check DATABASE_URL in .env file**:
   ```env
   DATABASE_URL=postgresql://stride:stride_dev_password@localhost:5433/stride
   ```

4. **Test connection**:
   ```bash
   docker compose exec stride-postgres psql -U stride -d stride -c "SELECT 1;"
   ```

---

## Build Issues

### TypeScript Errors After Schema Changes

**Symptom**: TypeScript errors about missing types after Prisma schema changes.

**Solution**:

1. **Regenerate Prisma client**:
   ```bash
   pnpm --filter @stride/database db:generate
   ```

2. **Restart TypeScript server** (in VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server")

3. **Clear TypeScript build cache**:
   ```bash
   rm -rf apps/web/.next
   rm -rf packages/*/tsconfig.tsbuildinfo
   ```

### Module Resolution Errors

**Symptom**: "Cannot find module '@stride/...'" errors.

**Solution**:

1. **Reinstall dependencies**:
   ```bash
   pnpm install
   ```

2. **Rebuild packages**:
   ```bash
   pnpm build
   ```

---

## Runtime Errors

### "Module not found" in Development

**Symptom**: Next.js reports "Module not found" even though the file exists.

**Solution**:

1. **Clear Next.js cache**:
   ```bash
   rm -rf apps/web/.next
   ```

2. **Restart dev server**:
   ```bash
   pnpm dev
   ```

---

## Getting Help

If you encounter issues not covered here:

1. Check the [main development guide](./README.md) for workflow details
2. Review error messages carefully - they often contain helpful hints
3. Check the [database README](../../packages/database/README.md) for Prisma-specific help
4. Search GitHub issues for similar problems
5. Ask in team discussions or create a new issue

---

## Related Documentation

- [Development Guide](./README.md) - Main development documentation
- [Database README](../../packages/database/README.md) - Database package documentation
- [Prisma v7 Compatibility](../../docs/PRISMA_V7_COMPATIBILITY.md) - Prisma version notes

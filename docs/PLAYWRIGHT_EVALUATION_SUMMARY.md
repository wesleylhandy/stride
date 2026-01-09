# Playwright E2E Testing - Evaluation Summary

## Critical Issues Found

### 1. Tests Not Being Discovered ⚠️

**Current Problem:**
- Playwright configuration has `testDir: './app'` which tries to load ALL files in the `app/` directory
- This causes Playwright to attempt loading Vitest test files (`.test.tsx`, `.integration.test.tsx`), resulting in module errors
- Tests in the `e2e/` directory are **completely ignored** - Playwright finds **0 tests** when run
- You have 6 test files but none are being executed

**Impact:** All e2e tests are effectively broken and not running.

### 2. Test File Locations

**Currently exists:**
- ✅ `apps/web/app/login/login.e2e.spec.ts`
- ✅ `apps/web/app/onboarding/onboarding.e2e.spec.ts`
- ✅ `apps/web/e2e/documentation.spec.ts`
- ✅ `apps/web/e2e/toast-notifications.spec.ts`
- ✅ `apps/web/e2e/repository-connection-manual.spec.ts`
- ✅ `apps/web/e2e/repository-connection-oauth.spec.ts`

**Problem:** Two locations, but config only scans `app/` directory (and does it incorrectly).

### 3. Code Duplication

Every test file duplicates:
- Authentication mocking (`/api/auth/me`, `/api/auth/login`)
- Project mocking (`/api/projects`)
- Test data setup

**Example:** The same auth mock code appears in 4+ different files.

## Recommended Solution

### Immediate Fix Required

1. **Update `playwright.config.ts`** to:
   - Change `testDir` from `'./app'` to `'./e2e'`
   - Add `testMatch` pattern: `'**/*.{spec,test}.{js,ts}'` or `'**/*.spec.ts'`
   - This will discover all tests in `e2e/` directory

2. **Consolidate test locations:**
   - Move `app/**/*.e2e.spec.ts` files to `e2e/` directory
   - Organize by feature: `e2e/auth/`, `e2e/features/`

### Long-term Organization

See `PLAYWRIGHT_MONOREPO_PLAN.md` for the complete plan including:
- Centralized `e2e/` directory structure
- Shared fixtures and utilities
- Proper test isolation
- CI/CD optimization

## Quick Win: Fix Test Discovery Now

Here's the minimal change needed to get tests running:

```typescript
// apps/web/playwright.config.ts
export default defineConfig({
  testDir: './e2e',  // Changed from './app'
  testMatch: '**/*.spec.ts',  // Add this line
  // ... rest of config
});
```

Then move:
- `app/login/login.e2e.spec.ts` → `e2e/auth/login.spec.ts`
- `app/onboarding/onboarding.e2e.spec.ts` → `e2e/auth/onboarding.spec.ts`

This will immediately fix test discovery and get your tests running.

## Next Steps

1. ✅ Review the detailed plan in `PLAYWRIGHT_MONOREPO_PLAN.md`
2. ⏭️ Fix immediate test discovery issue (5 minutes)
3. ⏭️ Reorganize test files (15 minutes)
4. ⏭️ Create shared fixtures (30 minutes)
5. ⏭️ Refactor tests to use shared utilities (ongoing)

## Benefits of Proper Organization

1. **All tests discoverable and runnable**
2. **50-70% reduction in test code** through shared utilities
3. **Easier maintenance** - update auth mocking in one place
4. **Better test isolation** - proper fixtures prevent test pollution
5. **CI/CD ready** - optimized for parallel execution
6. **Scalable** - easy to add new tests as features grow

## Playwright Best Practices Applied

Based on [Playwright documentation](https://playwright.dev/docs/intro) and monorepo best practices:

- ✅ Centralized test directory
- ✅ Shared fixtures for common operations
- ✅ Page Object Models (optional, but recommended for complex flows)
- ✅ Proper test isolation
- ✅ Multi-project configuration for different scenarios
- ✅ Global setup/teardown for database seeding

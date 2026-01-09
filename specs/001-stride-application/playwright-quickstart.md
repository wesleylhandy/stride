# Playwright E2E Testing - Quick Start Guide

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-02  
**Status**: Complete  
**Related Plan**: `playwright-reorganization-plan.md`

## Prerequisites

- Node.js >= 24.0.0
- pnpm >= 10.26.0
- Playwright browsers installed (see Installation section)

## Installation

### Install Dependencies

```bash
# From repository root
pnpm install

# Playwright browsers are installed automatically with dependencies
```

### Install Playwright Browsers (if needed)

```bash
# From apps/web directory
cd apps/web
pnpm exec playwright install

# On Linux, also install system dependencies (requires sudo)
sudo pnpm exec playwright install-deps
```

## Running Tests

### Run All E2E Tests

```bash
# From repository root
pnpm --filter @stride/web test:e2e

# Or from apps/web directory
cd apps/web
pnpm test:e2e
```

### Run Tests in UI Mode (Recommended for Development)

```bash
pnpm --filter @stride/web test:e2e:ui
```

Opens Playwright UI with:
- Watch mode (auto-rerun on file changes)
- Live step-by-step execution
- Time travel debugging
- Trace viewer integration

### Run Tests in Headed Mode (See Browser)

```bash
pnpm --filter @stride/web test:e2e:headed
```

### Run Specific Test File

```bash
pnpm --filter @stride/web test:e2e e2e/auth/login.spec.ts
```

### Run Tests for Specific Browser

```bash
pnpm --filter @stride/web test:e2e --project=chromium
pnpm --filter @stride/web test:e2e --project=firefox
pnpm --filter @stride/web test:e2e --project=webkit
```

### Run Tests Matching a Pattern

```bash
pnpm --filter @stride/web test:e2e --grep "login"
pnpm --filter @stride/web test:e2e --grep "onboarding"
```

## Test Structure

```
apps/web/e2e/
├── fixtures/          # Shared test fixtures
│   ├── auth.ts       # Authentication fixtures
│   └── projects.ts   # Project test data
├── utils/            # Utility functions
│   ├── api-helpers.ts
│   └── page-helpers.ts
├── auth/             # Authentication tests
│   ├── login.spec.ts
│   └── onboarding.spec.ts
└── features/         # Feature tests
    ├── documentation.spec.ts
    └── toast-notifications.spec.ts
```

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can navigate to login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
});
```

### Using Authentication Fixtures

```typescript
import { test } from '../fixtures/auth';

test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage.getByText(/dashboard/i)).toBeVisible();
});
```

### Using Project Fixtures

```typescript
import { test } from '@playwright/test';
import { mockProjectsList, testProjects } from '../fixtures/projects';

test('user with projects sees dashboard', async ({ page }) => {
  await mockProjectsList(page, [testProjects.withOnboarding()]);
  await page.goto('/dashboard');
  await expect(page.getByText('Test Project')).toBeVisible();
});
```

### Mocking API Routes

```typescript
import { test } from '@playwright/test';
import { mockAuthRoute } from '../utils/api-helpers';

test.beforeEach(async ({ page }) => {
  await mockAuthRoute(page, {
    email: 'test@example.com',
    role: 'Admin'
  });
});

test('admin can access settings', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText(/settings/i)).toBeVisible();
});
```

### Form Interaction

```typescript
import { test, expect } from '@playwright/test';
import { fillForm, submitForm } from '../utils/page-helpers';

test('user can submit login form', async ({ page }) => {
  await page.goto('/login');
  
  await fillForm(page, {
    'input[name="email"]': 'test@example.com',
    'input[name="password"]': 'password123'
  });
  
  await submitForm(page);
  await expect(page).toHaveURL('/dashboard');
});
```

## Test Naming Conventions

- **File Names**: `*.spec.ts` (e.g., `login.spec.ts`)
- **Test Descriptions**: Use descriptive, user-focused descriptions
  - ✅ Good: `'user can login with valid credentials'`
  - ❌ Bad: `'test login'` or `'login works'`

## Test Organization

### By Feature Domain

- `auth/` - Authentication and onboarding flows
- `features/` - Feature-specific tests (documentation, notifications, etc.)

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('user can login with valid credentials', async ({ page }) => {
    // Test implementation
  });

  test('user sees error with invalid credentials', async ({ page }) => {
    // Test implementation
  });
});
```

## Debugging

### UI Mode (Best for Development)

```bash
pnpm --filter @stride/web test:e2e:ui
```

Features:
- Watch mode
- Step-by-step execution
- Time travel debugging
- Trace viewer

### Headed Mode

```bash
pnpm --filter @stride/web test:e2e:headed
```

See the browser window during test execution.

### Debug Mode

```bash
pnpm --filter @stride/web test:e2e --debug
```

Pauses test execution and opens Playwright Inspector.

### Trace Viewer

After a failed test, view the trace:

```bash
pnpm --filter @stride/web exec playwright show-trace test-results/path-to-trace.zip
```

## Common Patterns

### Waiting for Navigation

```typescript
await page.click('button[type="submit"]');
await page.waitForURL('/dashboard');
```

### Waiting for Elements

```typescript
await page.waitForSelector('text=Loading complete');
// or
await expect(page.getByText('Loading complete')).toBeVisible();
```

### Handling Dialogs

```typescript
page.on('dialog', dialog => {
  expect(dialog.message()).toContain('Are you sure?');
  dialog.accept();
});
```

### Taking Screenshots

```typescript
await page.screenshot({ path: 'screenshot.png' });
// or automatically on failure (configured in playwright.config.ts)
```

## Best Practices

1. **Use Fixtures**: Prefer fixtures over manual setup for common operations
2. **Test Isolation**: Each test should be independent (no shared state)
3. **Use Accessible Selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
4. **Wait Explicitly**: Use `waitForURL`, `waitForSelector`, or `expect().toBeVisible()`
5. **Mock External APIs**: Use route mocking for consistent, fast tests
6. **Keep Tests Focused**: One user journey per test
7. **Descriptive Names**: Test names should describe what is being tested

## Troubleshooting

### Tests Not Found

**Problem**: Playwright finds 0 tests

**Solution**: Check that:
- `playwright.config.ts` has `testDir: './e2e'`
- `testMatch` pattern includes your test files (default: `'**/*.spec.ts'`)
- Test files are in the `e2e/` directory

### Dev Server Not Starting

**Problem**: Tests fail because dev server isn't running

**Solution**: 
- Playwright should start the server automatically (configured in `webServer`)
- Check that `pnpm dev` works manually
- Increase `timeout` in `webServer` config if needed

### Route Mocking Not Working

**Problem**: Routes aren't being intercepted

**Solution**:
- Ensure route is set up in `beforeEach` or before the request
- Check URL pattern matches exactly (case-sensitive)
- Use `page.route()` with correct URL pattern or RegExp

### Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solution**:
- Add explicit waits for async operations
- Use `waitForURL` instead of `waitForTimeout`
- Check for race conditions in test setup
- Increase timeouts if needed (but prefer explicit waits)

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Install Playwright
  run: pnpm exec playwright install --with-deps

- name: Run E2E tests
  run: pnpm --filter @stride/web test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: apps/web/playwright-report/
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- Internal: `docs/PLAYWRIGHT_MONOREPO_PLAN.md`
- Internal: `docs/TESTING_SETUP.md`

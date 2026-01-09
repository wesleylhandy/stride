# Playwright E2E Testing Organization Plan

## Current State Analysis

### Issues Identified

1. **Fragmented Test Locations**
   - Tests scattered across `apps/web/app/**/*.e2e.spec.ts` and `apps/web/e2e/**/*.spec.ts`
   - `playwright.config.ts` has `testDir: './app'` which only discovers tests in `app/` directory
   - Tests in `e2e/` directory are **NOT being discovered** - Playwright finds 0 tests
   - Current configuration tries to load Vitest test files (`.test.tsx`) causing errors

2. **Configuration Errors**
   - `testDir: './app'` is too broad and includes non-Playwright test files
   - Playwright attempts to load Vitest files (`.test.tsx`, `.integration.test.tsx`) causing module errors
   - No `testMatch` pattern to filter only Playwright test files
   - Tests in `e2e/` directory are completely ignored by current configuration

3. **Code Duplication**
   - Repeated mock setup for authentication (`/api/auth/me`, `/api/auth/login`)
   - Repeated project mocking (`/api/projects`, project-specific routes)
   - No shared utilities for common operations (login, project setup, auth mocking)

4. **No Test Infrastructure**
   - Missing shared fixtures for authentication, test data, database seeding
   - No centralized test utilities
   - No test data factories
   - No proper test isolation patterns

5. **Test Discovery Problems**
   - Playwright currently finds **0 tests** when run
   - Config tries to load files it shouldn't (Vitest files)
   - Need proper file pattern matching (`**/*.e2e.spec.ts` or `**/*.spec.ts` in e2e dir)

### Current Test Files

**Located in `apps/web/app/`:**
- `app/login/login.e2e.spec.ts`
- `app/onboarding/onboarding.e2e.spec.ts`

**Located in `apps/web/e2e/`:**
- `e2e/documentation.spec.ts`
- `e2e/toast-notifications.spec.ts`
- `e2e/repository-connection-manual.spec.ts`
- `e2e/repository-connection-oauth.spec.ts`

## Recommended Structure for Monorepo

Following Playwright best practices and monorepo patterns:

```
apps/web/
├── e2e/
│   ├── fixtures/
│   │   ├── auth.ts              # Authentication fixtures
│   │   ├── database.ts          # Database seeding/teardown
│   │   ├── projects.ts          # Project test data factories
│   │   └── users.ts             # User test data factories
│   ├── utils/
│   │   ├── api-helpers.ts       # API mocking utilities
│   │   ├── page-helpers.ts      # Page interaction helpers
│   │   └── test-helpers.ts      # General test utilities
│   ├── setup/
│   │   └── global-setup.ts      # Global setup (database, seed data)
│   ├── teardown/
│   │   └── global-teardown.ts   # Global cleanup
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── onboarding.spec.ts
│   ├── features/
│   │   ├── documentation.spec.ts
│   │   ├── toast-notifications.spec.ts
│   │   └── repository-connection.spec.ts
│   └── pages/                    # Page Object Models (if needed)
│       ├── login.page.ts
│       └── dashboard.page.ts
├── playwright.config.ts
└── package.json
```

## Implementation Plan

### Phase 1: Reorganize Test Structure

1. **Create centralized `e2e/` directory structure**
   - Move all e2e tests from `app/**/*.e2e.spec.ts` to `e2e/` organized by feature
   - Consolidate all e2e tests in one location

2. **Update `playwright.config.ts`**
   - Change `testDir` to `'./e2e'`
   - Configure proper test discovery pattern
   - Add projects for different test scenarios

### Phase 2: Create Shared Test Infrastructure

1. **Create fixtures** (`e2e/fixtures/`)
   - `auth.ts`: Login helpers, authenticated page fixtures
   - `database.ts`: Database seeding, test data cleanup
   - `projects.ts`: Project factories, mock project data
   - `users.ts`: User factories, test user creation

2. **Create utilities** (`e2e/utils/`)
   - `api-helpers.ts`: Route mocking utilities, API response builders
   - `page-helpers.ts`: Common page interactions (wait for navigation, form filling)
   - `test-helpers.ts`: Assertion helpers, retry logic, test data generators

### Phase 3: Refactor Existing Tests

1. **Replace duplicated code with shared utilities**
   - Replace inline route mocks with utility functions
   - Use fixtures for authentication
   - Use factories for test data

2. **Improve test isolation**
   - Ensure each test is independent
   - Proper setup/teardown using fixtures

### Phase 4: Enhance Configuration

1. **Multi-project configuration**
   - Separate projects for authenticated vs unauthenticated tests
   - Different projects for different environments (dev, staging)
   - Browser-specific configurations

2. **Global setup/teardown**
   - Database seeding before test suite
   - Cleanup after test suite
   - Test user creation

## Detailed Structure

### Fixtures Structure

```typescript
// e2e/fixtures/auth.ts
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  loginAsUser: (email: string, password: string) => Promise<void>;
  mockAuth: () => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, loginAsUser }, use) => {
    await loginAsUser('test@example.com', 'password123');
    await use(page);
  },
  
  loginAsUser: async ({ page }, use) => {
    await use(async (email: string, password: string) => {
      // Shared login logic
    });
  },
  
  mockAuth: async ({ page }, use) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          role: 'Admin',
        }),
      });
    });
    await use();
  },
});

export { expect };
```

```typescript
// e2e/fixtures/projects.ts
import { Page } from '@playwright/test';

export interface MockProject {
  id: string;
  key: string;
  name: string;
  config?: Record<string, unknown>;
}

export async function mockProjectRoute(
  page: Page,
  project: MockProject
): Promise<void> {
  await page.route(`/api/projects/${project.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(project),
    });
  });
}

export async function mockProjectsList(
  page: Page,
  projects: MockProject[]
): Promise<void> {
  await page.route('/api/projects*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total: projects.length,
        items: projects,
      }),
    });
  });
}

export const testProjects = {
  withOnboarding: (): MockProject => ({
    id: 'project-123',
    key: 'TEST',
    name: 'Test Project',
    config: {
      workflow: {
        default_status: 'todo',
        statuses: [
          { key: 'todo', name: 'To Do', type: 'open' },
          { key: 'done', name: 'Done', type: 'closed' },
        ],
      },
    },
  }),
  
  withoutOnboarding: (): MockProject => ({
    id: 'project-empty',
    key: 'EMPTY',
    name: 'Empty Project',
    config: {},
  }),
};
```

### Utilities Structure

```typescript
// e2e/utils/api-helpers.ts
import { Page, Route } from '@playwright/test';

export async function mockLoginRoute(
  page: Page,
  options: { success?: boolean } = {}
): Promise<void> {
  await page.route('/api/auth/login', async (route: Route) => {
    await route.fulfill({
      status: options.success === false ? 401 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        options.success === false
          ? { error: 'Invalid credentials' }
          : { success: true }
      ),
    });
  });
}

export async function mockAuthRoute(
  page: Page,
  user?: {
    id?: string;
    email?: string;
    username?: string;
    role?: string;
  }
): Promise<void> {
  await page.route('/api/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: user?.id || 'user-123',
        email: user?.email || 'test@example.com',
        username: user?.username || 'testuser',
        role: user?.role || 'Admin',
      }),
    });
  });
}
```

### Updated Playwright Config

```typescript
// apps/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  // Centralized test directory
  testDir: './e2e',
  
  // Test file pattern
  testMatch: /.*\.spec\.ts/,
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Authenticated tests (can use authenticated fixtures)
    {
      name: 'chromium-auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*auth.*\.spec\.ts/,
    },
    // Mobile tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  // Global setup/teardown (if needed)
  // globalSetup: './e2e/setup/global-setup.ts',
  // globalTeardown: './e2e/teardown/global-teardown.ts',
});
```

## Migration Steps

### Step 1: Create Directory Structure

```bash
cd apps/web
mkdir -p e2e/{fixtures,utils,setup,teardown,auth,features,pages}
```

### Step 2: Create Base Fixtures and Utilities

1. Create `e2e/fixtures/auth.ts` with authentication fixtures
2. Create `e2e/fixtures/projects.ts` with project mocking utilities
3. Create `e2e/utils/api-helpers.ts` with API mocking helpers
4. Create `e2e/utils/page-helpers.ts` with page interaction helpers

### Step 3: Move and Refactor Tests

1. Move `app/login/login.e2e.spec.ts` → `e2e/auth/login.spec.ts`
2. Move `app/onboarding/onboarding.e2e.spec.ts` → `e2e/auth/onboarding.spec.ts`
3. Move `e2e/documentation.spec.ts` → `e2e/features/documentation.spec.ts`
4. Move `e2e/toast-notifications.spec.ts` → `e2e/features/toast-notifications.spec.ts`
5. Move `e2e/repository-connection-*.spec.ts` → `e2e/features/repository-connection.spec.ts` (consolidate)

### Step 4: Update Test Files

Replace duplicated mock code with shared utilities:

**Before:**
```typescript
test.beforeEach(async ({ page }) => {
  await page.route('/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'Admin',
      }),
    });
  });
});
```

**After:**
```typescript
import { test } from '../fixtures/auth';
import { mockAuthRoute } from '../utils/api-helpers';

test.beforeEach(async ({ page }) => {
  await mockAuthRoute(page);
});
```

### Step 5: Update Configuration

Update `playwright.config.ts` with new structure and configuration options.

### Step 6: Update Documentation

Update `docs/TESTING_SETUP.md` and `TESTING_QUICKSTART.md` with new structure and examples.

## Benefits

1. **Centralized Organization**: All e2e tests in one location
2. **Code Reusability**: Shared fixtures and utilities reduce duplication
3. **Maintainability**: Changes to auth/project mocking happen in one place
4. **Scalability**: Easy to add new tests and fixtures
5. **Better Test Isolation**: Proper fixtures ensure test independence
6. **CI/CD Ready**: Proper configuration for parallel execution and reporting
7. **Type Safety**: TypeScript fixtures provide better IDE support

## Turborepo Considerations

Since this is a Turborepo monorepo:

1. **Package-level tests**: E2E tests are specific to `apps/web`, so configuration stays in that package
2. **Shared utilities**: If other apps need e2e tests later, consider creating `packages/e2e-utils` for shared fixtures
3. **Turbo pipeline**: Add `test:e2e` task to `turbo.json` if needed:
   ```json
   "test:e2e": {
     "dependsOn": ["^build"],
     "outputs": ["playwright-report/**", "test-results/**"]
   }
   ```

## Next Steps

1. Review and approve this plan
2. Create the directory structure
3. Implement base fixtures and utilities
4. Migrate existing tests one by one
5. Update documentation
6. Add CI/CD configuration updates if needed

## References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Monorepo Testing Patterns](https://playwright.dev/docs/test-projects)

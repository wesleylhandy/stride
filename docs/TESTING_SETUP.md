# Testing Setup Guide

This guide explains how to set up and run tests for the Stride application.

## Prerequisites

Before running tests, ensure you have:

1. **Node.js** >= 24.0.0
2. **pnpm** >= 10.26.0
3. **Dependencies installed**: Run `pnpm install` from the repository root

## Installation

The testing dependencies are already listed in `apps/web/package.json`. To install them:

```bash
# From repository root
pnpm install

# Or from apps/web directory
cd apps/web
pnpm install
```

### Install Playwright System Dependencies (Linux)

On Linux systems, you need to install system dependencies for Playwright browsers. Run one of the following commands:

**Option 1 (Recommended - installs all dependencies):**
```bash
cd apps/web
sudo pnpm exec playwright install-deps
```

**Option 2 (Manual install - only libavif16 mentioned in warning):**
```bash
sudo apt-get install libavif16
```

**Note**: If you see warnings about missing dependencies after running `playwright install`, you'll need to run `install-deps` with sudo privileges.

## Test Types

The project uses three types of tests:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test component interactions and API integration
3. **E2E Tests**: Test complete user journeys using Playwright

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm --filter @stride/web test:unit

# Run tests in watch mode (recommended during development)
pnpm --filter @stride/web test:watch

# Run tests with coverage
pnpm --filter @stride/web test:coverage
```

### Integration Tests

```bash
# Run all integration tests
pnpm --filter @stride/web test:integration
```

### E2E Tests

**Important**: E2E tests require the development server to be running. Playwright will start it automatically, but you can also start it manually:

```bash
# Start dev server manually (optional)
pnpm --filter @stride/web dev

# In another terminal, run E2E tests
pnpm --filter @stride/web test:e2e

# Run E2E tests with UI mode (recommended for debugging)
pnpm --filter @stride/web test:e2e:ui

# Run E2E tests in headed mode (see browser)
pnpm --filter @stride/web test:e2e:headed
```

### All Tests

From the repository root:

```bash
# Run all tests across all packages
pnpm test

# Or run tests for a specific package
pnpm --filter @stride/web test
```

## Test Configuration

### Vitest Configuration

- **Config file**: `apps/web/vitest.config.ts`
- **Setup file**: `apps/web/vitest.setup.ts`
- **Test files**: `**/*.{test,spec}.{js,ts,jsx,tsx}`

### Playwright Configuration

- **Config file**: `apps/web/playwright.config.ts`
- **Test directory**: `apps/web/e2e/`
- **Test files**: `**/*.spec.ts` (all E2E tests use `.spec.ts` extension)

## Test File Locations

### E2E Tests (Playwright)

All E2E tests are organized in `apps/web/e2e/`:

```
apps/web/e2e/
├── auth/
│   ├── login.spec.ts                  # Login flow tests
│   └── onboarding.spec.ts             # Onboarding flow tests
├── features/
│   ├── documentation.spec.ts          # Documentation tests
│   ├── toast-notifications.spec.ts    # Toast notification tests
│   ├── repository-connection-manual.spec.ts   # Manual repository connection tests
│   └── repository-connection-oauth.spec.ts    # OAuth repository connection tests
├── fixtures/
│   ├── auth.ts                        # Authentication fixtures
│   └── projects.ts                    # Project test data factories
└── utils/
    ├── api-helpers.ts                 # API route mocking utilities
    ├── page-helpers.ts                # Page interaction helpers
    └── test-helpers.ts                # General test utilities
```

### Unit and Integration Tests

```
apps/web/
├── app/
│   ├── login/
│   │   ├── page.test.tsx              # Unit tests
│   │   └── page.integration.test.tsx  # Integration tests
│   └── ...
└── src/
    └── lib/
        └── onboarding/
            └── status.test.ts         # Unit tests
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from './page';

describe('LoginPage', () => {
  it('should render email input', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Login Integration', () => {
  it('should handle login flow', async () => {
    // Test implementation
  });
});
```

### E2E Test Examples

#### Basic E2E Test (Using Shared Utilities)

```typescript
import { test, expect } from '@playwright/test';
import { mockAuthRoute, mockLoginRoute, mockProjectsListRoute } from '../utils/api-helpers';
import { fillForm, submitForm } from '../utils/page-helpers';
import { testProjects } from '../fixtures/projects';

test('user can login', async ({ page }) => {
  // Mock authentication endpoints using shared utilities
  await mockLoginRoute(page, { success: true });
  await mockProjectsListRoute(page, [testProjects.withOnboarding()], { pageSize: 1 });
  
  // Navigate to login page
  await page.goto('/login');
  
  // Fill and submit form using shared helpers
  await fillForm(page, {
    email: 'test@example.com',
    password: 'password123',
  });
  await submitForm(page);
  
  // Wait for navigation
  await page.waitForURL('/dashboard');
  expect(page.url()).toContain('/dashboard');
});
```

#### Using Authentication Fixtures

```typescript
import { test, expect } from '../fixtures/auth';

test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
  // authenticatedPage is pre-authenticated and ready to use
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage.locator('text=Dashboard')).toBeVisible();
});
```

#### Using Project Fixtures

```typescript
import { test, expect } from '@playwright/test';
import { mockProjectRoute, mockProjectsListRoute } from '../utils/api-helpers';
import { testProjects } from '../fixtures/projects';

test('user can view project board', async ({ page }) => {
  // Create test project data using factory
  const project = testProjects.withOnboarding();
  project.id = 'project-123';
  
  // Mock project endpoints using shared utilities
  await mockProjectRoute(page, project);
  await mockProjectsListRoute(page, [project]);
  
  // Navigate to project board
  await page.goto('/projects/project-123/board');
  await expect(page.locator('text=Kanban Board')).toBeVisible();
});
```

## E2E Test Fixtures and Utilities

The E2E test suite includes shared fixtures and utilities to reduce code duplication and improve maintainability.

### Available Fixtures

#### Authentication Fixtures (`e2e/fixtures/auth.ts`)

- **`authenticatedPage`**: Pre-authenticated page fixture ready for testing
- **`mockAuth(user?)`**: Mock `/api/auth/me` endpoint
- **`mockLogin(options?)`**: Mock `/api/auth/login` endpoint
- **`loginAsUser(email, password)`**: Programmatic login helper

Example:
```typescript
import { test, expect } from '../fixtures/auth';

test('uses authenticated page', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // Page is already authenticated
});
```

#### Project Fixtures (`e2e/fixtures/projects.ts`)

- **`testProjects.withOnboarding()`**: Create project with complete onboarding
- **`testProjects.withoutOnboarding()`**: Create empty project (new user)
- **`mockProjectRoute(page, project)`**: Mock single project endpoint
- **`mockProjectsListRoute(page, projects, options?)`**: Mock projects list endpoint

Example:
```typescript
import { testProjects } from '../fixtures/projects';
import { mockProjectRoute } from '../utils/api-helpers';

const project = testProjects.withOnboarding();
project.id = 'project-123';
await mockProjectRoute(page, project);
```

### Available Utilities

#### API Helpers (`e2e/utils/api-helpers.ts`)

- **`mockAuthRoute(page, user?)`**: Mock authentication endpoint
- **`mockLoginRoute(page, options?)`**: Mock login endpoint
- **`mockProjectRoute(page, project)`**: Mock single project endpoint
- **`mockProjectsListRoute(page, projects, options?)`**: Mock projects list with pagination
- **`mockJsonResponse(page, url, data, status?)`**: Generic JSON response mock

#### Page Helpers (`e2e/utils/page-helpers.ts`)

- **`fillForm(page, fields)`**: Fill form fields by name
- **`submitForm(page, selector?)`**: Submit form and wait for navigation
- **`clickAndWait(page, selector, waitFor?)`**: Click element and wait for navigation
- **`waitForNavigation(page, url?, timeout?)`**: Wait for page navigation

Example:
```typescript
import { fillForm, submitForm } from '../utils/page-helpers';

await fillForm(page, {
  email: 'user@example.com',
  password: 'password123',
});
await submitForm(page);
```

#### Test Helpers (`e2e/utils/test-helpers.ts`)

- **`retry(fn, options?)`**: Retry function with exponential backoff
- **`generateEmail(prefix?)`**: Generate unique email addresses
- **`generateProjectKey(prefix?)`**: Generate unique project keys

For more examples, see the test files in `apps/web/e2e/`.

## Common Issues

### Tests failing due to missing mocks

Some tests require mocking Next.js-specific modules. Check `vitest.setup.ts` for existing mocks and add new ones as needed.

### Playwright browsers not installed

If you see errors about missing browsers, install them:

```bash
pnpm --filter @stride/web exec playwright install
```

### Database required for integration tests

Some integration tests may require a test database. Set up `TEST_DATABASE_URL` in your `.env.local`:

```bash
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/stride_test
```

## CI/CD Integration

Tests can be run in CI/CD pipelines. See `specs/001-stride-application/testing-strategy.md` for CI/CD configuration examples.

## Coverage Goals

- **Unit Tests**: 80% coverage target
- **Integration Tests**: 70% coverage target
- **E2E Tests**: All critical user journeys

View coverage reports:

```bash
pnpm --filter @stride/web test:coverage
# Open apps/web/coverage/index.html in your browser
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Strategy](./specs/001-stride-application/testing-strategy.md)

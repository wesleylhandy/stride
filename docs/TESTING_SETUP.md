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
- **Test files**: `**/*.e2e.spec.ts`

## Test File Locations

```
apps/web/
├── app/
│   ├── login/
│   │   ├── page.test.tsx              # Unit tests
│   │   ├── page.integration.test.tsx  # Integration tests
│   │   └── login.e2e.spec.ts          # E2E tests
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

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
});
```

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

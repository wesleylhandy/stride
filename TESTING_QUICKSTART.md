# Quick Start: Running Tests

## Install Dependencies

```bash
# From repository root
pnpm install
```

## Install Playwright Browsers (for E2E tests) - Optional

E2E tests are optional and require additional setup. You can skip this if you only want to run unit/integration tests.

```bash
# Install browser binaries
pnpm --filter @stride/web exec playwright install

# On Linux, also install system dependencies (requires sudo)
cd apps/web
sudo pnpm exec playwright install-deps
# OR manually: sudo apt-get install libavif16
```

## Run Tests

### Unit Tests
```bash
# Run all unit tests
pnpm --filter @stride/web test:unit

# Watch mode (auto-rerun on changes)
pnpm --filter @stride/web test:watch
```

### Integration Tests
```bash
pnpm --filter @stride/web test:integration
```

### E2E Tests (Optional - requires Playwright setup)

All E2E tests are located in `apps/web/e2e/`:

```bash
# List all E2E tests
pnpm --filter @stride/web test:e2e --list

# Run all E2E tests (starts dev server automatically)
# Note: Requires Playwright browsers to be installed first
pnpm --filter @stride/web test:e2e

# Run specific test file
pnpm --filter @stride/web test:e2e e2e/auth/login.spec.ts

# With UI mode (recommended for debugging)
pnpm --filter @stride/web test:e2e:ui

# Run in headed mode (see browser)
pnpm --filter @stride/web test:e2e:headed

# Run tests for specific browser
pnpm --filter @stride/web test:e2e --project=chromium
```

**Test Structure:**
- `e2e/auth/` - Authentication tests (login, onboarding)
- `e2e/features/` - Feature tests (documentation, toasts, repository connections)
- `e2e/fixtures/` - Shared fixtures (auth, projects)
- `e2e/utils/` - Shared utilities (API helpers, page helpers)

**Using Shared Utilities:**
```typescript
import { mockAuthRoute, mockLoginRoute } from '../utils/api-helpers';
import { fillForm, submitForm } from '../utils/page-helpers';
import { testProjects } from '../fixtures/projects';

// Mock endpoints
await mockLoginRoute(page, { success: true });
await mockProjectsListRoute(page, [testProjects.withOnboarding()]);

// Fill and submit forms
await fillForm(page, { email: 'user@example.com', password: 'pass' });
await submitForm(page);
```

### All Tests
```bash
# From repository root
pnpm test
```

## Coverage Report
```bash
pnpm --filter @stride/web test:coverage
# Open apps/web/coverage/index.html in browser
```

## Common Commands Summary

| Command | What it does |
|---------|--------------|
| `pnpm --filter @stride/web test` | Run all tests (unit + integration) |
| `pnpm --filter @stride/web test:watch` | Run tests in watch mode |
| `pnpm --filter @stride/web test:coverage` | Generate coverage report |
| `pnpm --filter @stride/web test:e2e` | Run all E2E tests |
| `pnpm --filter @stride/web test:e2e --list` | List all E2E tests |
| `pnpm --filter @stride/web test:e2e:ui` | Run E2E tests with UI (interactive) |
| `pnpm --filter @stride/web test:e2e:headed` | Run E2E tests with visible browser |
| `pnpm --filter @stride/web test:e2e e2e/auth/login.spec.ts` | Run specific test file |

For more details, see [docs/TESTING_SETUP.md](./docs/TESTING_SETUP.md)

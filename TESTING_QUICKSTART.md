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
```bash
# Run E2E tests (starts dev server automatically)
# Note: Requires Playwright browsers to be installed first
pnpm --filter @stride/web test:e2e

# With UI mode (recommended for first run)
pnpm --filter @stride/web test:e2e:ui
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
| `pnpm --filter @stride/web test:e2e` | Run E2E tests |
| `pnpm --filter @stride/web test:e2e:ui` | Run E2E tests with UI |

For more details, see [docs/TESTING_SETUP.md](./docs/TESTING_SETUP.md)

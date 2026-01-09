# Playwright E2E Testing Reorganization - Research

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-02  
**Status**: Complete  
**Related Plan**: `playwright-reorganization-plan.md`

## Research Scope

This document consolidates research findings for reorganizing Playwright E2E tests in the Stride monorepo. Research focused on Playwright best practices, monorepo patterns, fixture systems, and test organization strategies.

## Key Decisions

### Decision 1: Centralized Test Directory Structure

**Decision**: All E2E tests in `apps/web/e2e/` organized by feature domain (auth, features).

**Rationale**:
- Single source of truth for all E2E tests
- Clear separation from application code and unit/integration tests
- Easier test discovery and maintenance
- Follows Playwright best practices for monorepo setups
- Prevents conflicts with Vitest test files (`.test.tsx`, `.integration.test.tsx`)

**Alternatives Considered**:
- **Co-located tests** (`app/**/*.e2e.spec.ts`): 
  - Rejected because: Creates confusion with unit tests, harder to discover, mixes concerns
- **Separate package** (`packages/e2e-tests`):
  - Rejected because: Over-engineering for single-app monorepo, adds complexity, unnecessary abstraction

**Sources**:
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Turborepo Testing Patterns](https://turborepo.com/docs/guides/tools/playwright)
- Internal evaluation: `docs/PLAYWRIGHT_EVALUATION_SUMMARY.md`

---

### Decision 2: Shared Fixtures Pattern

**Decision**: Use Playwright's fixture system (`test.extend()`) for authentication, test data, and common operations.

**Rationale**:
- Provides automatic test isolation
- Type-safe fixture APIs
- Reduces code duplication (currently ~70% duplicate code across tests)
- Follows Playwright recommended patterns
- Enables composition of fixtures (e.g., `authenticatedPage` uses `loginAsUser`)

**Alternatives Considered**:
- **Utility functions only**:
  - Rejected because: No automatic isolation, requires manual setup/teardown, less type-safe
- **Page Object Models only**:
  - Rejected because: Fixtures handle setup/teardown better, POM better for complex page interactions
- **Hybrid approach** (fixtures + POM):
  - Considered for future: May add POM for complex pages, but fixtures first

**Sources**:
- [Playwright Fixtures Documentation](https://playwright.dev/docs/test-fixtures)
- [Playwright Custom Fixtures](https://playwright.dev/docs/test-fixtures#creating-a-fixture)
- Code analysis: Identified 4+ instances of duplicate auth mocking code

---

### Decision 3: Route Mocking Strategy

**Decision**: Mock API responses using Playwright route interception instead of real database seeding.

**Rationale**:
- Faster test execution (no database setup/teardown)
- Better test isolation (no shared state between tests)
- Simpler setup (no database migrations or seed data required)
- Tests remain independent and parallelizable
- Easier to test error scenarios and edge cases

**Alternatives Considered**:
- **Real database with seeding**:
  - Rejected because: Slower, requires database setup, potential test pollution, harder to parallelize
  - Considered for: Future integration tests if needed
- **Test database with transactions**:
  - Rejected because: Adds complexity, still slower than mocking, requires transaction management

**Sources**:
- [Playwright Network Interception](https://playwright.dev/docs/network)
- [Playwright Route Mocking Best Practices](https://playwright.dev/docs/test-api-testing#mock-api-requests)
- Testing strategy analysis: Current tests already use route mocking

---

### Decision 4: Test File Naming Convention

**Decision**: Use `.spec.ts` extension for all Playwright E2E tests (consistent with existing `e2e/` directory).

**Rationale**:
- Clear separation from Vitest tests (`.test.ts`, `.integration.test.tsx`)
- Consistent with existing `e2e/` directory naming
- Follows Playwright convention (`.spec.ts` or `.test.ts` both supported)
- Shorter and cleaner than `.e2e.spec.ts`

**Alternatives Considered**:
- **Keep `.e2e.spec.ts`**:
  - Rejected because: Redundant (already in `e2e/` directory), longer, inconsistent with existing files
- **Use `.test.ts`**:
  - Rejected because: Conflicts with Vitest convention, less clear separation

**Sources**:
- [Playwright Test File Patterns](https://playwright.dev/docs/test-configuration)
- Existing codebase: `e2e/documentation.spec.ts` already uses `.spec.ts`

---

### Decision 5: Test Organization by Feature Domain

**Decision**: Organize tests into `auth/` and `features/` subdirectories within `e2e/`.

**Rationale**:
- Logical grouping by user journey domain
- Easier to find related tests
- Supports test filtering by directory
- Scales well as test suite grows
- Clear separation of concerns

**Structure**:
```
e2e/
├── auth/           # Authentication and onboarding flows
├── features/       # Feature-specific tests (documentation, notifications, etc.)
├── fixtures/       # Shared fixtures
└── utils/          # Shared utilities
```

**Alternatives Considered**:
- **Flat structure** (all tests in `e2e/` root):
  - Rejected because: Harder to navigate, no logical grouping, scales poorly
- **Organize by page/route**:
  - Rejected because: Tests often span multiple pages, feature-based is more intuitive

**Sources**:
- Playwright project structure examples
- Monorepo testing best practices
- Code review: Existing tests naturally group by feature

---

### Decision 6: Multi-Project Configuration

**Decision**: Use Playwright projects to configure different test scenarios (browsers, authenticated vs unauthenticated, mobile).

**Rationale**:
- Single config file manages all test scenarios
- Easy to run specific test subsets (e.g., `--project=chromium`)
- Supports parallel execution across browsers
- Follows Playwright recommended patterns

**Configuration**:
- Desktop browsers: chromium, firefox, webkit
- Mobile devices: Mobile Chrome, Mobile Safari
- Authenticated tests: Separate project with auth fixtures

**Alternatives Considered**:
- **Single project with runtime selection**:
  - Rejected because: Less flexible, harder to filter, doesn't leverage Playwright's project system

**Sources**:
- [Playwright Projects](https://playwright.dev/docs/test-projects)
- Current config already uses projects (needs enhancement)

---

## Best Practices Applied

### Playwright Best Practices
1. ✅ **Centralized test directory** - Single `e2e/` directory
2. ✅ **Shared fixtures** - Authentication, test data, common operations
3. ✅ **Route mocking** - Fast, isolated tests
4. ✅ **Multi-project configuration** - Different browsers and scenarios
5. ✅ **Proper test isolation** - Fixtures provide automatic cleanup
6. ✅ **Type safety** - TypeScript fixtures with proper typing

### Monorepo Best Practices
1. ✅ **Package-level tests** - E2E tests stay in `apps/web` (app-specific)
2. ✅ **Shared utilities** - Organized in `e2e/utils/` and `e2e/fixtures/`
3. ✅ **Future extensibility** - Can create `packages/e2e-utils` if other apps need tests
4. ✅ **Turborepo compatibility** - Works with existing turbo.json pipeline

### Code Quality Best Practices
1. ✅ **DRY principle** - Shared fixtures eliminate duplication
2. ✅ **Single Responsibility** - Each fixture handles one concern
3. ✅ **Type safety** - All fixtures and utilities fully typed
4. ✅ **Maintainability** - Clear structure, easy to extend

## Technical Findings

### Current Issues Identified
1. **Test Discovery**: `testDir: './app'` causes Playwright to attempt loading Vitest files, finds 0 tests
2. **Code Duplication**: ~70% duplicate code across test files (auth mocking, project mocking)
3. **Fragmented Structure**: Tests in two locations (`app/` and `e2e/`)
4. **No Shared Infrastructure**: Every test file implements its own mocks

### Solutions Validated
1. **Configuration Fix**: Change `testDir` to `'./e2e'`, add `testMatch` pattern
2. **Fixture System**: Playwright fixtures provide automatic isolation and type safety
3. **Route Mocking**: Confirmed as best practice for E2E tests (no database needed)
4. **Organized Structure**: Feature-based organization scales well

### Performance Considerations
- Route mocking is significantly faster than database operations
- Fixtures provide efficient test isolation without manual cleanup
- Parallel execution supported by Playwright projects
- No performance concerns identified

## Integration Points

### CI/CD Integration
- HTML reporter configured for test results
- GitHub Actions integration available (GitHub reporter)
- Trace viewer for debugging failures
- Screenshot/video on failure for better debugging

### Development Workflow
- Auto-start dev server via `webServer` config
- Reuse existing server in local development
- Watch mode not needed (E2E tests are slower, run on demand)

### Turborepo Integration
- Tests run via `pnpm --filter @stride/web test:e2e`
- Can add `test:e2e` task to `turbo.json` if needed
- Cache outputs: `playwright-report/`, `test-results/`

## Open Questions (Resolved)

### Q1: Should we use real database for E2E tests?
**Answer**: No - route mocking is faster, simpler, and provides better isolation. Real database can be considered for integration tests if needed in future.

### Q2: Should tests be co-located with features?
**Answer**: No - centralized `e2e/` directory provides better organization and separation of concerns.

### Q3: Should we create a separate package for shared test utilities?
**Answer**: Not initially - `apps/web/e2e/` is sufficient. Can extract to `packages/e2e-utils` if other apps need E2E tests.

### Q4: Should we use Page Object Models?
**Answer**: Not initially - fixtures handle setup/teardown better. Can add POM for complex pages if needed.

## References

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Turborepo Playwright Guide](https://turborepo.com/docs/guides/tools/playwright)
- [Monorepo Testing Patterns](https://playwright.dev/docs/test-projects)
- Internal: `docs/PLAYWRIGHT_MONOREPO_PLAN.md`
- Internal: `docs/PLAYWRIGHT_EVALUATION_SUMMARY.md`

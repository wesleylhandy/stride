# Implementation Plan: Playwright E2E Testing Reorganization

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-02  
**Status**: Planning (Phase 0)  
**Feature Spec**: `specs/001-stride-application/spec.md`  
**Related Documents**: 
- `docs/PLAYWRIGHT_MONOREPO_PLAN.md`
- `docs/PLAYWRIGHT_EVALUATION_SUMMARY.md`

## Summary

Reorganize and centralize Playwright E2E tests to fix critical test discovery issues, eliminate code duplication, and establish a scalable testing infrastructure following Playwright best practices for monorepo setups. Currently, Playwright finds 0 tests due to configuration errors, and test files are fragmented across two locations with significant code duplication.

## Technical Context

### Technology Stack
- **Testing Framework**: Playwright 1.51.1 (`@playwright/test`)
- **Test Runner**: Playwright Test (bundled)
- **Language**: TypeScript (strict mode)
- **Monorepo**: Turborepo with pnpm workspace
- **Application**: Next.js 16 (apps/web)
- **Base URL**: `http://localhost:3000` (development server)

### Current Test Files (6 files, 0 discovered)
**Location 1 - `apps/web/app/`:**
- `app/login/login.e2e.spec.ts` (189 lines)
- `app/onboarding/onboarding.e2e.spec.ts` (97 lines)

**Location 2 - `apps/web/e2e/`:**
- `e2e/documentation.spec.ts` (337 lines)
- `e2e/toast-notifications.spec.ts` (533 lines)
- `e2e/repository-connection-manual.spec.ts`
- `e2e/repository-connection-oauth.spec.ts`

### Dependencies
- **Existing**: `@playwright/test@^1.51.1` (already in `apps/web/package.json`)
- **No new dependencies required** - using existing Playwright features (fixtures, utilities)

### Integrations
- **Development Server**: Next.js dev server (started automatically by Playwright)
- **Database**: Test data mocking via route interception (no database seeding needed initially)
- **CI/CD**: GitHub Actions (requires configuration updates for test reporting)

### Architecture Decisions

1. **Centralized Test Directory**: All E2E tests in `apps/web/e2e/` organized by feature
   - **Rationale**: Single source of truth, easier discovery, clear separation from app code
   - **Alternative Considered**: Keep tests co-located with features - rejected for better organization and test isolation

2. **Shared Fixtures Pattern**: Use Playwright's fixture system for common operations
   - **Rationale**: Eliminates duplication, provides type safety, follows Playwright best practices
   - **Alternative Considered**: Utility functions only - rejected because fixtures provide better test isolation

3. **Route Mocking Strategy**: Mock API responses using Playwright route interception
   - **Rationale**: Fast, no database setup needed, tests remain independent
   - **Alternative Considered**: Real database seeding - rejected as more complex and slower

4. **Test File Naming**: Use `.spec.ts` extension (consistent with existing `e2e/` directory)
   - **Rationale**: Clear separation from Vitest tests (`.test.ts`, `.integration.test.tsx`)
   - **Alternative Considered**: Keep `.e2e.spec.ts` - rejected for consistency and brevity

## Constitution Check

### Principles Compliance
- [x] **SOLID**: Single Responsibility (fixtures handle one concern each), Dependency Inversion (test dependencies abstracted via fixtures)
- [x] **DRY**: Shared fixtures and utilities eliminate duplication (currently ~70% duplicate code)
- [x] **YAGNI**: Building only what's needed now (no premature optimization)
- [x] **KISS**: Simple route mocking, no complex test infrastructure
- [x] **Type Safety**: TypeScript strict mode, typed fixtures
- [x] **Accessibility**: Tests verify accessibility requirements (touch targets, keyboard navigation)
- [x] **Security**: Tests validate authentication and authorization flows

### Code Quality Gates
- [x] **No `any` types**: All fixtures and utilities will be fully typed
- [x] **Proper error handling**: Test failures provide clear error messages via Playwright assertions
- [x] **Input validation**: Test data factories validate input parameters
- [x] **Test coverage planned**: E2E tests for critical user journeys (onboarding, login, issue creation)

### Security Considerations
- Tests use mocked authentication (no real credentials)
- Tests don't expose sensitive data in route mocks
- Test isolation ensures no cross-test data leakage

## Phase 0: Outline & Research ✅ COMPLETE

### Research Tasks
- [x] **Research Playwright monorepo best practices** - Completed: Centralized `e2e/` directory, shared fixtures pattern
- [x] **Research Playwright fixture system** - Completed: Use `test.extend()` for custom fixtures
- [x] **Research test organization patterns** - Completed: Organize by feature (auth, features) with shared utilities
- [x] **Research CI/CD integration** - Completed: Use HTML reporter, GitHub Actions integration available

### Research Output
- [x] `docs/PLAYWRIGHT_MONOREPO_PLAN.md` - Complete plan with code examples
- [x] `docs/PLAYWRIGHT_EVALUATION_SUMMARY.md` - Critical issues identified
- [x] `specs/001-stride-application/playwright-research.md` - Detailed research findings with decisions

**Key Decisions from Research:**
- **Decision**: Centralize all tests in `e2e/` directory organized by feature
- **Rationale**: Single location for all E2E tests, easier discovery, clear separation
- **Alternatives Considered**: Co-located tests - rejected for better organization

- **Decision**: Use Playwright fixtures for authentication and test data
- **Rationale**: Type-safe, reusable, provides test isolation automatically
- **Alternatives Considered**: Utility functions only - rejected because fixtures provide better isolation

- **Decision**: Route mocking instead of real database
- **Rationale**: Faster tests, no database setup required, better test isolation
- **Alternatives Considered**: Real database seeding - rejected as more complex and slower

## Phase 1: Design & Contracts

### Directory Structure Design

```
apps/web/
├── e2e/
│   ├── fixtures/
│   │   ├── auth.ts              # Authentication fixtures (authenticatedPage, loginAsUser, mockAuth)
│   │   ├── projects.ts          # Project test data factories and route mocking
│   │   └── users.ts             # User test data factories (if needed)
│   ├── utils/
│   │   ├── api-helpers.ts       # API route mocking utilities
│   │   ├── page-helpers.ts      # Page interaction helpers (form filling, navigation)
│   │   └── test-helpers.ts      # General test utilities (assertions, retry logic)
│   ├── auth/
│   │   ├── login.spec.ts        # Login flow tests (moved from app/login/)
│   │   └── onboarding.spec.ts   # Onboarding flow tests (moved from app/onboarding/)
│   └── features/
│       ├── documentation.spec.ts        # Documentation tests (existing)
│       ├── toast-notifications.spec.ts  # Toast tests (existing)
│       └── repository-connection.spec.ts # Repository connection tests (consolidated)
├── playwright.config.ts         # Updated configuration
└── package.json                 # No changes needed
```

### Fixture Contracts

**Authentication Fixture** (`e2e/fixtures/auth.ts`):
```typescript
type AuthFixtures = {
  authenticatedPage: Page;
  loginAsUser: (email: string, password: string) => Promise<void>;
  mockAuth: (user?: Partial<User>) => Promise<void>;
  mockLogin: (options?: { success?: boolean }) => Promise<void>;
};
```

**Project Fixture** (`e2e/fixtures/projects.ts`):
```typescript
interface MockProject {
  id: string;
  key: string;
  name: string;
  config?: Record<string, unknown>;
}

type ProjectFixtures = {
  mockProject: (project: MockProject) => Promise<void>;
  mockProjectsList: (projects: MockProject[]) => Promise<void>;
  testProjects: {
    withOnboarding: () => MockProject;
    withoutOnboarding: () => MockProject;
  };
};
```

### API Contracts (Route Mocking)

**Auth Routes:**
- `POST /api/auth/login` → `{ success: true }` or `{ error: string }`
- `GET /api/auth/me` → `{ id: string, email: string, username: string, role: string }`

**Project Routes:**
- `GET /api/projects` → `{ total: number, items: MockProject[] }`
- `GET /api/projects/:id` → `MockProject`

**Contracts saved to**: `specs/001-stride-application/contracts/e2e-route-mocks.md`

### Configuration Contract

**Playwright Config** (`apps/web/playwright.config.ts`):
- `testDir`: `'./e2e'` (changed from `'./app'`)
- `testMatch`: `'**/*.spec.ts'` (new - filters only Playwright tests)
- `projects`: Multi-project config for browsers and scenarios
- `webServer`: Auto-start Next.js dev server

### Quickstart ✅ COMPLETE

**Quickstart guide**: `specs/001-stride-application/playwright-quickstart.md`

Key sections:
- Running tests: `pnpm --filter @stride/web test:e2e`
- Creating new tests: Use fixtures, follow naming conventions
- Debugging: UI mode, headed mode, trace viewer

### Agent Context
- [x] No new technologies - using existing Playwright features
- [x] Agent context update not needed - using existing Playwright features, no new technologies

## Phase 1: Design & Contracts ✅ COMPLETE

### Data Model ✅ COMPLETE
- [x] `specs/001-stride-application/playwright-fixture-model.md` - Fixture and utility data models defined
- [x] Entities defined with relationships (auth fixtures, project fixtures, utilities)
- [x] Validation rules documented (type validation, route validation)

### API Contracts ✅ COMPLETE
- [x] `specs/001-stride-application/contracts/e2e-route-mocks.md` - Route mocking contracts defined
- [x] REST endpoint contracts documented (auth, projects, issues)
- [x] Request/response schemas documented with TypeScript types

### Quickstart ✅ COMPLETE
- [x] `specs/001-stride-application/playwright-quickstart.md` - Quickstart guide generated
- [x] Setup instructions documented
- [x] Test writing examples provided
- [x] Debugging and troubleshooting guides included

## Phase 2: Implementation Planning

### Migration Strategy

**Phase 2.1: Fix Critical Issues (Immediate)**
1. Update `playwright.config.ts` to fix test discovery
2. Move tests from `app/` to `e2e/` directory
3. Verify all tests are discoverable

**Phase 2.2: Create Shared Infrastructure**
1. Create fixture directory structure
2. Implement authentication fixtures
3. Implement project fixtures
4. Create utility functions

**Phase 2.3: Refactor Existing Tests**
1. Update login tests to use fixtures
2. Update onboarding tests to use fixtures
3. Update feature tests to use shared utilities
4. Consolidate repository connection tests

**Phase 2.4: Enhance Configuration**
1. Add multi-project configuration
2. Add CI/CD reporting configuration
3. Update documentation

### Component Structure

**Fixtures** (Test Infrastructure Components):
- `auth.ts`: Authentication-related fixtures and helpers
- `projects.ts`: Project test data and route mocking
- `users.ts`: User test data factories (optional, created if needed)

**Utilities** (Shared Helper Functions):
- `api-helpers.ts`: Route mocking functions
- `page-helpers.ts`: Page interaction helpers
- `test-helpers.ts`: General test utilities

**Test Files** (E2E Test Suites):
- `auth/*.spec.ts`: Authentication and onboarding flows
- `features/*.spec.ts`: Feature-specific test suites

### State Management
- **Test State**: Managed by Playwright fixtures (automatic isolation)
- **Mock State**: Managed by route interception (reset between tests)
- **Page State**: Managed by Playwright Page API (automatic cleanup)

### Testing Strategy

**Unit Tests for Fixtures**: Not needed - fixtures are thin wrappers
**Integration Tests**: Not applicable - E2E tests are integration tests
**E2E Test Scenarios**:
1. ✅ Login flow (existing - needs refactoring)
2. ✅ Onboarding flow (existing - needs refactoring)
3. ✅ Documentation access (existing - needs refactoring)
4. ✅ Toast notifications (existing - needs refactoring)
5. ✅ Repository connections (existing - needs consolidation)

**Test Coverage Goals**:
- Critical paths: 100% (onboarding, login, issue creation)
- Feature paths: 80% (documentation, notifications, integrations)
- Edge cases: As needed based on user feedback

## Phase 3: Implementation Tasks

### Task Breakdown

**T001-T010: Configuration & Structure**
- Fix Playwright config
- Create directory structure
- Move existing test files

**T011-T020: Shared Infrastructure**
- Create authentication fixtures
- Create project fixtures
- Create utility functions

**T021-T030: Test Refactoring**
- Refactor login tests
- Refactor onboarding tests
- Refactor feature tests

**T031-T040: Documentation & Polish**
- Update testing documentation
- Add quickstart guide
- Update CI/CD configuration

### Dependencies
- No external dependencies required
- All tests must pass before marking complete
- Documentation updates required for maintainability

### Estimated Effort
- **Phase 2.1 (Critical Fix)**: 30 minutes
- **Phase 2.2 (Infrastructure)**: 2 hours
- **Phase 2.3 (Refactoring)**: 3 hours
- **Phase 2.4 (Enhancement)**: 1 hour
- **Total**: ~6.5 hours

## Complexity Tracking

**Risk Assessment**:
- **Low Risk**: Configuration changes are straightforward
- **Low Risk**: File moves are mechanical operations
- **Medium Risk**: Refactoring requires careful testing to ensure no regressions
- **Low Risk**: Fixture creation follows well-documented Playwright patterns

**Mitigation Strategies**:
- Run tests after each phase to catch regressions early
- Keep existing tests working while building new infrastructure
- Create fixtures incrementally and update tests one at a time

## Notes

- **Immediate Priority**: Fix test discovery issue (T001-T002) - blocks all E2E testing
- **Code Duplication**: Current duplication rate ~70% - target <10% after refactoring
- **Future Considerations**: 
  - Database seeding for integration tests (out of scope)
  - Visual regression testing (future enhancement)
  - Cross-browser testing configuration (already configured)

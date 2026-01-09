# Tasks: Playwright E2E Testing Reorganization

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-08  
**Status**: Ready for Implementation  
**Related Plan**: `specs/001-stride-application/playwright-reorganization-plan.md`

## Overview

This document provides an actionable, dependency-ordered task breakdown for reorganizing and centralizing Playwright E2E tests. Tasks are organized by implementation phases to enable systematic migration while maintaining test functionality throughout.

**Total Tasks**: 77  
**Estimated Total Time**: ~6.5 hours  
**MVP Scope**: Phase 1 (Critical Fix) - Tasks T001-T006 - ~30 minutes

## Implementation Strategy

### MVP First Approach

- **Phase 1**: Fix critical test discovery issue (blocks all E2E testing)
- **Incremental Delivery**: Each phase is independently testable and delivers value
- **Parallel Opportunities**: Tasks marked with [P] can be executed in parallel
- **Risk Mitigation**: Run tests after each phase to catch regressions early

### Task Format

Every task follows this strict format:

- `- [ ] [TaskID] [P?] Description with file path`

Where:

- **TaskID**: Sequential number (T001, T002, T003...)
- **[P]**: Optional marker for parallelizable tasks
- **Description**: Clear action with exact file path

---

## Phase 1: Fix Critical Issues (Immediate) 🎯 MVP

**Goal**: Fix test discovery configuration so Playwright can find and run existing tests

**Independent Test**: Run `pnpm --filter @stride/web test:e2e --list` and verify all 6 test files are discovered

**Estimated Time**: 30 minutes

### Configuration Fix

- [ ] T001 Update `testDir` from `'./app'` to `'./e2e'` in `apps/web/playwright.config.ts`
- [ ] T002 Add `testMatch: '**/*.spec.ts'` pattern to `apps/web/playwright.config.ts` to filter only Playwright test files

### Directory Structure

- [ ] T003 Create `apps/web/e2e/fixtures/` directory
- [ ] T004 Create `apps/web/e2e/utils/` directory
- [ ] T005 Create `apps/web/e2e/auth/` directory
- [ ] T006 Create `apps/web/e2e/features/` directory

**Checkpoint**: After Phase 1, verify `pnpm --filter @stride/web test:e2e --list` discovers tests in `e2e/` directory (should show 4 tests currently there)

---

## Phase 2: Move and Organize Existing Tests

**Goal**: Consolidate all E2E tests into centralized `e2e/` directory structure

**Independent Test**: All 6 test files should be discoverable in their new locations, tests still pass

**Estimated Time**: 30 minutes

### Move Authentication Tests

- [ ] T007 Move `apps/web/app/login/login.e2e.spec.ts` to `apps/web/e2e/auth/login.spec.ts`
- [ ] T008 Move `apps/web/app/onboarding/onboarding.e2e.spec.ts` to `apps/web/e2e/auth/onboarding.spec.ts`
- [ ] T009 Update imports in `apps/web/e2e/auth/login.spec.ts` (remove any relative paths that break)
- [ ] T010 Update imports in `apps/web/e2e/auth/onboarding.spec.ts` (remove any relative paths that break)

### Organize Feature Tests

- [ ] T011 Move `apps/web/e2e/documentation.spec.ts` to `apps/web/e2e/features/documentation.spec.ts` (rename if needed)
- [ ] T012 Move `apps/web/e2e/toast-notifications.spec.ts` to `apps/web/e2e/features/toast-notifications.spec.ts` (rename if needed)
- [ ] T013 Move `apps/web/e2e/repository-connection-manual.spec.ts` to `apps/web/e2e/features/repository-connection-manual.spec.ts`
- [ ] T014 Move `apps/web/e2e/repository-connection-oauth.spec.ts` to `apps/web/e2e/features/repository-connection-oauth.spec.ts`

### Verify Test Discovery

- [ ] T015 Run `pnpm --filter @stride/web test:e2e --list` and verify all 6 tests are discovered
- [ ] T016 Run `pnpm --filter @stride/web test:e2e` and verify all tests still pass (may have failures due to route mocking, but should discover and attempt to run)

**Checkpoint**: After Phase 2, all tests should be in `e2e/` directory organized by feature, and Playwright should discover all 6 test files

---

## Phase 3: Create Shared Infrastructure

**Goal**: Build reusable fixtures and utilities to eliminate code duplication

**Independent Test**: Fixtures can be imported and used in new test files, utilities function correctly

**Estimated Time**: 2 hours

### Authentication Fixtures

- [ ] T017 [P] Create `apps/web/e2e/fixtures/auth.ts` with `User` interface and `AuthFixtures` type definitions
- [ ] T018 [P] Implement `mockAuth` fixture function in `apps/web/e2e/fixtures/auth.ts` to mock `/api/auth/me` endpoint
- [ ] T019 [P] Implement `mockLogin` fixture function in `apps/web/e2e/fixtures/auth.ts` to mock `/api/auth/login` endpoint
- [ ] T020 Implement `loginAsUser` helper function in `apps/web/e2e/fixtures/auth.ts`
- [ ] T021 Implement `authenticatedPage` fixture in `apps/web/e2e/fixtures/auth.ts` using `test.extend()`
- [ ] T022 Export extended `test` and `expect` from `apps/web/e2e/fixtures/auth.ts`

### Project Fixtures

- [ ] T023 [P] Create `apps/web/e2e/fixtures/projects.ts` with `MockProject`, `ProjectConfig`, and related type definitions
- [ ] T024 [P] Implement `mockProjectRoute` function in `apps/web/e2e/fixtures/projects.ts` to mock single project endpoint
- [ ] T025 [P] Implement `mockProjectsList` function in `apps/web/e2e/fixtures/projects.ts` to mock projects list endpoint
- [ ] T026 Implement `testProjects` factory object in `apps/web/e2e/fixtures/projects.ts` with `withOnboarding()` and `withoutOnboarding()` methods

### API Helper Utilities

- [ ] T027 [P] Create `apps/web/e2e/utils/api-helpers.ts` with `mockAuthRoute` function
- [ ] T028 [P] Implement `mockLoginRoute` function in `apps/web/e2e/utils/api-helpers.ts`
- [ ] T029 [P] Implement `mockProjectRoute` helper in `apps/web/e2e/utils/api-helpers.ts`
- [ ] T030 [P] Implement `mockProjectsListRoute` helper in `apps/web/e2e/utils/api-helpers.ts`
- [ ] T031 Implement generic `mockJsonResponse` helper in `apps/web/e2e/utils/api-helpers.ts`

### Page Helper Utilities

- [ ] T032 [P] Create `apps/web/e2e/utils/page-helpers.ts` with `waitForNavigation` function
- [ ] T033 [P] Implement `fillForm` helper function in `apps/web/e2e/utils/page-helpers.ts`
- [ ] T034 [P] Implement `submitForm` helper function in `apps/web/e2e/utils/page-helpers.ts`
- [ ] T035 [P] Implement `clickAndWait` helper function in `apps/web/e2e/utils/page-helpers.ts`

### Test Helper Utilities

- [ ] T036 [P] Create `apps/web/e2e/utils/test-helpers.ts` with `retry` function for flaky operations
- [ ] T037 [P] Implement `generateEmail` function in `apps/web/e2e/utils/test-helpers.ts`
- [ ] T038 [P] Implement `generateProjectKey` function in `apps/web/e2e/utils/test-helpers.ts`

**Checkpoint**: After Phase 3, fixtures and utilities should be available for use in test files. Create a simple test to verify fixtures work correctly.

---

## Phase 4: Refactor Existing Tests

**Goal**: Update all existing tests to use shared fixtures and utilities, eliminating code duplication

**Independent Test**: All tests pass and use shared infrastructure instead of duplicated code

**Estimated Time**: 3 hours

### Refactor Login Tests

- [ ] T039 Update `apps/web/e2e/auth/login.spec.ts` to import and use `mockAuthRoute` and `mockLoginRoute` from `../utils/api-helpers`
- [ ] T040 Replace inline route mocks in `apps/web/e2e/auth/login.spec.ts` with utility function calls
- [ ] T041 Update `apps/web/e2e/auth/login.spec.ts` to use `fillForm` and `submitForm` helpers from `../utils/page-helpers` where appropriate
- [ ] T042 Verify `apps/web/e2e/auth/login.spec.ts` tests still pass after refactoring

### Refactor Onboarding Tests

- [ ] T043 Update `apps/web/e2e/auth/onboarding.spec.ts` to import and use `mockAuthRoute` and `mockLoginRoute` from `../utils/api-helpers`
- [ ] T044 Replace inline route mocks in `apps/web/e2e/auth/onboarding.spec.ts` with utility function calls
- [ ] T045 Update `apps/web/e2e/auth/onboarding.spec.ts` to use `mockProjectsListRoute` from `../utils/api-helpers` for project mocking
- [ ] T046 Verify `apps/web/e2e/auth/onboarding.spec.ts` tests still pass after refactoring

### Refactor Documentation Tests

- [ ] T047 Update `apps/web/e2e/features/documentation.spec.ts` to import and use `mockAuthRoute` from `../utils/api-helpers`
- [ ] T048 Replace inline `beforeEach` route mocks in `apps/web/e2e/features/documentation.spec.ts` with `mockAuthRoute` utility
- [ ] T049 Replace project mocking in `apps/web/e2e/features/documentation.spec.ts` with `mockProjectRoute` and `mockProjectsListRoute` utilities
- [ ] T050 Verify `apps/web/e2e/features/documentation.spec.ts` tests still pass after refactoring

### Refactor Toast Notification Tests

- [ ] T051 Update `apps/web/e2e/features/toast-notifications.spec.ts` to import and use `mockAuthRoute` from `../utils/api-helpers`
- [ ] T052 Replace inline `beforeEach` route mocks in `apps/web/e2e/features/toast-notifications.spec.ts` with `mockAuthRoute` utility
- [ ] T053 Replace project mocking in `apps/web/e2e/features/toast-notifications.spec.ts` with project fixture utilities
- [ ] T054 Verify `apps/web/e2e/features/toast-notifications.spec.ts` tests still pass after refactoring

### Refactor Repository Connection Tests

- [ ] T055 Update `apps/web/e2e/features/repository-connection-manual.spec.ts` to use shared utilities from `../utils/api-helpers`
- [ ] T056 Update `apps/web/e2e/features/repository-connection-oauth.spec.ts` to use shared utilities from `../utils/api-helpers`
- [ ] T057 Consider consolidating `apps/web/e2e/features/repository-connection-manual.spec.ts` and `apps/web/e2e/features/repository-connection-oauth.spec.ts` into single `repository-connection.spec.ts` with multiple test suites (optional optimization)
- [ ] T058 Verify both repository connection test files pass after refactoring

**Checkpoint**: After Phase 4, all tests should pass and use shared fixtures/utilities. Code duplication should be reduced from ~70% to <10%.

---

## Phase 5: Enhance Configuration and Documentation

**Goal**: Improve Playwright configuration with multi-project setup and update documentation

**Independent Test**: Configuration improvements work correctly, documentation is accurate

**Estimated Time**: 1 hour

### Playwright Configuration Enhancements

- [ ] T059 Add `testMatch: /.*\.spec\.ts/` pattern to `apps/web/playwright.config.ts` (if not already explicit)
- [ ] T060 Add `screenshot: 'only-on-failure'` to `use` section in `apps/web/playwright.config.ts`
- [ ] T061 Add `video: 'retain-on-failure'` to `use` section in `apps/web/playwright.config.ts`
- [ ] T062 Add conditional GitHub reporter for CI in `apps/web/playwright.config.ts` (update reporter array to include `['github']` when `process.env.CI` is true)
- [ ] T063 Add `chromium-auth` project configuration in `apps/web/playwright.config.ts` with `testMatch: /.*auth.*\.spec\.ts/` for authenticated test suite (optional enhancement)

### Update Documentation

- [ ] T064 Update `docs/TESTING_SETUP.md` with new E2E test structure and location information
- [ ] T065 Update `docs/TESTING_SETUP.md` with examples of using fixtures and utilities
- [ ] T066 Update `TESTING_QUICKSTART.md` with new test locations and fixture usage examples
- [ ] T067 Verify all documentation links to test files are updated to reflect new locations

### Turborepo Integration (Optional)

- [ ] T068 Add `test:e2e` task to `turbo.json` with proper dependencies and outputs if not already present

**Checkpoint**: After Phase 5, configuration should be optimized for CI/CD, and documentation should reflect the new structure.

---

## Phase 6: Validation and Cleanup

**Goal**: Final validation, cleanup, and verification that all goals are met

**Independent Test**: All tests pass, code duplication is minimized, structure is clean

**Estimated Time**: 30 minutes

### Final Validation

- [ ] T069 Run full test suite: `pnpm --filter @stride/web test:e2e` and verify all tests pass
- [ ] T070 Run test discovery: `pnpm --filter @stride/web test:e2e --list` and verify all 6 tests are discovered
- [ ] T071 Verify no duplicate route mocking code exists across test files (manual code review)
- [ ] T072 Verify all test files use shared fixtures/utilities where applicable

### Cleanup

- [ ] T073 Remove any unused imports from test files after refactoring
- [ ] T074 Ensure all TypeScript types are properly imported and used
- [ ] T075 Verify no linting errors: `pnpm --filter @stride/web lint`

### Documentation Verification

- [ ] T076 Verify `specs/001-stride-application/playwright-quickstart.md` is accessible and accurate
- [ ] T077 Verify all file paths in documentation match actual file structure

**Checkpoint**: After Phase 6, the reorganization should be complete. All tests pass, code duplication is minimized, and the structure is ready for future test additions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Critical Fix)**: No dependencies - **MUST START HERE** - blocks all test discovery
- **Phase 2 (Move Tests)**: Depends on Phase 1 completion - needs directory structure and config fix
- **Phase 3 (Infrastructure)**: Can start in parallel with Phase 2 - independent work
- **Phase 4 (Refactoring)**: Depends on Phase 2 and Phase 3 completion - needs moved tests and shared infrastructure
- **Phase 5 (Enhancement)**: Depends on Phase 4 completion - improvements after refactoring is stable
- **Phase 6 (Validation)**: Depends on all previous phases - final verification

### Task Dependencies Within Phases

**Phase 1**:
- T003-T006 can run in parallel after T001-T002 complete (directory creation is independent)

**Phase 2**:
- T007-T014 can run in parallel (moving files is independent)
- T015-T016 must run after all moves complete

**Phase 3**:
- T017-T031 can mostly run in parallel (different files, independent implementations)
- T020-T021 depend on T018-T019 (uses mock functions)
- T025 depends on T024 (related functions)

**Phase 4**:
- Test refactoring within each file must be sequential (T039→T040→T041→T042)
- Different test files can be refactored in parallel (T039-T042, T043-T046, etc.)

**Phase 5**:
- T059-T063 can run in parallel (config changes are independent)
- T064-T067 can run in parallel (documentation updates are independent)

**Phase 6**:
- Sequential validation tasks

### Parallel Opportunities

**Immediate Parallel (Phase 2)**:
- Moving all 8 test files (T007-T014) can be done in parallel

**Infrastructure Parallel (Phase 3)**:
- Creating all fixture files (T017, T023, T027, T032, T036) can start simultaneously
- All utility implementations marked [P] can run in parallel

**Refactoring Parallel (Phase 4)**:
- Different test files can be refactored by different developers simultaneously:
  - Developer A: Login tests (T039-T042)
  - Developer B: Onboarding tests (T043-T046)
  - Developer C: Documentation tests (T047-T050)
  - Developer D: Toast tests (T051-T054)

---

## Implementation Strategy

### MVP First (Critical Fix Only)

1. Complete Phase 1 only (T001-T006)
2. **STOP and VALIDATE**: Verify `pnpm --filter @stride/web test:e2e --list` discovers tests
3. Tests should now be discoverable (even if some fail due to route mocking)

**MVP Value**: E2E tests are now discoverable and runnable (fixes critical blocking issue)

### Incremental Delivery

1. **Week 1**: Phase 1 + Phase 2 → Tests organized and discoverable
2. **Week 2**: Phase 3 → Shared infrastructure ready
3. **Week 3**: Phase 4 → All tests refactored, duplication eliminated
4. **Week 4**: Phase 5 + Phase 6 → Configuration enhanced, validated

Each phase delivers independent value:
- Phase 1: Fixes critical blocking issue
- Phase 2: Better organization
- Phase 3: Reusable infrastructure
- Phase 4: Cleaner, maintainable tests
- Phase 5: Production-ready configuration
- Phase 6: Verified completeness

### Parallel Team Strategy

With multiple developers:

1. **Developer 1**: Phase 1 (config fix) → Phase 2 (move tests) → Phase 5 (config enhancement)
2. **Developer 2**: Phase 3 (fixtures and utilities) → Support Phase 4
3. **Developer 3**: Phase 4 (refactor tests) - can start after Phase 2+3 complete
4. **All**: Phase 6 (validation) - collaborative review

### Risk Mitigation

- **After Phase 1**: Run test discovery to verify fix works
- **After Phase 2**: Run tests to ensure moves didn't break anything
- **After Phase 3**: Create simple test using fixtures to verify they work
- **After Phase 4**: Full test suite run to catch any refactoring regressions
- **After Each Phase**: Commit changes to enable easy rollback if needed

---

## Success Criteria

### Phase 1 Success
- ✅ Playwright discovers all 6 test files when running `--list`
- ✅ No errors about loading Vitest files

### Phase 2 Success
- ✅ All tests located in `e2e/` directory organized by feature
- ✅ All tests still pass (or same failures as before)

### Phase 3 Success
- ✅ Fixtures can be imported and used in test files
- ✅ Utilities function correctly when tested manually

### Phase 4 Success
- ✅ All tests pass
- ✅ Code duplication reduced from ~70% to <10%
- ✅ All tests use shared fixtures/utilities

### Phase 5 Success
- ✅ Configuration optimized for CI/CD
- ✅ Documentation updated and accurate

### Phase 6 Success
- ✅ All tests pass
- ✅ No linting errors
- ✅ Structure is clean and ready for future additions

---

## Notes

- **Critical Path**: Phase 1 must complete first - blocks all E2E testing
- **Code Duplication Target**: Reduce from ~70% to <10% after refactoring
- **Test Count**: Should maintain 6 test files throughout (no tests lost during migration)
- **Breaking Changes**: None - this is internal test reorganization
- **Future Enhancements** (Out of Scope):
  - Database seeding for integration tests
  - Visual regression testing
  - Additional test coverage (covered in separate tasks)

---

## Quick Reference

### Running Tests

```bash
# List all tests
pnpm --filter @stride/web test:e2e --list

# Run all tests
pnpm --filter @stride/web test:e2e

# Run specific test file
pnpm --filter @stride/web test:e2e e2e/auth/login.spec.ts

# Run in UI mode
pnpm --filter @stride/web test:e2e:ui

# Run in headed mode
pnpm --filter @stride/web test:e2e:headed
```

### Key File Locations

- **Config**: `apps/web/playwright.config.ts`
- **Fixtures**: `apps/web/e2e/fixtures/`
- **Utilities**: `apps/web/e2e/utils/`
- **Auth Tests**: `apps/web/e2e/auth/`
- **Feature Tests**: `apps/web/e2e/features/`
- **Documentation**: `docs/TESTING_SETUP.md`, `TESTING_QUICKSTART.md`

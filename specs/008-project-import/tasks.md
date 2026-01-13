# Tasks: Project Import from Git Providers

**Input**: Design documents from `/specs/008-project-import/`  
**Prerequisites**: impl-plan.md (required), spec.md (required for user stories), data-model.md, contracts/

**Tests**: Tests are included as they are explicitly planned in the implementation plan testing strategy.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `apps/web/app/` for routes, `apps/web/src/` for components and lib
- **Shared Packages**: `packages/` for shared code
- Paths shown below follow the monorepo structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and utility functions needed across user stories

- [ ] T001 Create project key generation utility function in apps/web/src/lib/utils/project-key.ts
- [ ] T002 [P] Add RepositoryInfo and PaginationInfo types for repository listing API in apps/web/app/api/repositories/list/route.ts (co-locate with API route following existing pattern)
- [ ] T003 [P] Add ImportProjectData type in apps/web/src/components/features/projects/RepositoryImportForm.tsx (co-locate with component following existing pattern)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Enhance GitHub integration with repository listing function in apps/web/src/lib/integrations/github.ts
- [ ] T005 [P] Enhance GitLab integration with repository listing function in apps/web/src/lib/integrations/gitlab.ts
- [ ] T006 Create repository listing API endpoint in apps/web/app/api/repositories/list/route.ts
- [ ] T007 Create project import API endpoint in apps/web/app/api/projects/import/route.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Manual Project Creation (Priority: P1) 🎯 MVP

**Goal**: Allow users to create projects manually with optional repository URL storage during creation (URL is stored on project entity; repository connection happens separately via project settings or import flow)

**Independent Test**: User can navigate to project creation, enter project key/name/description, optionally provide repository URL, and successfully create a project. Project appears in projects list with correct information, and repository URL is stored if provided (connection can be established later via project settings or import flow).

### Implementation for User Story 1

- [ ] T008 [US1] Enhance POST /api/projects endpoint to accept optional repositoryUrl and repositoryType in apps/web/app/api/projects/route.ts (URL is stored on project entity only; no connection logic)
- [ ] T009 [US1] Update project creation validation schema to include optional repository fields in apps/web/src/lib/validation/project.ts
- [ ] T010 [US1] Update manual project creation UI to include optional repository URL input in apps/web/app/onboarding/project/page.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can create projects manually with or without repository URL (URL is stored; connection happens separately).

---

## Phase 4: User Story 2 - List Repositories from Git Providers (Priority: P1)

**Goal**: Allow users to see their available repositories from GitHub or GitLab so they can select one to import

**Independent Test**: User can authenticate with a git provider (GitHub/GitLab), view their repositories in a list, and see repository details like name, description, and URL. Success when users can see their repositories and identify which ones they want to import.

### Tests for User Story 2

- [ ] T012 [P] [US2] Unit test for listGitHubRepositories function in apps/web/src/lib/integrations/github.test.ts
- [ ] T013 [P] [US2] Unit test for listGitLabRepositories function in apps/web/src/lib/integrations/gitlab.test.ts
- [ ] T014 [P] [US2] Integration test for GET /api/repositories/list endpoint in apps/web/app/api/repositories/list/route.test.ts

### Implementation for User Story 2

- [ ] T015 [US2] Create import page server component in apps/web/app/projects/import/page.tsx
- [ ] T016 [US2] Create RepositoryImportFlow client component in apps/web/src/components/features/projects/RepositoryImportFlow.tsx
- [ ] T017 [US2] Create RepositoryList client component in apps/web/src/components/features/projects/RepositoryList.tsx
- [ ] T018 [P] [US2] Create RepositoryListSkeleton loading component in apps/web/src/components/features/projects/RepositoryListSkeleton.tsx
- [ ] T019 [US2] Implement OAuth flow integration in RepositoryImportFlow component
- [ ] T020 [US2] Implement repository listing with TanStack Query in RepositoryList component
- [ ] T021 [US2] Add pagination controls to RepositoryList component
- [ ] T022 [US2] Add error handling and loading states to repository listing flow

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently. Users can authenticate with git providers and view their repository lists.

---

## Phase 5: User Story 3 - Import Project from Repository (Priority: P1)

**Goal**: Allow users to create a project by importing from a git repository, automatically setting up the project with repository information and configuration

**Independent Test**: User can select a repository from the list, confirm import settings (project key, name), and successfully create a project with the repository automatically connected. Success when the project is created with correct information, repository connection is established, configuration is synced if present, and webhooks are registered.

### Tests for User Story 3

- [ ] T023 [P] [US3] Unit test for project key generation utility in apps/web/src/lib/utils/project-key.test.ts
- [ ] T024 [P] [US3] Unit test for RepositoryImportForm component in apps/web/src/components/features/projects/RepositoryImportForm.test.tsx
- [ ] T025 [P] [US3] Integration test for POST /api/projects/import endpoint in apps/web/app/api/projects/import/route.test.ts
- [ ] T026 [P] [US3] Integration test for transaction rollback on webhook failure in apps/web/app/api/projects/import/route.test.ts

### Implementation for User Story 3

- [ ] T027 [US3] Create RepositoryImportForm client component in apps/web/src/components/features/projects/RepositoryImportForm.tsx
- [ ] T028 [US3] Implement project import mutation with TanStack Query in RepositoryImportFlow component
- [ ] T029 [US3] Add project key editing and validation to RepositoryImportForm component
- [ ] T030 [US3] Implement duplicate repository detection in POST /api/projects/import endpoint
- [ ] T031 [US3] Implement project key generation from repository name in POST /api/projects/import endpoint
- [ ] T032 [US3] Implement repository metadata fetching in POST /api/projects/import endpoint
- [ ] T033 [US3] Implement configuration sync from repository in POST /api/projects/import endpoint
- [ ] T034 [US3] Implement repository connection creation in POST /api/projects/import endpoint
- [ ] T035 [US3] Implement webhook registration in POST /api/projects/import endpoint
- [ ] T036 [US3] Implement transaction rollback on webhook registration failure in POST /api/projects/import endpoint (use Prisma $transaction pattern - see apps/web/src/lib/services/invitation-service.ts:252 for example)
- [ ] T037 [US3] Add error handling for import failures in RepositoryImportForm component
- [ ] T038 [US3] Add success redirect to project page after import completion

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently. Users can import projects from repositories with automatic setup.

---

## Phase 6: E2E Tests & Polish

**Purpose**: End-to-end testing and cross-cutting improvements

### E2E Tests

- [ ] T039 [P] E2E test for repository import flow in apps/web/e2e/project-import.spec.ts
- [ ] T040 [P] E2E test for import with custom project key in apps/web/e2e/project-import.spec.ts
- [ ] T041 [P] E2E test for error handling in import flow in apps/web/e2e/project-import.spec.ts
- [ ] T042 [P] E2E test for repository listing pagination in apps/web/e2e/project-import.spec.ts

### Polish & Cross-Cutting Concerns

- [ ] T043 [P] Add accessibility attributes to all new components (ARIA labels, keyboard navigation)
- [ ] T044 [P] Add loading states and error boundaries to import page
- [ ] T045 [P] Update documentation with import feature usage in docs/user/README.md
- [ ] T046 [P] Add repository connection status indicator to repository list (optional enhancement)
- [ ] T047 Code cleanup and refactoring across all new components
- [ ] T048 Run quickstart.md validation to ensure all steps work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (independent OAuth and listing)
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US2 for repository selection UI, but import API can be built independently

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- API endpoints before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Unit test for listGitHubRepositories function in apps/web/src/lib/integrations/github.test.ts"
Task: "Unit test for listGitLabRepositories function in apps/web/src/lib/integrations/gitlab.test.ts"
Task: "Integration test for GET /api/repositories/list endpoint in apps/web/app/api/repositories/list/route.test.ts"

# Launch all components for User Story 2 together (after tests):
Task: "Create RepositoryListSkeleton loading component in apps/web/src/components/features/projects/RepositoryListSkeleton.tsx"
Task: "Create RepositoryList client component in apps/web/src/components/features/projects/RepositoryList.tsx"
```

---

## Parallel Example: User Story 3

```bash
# Launch all tests for User Story 3 together:
Task: "Unit test for project key generation utility in apps/web/src/lib/utils/project-key.test.ts"
Task: "Unit test for RepositoryImportForm component in apps/web/src/components/features/projects/RepositoryImportForm.test.tsx"
Task: "Integration test for POST /api/projects/import endpoint in apps/web/app/api/projects/import/route.test.ts"
Task: "Integration test for transaction rollback on webhook failure in apps/web/app/api/projects/import/route.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Manual Project Creation with optional repository)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Repository Discovery)
4. Add User Story 3 → Test independently → Deploy/Demo (Full Import)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Manual creation enhancement)
   - Developer B: User Story 2 (Repository listing)
   - Developer C: User Story 3 (Import functionality)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All three user stories are P1 priority, but can be delivered incrementally
- User Story 1 enhances existing functionality (manual project creation)
- User Stories 2 and 3 add new functionality (repository import workflow)

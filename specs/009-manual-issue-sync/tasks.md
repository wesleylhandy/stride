# Tasks: Manual Issue Sync for Inactive Webhooks

**Input**: Design documents from `/specs/009-manual-issue-sync/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are OPTIONAL - not explicitly requested in spec, but will include basic integration tests for core functionality.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/` for Next.js application, `packages/database/` for database layer
- All paths shown below use absolute paths from repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure and type definitions

- [ ] T001 [P] Create sync library directory structure at apps/web/src/lib/sync/
- [ ] T002 [P] Create TypeScript types file for sync operations at apps/web/src/lib/sync/types.ts
- [ ] T003 [P] Create rate limiter utility at apps/web/src/lib/sync/rate-limiter.ts
- [ ] T009 Implement DuplicateMatcher class in apps/web/src/lib/sync/duplicate-matcher.ts (requires T001: directory structure)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Extend GitHub client with fetchGitHubIssues function in apps/web/src/lib/integrations/github.ts
- [ ] T005 [P] Extend GitHub client with fetchGitHubDependabotAlerts function in apps/web/src/lib/integrations/github.ts
- [ ] T006 [P] Extend GitLab client with fetchGitLabIssues function in apps/web/src/lib/integrations/gitlab.ts
- [ ] T007 [P] Extend GitLab client with fetchGitLabVulnerabilityFindings function in apps/web/src/lib/integrations/gitlab.ts
- [ ] T008 [P] Extend Bitbucket client with fetchBitbucketIssues function in apps/web/src/lib/integrations/bitbucket.ts (create if not exists)
- [ ] T010 Create Zod validation schemas for sync request/response types in apps/web/src/lib/sync/types.ts (requires T002: types.ts file)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Manual Sync of Repository Issues (Priority: P1) 🎯 MVP

**Goal**: Enable project administrators and members to manually synchronize open issues from Git repositories when webhooks are inactive. System retrieves issues via Git provider APIs, matches existing issues to prevent duplicates, and creates/updates issues in the project.

**Independent Test**: Navigate to project settings, identify an inactive repository connection, trigger manual issue sync. Verify that open issues are retrieved from Git provider API and created as issues in the project. Test with repositories from all supported providers (GitHub, GitLab, Bitbucket).

**Note**: T011 requires T009 (DuplicateMatcher) from Phase 1 to be complete.

### Implementation for User Story 1

- [ ] T011 [US1] Implement IssueSyncService class in apps/web/src/lib/sync/issue-sync-service.ts with syncRepositoryIssues method
- [ ] T012 [US1] Set default issue state filter to 'open' only in Git provider client calls (unless includeClosed is true)
- [ ] T013 [US1] Add pagination handling logic to IssueSyncService for sequential page fetching
- [ ] T014 [US1] Integrate DuplicateMatcher into IssueSyncService for duplicate detection
- [ ] T015 [US1] Implement external identifier storage in Issue.customFields within IssueSyncService
- [ ] T016 [US1] Preserve Git provider issue metadata (labels, assignees, descriptions, creation dates) when creating/updating issues in IssueSyncService
- [ ] T017 [US1] Validate repository connection access token and permissions before sync in IssueSyncService
- [ ] T018 [US1] Add error handling for Git provider API failures in IssueSyncService
- [ ] T019 [US1] Add rate limiting error handling with exponential backoff in IssueSyncService
- [ ] T020 [US1] Create POST API route handler at apps/web/app/api/projects/[projectId]/repositories/[repositoryId]/sync/route.ts
- [ ] T021 [US1] Add permission validation (admin/member only, not viewers) in sync route handler
- [ ] T022 [US1] Add concurrent sync prevention logic in sync route handler
- [ ] T023 [US1] Add webhook status check and confirmation requirement logic in sync route handler
- [ ] T024 [US1] Integrate IssueSyncService into sync route handler
- [ ] T025 [US1] Implement RepositoryConnection.lastSyncAt update after successful sync
- [ ] T026 [US1] Create ManualSyncButton component at apps/web/src/components/features/projects/ManualSyncButton.tsx
- [ ] T027 [US1] Add sync button to repository connection settings UI
- [ ] T028 [US1] Implement sync trigger logic in ManualSyncButton component
- [ ] T029 [US1] Add loading state handling in ManualSyncButton component
- [ ] T030 [US1] Add basic success/error feedback display in ManualSyncButton component

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can trigger manual sync, issues are fetched and created/updated, duplicates are prevented.

---

## Phase 4: User Story 2 - Manual Sync of Security Advisories (Priority: P2)

**Goal**: Enable manual synchronization of security advisories and Dependabot alerts from repositories. Security issues are synced as part of regular sync (default) or via separate security-only sync action, with appropriate priority and type assignments.

**Independent Test**: Trigger manual security sync for a repository with known security advisories. Verify that security-related issues are retrieved, created with Bug type and High/Critical priority, and marked with security metadata. Test graceful degradation when provider doesn't support security advisories (e.g., Bitbucket).

### Implementation for User Story 2

- [ ] T031 [US2] Extend IssueSyncService to support security advisory fetching from GitHub Dependabot API
- [ ] T032 [US2] Extend IssueSyncService to support security advisory fetching from GitLab Vulnerability API
- [ ] T033 [US2] Add security advisory mapping logic (map to Bug type with High/Critical priority) in IssueSyncService
- [ ] T034 [US2] Add securityAdvisory flag to external sync metadata in Issue.customFields
- [ ] T035 [US2] Implement syncType parameter handling (full/issuesOnly/securityOnly) in sync route handler
- [ ] T036 [US2] Add security-only sync option to ManualSyncButton component UI
- [ ] T037 [US2] Implement graceful degradation for providers without security advisory support (Bitbucket)
- [ ] T038 [US2] Add security advisory sync error handling in IssueSyncService
- [ ] T039 [US2] Update sync results to include security advisory counts separately

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can sync regular issues, security advisories separately, or both together.

---

## Phase 5: User Story 3 - Sync Progress and Feedback (Priority: P3)

**Goal**: Provide visibility into sync operation progress with real-time feedback. Users see progress indicators, completion messages with counts, and clear error messages. Support asynchronous operations for large repositories.

**Independent Test**: Trigger manual sync on repository with known number of issues. Observe progress indicators, verify completion message shows correct counts (created/updated/skipped), verify errors are clearly communicated. Test with repository large enough to require async mode.

### Implementation for User Story 3

- [ ] T040 [US3] Add progress tracking state management to IssueSyncService
- [ ] T041 [US3] Implement sync operation status storage (in-memory or database) for async operations
- [ ] T042 [US3] Add GET API route handler for sync status at apps/web/app/api/projects/[projectId]/repositories/[repositoryId]/sync/[operationId]/route.ts
- [ ] T043 [US3] Implement async operation mode detection (repository size > 100 issues) in sync route handler
- [ ] T044 [US3] Return 202 Accepted with operation ID for async operations in sync route handler
- [ ] T045 [US3] Create SyncProgressDialog component at apps/web/src/components/features/projects/SyncProgressDialog.tsx
- [ ] T046 [US3] Implement progress polling logic in SyncProgressDialog component
- [ ] T047 [US3] Add progress bar and stage display in SyncProgressDialog component
- [ ] T048 [US3] Add sync results summary display (created/updated/skipped counts) in SyncProgressDialog component
- [ ] T049 [US3] Implement error message display with actionable suggestions in SyncProgressDialog component
- [ ] T050 [US3] Add SyncProgressDialog integration to ManualSyncButton component
- [ ] T051 [US3] Add periodic progress updates during sync (update every N issues processed)
- [ ] T052 [US3] Implement sync cancellation support (DELETE endpoint) at apps/web/app/api/projects/[projectId]/repositories/[repositoryId]/sync/[operationId]/route.ts
- [ ] T053 [US3] Add cancellation button to SyncProgressDialog component

**Checkpoint**: At this point, all user stories should work independently with full progress feedback. Users can monitor sync progress, see detailed results, and cancel long-running operations.

---

## Phase 6: Manual Issue Linking (User Story 1 Enhancement)

**Goal**: Allow users to manually link synced repository issues to existing local issues when automatic matching fails. This extends User Story 1 functionality per acceptance scenario #5.

**Note**: Required for US1 acceptance criteria, but implemented as enhancement phase to maintain MVP focus. Can be implemented alongside US1 if needed.

**Independent Test**: Sync issues from repository, identify an issue that was not automatically matched to an existing local issue, use manual link feature to connect them. Verify external identifier is updated and future syncs recognize the link.

### Implementation for Manual Issue Linking

- [ ] T054 [P] [US1] Create POST API route handler for manual linking at apps/web/app/api/projects/[projectId]/issues/[issueId]/link-external/route.ts
- [ ] T055 [P] [US1] Add external identifier validation logic in link-external route handler
- [ ] T056 [P] [US1] Implement duplicate external ID prevention in link-external route handler
- [ ] T057 [P] [US1] Add manual link button/action to issue detail UI
- [ ] T058 [P] [US1] Create manual link modal/dialog component for selecting external issue
- [ ] T059 [P] [US1] Integrate manual link functionality into issue detail page

**Checkpoint**: Users can now manually link issues when automatic matching fails or produces incorrect matches.

---

## Phase 7: Closed/Archived Issues Support (User Story 1 Enhancement)

**Goal**: Support syncing closed/archived issues with opt-in checkbox and verification confirmation to prevent accidental inclusion. This extends User Story 1 functionality per FR-013.

**Note**: Extends User Story 1 functionality - adds opt-in capability for closed/archived issues with verification safeguards.

**Independent Test**: Trigger manual sync with includeClosed option checked, verify confirmation dialog appears, confirm, verify closed issues are synced. Test without confirmation to verify sync is blocked.

### Implementation for Closed/Archived Issues

- [ ] T060 [US1] Add includeClosed parameter handling to sync route handler
- [ ] T061 [US1] Add includeClosed parameter to IssueSyncService.syncRepositoryIssues method
- [ ] T062 [US1] Add state parameter (closed/all) to Git provider client functions when includeClosed is true
- [ ] T063 [US1] Add includeClosed checkbox to ManualSyncButton component UI
- [ ] T064 [US1] Add verification confirmation dialog for includeClosed option in ManualSyncButton component
- [ ] T065 [US1] Add confirmation flag to sync API request when includeClosed is selected

**Checkpoint**: Users can opt-in to sync closed/archived issues with proper confirmation safeguards.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T066 [P] Add comprehensive error logging for sync operations in IssueSyncService
- [ ] T067 [P] Add sync operation metrics tracking (duration, issue counts, error rates)
- [ ] T068 [P] Update API documentation with sync endpoint examples
- [ ] T069 [P] Add integration tests for sync API endpoints in apps/web/e2e/features/manual-sync.spec.ts
- [ ] T070 [P] Add unit tests for DuplicateMatcher in apps/web/src/lib/sync/__tests__/duplicate-matcher.test.ts
- [ ] T071 [P] Add unit tests for IssueSyncService in apps/web/src/lib/sync/__tests__/issue-sync-service.test.ts
- [ ] T072 [P] Add accessibility attributes to ManualSyncButton and SyncProgressDialog components
- [ ] T073 [P] Add keyboard navigation support to sync UI components
- [ ] T074 [P] Validate quickstart.md implementation steps against actual code
- [ ] T075 [P] Add loading skeletons for sync operation states
- [ ] T076 [P] Add retry mechanism for failed sync operations
- [ ] T077 [P] Add sync history/audit log (optional enhancement)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion - MVP deliverable
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion, can build on US1 components
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion, enhances US1/US2 with progress feedback
- **Manual Linking (Phase 6)**: Depends on User Story 1 completion (needs sync functionality)
- **Closed Issues (Phase 7)**: Depends on User Story 1 completion (needs sync functionality)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Can reuse US1 components but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1/US2 but independently testable

### Within User Story 1 (Execution Order)

1. Service core implementation (T011-T015): IssueSyncService class, default state, pagination, duplicate matching, external ID storage
2. Service enhancements (T016-T019): Metadata preservation, token validation, error handling, rate limiting
3. API route implementation (T020-T025): Route handler, validation, webhook check, service integration, timestamp update
4. UI components (T026-T030): ManualSyncButton component, UI integration, trigger logic, states, feedback

### Parallel Opportunities

- **Setup phase**: T001-T003 can run in parallel (different files). T009 requires T001 to complete first (not parallel)
- **Foundational phase**: T004-T008 can run in parallel. T010 requires T002 to be complete first (not parallel)
- **User Story 1**: 
  - T011-T017 (sync service core + metadata + validation + error handling) must be sequential
  - T018-T019 (error handling completion) must complete before T024 (integration)
  - T020-T025 (API route) can be done in parallel with T026-T030 (UI components) after service is ready
- **User Story 2**: T031-T039 can mostly run in parallel with US1 work (extending existing service)
- **User Story 3**: T040-T053 can mostly run in parallel with previous stories (progress tracking is additive)
- **Manual Linking**: T054-T059 can all run in parallel (separate endpoint and UI) - extends US1
- **Closed Issues**: T060-T065 can run in parallel - extends US1
- **Polish**: All T066-T077 can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all Git provider client extensions together:
Task: "Extend GitHub client with fetchGitHubIssues function"
Task: "Extend GitHub client with fetchGitHubDependabotAlerts function"
Task: "Extend GitLab client with fetchGitLabIssues function"
Task: "Extend GitLab client with fetchGitLabVulnerabilityFindings function"
Task: "Extend Bitbucket client with fetchBitbucketIssues function"

# After prerequisites complete:
Task: "Implement DuplicateMatcher class" (requires T001 - must complete after T001)
Task: "Create Zod validation schemas for sync request/response types" (requires T002 - must complete after T002)
```

---

## Parallel Example: User Story 1

```bash
# After sync service is ready, launch API and UI in parallel:
# API route work:
Task: "Create POST API route handler"
Task: "Add permission validation"
Task: "Add concurrent sync prevention logic"
Task: "Add webhook status check and confirmation requirement logic"
Task: "Integrate IssueSyncService into sync route handler"
Task: "Implement RepositoryConnection.lastSyncAt update"

# UI component work:
Task: "Create ManualSyncButton component"
Task: "Add sync button to repository connection settings UI"
Task: "Implement sync trigger logic in ManualSyncButton component"
Task: "Add loading state handling"
Task: "Add basic success/error feedback display"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003, T009) - **T009 requires T001**
2. Complete Phase 2: Foundational (T004-T008, T010) - **CRITICAL - blocks all stories. T010 requires T002**
3. Complete Phase 3: User Story 1 (T011-T030) - **Error handling (T018-T019) must complete before integration (T024)**
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Verify sync works for GitHub, GitLab, Bitbucket
   - Verify duplicate detection works
   - Verify permission enforcement works
   - Verify webhook status handling works
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Security sync)
4. Add User Story 3 → Test independently → Deploy/Demo (Progress feedback)
5. Add Manual Linking → Test independently → Deploy/Demo
6. Add Closed Issues → Test independently → Deploy/Demo
7. Polish → Final enhancements

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 1 (sync service + API route)
   - **Developer B**: User Story 1 (UI components) - can start after service is ready
   - **Developer C**: User Story 2 (security advisory support) - can start after service is ready
3. Once US1 is complete:
   - **Developer A**: User Story 3 (progress tracking)
   - **Developer B**: Manual Linking feature
   - **Developer C**: Closed Issues support
4. All developers: Polish phase (parallel work)

---

## Notes

- **[P] tasks** = different files, no dependencies - can be worked on simultaneously
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Git provider client extensions (T004-T008) are foundational and must complete before any sync work
- Sync service (T011-T019) must complete before API routes and UI components
- Error handling (T018-T019) must be integrated into service before route integration (T024)
- Progress tracking (US3) enhances existing functionality and can be added incrementally
- Manual linking (Phase 6) and closed issues (Phase 7) are US1 enhancements that can be added after MVP
- T009 (DuplicateMatcher) moved to Phase 1 as it's needed by T011 (IssueSyncService)
- T010 (Zod schemas) requires T002 (types.ts) - not parallel

---

## Task Summary

- **Total Tasks**: 77
- **Setup Phase**: 4 tasks (includes T009: DuplicateMatcher)
- **Foundational Phase**: 6 tasks (T009 moved to Setup)
- **User Story 1**: 20 tasks (includes metadata preservation, token validation, default state handling)
- **User Story 2**: 9 tasks
- **User Story 3**: 14 tasks
- **Manual Linking**: 6 tasks (US1 enhancement)
- **Closed Issues**: 6 tasks (US1 enhancement)
- **Polish**: 12 tasks

**MVP Scope** (User Story 1): 30 tasks (Setup + Foundational + US1)

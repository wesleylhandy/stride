# Tasks: Documentation Search

**Input**: Design documents from `/specs/004-documentation-search/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [ ] T001 Install required dependencies: `remark`, `remark-gfm`, `@types/mdast` in `apps/web/package.json`
- [ ] T002 [P] Verify `fuse.js` is already installed in `packages/ui/package.json` (reuse existing)
- [ ] T003 [P] Create build script directory structure: `apps/web/scripts/` if not exists

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create build script `apps/web/scripts/build-docs-index.ts` to generate search index from markdown files
- [ ] T005 [P] Create TypeScript interfaces for search index in `apps/web/src/lib/search/types.ts` (DocumentationEntry, SearchResult, SearchIndex)
- [ ] T006 [P] Create search service class `apps/web/src/lib/search/documentation-search.ts` with loadIndex and search methods
- [ ] T007 Integrate build script into Next.js build process in `apps/web/package.json` (add `build:docs-index` script)
- [ ] T008 Create search index output location: ensure `apps/web/public/` directory exists for `docs-search-index.json`

**Checkpoint**: Foundation ready - search index generation and service layer complete. User story implementation can now begin.

---

## Phase 3: User Story 1 - Finding Configuration Documentation (Priority: P1) 🎯 MVP

**Goal**: Users can search documentation and find relevant sections with preview snippets, then navigate to the correct documentation page.

**Independent Test**: Open documentation search, enter query "custom fields", verify relevant results appear with titles and snippets, click result and navigate to correct documentation section.

### Implementation for User Story 1

- [ ] T009 [US1] Create DocumentationSearch component in `packages/ui/src/organisms/DocumentationSearch.tsx` with modal overlay UI
- [ ] T010 [US1] Implement search input field in `packages/ui/src/organisms/DocumentationSearch.tsx` with query state management
- [ ] T011 [US1] Implement search results list in `packages/ui/src/organisms/DocumentationSearch.tsx` displaying title, section, and snippet
- [ ] T012 [US1] Implement result click handler in `packages/ui/src/organisms/DocumentationSearch.tsx` to navigate to documentation path
- [ ] T013 [US1] Integrate search service in `packages/ui/src/organisms/DocumentationSearch.tsx` to load index and perform searches
- [ ] T014 [US1] Add "No results found" message in `packages/ui/src/organisms/DocumentationSearch.tsx` when search returns empty
- [ ] T015 [US1] Export DocumentationSearch component from `packages/ui/src/index.ts`
- [ ] T016 [US1] Add search button/trigger to documentation layout in `apps/web/app/docs/layout.tsx` (consistent access pattern per FR-001)
- [ ] T017 [US1] Integrate DocumentationSearch component into documentation pages with open/close state management

**Checkpoint**: At this point, User Story 1 should be fully functional - users can search documentation, see results with snippets, and navigate to pages.

---

## Phase 4: User Story 2 - Quick Reference Lookup (Priority: P1)

**Goal**: Search results are ranked by relevance with fuzzy matching, and matching terms are highlighted in preview snippets.

**Independent Test**: Search for "env vars" (abbreviation), verify "environment variables" documentation appears in top results with fuzzy matching. Verify matching terms are highlighted in snippets.

### Implementation for User Story 2

- [ ] T018 [US2] Configure fuse.js with weighted keys in `apps/web/src/lib/search/documentation-search.ts` (title: 0.4, headings: 0.3, content: 0.2, path: 0.1)
- [ ] T019 [US2] Implement relevance ranking in `apps/web/src/lib/search/documentation-search.ts` using fuse.js score sorting
- [ ] T020 [US2] Add match highlighting utility function in `packages/ui/src/organisms/DocumentationSearch.tsx` to highlight matched terms in snippets
- [ ] T021 [US2] Display highlighted matches in search result snippets in `packages/ui/src/organisms/DocumentationSearch.tsx`
- [ ] T022 [US2] Configure fuse.js fuzzy matching settings in `apps/web/src/lib/search/documentation-search.ts` (threshold: 0.3, minMatchCharLength: 2)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - search has relevance ranking and fuzzy matching with highlighted results.

---

## Phase 5: User Story 3 - Mobile and Keyboard Navigation (Priority: P2)

**Goal**: Search interface is fully accessible via keyboard shortcuts and mobile devices with proper focus management.

**Independent Test**: Open search on mobile (touch input works), use keyboard shortcuts (arrow keys navigate, Enter selects, Escape closes), verify all interactions work without mouse.

### Implementation for User Story 3

- [ ] T023 [US3] Implement keyboard navigation in `packages/ui/src/organisms/DocumentationSearch.tsx` (ArrowUp/ArrowDown for result selection)
- [ ] T024 [US3] Implement Enter key handler in `packages/ui/src/organisms/DocumentationSearch.tsx` to select and navigate to selected result
- [ ] T025 [US3] Implement Escape key handler in `packages/ui/src/organisms/DocumentationSearch.tsx` to close search modal
- [ ] T026 [US3] Add focus management in `packages/ui/src/organisms/DocumentationSearch.tsx` (focus input on open, trap focus in modal)
- [ ] T027 [US3] Add keyboard shortcut hook in `apps/web/src/hooks/useKeyboardShortcut.ts` (or similar) for Cmd/Ctrl+Shift+K to open search
- [ ] T028 [US3] Integrate keyboard shortcut in documentation pages to open search modal
- [ ] T029 [US3] Ensure mobile touch targets are 44x44px minimum in `packages/ui/src/organisms/DocumentationSearch.tsx`
- [ ] T030 [US3] Add screen reader support with ARIA labels in `packages/ui/src/organisms/DocumentationSearch.tsx` (aria-label, role, aria-live)
- [ ] T031 [US3] Add focus visible indicators for keyboard navigation in `packages/ui/src/organisms/DocumentationSearch.tsx`

**Checkpoint**: All user stories should now be independently functional with full accessibility support.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T032 [P] Add error handling and graceful degradation in `apps/web/src/lib/search/documentation-search.ts` (handle missing index, parse errors)
- [ ] T033 [P] Add loading state UI in `packages/ui/src/organisms/DocumentationSearch.tsx` while index loads
- [ ] T034 [P] Implement index caching in `apps/web/src/lib/search/documentation-search.ts` to avoid reloading on subsequent searches
- [ ] T035 [P] Add code splitting for search component in `packages/ui/src/organisms/DocumentationSearch.tsx` (lazy load with dynamic import)
- [ ] T036 [P] Add input validation in `packages/ui/src/organisms/DocumentationSearch.tsx` (min 2 chars, max 100 chars, sanitize query)
- [ ] T037 [P] Add performance optimization: virtualize results list if >50 results in `packages/ui/src/organisms/DocumentationSearch.tsx`
- [ ] T038 [P] Update documentation in `docs/` to mention search feature (if applicable)
- [ ] T039 [P] Verify build script runs correctly during `next build` and generates valid JSON index
- [ ] T040 [P] Test search index generation with all markdown files in `docs/` directory
- [ ] T041 [P] Validate search index JSON schema against `specs/004-documentation-search/contracts/search-index-schema.json`
- [ ] T042 [P] Implement runtime fallback in `apps/web/src/lib/search/documentation-search.ts` to parse markdown files if search index is missing (graceful degradation per FR-012)
- [ ] T043 [P] Add search term highlighting on destination documentation page after navigation (future enhancement - optional for MVP)

---

## Phase 7: E2E Testing (Critical User Flows)

**Purpose**: End-to-end tests for documentation search user flows per constitution requirements

- [ ] T044 [P] [US1] Create E2E test in `apps/web/e2e/features/documentation-search.spec.ts` for User Story 1: open search, enter query, verify results, navigate to page
- [ ] T045 [P] [US2] Create E2E test in `apps/web/e2e/features/documentation-search.spec.ts` for User Story 2: fuzzy matching, relevance ranking, highlighted snippets
- [ ] T046 [P] [US3] Create E2E test in `apps/web/e2e/features/documentation-search.spec.ts` for User Story 3: keyboard navigation, mobile accessibility, screen reader support

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete
- **E2E Testing (Phase 7)**: Depends on user stories being complete - validates end-to-end flows per constitution requirements

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. Core search functionality.
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Enhances US1 with ranking and highlighting. Can be implemented in parallel with US1 or after.
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances US1/US2 with accessibility. Can be implemented in parallel or after US1/US2.

### Within Each User Story

- Build script and service layer must be complete before UI components
- Search service must be complete before DocumentationSearch component
- Component structure before interaction handlers
- Core functionality before enhancements (highlighting, keyboard nav)
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup Phase**: T002 and T003 can run in parallel (different files)
- **Foundational Phase**: T005 and T006 can run in parallel (different files, no dependencies)
- **User Story 1**: T009-T017 can be worked on sequentially (component development)
- **User Story 2**: T018-T022 can be worked on in parallel with US1 completion (enhancements)
- **User Story 3**: T023-T031 can be worked on in parallel with US1/US2 (accessibility enhancements)
- **Polish Phase**: All tasks T032-T043 marked [P] can run in parallel (different concerns)
- **E2E Testing Phase**: All tasks T044-T046 marked [P] can run in parallel (different user stories)

---

## Parallel Example: User Story 1

```bash
# After Foundational phase, User Story 1 tasks run sequentially:
# Component creation → Integration → UI connection

# However, these can be prepared in parallel:
Task: "Create TypeScript interfaces" (T005) - can start immediately after T004
Task: "Create search service class" (T006) - can start after T005
```

---

## Parallel Example: User Story 2

```bash
# User Story 2 enhancements can be worked on in parallel:
Task: "Configure fuse.js weighted keys" (T018)
Task: "Add match highlighting utility" (T020)
Task: "Configure fuzzy matching settings" (T022)

# These don't conflict and can be developed simultaneously
```

---

## Parallel Example: User Story 3

```bash
# User Story 3 accessibility features can be worked on in parallel:
Task: "Implement keyboard navigation" (T023)
Task: "Add focus management" (T026)
Task: "Add screen reader support" (T030)
Task: "Add focus visible indicators" (T031)

# These are independent accessibility enhancements
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install dependencies)
2. Complete Phase 2: Foundational (build script, search service) - **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (basic search functionality)
4. **STOP and VALIDATE**: Test User Story 1 independently - search works, results display, navigation works
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (index generation + search service)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - basic search works!)
3. Add User Story 2 → Test independently → Deploy/Demo (enhanced with ranking + highlighting)
4. Add User Story 3 → Test independently → Deploy/Demo (full accessibility)
5. Add Polish → Final optimizations and error handling
6. Add E2E Tests → Validate all user flows end-to-end per constitution requirements

### Parallel Team Strategy

With multiple developers:

1. **Developer A**: Setup + Build script (T001-T004, T007-T008)
2. **Developer B**: Search service + Types (T005-T006) - can start after T001
3. Once Foundational is done:
   - **Developer A**: User Story 1 (T009-T017)
   - **Developer B**: User Story 2 (T018-T022) - can work in parallel
   - **Developer C**: User Story 3 (T023-T031) - can work in parallel
4. All developers: Polish phase (T032-T043) - parallel work
5. All developers: E2E Testing phase (T044-T046) - parallel work

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Build script must run during `next build` - verify in CI/CD
- Search index is generated at build time, served as static JSON
- Client-side search means no API endpoints needed
- Reuse existing `fuse.js` pattern from CommandPalette for consistency
- Verify search works with all 35 markdown files in `docs/` directory
- Test search performance: <200ms search execution, <100ms index load
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

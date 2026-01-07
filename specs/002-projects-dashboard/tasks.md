# Implementation Tasks: Projects Dashboard and Listing Page

**Feature Branch**: `002-projects-dashboard`  
**Created**: 2024-12-19  
**Status**: Ready for Implementation  
**Feature Spec**: `specs/002-projects-dashboard/spec.md`

## Overview

This document provides an actionable, dependency-ordered task breakdown for implementing the Projects Dashboard and Listing Page. Tasks are organized by user story priority (P1, P2) to enable independent implementation and testing.

**Total Tasks**: 33  
**MVP Scope**: Phase 1 (User Story 1)  
**Full Implementation**: All phases

## Implementation Strategy

### MVP First Approach

- **Phase 1**: Core projects listing page (User Story 1) - unblocks onboarding completion
- **Incremental Delivery**: Each user story phase is independently testable
- **Parallel Opportunities**: Tasks marked with [P] can be executed in parallel

### Task Format

Every task follows this strict format:

- `- [ ] [TaskID] [P?] [Story?] Description with file path`

Where:

- **TaskID**: Sequential number (T001, T002, T003...)
- **[P]**: Optional marker for parallelizable tasks
- **[Story]**: User story label (US1, US2) for story-specific tasks
- **Description**: Clear action with exact file path

---

## Phase 1: User Story 1 - Access Projects Dashboard After Onboarding (P1) 🎯 MVP

**Goal**: Enable users to complete onboarding and access a functional projects listing page where they can view all their projects and navigate to project-specific views.

**Independent Test**: Complete the onboarding flow, click "Go to Dashboard" on the completion page, and verify that the projects listing page loads correctly displaying all accessible projects. Test succeeds when the user can see their projects and navigate to individual project views.

**Dependencies**: Existing infrastructure (API, repository, auth) - no blocking setup needed

### Core Projects Listing Page

- [x] T001 [US1] Create projects listing page Server Component in apps/web/app/projects/page.tsx
- [x] T002 [US1] Implement authentication check using requireAuth middleware in apps/web/app/projects/page.tsx
- [x] T003 [US1] Fetch projects using projectRepository.findManyPaginated in apps/web/app/projects/page.tsx
- [x] T004 [US1] Add redirect to login for unauthenticated users in apps/web/app/projects/page.tsx

### Project Card Component

- [x] T005 [P] [US1] Create ProjectCard client component in apps/web/app/components/ProjectCard.tsx
- [x] T006 [US1] Display project name and key in ProjectCard component in apps/web/app/components/ProjectCard.tsx
- [x] T007 [US1] Add navigation to project board on card click in apps/web/app/components/ProjectCard.tsx
- [x] T008 [US1] Style ProjectCard with Tailwind CSS using existing design tokens in apps/web/app/components/ProjectCard.tsx

### Empty State Component

- [x] T009 [P] [US1] Create ProjectsEmptyState client component in apps/web/app/components/ProjectsEmptyState.tsx
- [x] T010 [US1] Display friendly empty state message in ProjectsEmptyState component in apps/web/app/components/ProjectsEmptyState.tsx
- [x] T011 [US1] Add call-to-action button linking to project creation in ProjectsEmptyState component in apps/web/app/components/ProjectsEmptyState.tsx

### Error Handling

- [x] T012 [P] [US1] Create error boundary component in apps/web/app/projects/error.tsx
- [x] T013 [US1] Implement retry functionality in error boundary in apps/web/app/projects/error.tsx
- [x] T014 [US1] Create loading state component in apps/web/app/projects/loading.tsx

### Integration

- [x] T015 [US1] Integrate ProjectCard components in projects listing page in apps/web/app/projects/page.tsx
- [x] T016 [US1] Integrate ProjectsEmptyState when no projects exist in apps/web/app/projects/page.tsx
- [x] T017 [US1] Verify onboarding completion redirect works to /projects route in apps/web/app/onboarding/complete/page.tsx

**Acceptance Criteria**:

- Projects listing page is accessible at `/projects` route
- Authentication redirect works correctly
- Projects are displayed in card layout
- Empty state shows when no projects exist
- Project cards navigate to project board on click
- Error states are handled gracefully
- Onboarding completion redirect works (no 404)

**Note on Quick Actions**: The spec's acceptance scenario 5 mentions "quick actions" - basic navigation (clicking project card to board) is covered in Phase 1 (T007). Enhanced quick actions (direct links to settings, etc.) are implemented in Phase 2 (T023) as they are nice-to-have enhancements.

---

## Phase 2: User Story 2 - Project Overview and Quick Navigation (P2)

**Goal**: Enhance the projects listing page with project statistics, improved navigation, and better project information display.

**Independent Test**: View the projects listing page with multiple projects, verify that project statistics (issue count, last activity) are displayed correctly, and confirm that navigation to different project views works from the listing page.

**Dependencies**: Phase 1 complete

### Enhanced Project Information

- [x] T018 [P] [US2] Add issue count calculation using Prisma \_count in apps/web/app/projects/page.tsx
- [x] T019 [US2] Display issue count on ProjectCard component in apps/web/components/ProjectCard.tsx
- [x] T020 [P] [US2] Add last activity timestamp formatting utility in apps/web/src/lib/utils/date.ts
- [x] T021 [US2] Display last activity timestamp on ProjectCard component in apps/web/components/ProjectCard.tsx
- [x] T022 [US2] Add project description display with truncation in ProjectCard component in apps/web/components/ProjectCard.tsx

### Enhanced Navigation

- [x] T023 [US2] Add quick access links to project settings in ProjectCard component in apps/web/components/ProjectCard.tsx
- [x] T024 [US2] Add keyboard navigation support for project cards in apps/web/components/ProjectCard.tsx

**Acceptance Criteria**:

- Issue count displays correctly for each project
- Last activity timestamp shows relative time (e.g., "2 hours ago")
- Project descriptions are displayed with proper truncation
- Quick access links work correctly
- Keyboard navigation works for all interactive elements

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, performance optimization, and accessibility enhancements.

**Dependencies**: Phase 1 complete (Phase 2 optional)

### Performance Optimization

- [x] T025 [P] Optimize project data fetching with proper pagination handling in apps/web/app/projects/page.tsx
- [x] T026 [P] Add caching headers for static project data if applicable

### Accessibility Enhancements

- [x] T027 [P] Ensure WCAG 2.1 AA compliance for project cards in apps/web/components/ProjectCard.tsx
- [x] T028 [P] Add screen reader labels for project cards in apps/web/components/ProjectCard.tsx
- [x] T029 [P] Verify keyboard navigation works for all interactive elements

### Error Handling Improvements

- [x] T030 [P] Enhance error messages with user-friendly text in apps/web/app/projects/error.tsx
- [x] T031 [P] Add error logging for debugging in apps/web/app/projects/page.tsx

### Edge Case Handling

- [x] T032 [P] Handle long project names with proper truncation and tooltip in ProjectCard component in apps/web/components/ProjectCard.tsx
- [x] T033 [P] Verify archived/deleted projects are filtered at repository level in apps/web/app/projects/page.tsx (add filter if not already handled)
- [x] T034 [P] Add pagination UI controls for users with 100+ projects (if API pagination is needed beyond default pageSize) in apps/web/app/projects/page.tsx
- [x] T035 [P] Document edge case handling decisions in apps/web/app/projects/page.tsx (many projects, long names, archived projects)

### Documentation

- [x] T036 [P] Update onboarding documentation to reference /projects route in docs/
- [x] T037 [P] Add component documentation comments in apps/web/components/ProjectCard.tsx

**Acceptance Criteria**:

- Page loads within 2 seconds for up to 20 projects
- All interactive elements are keyboard accessible
- Screen readers can navigate project cards
- Error states are clear and actionable
- Documentation is up to date

---

## Dependencies Graph

### User Story Completion Order

```
Phase 1: User Story 1 (Core Listing Page)
  └─> Phase 2: User Story 2 (Enhanced Features)
        └─> Phase 3: Polish & Cross-Cutting Concerns
```

### Story Dependencies

- **US1** (Core Listing): No dependencies on other stories - uses existing infrastructure
- **US2** (Enhanced Features): Depends on US1 (builds on core listing page)
- **Polish Phase**: Depends on US1 completion, US2 optional

### Parallel Execution Opportunities

**Within Phase 1 (US1)**:

- T005, T009, T012 can be parallelized (different components)
- T006-T008 can run in parallel after T005
- T010-T011 can run in parallel after T009
- T013-T014 can run in parallel after T012

**Within Phase 2 (US2)**:

- T018, T020 can be parallelized (different concerns)
- T019, T021, T022 can run in parallel after their dependencies

**Within Phase 3 (Polish)**:

- All tasks marked [P] can run in parallel

---

## Independent Test Criteria

### User Story 1 - Access Projects Dashboard After Onboarding

**Test**: Complete the onboarding flow, click "Go to Dashboard" on the completion page, and verify that the projects listing page loads correctly displaying all accessible projects.  
**Success**: User can see their projects, navigate to project views, and empty state displays when no projects exist.

### User Story 2 - Project Overview and Quick Navigation

**Test**: View the projects listing page with multiple projects, verify that project statistics (issue count, last activity) are displayed correctly, and confirm that navigation to different project views works from the listing page.  
**Success**: Project statistics display correctly, navigation works from listing page.

---

## MVP Scope Recommendation

**Suggested MVP**: Phase 1 (User Story 1) only

**Rationale**:

- User Story 1 unblocks the critical gap in onboarding completion
- Provides core functionality: projects listing, navigation, empty state
- Phase 2 enhancements can be added incrementally
- Quick to implement (17 tasks for MVP)

**MVP Deliverables**:

- ✅ Functional projects listing page at `/projects`
- ✅ Project cards with navigation
- ✅ Empty state handling
- ✅ Error boundaries
- ✅ Authentication protection
- ✅ Onboarding redirect works (no 404)

**Post-MVP Enhancements**:

- Issue count and last activity display (US2)
- Enhanced navigation options (US2)
- Performance optimizations (Polish)
- Accessibility improvements (Polish)

---

## Task Summary

**Total Tasks**: 37  
**Phase 1 (US1 - MVP)**: 17 tasks  
**Phase 2 (US2)**: 7 tasks  
**Phase 3 (Polish)**: 13 tasks (includes edge case handling and documentation)

**Note**: Edge case handling tasks (T032-T035) ensure robust handling of long names, archived projects, and large project lists. These can be implemented incrementally after MVP.

**Parallel Opportunities**: ~15 tasks marked with [P]

**Estimated Timeline**:

- **MVP (Phase 1)**: 1-2 days
- **Full Implementation (All Phases)**: 3-4 days

---

## Format Validation

✅ All tasks follow the strict checklist format:

- Checkbox: `- [ ]`
- Task ID: `T001`, `T002`, etc.
- Parallel marker: `[P]` where applicable
- Story label: `[US1]`, `[US2]` for story-specific tasks
- Description with file path: Every task includes exact file path

✅ All tasks are organized by user story to enable independent implementation

✅ Each phase includes independent test criteria

✅ Dependencies are clearly identified

✅ Parallel execution opportunities are marked

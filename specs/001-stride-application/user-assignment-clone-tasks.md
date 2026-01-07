# Implementation Tasks: User Assignment & Issue Clone Features

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-XX  
**Status**: Ready for Implementation  
**Related Plan**: `specs/001-stride-application/user-assignment-clone-plan.md`  
**Related Spec**: `specs/001-stride-application/spec.md` (Enhancement to User Story 2)

## Overview

This document provides actionable, dependency-ordered tasks for implementing user assignment and issue clone features as enhancements to the existing issue management functionality.

**Total Tasks**: 22  
**Feature 1**: User Assignment (Tasks T459-T471, 13 tasks)  
**Feature 2**: Issue Clone (Tasks T472-T480, 9 tasks)  
**Dependencies**: Requires existing issue management functionality (User Story 2) to be complete

## Implementation Strategy

### Enhancement Approach

These features enhance existing User Story 2 (Issue Creation and Management):
- **User Assignment**: Adds assignee selection to issue create/edit forms
- **Issue Clone**: Adds clone functionality to issue detail pages

Both features can be implemented independently and do not require changes to existing functionality.

### Task Format

Every task follows this strict format:

- `- [ ] [TaskID] [P?] [Enhancement] Description with file path`

Where:
- **TaskID**: Sequential number (T459, T460, T461...)
- **[P]**: Optional marker for parallelizable tasks
- **[Enhancement]**: Label indicating this is an enhancement (ENH1 for User Assignment, ENH2 for Issue Clone)
- **Description**: Clear action with exact file path

---

## Phase 1: User Assignment Feature (ENH1)

**Goal**: Add assignee dropdown field to issue creation and editing forms, allowing users to assign issues to team members.

**Independent Test**: Create or edit an issue, select a user from the assignee dropdown, save the issue, and verify the assignee is correctly stored and displayed. Test succeeds when:
- Assignee dropdown appears in create/edit forms
- User can select from list of all system users
- Selected assignee persists after save
- Assignee displays correctly in issue detail view

### API Endpoint

- [ ] T459 [P] [ENH1] Create GET /api/users endpoint in apps/web/app/api/users/route.ts
- [ ] T460 [ENH1] Implement authentication check in apps/web/app/api/users/route.ts
- [ ] T461 [ENH1] Implement user list query (select id, username, name, avatarUrl, role) in apps/web/app/api/users/route.ts
- [ ] T462 [ENH1] Add error handling (401, 500) and response formatting in apps/web/app/api/users/route.ts

### Component Updates

- [ ] T463 [P] [ENH1] Add users prop to IssueFormProps interface in packages/ui/src/organisms/IssueForm.tsx
- [ ] T464 [ENH1] Add assignee dropdown field after Priority field in packages/ui/src/organisms/IssueForm.tsx
- [ ] T465 [ENH1] Implement user display format (name (username) or username) in assignee dropdown in packages/ui/src/organisms/IssueForm.tsx
- [ ] T466 [ENH1] Add "Unassigned" option to assignee dropdown in packages/ui/src/organisms/IssueForm.tsx

### Integration

- [ ] T467 [P] [ENH1] Add user fetching in CreateIssueModal component in apps/web/src/components/CreateIssueModal.tsx
- [ ] T468 [ENH1] Pass users prop to IssueForm in CreateIssueModal in apps/web/src/components/CreateIssueModal.tsx
- [ ] T469 [ENH1] Add user fetching in IssueDetail edit mode in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [ ] T470 [ENH1] Pass users prop to IssueForm when editing in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [ ] T471 [ENH1] Update IssueDetail display to show assignee name/username instead of ID in packages/ui/src/organisms/IssueDetail.tsx

**Checkpoint**: User assignment feature complete - users can assign issues from create/edit forms

---

## Phase 2: Issue Clone Feature (ENH2)

**Goal**: Add clone functionality that opens create modal prefilled with issue data, allowing users to quickly create similar issues.

**Independent Test**: Open an existing issue detail page, click "Clone" button, verify create modal opens with all relevant fields prefilled (excluding metadata), edit if desired, save new issue. Test succeeds when:
- Clone button appears on issue detail pages
- Clicking clone opens create modal
- Modal is prefilled with issue data (title, description, type, priority, status, assigneeId, cycleId, storyPoints, customFields)
- New issue gets new key and current user as reporter
- Metadata fields (id, key, timestamps) are excluded

### Component Updates

- [ ] T472 [P] [ENH2] Add onClone callback prop to IssueDetailProps interface in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T473 [ENH2] Add Clone button next to Edit button in IssueDetail header in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T474 [ENH2] Style Clone button as ghost variant in packages/ui/src/organisms/IssueDetail.tsx

### Clone Handler

- [ ] T475 [P] [ENH2] Create clone handler function in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [ ] T476 [ENH2] Map issue data to CreateIssueInput excluding metadata (id, key, createdAt, updatedAt, closedAt, reporterId) in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [ ] T477 [ENH2] Open CreateIssueModal with prefilled initialValues in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [ ] T478 [ENH2] Pass clone handler to IssueDetail component via onClone prop in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx

### Modal Enhancement

- [ ] T479 [ENH2] Support initialValues prop in CreateIssueModal for prefilling form in apps/web/src/components/CreateIssueModal.tsx
- [ ] T480 [ENH2] Pass initialValues to IssueForm when provided in CreateIssueModal in apps/web/src/components/CreateIssueModal.tsx

**Checkpoint**: Issue clone feature complete - users can clone issues with prefilled data

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (User Assignment)**: Can be implemented independently after User Story 2 (Issue Creation and Management) is complete
- **Phase 2 (Issue Clone)**: Can be implemented independently after User Story 2 (Issue Creation and Management) is complete
- **Both phases**: Can be implemented in parallel if desired

### Task Dependencies

**Phase 1 - User Assignment**:
- T459-T462 (API endpoint): Can be done in parallel, but all must complete before component integration
- T463-T466 (Component updates): T463 must complete before T464-T466
- T467-T471 (Integration): Requires API endpoint (T459-T462) and component updates (T463-T466) to be complete

**Phase 2 - Issue Clone**:
- T472-T474 (Component updates): Can be done in parallel
- T475-T478 (Clone handler): T476 depends on understanding CreateIssueInput structure
- T479-T480 (Modal enhancement): Can be done in parallel with T475-T478

### Parallel Opportunities

- **API endpoint tasks** (T459-T462): T459 and T461 can be worked on in parallel
- **Component prop additions** (T463, T472): Can be done in parallel (different files)
- **Component field additions** (T464-T466, T473-T474): Can be done in parallel after props are added
- **Integration tasks** (T467-T471, T475-T480): Some can be done in parallel (different files/components)

### Integration Points

- **Existing IssueForm**: Already supports assigneeId in schema, just needs UI field
- **Existing CreateIssueModal**: Already exists, needs initialValues support for clone
- **Existing Issue Detail Page**: Already exists, needs clone handler
- **Existing API**: Already accepts assigneeId in create/update endpoints

---

## Implementation Strategy

### Incremental Delivery

1. **Step 1**: Implement User Assignment (Phase 1)
   - Complete API endpoint (T459-T462)
   - Add assignee field to form (T463-T466)
   - Integrate into create/edit flows (T467-T471)
   - Test independently

2. **Step 2**: Implement Issue Clone (Phase 2)
   - Add clone button (T472-T474)
   - Implement clone handler (T475-T478)
   - Enhance modal for prefilling (T479-T480)
   - Test independently

### Parallel Team Strategy

With multiple developers:

- **Developer A**: User Assignment API (T459-T462) → Component updates (T463-T466) → Integration (T467-T471)
- **Developer B**: Issue Clone component updates (T472-T474) → Clone handler (T475-T478) → Modal enhancement (T479-T480)

Both features are independent and can be developed in parallel.

---

## Testing Considerations

### User Assignment Tests

- Unit test: User list API endpoint returns correct format
- Integration test: Assignee selection persists through create/update flow
- E2E test: Complete user assignment workflow (select assignee, save, verify display)

### Issue Clone Tests

- Unit test: Clone data mapping excludes metadata correctly
- Integration test: Clone opens modal with correct prefilled data
- E2E test: Complete clone workflow (clone, edit, save, verify new issue)

---

## Notes

- Both features enhance existing functionality without breaking changes
- All existing issue management features continue to work
- No database schema changes required (assigneeId already exists)
- User list endpoint is simple (no pagination needed for small teams)
- Clone functionality reuses existing CreateIssueModal component (DRY)
- Tasks are numbered starting from T459 to continue from existing tasks.md
- Each phase is independently testable and deployable


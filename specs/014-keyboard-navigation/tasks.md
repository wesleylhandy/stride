# Implementation Tasks: Keyboard Navigation & Hotkeys Expansion

**Feature Branch**: `014-keyboard-navigation`  
**Created**: 2025-01-27  
**Status**: Ready for Implementation  
**Feature Spec**: `specs/014-keyboard-navigation/spec.md`

## Overview

This document provides an actionable, dependency-ordered task breakdown for implementing keyboard navigation and hotkeys throughout Stride. Tasks are organized by user story priority (P1, P2, P3) to enable independent implementation and testing.

**Total Tasks**: 84  
**MVP Scope**: Phase 1-4 (User Stories 1-3, P1 priority)  
**Full Implementation**: All phases

## Implementation Strategy

### MVP First Approach

- **Phase 1**: Foundational infrastructure (keyboard hook and utilities) - enables all other phases
- **Phase 2-4**: Core keyboard interactions (User Stories 1-3, P1) - fundamental accessibility and productivity
- **Incremental Delivery**: Each user story phase is independently testable
- **Parallel Opportunities**: Tasks marked with [P] can be executed in parallel

### Task Format

Every task follows this strict format:

- `- [ ] [TaskID] [P?] [Story?] Description with file path`

Where:

- **TaskID**: Sequential number (T001, T002, T003...)
- **[P]**: Optional marker for parallelizable tasks
- **[Story]**: User story label (US1, US2, etc.) for story-specific tasks
- **Description**: Clear action with exact file path

---

## Phase 1: Foundational Infrastructure

**Goal**: Create reusable keyboard shortcut hook and utility functions that all other phases depend on.

**Dependencies**: None (foundational phase)

**Independent Test**: Import and use `useKeyboardShortcut` hook in a test component, verify it responds to key presses and handles cleanup correctly.

### Core Keyboard Hook

- [ ] T001 Create useKeyboardShortcut hook in apps/web/src/hooks/useKeyboardShortcut.ts
- [ ] T002 Implement keyboard event listener registration in apps/web/src/hooks/useKeyboardShortcut.ts
- [ ] T003 Implement event listener cleanup on unmount in apps/web/src/hooks/useKeyboardShortcut.ts
- [ ] T004 Add input field detection utility function in apps/web/src/hooks/useKeyboardShortcut.ts
- [ ] T005 Add key matching logic (supports single keys and modifiers) in apps/web/src/hooks/useKeyboardShortcut.ts
- [ ] T006 Add TypeScript types for keyboard shortcut options in apps/web/src/hooks/useKeyboardShortcut.ts

### Utility Functions

- [ ] T007 [P] Create isInputFocused utility function in apps/web/src/lib/utils/keyboard.ts
- [ ] T008 [P] Create matchesKey utility function in apps/web/src/lib/utils/keyboard.ts
- [ ] T009 [P] Create getContextFromRoute utility function in apps/web/src/lib/utils/route-context.ts
- [ ] T082 [P] Create focus indicator design pattern/styling utilities in apps/web/src/lib/utils/focus-indicators.ts or packages/ui/src/utils/focus.ts

**Acceptance Criteria**:
- Hook can be imported and used in components
- Hook responds to specified key combinations
- Hook cleans up event listeners on unmount
- Hook respects disabledInInputs option
- Utility functions handle edge cases correctly

---

## Phase 2: User Story 1 - Activate Issue Cards with Keyboard (P1) 🎯 MVP

**Goal**: Enable users to activate issue cards using Enter or Space key when cards are focused, providing fundamental keyboard accessibility.

**Independent Test**: Tab to an issue card on Kanban board or issues list, press Enter or Space, verify issue detail page opens. Test succeeds when cards can be activated entirely via keyboard without mouse.

**Dependencies**: Phase 1 complete

### IssueCard Component Enhancement

- [ ] T010 [US1] Add onKeyDown handler to IssueCard component in packages/ui/src/molecules/IssueCard.tsx
- [ ] T011 [US1] Handle Enter key activation in IssueCard onKeyDown handler in packages/ui/src/molecules/IssueCard.tsx
- [ ] T012 [US1] Handle Space key activation in IssueCard onKeyDown handler in packages/ui/src/molecules/IssueCard.tsx
- [ ] T013 [US1] Prevent default browser behavior for Enter/Space in IssueCard handler in packages/ui/src/molecules/IssueCard.tsx
- [ ] T014 [US1] Add aria-keyshortcuts attribute to IssueCard in packages/ui/src/molecules/IssueCard.tsx

**Acceptance Criteria**:
- Issue cards can be activated with Enter key
- Issue cards can be activated with Space key
- Browser default behavior is prevented
- Issue detail page opens on activation
- Works on both Kanban board and issues list views
- ARIA attributes are present for accessibility

---

## Phase 3: User Story 2 - Navigate Issues List with Arrow Keys (P1) 🎯 MVP

**Goal**: Enable users to navigate through issues list using arrow keys for efficient keyboard-based browsing.

**Independent Test**: Navigate to issues list page, use Up/Down arrow keys to move between issues, press Enter to open selected issue, press Escape to clear focus. Test succeeds when list navigation works entirely via keyboard.

**Dependencies**: Phase 1 complete

### Issues List Page Enhancement

- [ ] T015 [US2] Create client component wrapper for issues list in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T016 [US2] Add focusedIndex state for list navigation in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T017 [US2] Create refs array for issue list items in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T018 [US2] Implement Down arrow key handler for next issue in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T019 [US2] Implement Up arrow key handler for previous issue in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T020 [US2] Implement Enter key handler to open focused issue in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T021 [US2] Implement Escape key handler to clear focus in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T022 [US2] Add focus management with scrollIntoView for focused item in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T023 [US2] Add visual focus indicator styles for focused issue in apps/web/app/projects/[projectId]/issues/page.tsx
- [ ] T024 [US2] Handle edge case: no issues in list (arrow keys have no effect) in apps/web/app/projects/[projectId]/issues/page.tsx

**Acceptance Criteria**:
- Down arrow moves focus to next issue
- Up arrow moves focus to previous issue
- Enter opens the focused issue detail page
- Escape clears focus and returns to page level
- Focused issue has visible focus indicator
- Focus scrolls into view when navigating
- Empty list handles arrow keys gracefully

---

## Phase 4: User Story 3 - Quick Actions on Issue Detail Page (P1) 🎯 MVP

**Goal**: Provide keyboard shortcuts for common issue detail page actions (edit, status, clone, link) to improve productivity.

**Independent Test**: Open issue detail page, press E to edit, S for status, C to clone, L to link, Cmd/Ctrl+S to save (in edit mode), Escape to cancel. Test succeeds when all shortcuts trigger correct actions.

**Dependencies**: Phase 1 complete

### Issue Detail Page Shortcuts

- [ ] T025 [US3] Add E key shortcut for edit mode in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T026 [US3] Add S key shortcut for status change picker in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T027 [US3] Add C key shortcut for clone modal in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T028 [US3] Add L key shortcut for link modal in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T029 [US3] Add Cmd/Ctrl+S shortcut for save (when in edit mode) in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T030 [US3] Add Escape key handler for cancel edit/close modals in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T031 [US3] Ensure shortcuts are disabled when typing in input fields in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T032 [US3] Add permission check with toast notification for unauthorized actions in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T033 [US3] Add aria-keyshortcuts attributes for all shortcuts in packages/ui/src/organisms/IssueDetail.tsx

**Acceptance Criteria**:
- E key enters edit mode
- S key opens status change picker
- C key opens clone modal
- L key opens link modal
- Cmd/Ctrl+S saves changes in edit mode
- Escape cancels edit or closes modals
- Shortcuts don't trigger when typing in inputs
- Permission denials show toast notification
- All shortcuts have ARIA attributes

---

## Phase 5: User Story 4 - Kanban Board Quick Actions (P2)

**Goal**: Enable keyboard shortcuts for quick actions on Kanban board (open issue, move between statuses, focus search).

**Independent Test**: Focus issue card on Kanban board, press Enter to open, Right/Left arrows to move between statuses, F to focus filter, Cmd/Ctrl+F to focus search. Test succeeds when all shortcuts work as expected.

**Dependencies**: Phase 1-2 complete (IssueCard activation from Phase 2)

### Kanban Board Shortcuts

- [ ] T034 [US4] Add Enter key shortcut to open issue detail from focused card in packages/ui/src/organisms/KanbanBoard.tsx
- [ ] T035 [US4] Add Right arrow key handler to move issue to next status column in packages/ui/src/organisms/KanbanBoard.tsx
- [ ] T036 [US4] Add Left arrow key handler to move issue to previous status column in packages/ui/src/organisms/KanbanBoard.tsx
- [ ] T037 [US4] Validate status transitions before moving (use existing validation) in packages/ui/src/organisms/KanbanBoard.tsx
- [ ] T038 [US4] Add F key shortcut to focus filter/search input in packages/ui/src/organisms/KanbanBoard.tsx
- [ ] T039 [US4] Add Cmd/Ctrl+F shortcut to focus search input (override browser default in board context) in packages/ui/src/organisms/KanbanBoard.tsx
- [ ] T040 [US4] Handle edge case: no next/previous status (arrow keys have no effect) in packages/ui/src/organisms/KanbanBoard.tsx
- [ ] T041 [US4] Add visual feedback for invalid status transitions in packages/ui/src/organisms/KanbanBoard.tsx

**Acceptance Criteria**:
- Enter opens issue detail from focused card
- Right arrow moves to next status (if valid transition)
- Left arrow moves to previous status (if valid transition)
- F key focuses filter/search input
- Cmd/Ctrl+F focuses search input (overrides browser default on board)
- Invalid transitions show validation feedback
- Edge cases handled gracefully

---

## Phase 6: User Story 5 - Expanded Command Palette with Context-Aware Commands (P2)

**Goal**: Make command palette context-aware by showing relevant commands based on current route/URL path.

**Independent Test**: Open command palette from issue detail page, verify issue-specific commands appear. Open from board, verify board-specific commands appear. Open from anywhere, verify global commands appear. Test succeeds when commands are filtered correctly by context.

**Dependencies**: Phase 1 complete

### Context-Aware Command Registration

- [ ] T042 [US5] Create context-registry utility for route-based context detection in apps/web/src/lib/commands/context-registry.ts
- [ ] T043 [US5] Implement getContextFromRoute function with route pattern matching in apps/web/src/lib/commands/context-registry.ts
- [ ] T044 [US5] Add contexts property to Command interface in packages/ui/src/organisms/CommandPalette.tsx
- [ ] T045 [US5] Create issue-actions commands file with issue-specific commands in apps/web/src/lib/commands/issue-actions.ts
- [ ] T046 [US5] Create board-actions commands file with board-specific commands in apps/web/src/lib/commands/board-actions.ts
- [ ] T047 [US5] Register issue-specific commands (Edit, Status, Clone, Link) in apps/web/src/lib/commands/issue-actions.ts
- [ ] T048 [US5] Register board-specific commands (Filter by Status, Filter by Assignee, Create Issue, Switch to List) in apps/web/src/lib/commands/board-actions.ts
- [ ] T049 [US5] Modify CommandPaletteProvider to filter commands by current route context in apps/web/src/components/CommandPaletteProvider.tsx
- [ ] T050 [US5] Update command registration to include context patterns in apps/web/src/components/CommandPaletteProvider.tsx

**Acceptance Criteria**:
- Command palette shows issue-specific commands on issue detail page
- Command palette shows board-specific commands on board page
- Command palette shows global commands everywhere
- Commands are filtered correctly by route pattern
- Existing command palette functionality still works
- Context detection is accurate

---

## Phase 7: User Story 6 - Sprint Planning Keyboard Shortcuts (P2)

**Goal**: Enable keyboard shortcuts for sprint planning actions (assign/remove issues, navigate between sections).

**Independent Test**: Navigate to sprint planning, focus issue in backlog, press A to assign. Focus issue in sprint, press R to remove. Press Tab to move between sections, Up/Down arrows to navigate within section. Test succeeds when all shortcuts work correctly.

**Dependencies**: Phase 1 complete

### Sprint Planning Shortcuts

- [ ] T051 [US6] Add A key shortcut to assign issue from backlog to sprint in packages/ui/src/organisms/SprintPlanning.tsx
- [ ] T052 [US6] Add R key shortcut to remove issue from sprint in packages/ui/src/organisms/SprintPlanning.tsx
- [ ] T053 [US6] Add Tab key handler to navigate between backlog and sprint sections in packages/ui/src/organisms/SprintPlanning.tsx
- [ ] T054 [US6] Add Up/Down arrow key handlers for issue navigation within each section in packages/ui/src/organisms/SprintPlanning.tsx
- [ ] T055 [US6] Implement focus management for section navigation in packages/ui/src/organisms/SprintPlanning.tsx
- [ ] T056 [US6] Handle edge case: empty backlog or sprint (navigation has no effect) in packages/ui/src/organisms/SprintPlanning.tsx
- [ ] T057 [US6] Add visual focus indicators for focused issues in packages/ui/src/organisms/SprintPlanning.tsx

**Acceptance Criteria**:
- A key assigns focused issue from backlog to sprint
- R key removes focused issue from sprint
- Tab moves focus between backlog and sprint sections
- Up/Down arrows navigate issues within current section
- Focus indicators are visible
- Edge cases handled gracefully

---

## Phase 8: User Story 7 - Keyboard Shortcuts Help and Discovery (P3)

**Goal**: Provide discoverable keyboard shortcuts through a help modal accessible via ? key.

**Independent Test**: Press ? key from any page, verify help modal opens showing shortcuts grouped by category and filtered by context. Press Escape or click outside to close. Test succeeds when all shortcuts are discoverable through help modal.

**Dependencies**: Phase 1, Phase 6 (for context detection and command context)

### Help Modal Component

- [ ] T058 [US7] Create KeyboardShortcutsHelp component in apps/web/src/components/KeyboardShortcutsHelp.tsx
- [ ] T059 [US7] Add ? key shortcut to open help modal globally in apps/web/src/components/KeyboardShortcutsHelp.tsx
- [ ] T060 [US7] Implement context-aware shortcut filtering for help modal in apps/web/src/components/KeyboardShortcutsHelp.tsx
- [ ] T061 [US7] Group shortcuts by category (Navigation, Actions, Global) in apps/web/src/components/KeyboardShortcutsHelp.tsx
- [ ] T062 [US7] Add Escape key and click-outside handlers to close modal in apps/web/src/components/KeyboardShortcutsHelp.tsx
- [ ] T063 [US7] Style help modal with keyboard shortcut display (kbd elements) in apps/web/src/components/KeyboardShortcutsHelp.tsx
- [ ] T064 [US7] Integrate help modal into app layout or CommandPaletteProvider in apps/web/src/components/CommandPaletteProvider.tsx

**Acceptance Criteria**:
- ? key opens help modal from any page
- Help modal shows shortcuts filtered by current context
- Shortcuts are grouped by category
- Modal closes with Escape or click outside
- Keyboard shortcuts are displayed with proper formatting
- Modal is accessible (focus trap, ARIA attributes)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, accessibility enhancements, edge case handling, and documentation.

**Dependencies**: All user story phases complete

### Accessibility Enhancements

- [ ] T065 [P] Verify all keyboard shortcuts have aria-keyshortcuts attributes across all components
- [ ] T066 [P] Test keyboard navigation with screen readers (NVDA, JAWS, VoiceOver) for all features
- [ ] T067 [P] Apply focus indicator design pattern consistently across all components using T082 utilities
- [ ] T068 [P] Verify focus trapping works correctly in all modals opened via keyboard shortcuts and that focus returns to trigger element on close (FR-020)

### Performance Optimization

- [ ] T069 [P] Verify keyboard event handlers don't cause unnecessary re-renders (use useCallback where needed)
- [ ] T070 [P] Test keyboard shortcut response time (should be <50ms) across all shortcuts
- [ ] T071 [P] Optimize context detection with memoization if route checks are expensive

### Edge Case Handling

- [ ] T072 [P] Handle keyboard shortcuts on mobile devices (only active with physical keyboard) in apps/web/src/hooks/useKeyboardShortcut.ts
- [ ] T073 [P] Verify browser shortcut conflicts are handled correctly in all contexts
- [ ] T074 [P] Test rapid key presses to ensure no race conditions or double-triggers
- [ ] T075 [P] Handle edge case: user switches tabs/apps while holding modifier keys

### Documentation & Testing

- [ ] T076 [P] Update user documentation with keyboard shortcuts guide in docs/user/README.md
- [ ] T077 [P] Add E2E tests for keyboard navigation flows in apps/web/e2e/keyboard-navigation.spec.ts
- [ ] T078 [P] Add unit tests for useKeyboardShortcut hook in apps/web/src/hooks/__tests__/useKeyboardShortcut.test.ts
- [ ] T079 [P] Add component tests for keyboard handlers in relevant component test files
- [ ] T083 [P] Implement analytics tracking for keyboard shortcut usage (track events for SC-004 metrics) in apps/web/src/lib/analytics/keyboard-shortcuts.ts

### Error Handling

- [ ] T080 [P] Add error boundaries for keyboard shortcut handlers with graceful fallbacks
- [ ] T081 [P] Log keyboard shortcut errors for debugging (development mode only)

### Verification & Validation

- [ ] T084 [P] Verify all keyboard actions have mouse/touch alternatives (FR-018) - audit all shortcuts to ensure UI buttons/controls still accessible

**Acceptance Criteria**:
- All shortcuts meet accessibility requirements
- Performance targets met (<50ms response time)
- All edge cases handled gracefully
- Documentation updated
- Test coverage adequate
- Error handling robust

---

## Dependency Graph

```
Phase 1 (Foundation)
    ↓
Phase 2 (US1) ← Phase 1
Phase 3 (US2) ← Phase 1
Phase 4 (US3) ← Phase 1
    ↓
Phase 5 (US4) ← Phase 1, Phase 2
Phase 6 (US5) ← Phase 1
Phase 7 (US6) ← Phase 1
    ↓
Phase 8 (US7) ← Phase 1, Phase 6
    ↓
Phase 9 (Polish) ← All previous phases
```

## Parallel Execution Examples

### Within Phase 2 (US1):
- T010-T014 can be implemented together (all modify same file)

### Within Phase 3 (US2):
- T018-T021 can be implemented in parallel (different handlers)
- T022-T024 can be implemented after handlers (focus management)

### Within Phase 4 (US3):
- T025-T030 can be implemented in parallel (different shortcuts)
- T031-T033 can be implemented after shortcuts (polish)

### Within Phase 6 (US5):
- T042-T044 can be implemented in parallel (context infrastructure)
- T045-T050 can be implemented in parallel (command registration)

### Within Phase 9 (Polish):
- All tasks marked [P] can be implemented in parallel (independent improvements)

## MVP Scope Recommendation

**Recommended MVP**: Phases 1-4 (Foundational + User Stories 1-3)

This provides:
- Core keyboard accessibility (issue card activation)
- List navigation with arrow keys
- Quick actions on issue detail page

These three user stories deliver the most value and are fundamental accessibility requirements. Subsequent phases enhance the experience but are not critical for basic keyboard navigation support.

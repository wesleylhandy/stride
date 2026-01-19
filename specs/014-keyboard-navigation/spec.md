# Feature Specification: Keyboard Navigation & Hotkeys Expansion

**Feature Branch**: `014-keyboard-navigation`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Lets turn #KEYBOARD_NAVIGATION_ANALYSIS.md into a new specification. We will probably need some clarifications to make this smooth and useful. The next spec should be numbered 014"

## User Scenarios & Testing

### User Story 1 - Activate Issue Cards with Keyboard (Priority: P1)

As a power user, I want to activate issue cards using keyboard keys (Enter or Space) so that I can navigate and interact with issues without using a mouse.

**Why this priority**: This is a fundamental accessibility requirement and affects all issue interactions. Users can currently focus cards but cannot activate them, creating a broken keyboard navigation experience.

**Independent Test**: Can be fully tested by tabbing to an issue card and pressing Enter or Space to verify the card opens the issue detail page. This delivers immediate keyboard accessibility for the most common user action.

**Acceptance Scenarios**:

1. **Given** a user is viewing a Kanban board or issues list, **When** they tab to focus an issue card and press Enter, **Then** the issue detail page opens
2. **Given** a user is viewing a Kanban board or issues list, **When** they tab to focus an issue card and press Space, **Then** the issue detail page opens
3. **Given** a user is focused on an issue card, **When** they press Enter or Space, **Then** the default browser behavior is prevented and only the card action occurs

---

### User Story 2 - Navigate Issues List with Arrow Keys (Priority: P1)

As a user, I want to navigate through the issues list using arrow keys so that I can quickly browse and select issues without using a mouse.

**Why this priority**: The issues list is a core navigation pattern. Without keyboard navigation, users must click through every issue, which is inefficient and inaccessible.

**Independent Test**: Can be fully tested by navigating to the issues list page and using arrow keys to move between issues, then pressing Enter to open the selected issue. This delivers efficient keyboard-based issue browsing.

**Acceptance Scenarios**:

1. **Given** a user is on the issues list page, **When** they press the Down arrow key, **Then** focus moves to the next issue in the list
2. **Given** a user is on the issues list page, **When** they press the Up arrow key, **Then** focus moves to the previous issue in the list
3. **Given** a user has navigated to an issue using arrow keys, **When** they press Enter, **Then** the issue detail page opens
4. **Given** a user is navigating the issues list, **When** they press Escape, **Then** focus is cleared and returns to the page level
5. **Given** a user is navigating the issues list, **Then** the currently focused issue has a visible focus indicator

---

### User Story 3 - Quick Actions on Issue Detail Page (Priority: P1)

As a user, I want to perform common actions on the issue detail page using keyboard shortcuts so that I can work more efficiently without switching between keyboard and mouse.

**Why this priority**: The issue detail page is where users spend significant time. Keyboard shortcuts for common actions (edit, status change, clone, link) dramatically improve productivity for power users.

**Independent Test**: Can be fully tested by opening an issue detail page and using keyboard shortcuts (E for edit, S for status, C for clone, L for link) to verify each action is triggered. This delivers efficient keyboard-based issue management.

**Acceptance Scenarios**:

1. **Given** a user is viewing an issue detail page, **When** they press the E key, **Then** the issue enters edit mode
2. **Given** a user is viewing an issue detail page, **When** they press the S key, **Then** the status change picker opens
3. **Given** a user is viewing an issue detail page, **When** they press the C key, **Then** the clone issue modal opens
4. **Given** a user is viewing an issue detail page, **When** they press the L key, **Then** the link issue modal opens
5. **Given** a user is in edit mode on an issue detail page, **When** they press Cmd/Ctrl+S, **Then** the changes are saved
6. **Given** a user is in edit mode or has a modal open, **When** they press Escape, **Then** edit mode is cancelled or the modal closes

---

### User Story 4 - Kanban Board Quick Actions (Priority: P2)

As a power user, I want to perform quick actions on focused issue cards in the Kanban board using keyboard shortcuts so that I can manage issues efficiently without dragging and dropping.

**Why this priority**: While drag-and-drop works, keyboard shortcuts provide faster alternatives for power users who prefer keyboard navigation. This improves workflow efficiency for users managing many issues.

**Independent Test**: Can be fully tested by focusing an issue card on the Kanban board and using keyboard shortcuts (Enter to open, arrow keys to move between statuses) to verify actions work. This delivers keyboard-based issue management on the board.

**Acceptance Scenarios**:

1. **Given** a user has focused an issue card on the Kanban board, **When** they press Enter, **Then** the issue detail page opens
2. **Given** a user has focused an issue card on the Kanban board, **When** they press the Right arrow key, **Then** the issue moves to the next status column (if transition is valid)
3. **Given** a user has focused an issue card on the Kanban board, **When** they press the Left arrow key, **Then** the issue moves to the previous status column (if transition is valid)
4. **Given** a user is on the Kanban board, **When** they press the F key, **Then** focus moves to the filter/search input
5. **Given** a user is on the Kanban board, **When** they press Cmd/Ctrl+F, **Then** focus moves to the search input within the board

---

### User Story 5 - Expanded Command Palette with Context-Aware Commands (Priority: P2)

As a user, I want the command palette to show contextually relevant commands based on the current page so that I can quickly access actions without navigating through menus.

**Why this priority**: The command palette infrastructure exists but is underutilized. Context-aware commands make the palette more powerful and discoverable, improving the overall keyboard-first experience.

**Independent Test**: Can be fully tested by opening the command palette (Cmd/Ctrl+K) from different pages and verifying that relevant commands appear based on context. This delivers a more intelligent and useful command palette.

**Acceptance Scenarios**:

1. **Given** a user is on the issue detail page, **When** they open the command palette, **Then** issue-specific commands appear (Edit Issue, Change Status, Clone Issue, Link Issue)
2. **Given** a user is on the Kanban board, **When** they open the command palette, **Then** board-specific commands appear (Filter by Status, Filter by Assignee, Create Issue, Switch to List View)
3. **Given** a user is anywhere in the application, **When** they open the command palette, **Then** global commands appear (Search Issues, Go to Sprint Planning, View Settings)
4. **Given** a user opens the command palette, **When** they type to search, **Then** commands are filtered using fuzzy search
5. **Given** a user selects a command from the palette, **When** they press Enter, **Then** the command executes and the palette closes

---

### User Story 6 - Sprint Planning Keyboard Shortcuts (Priority: P2)

As a user, I want to assign and remove issues from sprints using keyboard shortcuts so that I can plan sprints more efficiently.

**Why this priority**: Sprint planning involves repetitive actions (assign/remove issues). Keyboard shortcuts reduce the time and effort required for sprint planning sessions.

**Independent Test**: Can be fully tested by navigating to sprint planning, focusing an issue, and using keyboard shortcuts (A to assign, R to remove) to verify actions work. This delivers efficient keyboard-based sprint planning.

**Acceptance Scenarios**:

1. **Given** a user has focused an issue in the backlog, **When** they press the A key, **Then** the issue is assigned to the sprint
2. **Given** a user has focused an issue in the sprint, **When** they press the R key, **Then** the issue is removed from the sprint
3. **Given** a user is on the sprint planning page, **When** they press Tab, **Then** focus moves between the backlog and sprint sections
4. **Given** a user is in the backlog or sprint section, **When** they press Up/Down arrow keys, **Then** focus moves between issues within that section

---

### User Story 7 - Keyboard Shortcuts Help and Discovery (Priority: P3)

As a user, I want to discover available keyboard shortcuts through a help modal so that I can learn and remember shortcuts without referring to documentation.

**Why this priority**: Keyboard shortcuts are only useful if users know they exist. A help modal improves discoverability and helps users learn the keyboard-first workflow.

**Independent Test**: Can be fully tested by pressing the ? key from any page and verifying a help modal opens showing available keyboard shortcuts for that context. This delivers discoverability for keyboard features.

**Acceptance Scenarios**:

1. **Given** a user is on any page, **When** they press the ? key, **Then** a keyboard shortcuts help modal opens
2. **Given** the keyboard shortcuts help modal is open, **Then** it displays shortcuts relevant to the current page/context
3. **Given** the keyboard shortcuts help modal is open, **When** they press Escape or click outside, **Then** the modal closes
4. **Given** the keyboard shortcuts help modal is open, **Then** shortcuts are grouped by category (Navigation, Actions, etc.)

---

### Edge Cases

- What happens when a keyboard shortcut conflicts with a browser default (e.g., Cmd/Ctrl+F for search)? The application shortcut overrides the browser default only in specific contexts where it is clearly more useful (e.g., Kanban board search, command palette). In other contexts, browser defaults take precedence.
- How does the system handle keyboard shortcuts when a modal or dialog is open? Shortcuts should be context-aware - some shortcuts work in modals (like Escape to close), while others are disabled to prevent conflicts.
- What happens when a user presses a shortcut for an action they don't have permission to perform? The action should not execute, and a brief permission message (toast/notification) must be shown explaining the denial.
- How does the system handle keyboard navigation when there are no issues in a list? Focus should remain on the page level, and arrow keys should have no effect.
- What happens when a keyboard shortcut is pressed while typing in an input field? Input-focused shortcuts (like Cmd/Ctrl+F) should work, but action shortcuts (like E for edit) should be disabled to prevent accidental triggers.
- How does the system handle keyboard shortcuts on mobile devices? Keyboard shortcuts should only be active when a physical keyboard is connected, not for on-screen keyboards.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to activate issue cards using Enter or Space key when cards are focused
- **FR-002**: System MUST support arrow key navigation (Up/Down) through issues list pages
- **FR-003**: System MUST allow users to open issue detail pages by pressing Enter when an issue is focused in a list
- **FR-004**: System MUST provide keyboard shortcuts for common issue detail page actions (E for edit, S for status, C for clone, L for link)
- **FR-005**: System MUST allow users to save changes using Cmd/Ctrl+S when in edit mode
- **FR-006**: System MUST allow users to cancel actions or close modals using Escape key
- **FR-007**: System MUST support arrow key navigation (Left/Right) to move issues between status columns on Kanban board when cards are focused
- **FR-008**: System MUST allow users to focus filter/search inputs using keyboard shortcuts (F key on board, Cmd/Ctrl+F for search)
- **FR-009**: System MUST display context-aware commands in the command palette based on the current route/URL path (e.g., issue detail page route shows issue-specific commands, Kanban board route shows board-specific commands)
- **FR-010**: System MUST allow users to assign issues to sprint using A key when issue is focused in backlog
- **FR-011**: System MUST allow users to remove issues from sprint using R key when issue is focused in sprint
- **FR-012**: System MUST support Tab key navigation between backlog and sprint sections in sprint planning
- **FR-013**: System MUST display a keyboard shortcuts help modal when user presses ? key
- **FR-014**: System MUST show visual focus indicators for all keyboard-navigable elements
- **FR-015**: System MUST prevent browser default behavior for application keyboard shortcuts only in specific contexts where the application shortcut is clearly more useful (e.g., Kanban board for Cmd/Ctrl+F search, command palette)
- **FR-016**: System MUST disable action shortcuts when user is typing in input fields (except input-specific shortcuts)
- **FR-017**: System MUST respect user permissions when executing keyboard shortcut actions. When a user presses a shortcut for an action they lack permission to perform, the system MUST show a brief permission message (toast/notification) explaining the denial
- **FR-018**: System MUST provide alternative mouse/touch methods for all keyboard actions
- **FR-019**: System MUST use aria-keyshortcuts attribute for keyboard shortcut discoverability by assistive technologies
- **FR-020**: System MUST return focus to the trigger element when closing modals opened via keyboard shortcuts

### Key Entities

- **Keyboard Shortcut**: Represents a key combination that triggers an action. Has a key combination, context (where it applies), action (what it does), and optional description.
- **Command**: Represents an action available in the command palette. Has an ID, label, description, keywords for search, group/category, and action handler. Commands are context-aware based on current route/URL path.
- **Focus State**: Represents the currently focused element in the UI. Tracks which issue card, list item, or input has keyboard focus for navigation purposes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can navigate and activate issue cards entirely via keyboard (no mouse required) - 100% of issue card interactions support keyboard activation
- **SC-002**: Users can complete issue list navigation using only keyboard - arrow keys navigate between issues, Enter opens selected issue
- **SC-003**: Users can perform all common issue detail actions using keyboard shortcuts - edit, status change, clone, and link actions accessible via single-key shortcuts
- **SC-004**: Keyboard shortcut usage increases by at least 30% after implementation (measured via analytics)
- **SC-005**: Task completion time for power users decreases by at least 20% when using keyboard shortcuts vs. mouse-only workflow
- **SC-006**: All keyboard shortcuts are discoverable through help modal (? key) - 100% of shortcuts documented in context-appropriate help
- **SC-007**: Application meets WCAG 2.1 AA compliance for keyboard navigation - all interactive elements accessible via keyboard
- **SC-008**: Command palette shows contextually relevant commands - commands filtered by current page/context with 100% accuracy
- **SC-009**: Users can complete sprint planning tasks using only keyboard - assign/remove issues, navigate between sections without mouse
- **SC-010**: Zero keyboard shortcut conflicts with browser defaults in appropriate contexts - all application shortcuts work as intended without browser interference

## Clarifications

### Session 2025-01-27

- Q: When a user presses a keyboard shortcut for an action they don't have permission to perform, what should happen? → A: Show brief permission message (toast/notification)
- Q: How should the system determine when to override browser shortcuts vs. allowing browser defaults? → A: Override only in specific contexts (e.g., Kanban board, command palette) where application shortcut is clearly more useful
- Q: How should the system determine the "context" for showing relevant commands in the command palette? → A: Route/URL path (e.g., `/projects/[id]/issues/[key]` = issue detail context)

## Assumptions

- Users have physical keyboards available (keyboard shortcuts are not required for mobile/touch-only devices)
- The command palette infrastructure (command registry, fuzzy search) will continue to work as currently implemented
- Keyboard shortcuts will be context-aware and only active when appropriate (e.g., not active when typing in input fields)
- All keyboard actions will have equivalent mouse/touch alternatives for accessibility
- Browser default shortcuts (like Cmd/Ctrl+F) can be overridden in specific contexts when appropriate
- The help modal will be implemented as a simple overlay that doesn't require significant design work
- Keyboard shortcuts will follow common conventions (E for edit, S for save/status, C for copy/clone, etc.) where possible
- Focus management will follow standard accessibility patterns (focus trapping in modals, focus return on close)

## Dependencies

- Existing command palette infrastructure (`apps/web/src/lib/commands/registry.ts`)
- Existing command palette UI component (`packages/ui/src/organisms/CommandPalette.tsx`)
- Issue detail page components (`packages/ui/src/organisms/IssueDetail.tsx`)
- Kanban board component (`packages/ui/src/organisms/KanbanBoard.tsx`)
- Sprint planning component (`packages/ui/src/organisms/SprintPlanning.tsx`)
- Issues list page (`apps/web/app/projects/[projectId]/issues/page.tsx`)

## Out of Scope

- Global search functionality (mentioned in analysis but marked as "coming soon" - will be handled separately)
- Quick status transitions using number keys (1-9) - considered lower priority power user feature
- View switching shortcuts (V key, Cmd/Ctrl+B, Cmd/Ctrl+L) - can be added in future iteration
- Custom keyboard shortcut configuration by users - not in initial scope
- Keyboard shortcuts for features not yet implemented (e.g., global search)

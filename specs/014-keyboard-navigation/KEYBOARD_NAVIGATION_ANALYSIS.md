# Keyboard Navigation & Hotkeys Analysis

## Executive Summary

Stride currently has **keyboard navigation implemented primarily in the Command Palette** (`Cmd/Ctrl+K`), which is well-executed. However, this powerful feature is underutilized across the rest of the application. This analysis identifies opportunities to expand keyboard navigation and hotkeys throughout the application, making it a truly keyboard-first experience.

## Current State

### ✅ What's Working Well

1. **Command Palette** (`Cmd/Ctrl+K`)
   - **Location**: `apps/web/src/components/CommandPaletteProvider.tsx`, `packages/ui/src/organisms/CommandPalette.tsx`
   - **Features**:
     - Opens with `Cmd/Ctrl+K`
     - Arrow key navigation (↑↓)
     - Enter to execute
     - Escape to close
     - Fuzzy search with Fuse.js
     - Commands: Navigation, Create Issue, Recent Items
   - **Status**: Fully functional and well-implemented

2. **Basic Accessibility**
   - IssueCard has `tabIndex={0}` and `role="button"` for keyboard focus
   - ProjectCard has keyboard navigation support
   - Kanban board uses `KeyboardSensor` from dnd-kit for drag-and-drop
   - Sprint Planning uses `KeyboardSensor` for drag-and-drop

### ❌ Gaps & Opportunities

1. **IssueCard Keyboard Activation**
   - **Location**: `packages/ui/src/molecules/IssueCard.tsx`
   - **Issue**: Has `tabIndex={0}` and `role="button"` but **no `onKeyDown` handler** for Enter/Space
   - **Impact**: Users can focus cards but cannot activate them with keyboard
   - **Code Reference**:
```237:239:packages/ui/src/molecules/IssueCard.tsx
      role="button"
      tabIndex={0}
      aria-label={`Issue ${issue.key}: ${issue.title}`}
```

2. **Issues List Page Navigation**
   - **Location**: `apps/web/app/projects/[projectId]/issues/page.tsx`
   - **Issue**: No keyboard navigation for navigating through issue list
   - **Impact**: Users must use mouse to click through issues
   - **Code Reference**: Issues are rendered as `<a>` tags but no keyboard shortcuts for list navigation
```192:199:apps/web/app/projects/[projectId]/issues/page.tsx
              <div
                key={issue.id}
                className="p-4 border border-border dark:border-border-dark rounded-md bg-surface dark:bg-surface-dark hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors hover:shadow-sm"
              >
                <a
                  href={`/projects/${projectId}/issues/${issue.key}`}
                  className="block"
                >
```

3. **Kanban Board Keyboard Shortcuts**
   - **Location**: `packages/ui/src/organisms/KanbanBoard.tsx`
   - **Issue**: While drag-and-drop works with keyboard, there are no shortcuts for:
     - Quick status transitions (e.g., `Ctrl+→` to move to next status)
     - Opening issue detail from focused card
     - Filtering columns
   - **Code Reference**: KeyboardSensor is configured but only for drag-and-drop
```593:603:packages/ui/src/organisms/KanbanBoard.tsx
  // Configure sensors for drag-and-drop (T152, T156)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
```

4. **Issue Detail Page Actions**
   - **Location**: `packages/ui/src/organisms/IssueDetail.tsx`
   - **Issue**: No keyboard shortcuts for common actions:
     - Edit mode (`E` key)
     - Status change (`S` key)
     - Clone issue (`C` key)
     - Link issue (`L` key)
     - Save changes (`Cmd/Ctrl+S`)
   - **Impact**: Users must click buttons for all actions

5. **Sprint Planning Actions**
   - **Location**: `packages/ui/src/organisms/SprintPlanning.tsx`
   - **Issue**: No keyboard shortcuts for:
     - Assigning issues to sprint
     - Removing issues from sprint
     - Quick navigation between backlog and sprint
   - **Code Reference**: Has KeyboardSensor but only for drag-and-drop
```169:178:packages/ui/src/organisms/SprintPlanning.tsx
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (matches KanbanBoard)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
```

6. **Global Search Shortcut**
   - **Location**: `packages/ui/src/organisms/TopBar.tsx`
   - **Issue**: Search input is disabled, no keyboard shortcut to focus it
   - **Code Reference**: Search is marked as "coming soon"
```152:169:packages/ui/src/organisms/TopBar.tsx
              <input
                type="text"
                placeholder="Search (coming soon)..."
                disabled
                className={cn(
                  'w-full pl-10 pr-4 py-2',
                  'border border-border dark:border-border-dark rounded-md',
                  'bg-background dark:bg-background-dark',
                  'text-foreground dark:text-foreground-dark',
                  'placeholder:text-foreground-secondary dark:placeholder:text-foreground-dark-secondary',
                  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  searchFocused && 'ring-2 ring-accent'
                )}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                aria-label="Search"
              />
```

7. **Command Palette Expansion**
   - **Location**: `apps/web/src/lib/commands/`
   - **Issue**: Limited commands available. Missing:
     - Issue-specific actions (edit, clone, link)
     - Status transitions
     - Filter toggles
     - View switching (list/kanban)
   - **Current Commands**: Navigation, Create Issue, Recent Items only
   - **Code Reference**:
```14:49:apps/web/src/lib/commands/navigation.ts
export function createNavigationCommands(
  options: NavigationCommandOptions,
): Command[] {
  return [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'Navigate to the dashboard',
      keywords: ['dashboard', 'home', 'main'],
      group: 'Navigation',
      action: () => {
        options.onNavigate('/');
      },
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      description: 'Navigate to projects list',
      keywords: ['projects', 'list'],
      group: 'Navigation',
      action: () => {
        options.onNavigate('/projects');
      },
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Navigate to settings',
      keywords: ['settings', 'config', 'preferences'],
      group: 'Navigation',
      action: () => {
        options.onNavigate('/settings');
      },
    },
  ];
}
```

## Recommended Improvements

### Priority 1: Critical UX Enhancements

#### 1.1 IssueCard Keyboard Activation
**Impact**: High - Affects all issue interactions  
**Effort**: Low - Simple handler addition

Add `onKeyDown` handler to IssueCard to support Enter/Space activation:

```typescript
// In packages/ui/src/molecules/IssueCard.tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClick?.(e as any);
  }
}}
```

#### 1.2 Issues List Keyboard Navigation
**Impact**: High - Core navigation pattern  
**Effort**: Medium - Requires focus management

Implement arrow key navigation through issue list:
- `↑/↓` to navigate between issues
- `Enter` to open selected issue
- `Esc` to clear selection
- Visual focus indicator

#### 1.3 Issue Detail Page Actions
**Impact**: High - Frequent user actions  
**Effort**: Medium - Context-aware shortcuts

Add keyboard shortcuts for common actions:
- `E` - Edit issue
- `S` - Change status (open status picker)
- `C` - Clone issue
- `L` - Link issue
- `Cmd/Ctrl+S` - Save changes (when in edit mode)
- `Esc` - Cancel edit/close modals

### Priority 2: Power User Features

#### 2.1 Kanban Board Quick Actions
**Impact**: Medium - Power user workflow  
**Effort**: Medium - Requires focus tracking

When an issue card is focused:
- `Enter` - Open issue detail
- `→/←` - Move to next/previous status column
- `F` - Focus filter/search
- `Cmd/Ctrl+F` - Focus search within board

#### 2.2 Command Palette Expansion
**Impact**: Medium - Discoverability  
**Effort**: Medium - Command registration system exists

Add context-aware commands:
- **Issue Actions** (when on issue detail page):
  - "Edit Issue"
  - "Change Status"
  - "Clone Issue"
  - "Link Issue"
- **Board Actions** (when on board):
  - "Filter by Status"
  - "Filter by Assignee"
  - "Create Issue"
  - "Switch to List View"
- **Global Actions**:
  - "Search Issues"
  - "Go to Sprint Planning"
  - "View Settings"

#### 2.3 Sprint Planning Shortcuts
**Impact**: Medium - Sprint planning efficiency  
**Effort**: Medium - Requires focus management

Add keyboard shortcuts:
- `A` - Assign selected issue to sprint
- `R` - Remove selected issue from sprint
- `Tab` - Navigate between backlog and sprint
- `↑/↓` - Navigate issues within section

### Priority 3: Nice-to-Have Enhancements

#### 3.1 Global Search Shortcut
**Impact**: Low - Feature not yet implemented  
**Effort**: Low - When search is enabled

When search is enabled:
- `Cmd/Ctrl+F` - Focus search input
- `/` - Quick search (if not in input field)

#### 3.2 Quick Status Transitions
**Impact**: Low - Power user feature  
**Effort**: High - Requires status picker redesign

For focused issues:
- `1-9` - Quick transition to status (if < 10 statuses)
- `Cmd/Ctrl+1-9` - Alternative status shortcuts

#### 3.3 View Switching
**Impact**: Low - Convenience feature  
**Effort**: Low - Simple shortcut

- `V` - Switch view (list/kanban) when on issues page
- `Cmd/Ctrl+B` - Go to board
- `Cmd/Ctrl+L` - Go to list

## Implementation Strategy

### Phase 1: Foundation (Week 1)
1. Add keyboard activation to IssueCard
2. Implement issues list keyboard navigation
3. Add basic shortcuts to Issue Detail page

### Phase 2: Expansion (Week 2)
1. Expand command palette with context-aware commands
2. Add Kanban board quick actions
3. Implement sprint planning shortcuts

### Phase 3: Polish (Week 3)
1. Add visual indicators for keyboard shortcuts
2. Create keyboard shortcuts help modal (`?` key)
3. Update documentation

## Technical Considerations

### Keyboard Event Handling
- Use a centralized keyboard shortcut system to avoid conflicts
- Consider using a library like `react-hotkeys-hook` or `use-hotkeys` for consistency
- Ensure shortcuts don't conflict with browser defaults (e.g., `Cmd/Ctrl+F`)

### Focus Management
- Implement proper focus trapping in modals
- Return focus to trigger element when closing modals
- Use `aria-keyshortcuts` attribute for discoverability

### Accessibility
- All keyboard shortcuts should be discoverable (help modal)
- Ensure shortcuts work with screen readers
- Provide alternative mouse/touch methods for all keyboard actions

### Context Awareness
- Commands should be context-aware (different on issue detail vs. board)
- Use React Context or route-based command registration
- Consider command palette showing only relevant commands

## Code References Summary

### Existing Keyboard Navigation
- Command Palette: `apps/web/src/components/CommandPaletteProvider.tsx:72-88`
- Command Palette UI: `packages/ui/src/organisms/CommandPalette.tsx:78-117`
- Kanban KeyboardSensor: `packages/ui/src/organisms/KanbanBoard.tsx:593-603`
- Sprint KeyboardSensor: `packages/ui/src/organisms/SprintPlanning.tsx:169-178`

### Areas Needing Enhancement
- IssueCard: `packages/ui/src/molecules/IssueCard.tsx:224-240` (missing onKeyDown)
- Issues List: `apps/web/app/projects/[projectId]/issues/page.tsx:192-199` (no keyboard nav)
- Issue Detail: `packages/ui/src/organisms/IssueDetail.tsx` (no shortcuts)
- Command Registry: `apps/web/src/lib/commands/` (limited commands)

## Success Metrics

1. **Keyboard Usage**: Track percentage of actions performed via keyboard vs. mouse
2. **Task Completion Time**: Measure time to complete common tasks with keyboard
3. **User Feedback**: Survey power users on keyboard navigation experience
4. **Accessibility**: WCAG 2.1 AA compliance for keyboard navigation

## Conclusion

Stride has a solid foundation with the Command Palette, but keyboard navigation is significantly underutilized. By implementing the recommended improvements, Stride can become a truly keyboard-first application, improving both productivity and accessibility. The command palette infrastructure is already in place - it just needs to be expanded and complemented with context-specific shortcuts.

# Research & Technical Decisions: Keyboard Navigation & Hotkeys Expansion

**Feature**: Keyboard Navigation & Hotkeys Expansion  
**Date**: 2025-01-27  
**Plan**: [plan.md](./plan.md)

## Research Questions & Decisions

### 1. Keyboard Event Handling Library vs. Native React

**Question**: Should we use a library like `react-hotkeys-hook` or `use-hotkeys`, or implement keyboard handling with native React hooks?

**Decision**: Use native React hooks (useEffect + KeyboardEvent) for keyboard handling.

**Rationale**:
- Lightweight - no additional dependency
- Full control over event handling logic
- Better TypeScript integration
- Consistent with existing codebase patterns (command palette already uses native handlers)
- Simple enough for our needs - no complex key combination parsing required

**Alternatives Considered**:
- `react-hotkeys-hook`: Good library but adds dependency and may be overkill for our use case
- `use-hotkeys`: Similar to react-hotkeys-hook, adds complexity
- Global window listeners: Less React-idiomatic, harder to manage component lifecycle

**Implementation Pattern**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      // Handle shortcut
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [dependencies]);
```

---

### 2. Keyboard Shortcut Conflict Resolution Strategy

**Question**: How should we handle conflicts between application shortcuts and browser defaults (e.g., Cmd/Ctrl+F)?

**Decision**: Override browser shortcuts only in specific contexts where the application shortcut is clearly more useful.

**Rationale**:
- Balances functionality with user expectations
- Avoids breaking standard browser behavior
- Provides consistent experience within application contexts

**Implementation Strategy**:
- **Command Palette (Cmd/Ctrl+K)**: Override - application-specific feature
- **Kanban Board Search (Cmd/Ctrl+F)**: Override when focus is on board - searches issues within board
- **Issue Detail Actions (E, S, C, L)**: No override needed - single keys don't conflict
- **Global Cmd/Ctrl+F**: Allow browser default when not in specific contexts

**Code Pattern**:
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  // Only override in specific context
  if (isInKanbanBoard && (e.metaKey || e.ctrlKey) && e.key === 'f') {
    e.preventDefault();
    focusSearchInput();
    return;
  }
  // Otherwise, let browser handle it
};
```

---

### 3. Context Determination for Command Palette

**Question**: How should we determine "context" for showing relevant commands in the command palette?

**Decision**: Use route/URL path to determine context.

**Rationale**:
- Most reliable and unambiguous method
- Aligns with Next.js App Router patterns
- Easy to test and debug
- Consistent behavior across page loads and navigation
- Can be determined synchronously without component state

**Implementation Strategy**:
- Extract route pattern from `usePathname()` hook
- Map route patterns to command groups:
  - `/projects/[id]/issues/[key]` → Issue Detail commands
  - `/projects/[id]/board` → Board commands
  - `/projects/[id]/sprints/[id]` → Sprint Planning commands
  - Global routes → Global commands only

**Code Pattern**:
```typescript
const pathname = usePathname();
const context = React.useMemo(() => {
  if (pathname.match(/\/projects\/[^/]+\/issues\/[^/]+$/)) {
    return 'issue-detail';
  }
  if (pathname.match(/\/projects\/[^/]+\/board$/)) {
    return 'board';
  }
  // ... more patterns
  return 'global';
}, [pathname]);
```

---

### 4. Input Field Shortcut Suppression

**Question**: How should we prevent action shortcuts from triggering while users type in input fields?

**Decision**: Disable action shortcuts when focus is in any input, textarea, or contenteditable element. Allow input-focused shortcuts (like Cmd/Ctrl+F for search).

**Rationale**:
- Prevents accidental triggers while typing
- Standard UX pattern users expect
- Preserves useful input shortcuts (Cmd/Ctrl+F, Cmd/Ctrl+A, etc.)

**Implementation Pattern**:
```typescript
const isInputFocused = () => {
  const activeElement = document.activeElement;
  return (
    activeElement?.tagName === 'INPUT' ||
    activeElement?.tagName === 'TEXTAREA' ||
    activeElement?.getAttribute('contenteditable') === 'true'
  );
};

const handleKeyDown = (e: KeyboardEvent) => {
  // Allow input-focused shortcuts
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
    // Always allow search
    return;
  }
  
  // Block action shortcuts when typing
  if (isInputFocused() && !isInputShortcut(e)) {
    return;
  }
  
  // Handle action shortcut
};
```

---

### 5. Focus Management for Keyboard Navigation

**Question**: How should we manage focus for list navigation and modal interactions?

**Decision**: Use React refs and focus() API with proper focus trapping in modals.

**Rationale**:
- Standard accessibility pattern
- Works with screen readers
- Provides visual focus indicators
- Follows WCAG 2.1 AA guidelines

**Implementation Patterns**:
- **List Navigation**: Track focused index, scroll into view, apply focus ring
- **Modal Focus Trap**: Focus first focusable element on open, trap Tab navigation, return focus on close
- **Focus Return**: Store trigger element before opening modal, restore on close

**Code Pattern**:
```typescript
const [focusedIndex, setFocusedIndex] = useState(0);
const itemRefs = useRef<(HTMLElement | null)[]>([]);

useEffect(() => {
  itemRefs.current[focusedIndex]?.focus();
  itemRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
}, [focusedIndex]);
```

---

### 6. Permission Handling for Keyboard Shortcuts

**Question**: What should happen when a user presses a shortcut for an action they don't have permission to perform?

**Decision**: Show a brief permission message (toast/notification) explaining the denial.

**Rationale**:
- Provides clear feedback without disrupting workflow
- Non-intrusive compared to modal dialogs
- Aligns with existing toast notification patterns
- Meets accessibility requirements for error feedback

**Implementation Pattern**:
```typescript
const handleEditShortcut = async () => {
  if (!canEdit) {
    toast.error('Permission denied', {
      description: 'You do not have permission to edit this issue',
    });
    return;
  }
  // Proceed with edit
};
```

---

### 7. Help Modal Implementation

**Question**: Should the help modal show all shortcuts or only context-relevant ones?

**Decision**: Show shortcuts grouped by context, with all shortcuts visible but clearly categorized.

**Rationale**:
- Allows users to discover shortcuts for other contexts
- Reduces cognitive load by grouping related shortcuts
- Follows common pattern in modern applications (VS Code, GitHub, etc.)

**Implementation Pattern**:
- Group shortcuts by category: Navigation, Actions, Global
- Show current context shortcuts first, then global shortcuts
- Use collapsible sections for different contexts

---

### 8. Performance Considerations

**Question**: Are there performance concerns with keyboard event listeners?

**Decision**: Use React's useEffect cleanup and debouncing where appropriate to minimize performance impact.

**Rationale**:
- Keyboard events are lightweight
- React's event system handles delegation efficiently
- Debouncing only needed for search/filter shortcuts, not action shortcuts

**Implementation Notes**:
- Cleanup event listeners in useEffect return
- No debouncing needed for action shortcuts (E, S, C, L keys)
- Debounce search/filter shortcuts if needed (using existing patterns)
- Keyboard shortcuts should respond within 50ms (sub-perceptible latency)

---

## Summary of Technical Decisions

| Decision Area | Decision | Key Rationale |
|--------------|----------|---------------|
| Keyboard Handling | Native React hooks | Lightweight, full control, consistent with codebase |
| Browser Conflicts | Context-specific override | Balances functionality with user expectations |
| Context Determination | Route/URL path | Reliable, unambiguous, Next.js-aligned |
| Input Suppression | Disable actions, allow input shortcuts | Prevents accidental triggers, preserves useful shortcuts |
| Focus Management | React refs + focus API | Standard accessibility pattern, WCAG compliant |
| Permission Handling | Brief toast notification | Non-intrusive, clear feedback |
| Help Modal | Context-grouped with all visible | Discoverable, organized, follows common patterns |
| Performance | useEffect cleanup, minimal debouncing | Keyboard events are lightweight |

All decisions align with existing codebase patterns and accessibility requirements.

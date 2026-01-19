# Data Model: Keyboard Navigation & Hotkeys Expansion

**Feature**: Keyboard Navigation & Hotkeys Expansion  
**Date**: 2025-01-27  
**Plan**: [plan.md](./plan.md)

## Overview

This feature is primarily a client-side UI enhancement and does not require database schema changes. However, we need to model the **Focus State** and **Keyboard Shortcut** entities for TypeScript typing and state management.

## Entities

### Focus State (Client-Side Only)

Represents the currently focused element in the UI for keyboard navigation purposes.

**Type**: TypeScript interface (no database persistence)

```typescript
interface FocusState {
  /** The currently focused element type */
  type: 'issue-card' | 'list-item' | 'input' | 'modal' | null;
  
  /** Index of focused item (for lists) */
  index?: number;
  
  /** ID of focused element (for cards, issues) */
  elementId?: string;
  
  /** Whether focus is trapped (in modal) */
  isTrapped?: boolean;
  
  /** Element to return focus to when modal closes */
  previousFocus?: HTMLElement | null;
}
```

**Usage**:
- Managed via React state in components
- Used for arrow key navigation in lists
- Used for focus management in modals
- Cleared on Escape key press

**State Transitions**:
- `null` → `'issue-card'` (when tabbing to card)
- `'issue-card'` → `'list-item'` (when navigating to list)
- `'list-item'` → `null` (when pressing Escape)
- `null` → `'modal'` (when opening modal)
- `'modal'` → `null` (when closing modal, focus returns)

---

### Keyboard Shortcut (Client-Side Configuration)

Represents a keyboard shortcut configuration for registration and discovery.

**Type**: TypeScript interface (no database persistence)

```typescript
interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  
  /** Key combination (e.g., 'Enter', 'E', 'Cmd+K') */
  keys: string;
  
  /** Display label for help modal */
  label: string;
  
  /** Description of what the shortcut does */
  description: string;
  
  /** Contexts where shortcut is active (route patterns) */
  contexts: string[];
  
  /** Category for grouping in help modal */
  category: 'navigation' | 'actions' | 'global';
  
  /** Whether shortcut requires modifier keys */
  requiresModifier: boolean;
  
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  
  /** Whether to prevent default browser behavior */
  preventDefault: boolean;
  
  /** Whether shortcut is disabled when typing in inputs */
  disabledInInputs: boolean;
}
```

**Usage**:
- Defined as constants in keyboard shortcut configuration
- Registered with keyboard hook/system
- Used for help modal generation
- Used for keyboard event handling

**Example**:
```typescript
const shortcuts: KeyboardShortcut[] = [
  {
    id: 'issue-edit',
    keys: 'E',
    label: 'Edit Issue',
    description: 'Open issue in edit mode',
    contexts: ['/projects/[id]/issues/[key]'],
    category: 'actions',
    requiresModifier: false,
    handler: handleEditIssue,
    preventDefault: true,
    disabledInInputs: true,
  },
];
```

---

### Command (Existing Entity - Enhanced)

The existing Command entity from the command palette is enhanced to support context-aware registration.

**Existing Structure** (from `packages/ui/src/organisms/CommandPalette.tsx`):
```typescript
interface Command {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  icon?: React.ReactNode;
  action: () => void | Promise<void>;
  group?: string;
}
```

**Enhancement**: Add context property for route-based filtering
```typescript
interface Command {
  // ... existing fields ...
  /** Route patterns where command is available (e.g., '/projects/[id]/issues/[key]') */
  contexts?: string[];
}
```

**Context Matching Logic**:
- Commands without `contexts` property → Available globally
- Commands with `contexts` → Only shown when current route matches pattern
- Context patterns use simple string matching or regex

---

## State Management

### Component State (React Hooks)

**Issue List Navigation**:
```typescript
const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
const itemRefs = useRef<(HTMLElement | null)[]>([]);
```

**Issue Card Focus**:
```typescript
const [isFocused, setIsFocused] = useState(false);
```

**Modal Focus Trap**:
```typescript
const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
```

**Keyboard Shortcut Registration**:
```typescript
const [activeShortcuts, setActiveShortcuts] = useState<KeyboardShortcut[]>([]);
```

---

## Validation Rules

### Focus State
- `index` must be >= 0 if `type` is 'list-item'
- `elementId` must be defined if `type` is 'issue-card'
- `previousFocus` should be stored before opening modals

### Keyboard Shortcut
- `id` must be unique within a context
- `keys` must be a valid key combination
- `contexts` array should contain valid route patterns
- `handler` must be a function
- `preventDefault` should be true for action shortcuts, false for navigation shortcuts

### Command
- `contexts` array (if present) should contain valid route patterns
- Commands without `contexts` are available globally

---

## Relationships

### Focus State → UI Elements
- One-to-one: Each component manages its own focus state
- Focus state references DOM elements via refs

### Keyboard Shortcut → Context
- Many-to-many: Shortcuts can be active in multiple contexts
- Context determines which shortcuts are registered

### Command → Context
- Many-to-many: Commands can be available in multiple contexts
- Context determines which commands appear in palette

---

## No Database Schema Changes Required

This feature is entirely client-side and does not require:
- Database tables
- API endpoints (uses existing ones)
- Data persistence
- Server-side state

All state is managed in React components and browser memory.

---

## Type Definitions Summary

```typescript
// Focus state management
interface FocusState { /* ... */ }
type FocusType = 'issue-card' | 'list-item' | 'input' | 'modal' | null;

// Keyboard shortcuts
interface KeyboardShortcut { /* ... */ }
type ShortcutCategory = 'navigation' | 'actions' | 'global';

// Enhanced command
interface Command {
  // ... existing fields ...
  contexts?: string[];
}
```

These types will be defined in `packages/types` or component-specific type files as needed.

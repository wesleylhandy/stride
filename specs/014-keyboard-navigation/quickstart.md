# Quickstart Guide: Keyboard Navigation & Hotkeys Expansion

**Feature**: Keyboard Navigation & Hotkeys Expansion  
**Date**: 2025-01-27  
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

This guide helps developers understand how to implement keyboard navigation and hotkeys in the Stride application. The feature adds keyboard shortcuts throughout the UI to create a keyboard-first experience.

## Key Concepts

### 1. Keyboard Shortcut Hook

Create a reusable hook for keyboard shortcuts:

```typescript
// apps/web/src/hooks/useKeyboardShortcut.ts
export function useKeyboardShortcut(
  keys: string,
  handler: (event: KeyboardEvent) => void,
  options?: {
    enabled?: boolean;
    preventDefault?: boolean;
    disabledInInputs?: boolean;
  }
) {
  useEffect(() => {
    if (!options?.enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if in input field
      if (options?.disabledInInputs && isInputFocused(e.target)) {
        return;
      }
      
      if (matchesKey(e, keys)) {
        if (options?.preventDefault) {
          e.preventDefault();
        }
        handler(e);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, handler, options?.enabled, options?.preventDefault, options?.disabledInInputs]);
}
```

### 2. Context-Aware Command Registration

Register commands based on route context:

```typescript
// apps/web/src/lib/commands/context-registry.ts
export function registerContextCommands(
  pathname: string,
  commands: Command[]
) {
  const context = getContextFromRoute(pathname);
  return commands.filter(cmd => 
    !cmd.contexts || cmd.contexts.includes(context)
  );
}

function getContextFromRoute(pathname: string): string {
  if (pathname.match(/\/projects\/[^/]+\/issues\/[^/]+$/)) {
    return 'issue-detail';
  }
  if (pathname.match(/\/projects\/[^/]+\/board$/)) {
    return 'board';
  }
  // ... more patterns
  return 'global';
}
```

### 3. Issue Card Keyboard Activation

Add keyboard handlers to IssueCard:

```typescript
// packages/ui/src/molecules/IssueCard.tsx
export function IssueCard({ issue, onClick, ...props }: IssueCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e as any);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-keyshortcuts="Enter Space"
      // ... other props
    >
      {/* card content */}
    </div>
  );
}
```

### 4. List Navigation with Arrow Keys

Implement arrow key navigation for lists:

```typescript
// apps/web/app/projects/[projectId]/issues/page.tsx (client component)
export function IssuesListClient({ issues }: Props) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useKeyboardShortcut('ArrowDown', () => {
    setFocusedIndex(prev => 
      prev === null ? 0 : Math.min(prev + 1, issues.length - 1)
    );
  });

  useKeyboardShortcut('ArrowUp', () => {
    setFocusedIndex(prev => 
      prev === null ? issues.length - 1 : Math.max(prev - 1, 0)
    );
  });

  useKeyboardShortcut('Escape', () => {
    setFocusedIndex(null);
  });

  useEffect(() => {
    if (focusedIndex !== null) {
      itemRefs.current[focusedIndex]?.focus();
      itemRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  return (
    <div>
      {issues.map((issue, index) => (
        <div
          key={issue.id}
          ref={el => itemRefs.current[index] = el}
          tabIndex={focusedIndex === index ? 0 : -1}
          className={focusedIndex === index ? 'ring-2 ring-accent' : ''}
        >
          {/* issue content */}
        </div>
      ))}
    </div>
  );
}
```

### 5. Issue Detail Page Shortcuts

Add shortcuts to IssueDetail component:

```typescript
// packages/ui/src/organisms/IssueDetail.tsx
export function IssueDetail({ issue, onUpdate, onStatusChange, ...props }: Props) {
  const isEditing = /* ... */;
  
  useKeyboardShortcut('E', () => {
    if (!isEditing && props.canEdit) {
      setIsEditing(true);
    }
  }, { disabledInInputs: true, preventDefault: true });

  useKeyboardShortcut('S', () => {
    if (!isEditing && onStatusChange) {
      openStatusPicker();
    }
  }, { disabledInInputs: true, preventDefault: true });

  useKeyboardShortcut('Ctrl+S', () => {
    if (isEditing && onUpdate) {
      handleSave();
    }
  }, { disabledInInputs: false, preventDefault: true });

  // ... rest of component
}
```

### 6. Help Modal Component

Create keyboard shortcuts help modal:

```typescript
// apps/web/src/components/KeyboardShortcutsHelp.tsx
export function KeyboardShortcutsHelp({ open, onClose }: Props) {
  const pathname = usePathname();
  const context = getContextFromRoute(pathname);
  const shortcuts = getShortcutsForContext(context);

  useKeyboardShortcut('?', () => {
    if (!open) {
      onOpen();
    }
  });

  useKeyboardShortcut('Escape', () => {
    if (open) {
      onClose();
    }
  });

  return (
    <Modal open={open} onClose={onClose}>
      <h2>Keyboard Shortcuts</h2>
      {Object.entries(groupByCategory(shortcuts)).map(([category, items]) => (
        <div key={category}>
          <h3>{category}</h3>
          {items.map(shortcut => (
            <div key={shortcut.id}>
              <kbd>{shortcut.keys}</kbd>
              <span>{shortcut.label}</span>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  );
}
```

## Implementation Checklist

### Phase 1: Foundation (P1)
- [ ] Create `useKeyboardShortcut` hook
- [ ] Add `onKeyDown` handler to IssueCard
- [ ] Implement arrow key navigation in issues list
- [ ] Add basic shortcuts to IssueDetail (E, S, C, L, Cmd+S, Esc)

### Phase 2: Expansion (P2)
- [ ] Create context-aware command registry
- [ ] Add commands for issue actions
- [ ] Add commands for board actions
- [ ] Add keyboard shortcuts to Kanban board
- [ ] Add keyboard shortcuts to Sprint Planning
- [ ] Create keyboard shortcuts help modal

### Phase 3: Polish (P3)
- [ ] Add visual focus indicators
- [ ] Test with screen readers
- [ ] Verify WCAG 2.1 AA compliance
- [ ] Update documentation

## Testing

### Unit Tests
```typescript
describe('useKeyboardShortcut', () => {
  it('calls handler when key is pressed', () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcut('Enter', handler));
    
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(handler).toHaveBeenCalled();
  });

  it('does not call handler when in input field', () => {
    const handler = jest.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    renderHook(() => useKeyboardShortcut('Enter', handler, { disabledInInputs: true }));
    fireEvent.keyDown(window, { key: 'Enter' });
    
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
```

### E2E Tests
```typescript
test('user can navigate issues list with arrow keys', async ({ page }) => {
  await page.goto('/projects/test-project/issues');
  
  await page.keyboard.press('ArrowDown');
  const firstIssue = page.locator('[role="button"]').first();
  await expect(firstIssue).toBeFocused();
  
  await page.keyboard.press('ArrowDown');
  const secondIssue = page.locator('[role="button"]').nth(1);
  await expect(secondIssue).toBeFocused();
  
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/issues\/.*/);
});
```

## Common Pitfalls

1. **Forgetting to prevent default**: Always call `e.preventDefault()` for action shortcuts
2. **Not cleaning up event listeners**: Always return cleanup function from useEffect
3. **Input field conflicts**: Remember to disable action shortcuts when typing
4. **Focus management**: Always return focus to trigger element when closing modals
5. **Context matching**: Test context matching logic with actual routes

## Resources

- [WCAG 2.1 Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)
- [MDN KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [React Keyboard Events](https://react.dev/reference/react-dom/components/common#keyboard-events)
- Existing command palette: `apps/web/src/components/CommandPaletteProvider.tsx`

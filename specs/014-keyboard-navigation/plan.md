# Implementation Plan: Keyboard Navigation & Hotkeys Expansion

**Branch**: `014-keyboard-navigation` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-keyboard-navigation/spec.md`

## Summary

This feature expands keyboard navigation and hotkeys throughout Stride to create a keyboard-first user experience. The implementation builds on the existing command palette infrastructure (`Cmd/Ctrl+K`) and adds keyboard shortcuts for issue interactions, list navigation, Kanban board actions, and sprint planning. All shortcuts are context-aware and respect user permissions, with proper accessibility support (WCAG 2.1 AA compliance).

**Technical Approach**: 
- Client-side keyboard event handling using React hooks
- Context-aware command registration based on route/URL path
- Centralized keyboard shortcut management to avoid conflicts
- Focus management and accessibility attributes (aria-keyshortcuts)
- Integration with existing command palette infrastructure

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 18+, Next.js 16+ (App Router), dnd-kit (existing for drag-and-drop keyboard support)  
**Storage**: N/A (client-side feature, no data persistence)  
**Testing**: Vitest (unit), Playwright (E2E), React Testing Library (component)  
**Target Platform**: Web browsers (desktop focus, mobile with physical keyboard support)  
**Project Type**: Web application (monorepo with Next.js frontend)  
**Performance Goals**: Keyboard shortcuts must respond within 50ms of keypress (sub-perceptible latency)  
**Constraints**: Must not conflict with browser defaults; must work with screen readers; must not interfere with text input  
**Scale/Scope**: All interactive pages (issues list, Kanban board, issue detail, sprint planning, command palette)

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **UI Library**: React 18+ with hooks for keyboard event handling
- **State Management**: React hooks (useState, useEffect, useCallback) for local keyboard state
- **Drag & Drop**: dnd-kit (existing - already supports KeyboardSensor)
- **Accessibility**: ARIA attributes, focus management
- **Styling**: Tailwind CSS (existing)

### Dependencies
- **Existing Command Palette**: `apps/web/src/components/CommandPaletteProvider.tsx`
- **Existing Command Registry**: `apps/web/src/lib/commands/registry.ts`
- **Existing Components**: 
  - `packages/ui/src/organisms/CommandPalette.tsx`
  - `packages/ui/src/molecules/IssueCard.tsx`
  - `packages/ui/src/organisms/KanbanBoard.tsx`
  - `packages/ui/src/organisms/IssueDetail.tsx`
  - `packages/ui/src/organisms/SprintPlanning.tsx`
- **Existing Navigation**: Next.js router (`next/navigation`)

### Architecture Decisions
- **Centralized Keyboard Handler**: Create a reusable keyboard shortcut hook/system to avoid conflicts and ensure consistent behavior
- **Route-Based Context**: Use Next.js router to determine context for command palette (route/URL path)
- **Event Delegation**: Use React's event system rather than global window listeners where possible to maintain component lifecycle
- **Focus Management**: Implement proper focus trapping in modals and return focus on close
- **Accessibility First**: All shortcuts must be discoverable (help modal) and work with assistive technologies
- **Graceful Degradation**: Keyboard shortcuts enhance but don't replace mouse/touch interactions

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Permission handling - brief toast notification shown (clarified in spec)
- ✅ **RESOLVED**: Browser shortcut conflicts - override only in specific contexts (clarified in spec)
- ✅ **RESOLVED**: Context determination - use route/URL path (clarified in spec)

All clarifications resolved. See `research.md` for detailed technical decisions.

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied
  - Single Responsibility: Keyboard handlers isolated in hooks, shortcuts scoped to components
  - Open/Closed: Extend command palette with new commands without modifying core
  - Liskov Substitution: Keyboard shortcuts follow consistent interface patterns
  - Interface Segregation: Minimal, focused keyboard hook interfaces
  - Dependency Inversion: Depend on command registry abstraction, not implementations
- [x] DRY, YAGNI, KISS followed
  - Reuse existing command palette infrastructure
  - MVP focus: Core shortcuts first, advanced features later
  - Simple React hooks for keyboard handling (no complex library needed)
- [x] Type safety enforced
  - TypeScript strict mode
  - Typed keyboard event handlers
  - No `any` types
- [x] Security best practices
  - No client-side security concerns (UI-only feature)
  - Permission checks handled at action level (existing patterns)
- [x] Accessibility requirements met
  - WCAG 2.1 AA compliance for keyboard navigation
  - aria-keyshortcuts attributes for discoverability
  - Focus management and visual indicators
  - Screen reader support

### Code Quality Gates
- [x] No `any` types (use KeyboardEvent types)
- [x] Error handling implemented (try/catch in keyboard handlers, graceful fallbacks)
- [x] Input validation (not applicable - UI events only)
- [x] Authentication required (existing middleware, shortcuts respect permissions)
- [x] Type safety (strict TypeScript, typed event handlers)

## Project Structure

### Documentation (this feature)

```text
specs/014-keyboard-navigation/
├── plan.md              # This file
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (no schema changes, focus state model)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (N/A - client-side only)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── hooks/
│   │   └── useKeyboardShortcut.ts          # NEW: Centralized keyboard shortcut hook
│   ├── lib/
│   │   └── commands/
│   │       ├── issue-actions.ts            # NEW: Issue-specific commands
│   │       ├── board-actions.ts            # NEW: Board-specific commands
│   │       └── context-registry.ts         # NEW: Context-aware command registration
│   └── components/
│       ├── KeyboardShortcutsHelp.tsx       # NEW: Help modal component
│       └── CommandPaletteProvider.tsx      # MODIFY: Add context-aware commands

packages/ui/
├── src/
│   ├── molecules/
│   │   └── IssueCard.tsx                   # MODIFY: Add onKeyDown handler
│   └── organisms/
│       ├── CommandPalette.tsx              # MODIFY: Enhanced with context
│       ├── KanbanBoard.tsx                 # MODIFY: Add keyboard shortcuts
│       ├── IssueDetail.tsx                 # MODIFY: Add keyboard shortcuts
│       └── SprintPlanning.tsx              # MODIFY: Add keyboard shortcuts

apps/web/app/
└── projects/
    └── [projectId]/
        └── issues/
            └── page.tsx                    # MODIFY: Add arrow key navigation
```

**Structure Decision**: This is a client-side UI enhancement feature distributed across existing component structure. No new major modules needed - enhancements to existing components and addition of reusable hooks.

## Complexity Tracking

> **No violations** - This feature follows existing patterns and enhances current components without introducing architectural complexity.

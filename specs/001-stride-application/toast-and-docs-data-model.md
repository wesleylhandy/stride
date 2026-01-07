# Data Model: Toast Notifications & YAML Configuration Documentation

**Feature**: Toast Notifications & YAML Configuration Documentation  
**Date**: 2024-12-20

## Toast System Data Model

### Toast State (Client-Side Only)

**Toast Entity**:
```typescript
interface Toast {
  id: string; // Unique identifier
  title: string; // Toast title/message
  description?: string; // Optional detailed message
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // Auto-dismiss duration in ms (default varies by variant)
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number; // Timestamp for ordering
}
```

**Toast Queue**:
- Array of `Toast` objects
- Managed by `ToastProvider` context
- Maximum visible toasts: 3
- Additional toasts queued and shown as others dismiss

**No Database Storage**: Toasts are ephemeral and client-side only.

## Documentation Data Model

### Documentation Content (Static)

**Documentation Page**:
```typescript
interface DocumentationPage {
  slug: string; // URL slug
  title: string; // Page title
  description?: string; // Meta description
  content: string; // Markdown/MDX content
  category: 'configuration' | 'guides' | 'reference';
  order: number; // Display order
}
```

**Configuration Example**:
```typescript
interface ConfigExample {
  name: string; // Example name
  description: string; // What this example demonstrates
  yaml: string; // YAML content
  validated: boolean; // Whether example has been validated against schema
}
```

**No Database Storage**: Documentation is static content (MDX/Markdown files).

## Relationships

- **Toast → User Action**: Toasts are triggered by user actions (API calls, form submissions, etc.)
- **Documentation → Configuration Schema**: Documentation references and explains configuration schema
- **Config Examples → Schema**: Examples must validate against actual schema

## Validation Rules

### Toast
- `id` must be unique within toast queue
- `title` is required and non-empty
- `variant` must be one of the allowed values
- `duration` must be positive if provided

### Documentation
- `slug` must be unique
- `content` must be valid Markdown/MDX
- Configuration examples must validate against `ProjectConfigSchema`

## State Management

### Toast State
- **Location**: React Context (`ToastProvider`)
- **Scope**: Global (app-wide)
- **Persistence**: None (ephemeral)
- **Lifecycle**: Created on trigger, removed on dismiss or timeout

### Documentation State
- **Location**: Static files (MDX/Markdown)
- **Scope**: Read-only content
- **Persistence**: File system
- **Lifecycle**: Loaded on page access, cached by Next.js

## Notes

- Toast system requires no database changes
- Documentation is static content, no database needed
- Configuration examples should be validated during build/test time
- Toast state is managed entirely client-side for performance


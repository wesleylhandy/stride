# Quickstart: Toast Notifications & YAML Configuration Documentation

**Feature**: Toast Notifications & YAML Configuration Documentation  
**Date**: 2024-12-20

## Toast System Setup

### 1. Install Dependencies

```bash
pnpm add sonner
```

### 2. Setup Toast Provider

**Add to root layout** (`apps/web/app/layout.tsx`):
```tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster 
          position="bottom-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
```

### 3. Create Toast Hook

**Create** `packages/ui/src/hooks/useToast.ts`:
```typescript
import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    toast: {
      success: (message: string, options?: ToastOptions) => 
        sonnerToast.success(message, options),
      error: (message: string, options?: ToastOptions) => 
        sonnerToast.error(message, options),
      warning: (message: string, options?: ToastOptions) => 
        sonnerToast.warning(message, options),
      info: (message: string, options?: ToastOptions) => 
        sonnerToast.info(message, options),
    },
  };
}
```

### 4. Replace Alert Calls

**Before**:
```typescript
alert('Failed to update issue status');
```

**After**:
```typescript
const { toast } = useToast();
toast.error('Failed to update issue status', {
  description: 'Please check your connection and try again.',
  action: {
    label: 'Retry',
    onClick: () => retryOperation(),
  },
});
```

## Documentation Setup

### 1. Create Documentation Pages

**Marketing Site** (`apps/site/app/docs/configuration/page.tsx`):
```tsx
import { MDXRemote } from 'next-mdx-remote/rsc';
import { readFile } from 'fs/promises';

export default async function ConfigDocsPage() {
  const content = await readFile(
    './content/docs/configuration.md',
    'utf-8'
  );
  
  return (
    <div className="prose">
      <MDXRemote source={content} />
    </div>
  );
}
```

**Internal App** (`apps/web/app/docs/configuration/page.tsx`):
```tsx
import { MDXRemote } from 'next-mdx-remote/rsc';
import { readFile } from 'fs/promises';

export default async function ConfigDocsPage() {
  const content = await readFile(
    './content/docs/configuration-reference.md',
    'utf-8'
  );
  
  return (
    <div className="prose max-w-4xl mx-auto">
      <MDXRemote source={content} />
    </div>
  );
}
```

### 2. Create Documentation Content

**Create** `apps/site/content/docs/configuration.md`:
```markdown
# Configuration Guide

Stride uses YAML configuration files to define workflows, statuses, and custom fields.

## Quick Start

\`\`\`yaml
project_key: APP
project_name: My Application
workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
    - key: done
      name: Done
      type: closed
\`\`\`

[View full documentation →](/docs/configuration/reference)
```

### 3. Link from Error Messages

**Enhance error responses** with help URLs:
```typescript
return NextResponse.json({
  error: 'Status transition validation failed',
  details: validationErrors,
  helpUrl: '/docs/configuration/troubleshooting#status-transition-errors',
}, { status: 400 });
```

## Testing

### Toast Testing

```typescript
import { renderHook } from '@testing-library/react';
import { useToast } from '@/hooks/useToast';

test('toast.error shows error message', () => {
  const { result } = renderHook(() => useToast());
  result.current.toast.error('Test error');
  // Verify toast appears in DOM
});
```

### Documentation Testing

```typescript
import { readFile } from 'fs/promises';
import { parseYamlConfig } from '@stride/yaml-config';

test('all documentation examples are valid YAML', async () => {
  const content = await readFile('./content/docs/examples.md', 'utf-8');
  const examples = extractYamlExamples(content);
  
  for (const example of examples) {
    const result = parseYamlConfig(example);
    expect(result.success).toBe(true);
  }
});
```

## Next Steps

1. Replace all `alert()` calls with toast notifications
2. Create comprehensive configuration documentation
3. Add documentation links to error messages
4. Test accessibility of toast system
5. Validate all documentation examples against schema


# API Contracts: Toast Notifications & YAML Configuration Documentation

**Feature**: Toast Notifications & YAML Configuration Documentation  
**Date**: 2024-12-20

## Toast System API

### Client-Side API (No HTTP Endpoints)

**Toast Hook Interface**:
```typescript
interface UseToastReturn {
  toast: {
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
  };
}

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage Example**:
```typescript
const { toast } = useToast();

// Success toast
toast.success('Issue created successfully');

// Error toast with description
toast.error('Failed to update issue', {
  description: 'Please check your connection and try again.',
  action: {
    label: 'Retry',
    onClick: () => retryOperation(),
  },
});

// Warning toast
toast.warning('Configuration has unsaved changes');

// Info toast
toast.info('Issue moved to review status');
```

## Documentation API

### Static Content Routes

**Marketing Site Routes**:
- `GET /docs/configuration` - Configuration overview and quick start
- `GET /docs/configuration/reference` - Full configuration reference

**Internal Application Routes**:
- `GET /docs/configuration` - Comprehensive configuration documentation
- `GET /docs/configuration/examples` - Configuration examples
- `GET /docs/configuration/troubleshooting` - Common errors and solutions

### Documentation Content Structure

**No API Endpoints Required**: Documentation is served as static pages (MDX/Markdown).

## Error Response Enhancement

### Enhanced Error Messages

**Current Error Response** (from status update API):
```json
{
  "error": "Status transition validation failed",
  "details": [
    {
      "field": "status",
      "message": "Cannot move from 'Done' to 'In Progress'"
    }
  ]
}
```

**Enhanced with Documentation Links**:
```json
{
  "error": "Status transition validation failed",
  "details": [
    {
      "field": "status",
      "message": "Cannot move from 'Done' (closed status) to 'In Review' (in_progress status). Once an issue is closed, it can only be moved to another closed status.",
      "helpUrl": "/docs/configuration#workflow-status-types"
    }
  ],
  "helpUrl": "/docs/configuration/troubleshooting#status-transition-errors"
}
```

## Toast Integration Points

### API Error Handling

**Current Pattern**:
```typescript
catch (error) {
  alert(error.message);
}
```

**New Pattern**:
```typescript
catch (error) {
  const { toast } = useToast();
  
  if (error.details && Array.isArray(error.details)) {
    // Show detailed error with help link
    toast.error(error.message || 'Operation failed', {
      description: error.details.map(d => d.message).join('\n'),
      action: error.helpUrl ? {
        label: 'View Help',
        onClick: () => router.push(error.helpUrl),
      } : undefined,
    });
  } else {
    toast.error(error.message || 'Operation failed');
  }
}
```

## Notes

- Toast system is entirely client-side, no API endpoints needed
- Documentation is static content, served as pages
- Error responses can be enhanced with help URLs
- Toast actions can navigate to documentation


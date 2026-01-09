# E2E Test Route Mocking Contracts

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-02  
**Status**: Design Complete  
**Related Plan**: `playwright-reorganization-plan.md`

## Overview

This document defines the API route mocking contracts for Playwright E2E tests. These contracts specify the request/response formats used in route interception to simulate backend API responses during testing.

## Authentication Routes

### POST /api/auth/login

**Purpose**: User login endpoint

**Request**:
```typescript
{
  email: string;
  password: string;
}
```

**Success Response** (200):
```typescript
{
  success: true;
  // Optional: user data
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}
```

**Error Response** (401):
```typescript
{
  error: string; // e.g., "Invalid credentials"
  code?: string; // Optional error code
}
```

**Mock Usage**:
```typescript
await mockLoginRoute(page, { success: true });
// or
await mockLoginRoute(page, { success: false });
```

---

### GET /api/auth/me

**Purpose**: Get current authenticated user

**Request**: None (uses session cookie/token)

**Success Response** (200):
```typescript
{
  id: string;
  email: string;
  username: string;
  role: 'Admin' | 'Member' | 'Viewer';
}
```

**Error Response** (401):
```typescript
{
  error: 'Unauthorized';
}
```

**Mock Usage**:
```typescript
await mockAuthRoute(page, {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  role: 'Admin'
});
```

---

## Project Routes

### GET /api/projects

**Purpose**: List projects with pagination

**Request Query Parameters**:
```typescript
{
  page?: number;      // Default: 1
  pageSize?: number;  // Default: 10
  search?: string;    // Optional search term
}
```

**Success Response** (200):
```typescript
{
  total: number;
  items: MockProject[];
  page?: number;
  pageSize?: number;
}
```

**Mock Usage**:
```typescript
await mockProjectsListRoute(page, [
  { id: 'project-1', key: 'TEST', name: 'Test Project' },
  { id: 'project-2', key: 'APP', name: 'App Project' }
]);
```

---

### GET /api/projects/:id

**Purpose**: Get single project by ID

**Request**: URL parameter `id`

**Success Response** (200):
```typescript
MockProject
```

**Error Response** (404):
```typescript
{
  error: 'Project not found';
}
```

**Mock Usage**:
```typescript
await mockProjectRoute(page, {
  id: 'project-123',
  key: 'TEST',
  name: 'Test Project',
  config: { /* ... */ }
});
```

---

### GET /api/projects?pageSize=1

**Purpose**: Check if user has projects (onboarding check)

**Request Query Parameters**:
```typescript
{
  pageSize: 1;  // Only need to check existence
}
```

**Success Response** (200):
```typescript
{
  total: number;  // 0 = no projects, >0 = has projects
  items: MockProject[];  // Empty array if no projects
}
```

**Mock Usage**:
```typescript
// User with projects (onboarding complete)
await mockProjectsListRoute(page, [{ id: '1', key: 'APP', name: 'App' }]);

// User without projects (onboarding incomplete)
await mockProjectsListRoute(page, []);
```

---

## Project Configuration Routes

### GET /api/projects/:id/config

**Purpose**: Get project configuration YAML

**Request**: URL parameter `id`

**Success Response** (200):
- **Content-Type**: `text/yaml`
- **Body**: Raw YAML string

```yaml
project_key: TEST
project_name: Test Project
workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
    - key: done
      name: Done
      type: closed
```

**Error Response** (404):
```typescript
{
  error: 'Project not found';
}
```

---

## Issue Routes

### GET /api/projects/:projectId/issues

**Purpose**: List issues for a project

**Request Query Parameters**:
```typescript
{
  page?: number;
  pageSize?: number;
  status?: string;
  assigneeId?: string;
}
```

**Success Response** (200):
```typescript
{
  total: number;
  items: Issue[];
  page?: number;
  pageSize?: number;
}
```

**Issue Type**:
```typescript
{
  id: string;
  key: string;  // e.g., "TEST-1"
  title: string;
  description: string;
  status: string;
  priority: string | null;
  assigneeId: string | null;
  reporterId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### PATCH /api/projects/:projectId/issues/:issueId/status

**Purpose**: Update issue status

**Request Body**:
```typescript
{
  status: string;
}
```

**Success Response** (200):
```typescript
{
  id: string;
  status: string;
  // ... other issue fields
}
```

**Error Response** (400):
```typescript
{
  error: string;  // e.g., "Invalid status transition"
  helpUrl?: string;  // Optional: link to documentation
  details?: {
    field?: string;
    message: string;
  }[];
}
```

**Example Error**:
```typescript
{
  error: 'Invalid status transition',
  helpUrl: '/docs/configuration',
  details: [
    {
      field: 'status',
      message: 'Cannot move from "todo" to "done" without "in_progress"'
    }
  ]
}
```

---

## Webhook Routes

### POST /api/webhooks/*

**Purpose**: Receive webhooks from Git services (GitHub, GitLab, Bitbucket)

**Request**: Varies by service (GitHub webhook payload, GitLab webhook payload, etc.)

**Success Response** (200):
```typescript
{
  success: true;
  processed: boolean;
}
```

**Note**: Webhook routes are typically not mocked in E2E tests as they test external integrations. If needed, they would follow the respective service's webhook payload format.

---

## Error Response Standard

All error responses follow this structure:

```typescript
{
  error: string;           // Human-readable error message
  code?: string;          // Optional error code (e.g., "VALIDATION_ERROR")
  helpUrl?: string;       // Optional: link to documentation or help
  details?: Array<{       // Optional: field-specific errors
    field?: string;
    message: string;
  }>;
}
```

## Mock Implementation Patterns

### Basic Route Mock

```typescript
await page.route('/api/auth/login', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  });
});
```

### Conditional Route Mock

```typescript
await page.route('/api/projects/:id', async (route) => {
  const id = route.request().url().split('/').pop();
  if (id === 'project-123') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockProject),
    });
  } else {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Project not found' }),
    });
  }
});
```

### Query Parameter Handling

```typescript
await page.route('/api/projects*', async (route) => {
  const url = new URL(route.request().url());
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const projects = generateProjects(pageSize);
  
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      total: projects.length,
      items: projects,
    }),
  });
});
```

## Route Matching Patterns

### Exact Match
```typescript
'/api/auth/login'
```

### RegExp Match
```typescript
/\/api\/projects\/[\w-]+/
```

### Wildcard Match
```typescript
'/api/projects*'  // Matches /api/projects and /api/projects/123
```

## Best Practices

1. **Route Cleanup**: Playwright automatically cleans up routes between tests
2. **Default Values**: Provide sensible defaults for optional fields
3. **Error Scenarios**: Mock both success and error responses
4. **Realistic Data**: Use realistic test data that matches production structure
5. **Type Safety**: Use TypeScript interfaces for request/response types

## Testing Error Scenarios

### Test Invalid Login
```typescript
await mockLoginRoute(page, { success: false });
await page.fill('input[name="email"]', 'wrong@example.com');
await page.fill('input[name="password"]', 'wrongpassword');
await page.click('button[type="submit"]');
await expect(page.locator('text=/invalid credentials/i')).toBeVisible();
```

### Test 404 Response
```typescript
await page.route('/api/projects/missing-id', async (route) => {
  await route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Project not found' }),
  });
});
```

### Test Validation Error
```typescript
await page.route('/api/projects/:id/issues/:issueId/status', async (route) => {
  await route.fulfill({
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({
      error: 'Invalid status transition',
      helpUrl: '/docs/configuration',
    }),
  });
});
```

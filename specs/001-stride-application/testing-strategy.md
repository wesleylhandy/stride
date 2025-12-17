# Testing Strategy: Stride Core Application

**Created**: 2024-12-19  
**Purpose**: Define comprehensive testing approach for unit, integration, and E2E tests

## Testing Philosophy

### Principles
- **Test Behavior, Not Implementation**: Focus on what the code does, not how
- **Test Critical Paths**: Prioritize user-facing functionality
- **Fast Feedback**: Unit tests should run in milliseconds
- **Confidence**: Tests should give confidence to deploy
- **Maintainability**: Tests should be easy to update when code changes

### Testing Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /____\     Critical user journeys
     /      \    
    /________\   Integration Tests (30%)
   /          \  API routes, database operations
  /____________\ Unit Tests (60%)
                Utilities, components, business logic
```

## Unit Testing

### Testing Framework
- **Vitest**: Fast, Vite-native test runner
- **React Testing Library**: Component testing
- **@testing-library/jest-dom**: DOM matchers

### Test Structure

```typescript
// Example unit test structure
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Unit Test Coverage

#### Utilities and Helpers

**Location**: `packages/*/src/utils/**/*.test.ts`

**Examples**:
- YAML parsing and validation
- Issue key generation
- Date formatting
- URL parsing
- Validation functions

**Test Cases**:
```typescript
// packages/yaml-config/src/parser.test.ts
describe('YAML Parser', () => {
  it('should parse valid YAML', () => {
    const yaml = 'project_key: APP\nproject_name: Test';
    const result = parseYaml(yaml);
    expect(result.project_key).toBe('APP');
  });
  
  it('should throw on invalid YAML', () => {
    const yaml = 'invalid: [unclosed';
    expect(() => parseYaml(yaml)).toThrow();
  });
  
  it('should validate schema', () => {
    const config = { project_key: 'APP' };
    expect(() => validateSchema(config)).toThrow('project_name is required');
  });
});
```

---

#### Business Logic

**Location**: `apps/web/lib/**/*.test.ts`

**Examples**:
- Issue key generation logic
- Workflow validation
- Status transition rules
- Custom field validation

**Test Cases**:
```typescript
// apps/web/lib/issues/key-generator.test.ts
describe('Issue Key Generator', () => {
  it('should generate unique keys per project', () => {
    const key1 = generateIssueKey('APP', 1);
    const key2 = generateIssueKey('APP', 2);
    expect(key1).toBe('APP-1');
    expect(key2).toBe('APP-2');
  });
  
  it('should format key correctly', () => {
    const key = generateIssueKey('PROJ', 123);
    expect(key).toMatch(/^PROJ-\d+$/);
  });
});
```

---

#### React Components (Atoms & Molecules)

**Location**: `packages/ui/components/**/*.test.tsx`

**Examples**:
- Button, Input, Badge components
- FormField, Card components
- MarkdownRenderer

**Test Cases**:
```typescript
// packages/ui/components/atoms/Button.test.tsx
describe('Button', () => {
  it('should render with correct variant', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });
  
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should be disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

#### Jotai Atoms

**Location**: `packages/ui/atoms/**/*.test.ts`

**Test Cases**:
```typescript
// packages/ui/atoms/user.test.ts
import { createStore } from 'jotai';
import { userAtom, isAuthenticatedAtom } from './user';

describe('User Atoms', () => {
  it('should update user atom', () => {
    const store = createStore();
    const user = { id: '1', email: 'test@example.com' };
    store.set(userAtom, user);
    expect(store.get(userAtom)).toEqual(user);
  });
  
  it('should derive isAuthenticated from user', () => {
    const store = createStore();
    store.set(userAtom, { id: '1', email: 'test@example.com' });
    expect(store.get(isAuthenticatedAtom)).toBe(true);
    
    store.set(userAtom, null);
    expect(store.get(isAuthenticatedAtom)).toBe(false);
  });
});
```

---

#### TanStack Query Hooks

**Location**: `apps/web/lib/queries/**/*.test.ts`

**Test Cases**:
```typescript
// apps/web/lib/queries/issues.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIssues } from './issues';
import { vi } from 'vitest';

describe('useIssues', () => {
  it('should fetch issues', async () => {
    const mockApi = vi.fn().mockResolvedValue({ data: [] });
    const queryClient = new QueryClient();
    
    const { result } = renderHook(
      () => useIssues('project-1'),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      }
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ data: [] });
  });
});
```

## Integration Testing

### Testing Framework
- **Vitest**: Test runner
- **Supertest**: HTTP assertions for API routes
- **Test Database**: Separate test PostgreSQL instance

### Test Database Setup

```typescript
// tests/setup/database.ts
import { PrismaClient } from '@stride/database';

export async function setupTestDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL,
      },
    },
  });
  
  // Clean database
  await prisma.$executeRaw`TRUNCATE TABLE "Issue", "Project", "User" CASCADE`;
  
  return prisma;
}

export async function teardownTestDatabase(prisma: PrismaClient) {
  await prisma.$disconnect();
}
```

### Integration Test Coverage

#### API Routes

**Location**: `apps/web/app/api/**/*.test.ts`

**Test Cases**:
```typescript
// apps/web/app/api/projects/[projectId]/issues/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase } from '@/tests/setup/database';

describe('POST /api/projects/:projectId/issues', () => {
  let prisma: PrismaClient;
  let project: Project;
  let user: User;
  let authToken: string;
  
  beforeAll(async () => {
    prisma = await setupTestDatabase();
    project = await createTestProject(prisma);
    user = await createTestUser(prisma);
    authToken = await createAuthToken(user);
  });
  
  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });
  
  it('should create issue with valid data', async () => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Issue',
        description: 'Test description',
      })
      .expect(201);
    
    expect(response.body.data.key).toMatch(/^APP-\d+$/);
    expect(response.body.data.title).toBe('Test Issue');
  });
  
  it('should reject issue creation without auth', async () => {
    await request(app)
      .post(`/api/projects/${project.id}/issues`)
      .send({ title: 'Test' })
      .expect(401);
  });
  
  it('should validate required fields', async () => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);
    
    expect(response.body.error.details).toContainEqual(
      expect.objectContaining({ field: 'title' })
    );
  });
});
```

---

#### Database Operations

**Location**: `packages/database/**/*.test.ts`

**Test Cases**:
```typescript
// packages/database/src/repositories/issue-repository.test.ts
import { describe, it, expect } from 'vitest';
import { IssueRepository } from './issue-repository';
import { setupTestDatabase } from '@/tests/setup/database';

describe('IssueRepository', () => {
  it('should create issue with custom fields', async () => {
    const repo = new IssueRepository(prisma);
    const issue = await repo.create({
      projectId: 'project-1',
      title: 'Test',
      customFields: { priority: 'High' },
    });
    
    expect(issue.customFields).toEqual({ priority: 'High' });
  });
  
  it('should generate unique issue keys per project', async () => {
    const repo = new IssueRepository(prisma);
    const issue1 = await repo.create({ projectId: 'project-1', title: 'Test 1' });
    const issue2 = await repo.create({ projectId: 'project-1', title: 'Test 2' });
    
    expect(issue1.key).toBe('APP-1');
    expect(issue2.key).toBe('APP-2');
  });
});
```

---

#### Webhook Processing

**Location**: `apps/web/app/api/webhooks/**/*.test.ts`

**Test Cases**:
```typescript
// apps/web/app/api/webhooks/github/route.test.ts
describe('GitHub Webhook', () => {
  it('should process branch creation webhook', async () => {
    const webhookPayload = {
      ref: 'refs/heads/feature/APP-123-auth',
      repository: { name: 'test-repo' },
    };
    
    const signature = generateHMAC(webhookPayload, secret);
    
    const response = await request(app)
      .post('/api/webhooks/github')
      .set('X-Hub-Signature-256', signature)
      .send(webhookPayload)
      .expect(200);
    
    // Verify issue status updated
    const issue = await getIssue('APP-123');
    expect(issue.status).toBe('in_progress');
  });
  
  it('should reject invalid signature', async () => {
    await request(app)
      .post('/api/webhooks/github')
      .set('X-Hub-Signature-256', 'invalid')
      .send({})
      .expect(401);
  });
});
```

---

#### Configuration Validation

**Location**: `packages/yaml-config/**/*.test.ts`

**Test Cases**:
```typescript
// packages/yaml-config/src/validator.test.ts
describe('Configuration Validator', () => {
  it('should validate complete configuration', () => {
    const config = {
      project_key: 'APP',
      project_name: 'Test',
      workflow: {
        default_status: 'todo',
        statuses: [
          { key: 'todo', name: 'To Do', type: 'open' },
        ],
      },
    };
    
    expect(() => validateConfig(config)).not.toThrow();
  });
  
  it('should reject duplicate status keys', () => {
    const config = {
      workflow: {
        statuses: [
          { key: 'todo', name: 'To Do', type: 'open' },
          { key: 'todo', name: 'Done', type: 'closed' },
        ],
      },
    };
    
    expect(() => validateConfig(config)).toThrow('Duplicate status key: todo');
  });
});
```

## End-to-End Testing

### Testing Framework
- **Playwright**: Browser automation
- **Test Database**: Isolated test instance
- **Test Server**: Separate Next.js instance for tests

### E2E Test Structure

```typescript
// tests/e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Issue Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await loginAsTestUser(page);
  });
  
  test('should create issue via command palette', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');
    await expect(page.getByPlaceholder('Search commands')).toBeVisible();
    
    // Create issue
    await page.fill('input[placeholder="Search commands"]', 'create issue');
    await page.keyboard.press('Enter');
    
    // Fill form
    await page.fill('input[name="title"]', 'Test Issue');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.click('button[type="submit"]');
    
    // Verify issue created
    await expect(page.getByText('APP-1')).toBeVisible();
  });
});
```

### E2E Test Scenarios

#### User Story 1: Initial Deployment and Onboarding

**Location**: `tests/e2e/onboarding.spec.ts`

**Test Cases**:
```typescript
test.describe('Onboarding Flow', () => {
  test('should complete initial setup', async ({ page }) => {
    // 1. Access application
    await page.goto('/');
    await expect(page.getByText('Create Admin Account')).toBeVisible();
    
    // 2. Create admin account
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    
    // 3. Link repository
    await expect(page.getByText('Link Repository')).toBeVisible();
    await page.fill('input[name="repositoryUrl"]', 'https://github.com/test/repo');
    await page.click('button:has-text("Connect")');
    
    // 4. Verify dashboard
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('test/repo')).toBeVisible();
  });
});
```

---

#### User Story 2: Issue Creation and Management

**Location**: `tests/e2e/issues.spec.ts`

**Test Cases**:
```typescript
test.describe('Issue Management', () => {
  test('should create issue with Mermaid diagram', async ({ page }) => {
    await page.goto('/projects/test-project/issues');
    
    // Create issue
    await page.keyboard.press('Meta+k');
    await page.fill('input[placeholder="Search commands"]', 'create issue');
    await page.keyboard.press('Enter');
    
    await page.fill('input[name="title"]', 'Test Issue');
    await page.fill('textarea[name="description"]', `
      # Test Issue
      
      \`\`\`mermaid
      graph TD
        A[Start] --> B[End]
      \`\`\`
    `);
    await page.click('button[type="submit"]');
    
    // Verify diagram rendered
    await expect(page.locator('svg.mermaid')).toBeVisible();
  });
  
  test('should move issue on Kanban board', async ({ page }) => {
    await page.goto('/projects/test-project/board');
    
    const issueCard = page.getByText('APP-1').locator('..');
    const targetColumn = page.getByText('In Progress').locator('..');
    
    await issueCard.dragTo(targetColumn);
    
    // Verify status updated
    await expect(issueCard).toBeVisible();
    await expect(page.getByText('APP-1')).toBeVisible();
  });
});
```

---

#### User Story 3: Configuration as Code

**Location**: `tests/e2e/config.spec.ts`

**Test Cases**:
```typescript
test.describe('Configuration Management', () => {
  test('should update workflow configuration', async ({ page }) => {
    await page.goto('/projects/test-project/settings/config');
    
    // Edit YAML
    const editor = page.locator('.cm-editor');
    await editor.fill(`
      project_key: APP
      workflow:
        statuses:
          - key: new_status
            name: New Status
            type: open
    `);
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify new status appears
    await expect(page.getByText('New Status')).toBeVisible();
  });
  
  test('should show validation errors', async ({ page }) => {
    await page.goto('/projects/test-project/settings/config');
    
    const editor = page.locator('.cm-editor');
    await editor.fill('invalid: yaml: [unclosed');
    
    // Verify error shown
    await expect(page.getByText('YAML syntax error')).toBeVisible();
  });
});
```

---

#### User Story 4: Git Integration

**Location**: `tests/e2e/git-integration.spec.ts`

**Test Cases**:
```typescript
test.describe('Git Integration', () => {
  test('should update issue status from webhook', async ({ request }) => {
    // Simulate GitHub webhook
    const webhookPayload = {
      ref: 'refs/heads/feature/APP-123-auth',
      repository: { name: 'test-repo' },
    };
    
    const response = await request.post('/api/webhooks/github', {
      data: webhookPayload,
      headers: {
        'X-Hub-Signature-256': generateSignature(webhookPayload),
      },
    });
    
    expect(response.status()).toBe(200);
    
    // Verify issue status updated
    const page = await browser.newPage();
    await page.goto('/projects/test-project/issues/APP-123');
    await expect(page.getByText('In Progress')).toBeVisible();
  });
});
```

---

#### User Story 5: Sprint Planning

**Location**: `tests/e2e/sprints.spec.ts`

**Test Cases**:
```typescript
test.describe('Sprint Planning', () => {
  test('should create sprint and assign issues', async ({ page }) => {
    await page.goto('/projects/test-project/cycles');
    
    // Create sprint
    await page.click('button:has-text("New Sprint")');
    await page.fill('input[name="name"]', 'Sprint 1');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-14');
    await page.click('button[type="submit"]');
    
    // Assign issues
    await page.goto('/projects/test-project/cycles/sprint-1');
    const issue = page.getByText('APP-1');
    await issue.dragTo(page.getByText('Sprint Issues'));
    
    // Verify assignment
    await expect(page.getByText('APP-1')).toBeVisible();
  });
  
  test('should display burndown chart', async ({ page }) => {
    await page.goto('/projects/test-project/cycles/sprint-1');
    
    // Verify chart rendered
    await expect(page.locator('svg.recharts-surface')).toBeVisible();
  });
});
```

## Test Data Management

### Fixtures

**Location**: `tests/fixtures/**/*.ts`

```typescript
// tests/fixtures/projects.ts
export async function createTestProject(prisma: PrismaClient) {
  return prisma.project.create({
    data: {
      key: 'TEST',
      name: 'Test Project',
      configYaml: defaultConfig,
      config: parseConfig(defaultConfig),
    },
  });
}

export async function createTestIssue(prisma: PrismaClient, projectId: string) {
  return prisma.issue.create({
    data: {
      projectId,
      key: 'TEST-1',
      title: 'Test Issue',
      status: 'todo',
      reporterId: 'user-1',
    },
  });
}
```

### Test Utilities

**Location**: `tests/utils/**/*.ts`

```typescript
// tests/utils/auth.ts
export async function createAuthToken(user: User) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
}

export async function loginAsTestUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}
```

## Test Coverage Goals

### Unit Tests
- **Target**: 80% coverage
- **Focus**: Utilities, business logic, components
- **Critical**: 100% coverage for validation, key generation, parsing

### Integration Tests
- **Target**: 70% coverage
- **Focus**: API routes, database operations, webhooks
- **Critical**: 100% coverage for authentication, authorization

### E2E Tests
- **Target**: All P1 user stories
- **Focus**: Critical user journeys
- **Critical**: Onboarding, issue creation, configuration

## Continuous Integration

### Test Execution

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:e2e
```

### Test Commands

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --dir packages apps/web/lib",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Performance Testing

### Load Testing

- API endpoint load testing (k6 or similar)
- Database query performance
- Webhook processing under load

### Visual Regression

- Storybook visual tests
- Screenshot comparisons
- Component visual regression

## Accessibility Testing

### Automated

- axe-core for accessibility violations
- Lighthouse accessibility audits
- Keyboard navigation tests

### Manual

- Screen reader testing
- Keyboard-only navigation
- Color contrast verification


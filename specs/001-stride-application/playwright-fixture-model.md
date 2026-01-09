# Playwright E2E Testing - Fixture and Utility Data Model

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-02  
**Status**: Design Complete  
**Related Plan**: `playwright-reorganization-plan.md`

## Overview

This document defines the data models, interfaces, and contracts for Playwright E2E test fixtures and utilities. Fixtures provide shared test infrastructure with automatic isolation, while utilities provide reusable helper functions.

## Fixture Models

### Authentication Fixtures (`e2e/fixtures/auth.ts`)

#### Type Definitions

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  role: 'Admin' | 'Member' | 'Viewer';
}

interface AuthFixtures {
  authenticatedPage: Page;
  loginAsUser: (email: string, password: string) => Promise<void>;
  mockAuth: (user?: Partial<User>) => Promise<void>;
  mockLogin: (options?: LoginOptions) => Promise<void>;
}

interface LoginOptions {
  success?: boolean;
  delay?: number;
}
```

#### Fixture Behaviors

**`authenticatedPage`**:
- **Type**: `Page`
- **Purpose**: Pre-authenticated page ready for testing authenticated flows
- **Usage**: `test('authenticated flow', async ({ authenticatedPage }) => { ... })`
- **Behavior**: 
  - Automatically logs in before test
  - Uses default test user or configured user
  - Page is isolated per test

**`loginAsUser`**:
- **Type**: `(email: string, password: string) => Promise<void>`
- **Purpose**: Programmatic login helper
- **Usage**: `await loginAsUser('user@example.com', 'password123')`
- **Behavior**:
  - Navigates to login page
  - Fills email and password fields
  - Submits form
  - Waits for navigation to complete

**`mockAuth`**:
- **Type**: `(user?: Partial<User>) => Promise<void>`
- **Purpose**: Mock `/api/auth/me` endpoint
- **Usage**: `await mockAuth({ email: 'custom@example.com' })`
- **Behavior**:
  - Routes `/api/auth/me` to return user data
  - Uses provided user or defaults to test user
  - Cleans up after test

**`mockLogin`**:
- **Type**: `(options?: LoginOptions) => Promise<void>`
- **Purpose**: Mock `/api/auth/login` endpoint
- **Usage**: `await mockLogin({ success: false })` for failed login
- **Behavior**:
  - Routes `/api/auth/login` to return success/error
  - Configurable success/failure scenarios
  - Optional delay for testing loading states

---

### Project Fixtures (`e2e/fixtures/projects.ts`)

#### Type Definitions

```typescript
interface MockProject {
  id: string;
  key: string;
  name: string;
  config?: ProjectConfig;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectConfig {
  workflow?: WorkflowConfig;
  customFields?: CustomField[];
  [key: string]: unknown;
}

interface WorkflowConfig {
  default_status: string;
  statuses: Status[];
  transitions?: Transition[];
}

interface Status {
  key: string;
  name: string;
  type: 'open' | 'closed';
}

interface Transition {
  from: string;
  to: string;
  requires?: string[];
}

interface CustomField {
  key: string;
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date';
  required?: boolean;
  options?: string[];
}

interface ProjectsListResponse {
  total: number;
  items: MockProject[];
  page?: number;
  pageSize?: number;
}

interface ProjectFixtures {
  mockProject: (project: MockProject) => Promise<void>;
  mockProjectsList: (projects: MockProject[]) => Promise<void>;
  testProjects: ProjectFactories;
}

interface ProjectFactories {
  withOnboarding: () => MockProject;
  withoutOnboarding: () => MockProject;
  withCustomFields: (fields: CustomField[]) => MockProject;
  withWorkflow: (workflow: WorkflowConfig) => MockProject;
}
```

#### Fixture Behaviors

**`mockProject`**:
- **Type**: `(project: MockProject) => Promise<void>`
- **Purpose**: Mock single project endpoint (`/api/projects/:id`)
- **Usage**: `await mockProject(testProjects.withOnboarding())`
- **Behavior**:
  - Routes `/api/projects/{project.id}` to return project data
  - Handles both GET and potentially PATCH requests
  - Cleans up after test

**`mockProjectsList`**:
- **Type**: `(projects: MockProject[]) => Promise<void>`
- **Purpose**: Mock projects list endpoint (`/api/projects`)
- **Usage**: `await mockProjectsList([project1, project2])`
- **Behavior**:
  - Routes `/api/projects*` to return paginated list
  - Handles query parameters (page, pageSize)
  - Returns total count and items array
  - Cleans up after test

**`testProjects`**:
- **Type**: `ProjectFactories`
- **Purpose**: Factory functions for common project configurations
- **Usage**: `const project = testProjects.withOnboarding()`
- **Factories**:
  - `withOnboarding()`: Project with complete onboarding (has config, statuses)
  - `withoutOnboarding()`: Empty project (no config, new user scenario)
  - `withCustomFields(fields)`: Project with custom fields defined
  - `withWorkflow(workflow)`: Project with specific workflow configuration

---

### User Fixtures (`e2e/fixtures/users.ts`) - Optional

#### Type Definitions

```typescript
interface UserData {
  id: string;
  email: string;
  username: string;
  role: 'Admin' | 'Member' | 'Viewer';
  createdAt?: string;
}

interface UserFixtures {
  mockUser: (user?: Partial<UserData>) => Promise<void>;
  testUsers: UserFactories;
}

interface UserFactories {
  admin: () => UserData;
  member: () => UserData;
  viewer: () => UserData;
}
```

**Note**: User fixtures may not be needed initially if authentication fixtures cover user mocking. Created if needed for user management tests.

---

## Utility Models

### API Helpers (`e2e/utils/api-helpers.ts`)

#### Function Signatures

```typescript
// Authentication helpers
export async function mockAuthRoute(
  page: Page,
  user?: Partial<User>
): Promise<void>;

export async function mockLoginRoute(
  page: Page,
  options?: LoginOptions
): Promise<void>;

// Project helpers
export async function mockProjectRoute(
  page: Page,
  project: MockProject
): Promise<void>;

export async function mockProjectsListRoute(
  page: Page,
  projects: MockProject[],
  options?: { page?: number; pageSize?: number }
): Promise<void>;

// Generic route helpers
export async function mockRoute(
  page: Page,
  url: string | RegExp,
  handler: (route: Route) => Promise<void>
): Promise<void>;

export async function mockJsonResponse(
  page: Page,
  url: string | RegExp,
  data: unknown,
  status?: number
): Promise<void>;
```

#### Behavior

- **Route Interception**: Uses Playwright's `page.route()` API
- **Automatic Cleanup**: Routes cleared between tests (Playwright handles this)
- **Flexible Matching**: Supports string URLs and RegExp patterns
- **Error Handling**: Throws descriptive errors if route setup fails

---

### Page Helpers (`e2e/utils/page-helpers.ts`)

#### Function Signatures

```typescript
// Navigation helpers
export async function waitForNavigation(
  page: Page,
  url?: string | RegExp,
  timeout?: number
): Promise<void>;

export async function navigateAndWait(
  page: Page,
  url: string,
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'
): Promise<void>;

// Form helpers
export async function fillForm(
  page: Page,
  fields: Record<string, string>
): Promise<void>;

export async function submitForm(
  page: Page,
  selector?: string
): Promise<void>;

// Interaction helpers
export async function clickAndWait(
  page: Page,
  selector: string,
  waitFor?: string | RegExp
): Promise<void>;

export async function typeSlowly(
  page: Page,
  selector: string,
  text: string,
  delay?: number
): Promise<void>;

// Assertion helpers
export async function expectVisible(
  page: Page,
  selector: string,
  timeout?: number
): Promise<void>;

export async function expectText(
  page: Page,
  text: string | RegExp,
  options?: { exact?: boolean }
): Promise<void>;
```

#### Behavior

- **Error Handling**: Includes timeouts and retries
- **Type Safety**: Fully typed with TypeScript
- **Accessibility**: Uses accessible selectors (roles, labels) when possible
- **Performance**: Optimized selectors and waiting strategies

---

### Test Helpers (`e2e/utils/test-helpers.ts`)

#### Function Signatures

```typescript
// Retry helpers
export async function retry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; delay?: number }
): Promise<T>;

// Data generators
export function generateEmail(prefix?: string): string;
export function generateProjectKey(prefix?: string): string;
export function generateIssueKey(projectKey: string, number?: number): string;

// Time helpers
export function wait(ms: number): Promise<void>;
export function formatDate(date: Date): string;

// Assertion helpers
export function assertNotEmpty<T>(value: T | null | undefined): asserts value is T;
export function assertIsDefined<T>(value: T | undefined): asserts value is T;
```

#### Behavior

- **Retry Logic**: Exponential backoff for flaky operations
- **Data Generation**: Deterministic test data (uses seeds when needed)
- **Type Guards**: TypeScript type narrowing utilities
- **Utilities**: Common operations needed across tests

---

## State Transitions

### Authentication Flow

```
Unauthenticated → [loginAsUser] → Authenticated
Authenticated → [page.goto('/login')] → Unauthenticated (if logout)
```

### Test Isolation

```
Test Start → [Fixtures Setup] → Test Execution → [Fixtures Teardown] → Test End
```

- Each test gets fresh fixtures
- Routes reset between tests
- Page state cleared
- No shared state between tests

---

## Validation Rules

### MockProject Validation
- `id`: Required, non-empty string
- `key`: Required, uppercase string, matches `/^[A-Z0-9]+$/`
- `name`: Required, non-empty string, max 255 characters
- `config`: Optional, must be valid JSON structure if provided

### User Validation
- `id`: Required, non-empty string
- `email`: Required, valid email format
- `username`: Required, non-empty string, max 50 characters
- `role`: Required, one of: 'Admin', 'Member', 'Viewer'

### Route Validation
- URL patterns: Must be valid string or RegExp
- Response status: Must be valid HTTP status code (200-599)
- JSON responses: Must be valid JSON (validated at runtime)

---

## Error Handling

### Fixture Errors
- **Setup Failure**: Test fails immediately with descriptive error
- **Teardown Failure**: Logged but doesn't fail test (Playwright handles cleanup)
- **Type Errors**: Caught at compile time (TypeScript)

### Utility Errors
- **Route Setup Failure**: Throws error with URL and reason
- **Navigation Timeout**: Throws timeout error with expected URL
- **Form Fill Failure**: Throws error with field name and selector

---

## Future Extensibility

### Planned Additions
- Database fixtures (if integration tests needed)
- Visual regression helpers (screenshot comparison)
- Performance testing helpers (metrics collection)
- Accessibility testing helpers (axe-core integration)

### Extension Points
- Fixtures can be composed (e.g., `authenticatedProjectPage`)
- Utilities can be extended with domain-specific helpers
- Factories can be extended with more test data variants

# Implementation Plan: Project Import from Git Providers

**Feature Branch**: `008-project-import`  
**Created**: 2026-01-23  
**Status**: Planning Complete (Phase 0-2)  
**Feature Spec**: `specs/008-project-import/spec.md`

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM (existing)
- **Authentication**: HTTP-only cookies with JWT tokens, OAuth for GitHub/GitLab (existing)
- **State Management**: TanStack Query for server state, React state for local UI
- **Styling**: Tailwind CSS with custom design tokens (existing)
- **UI Components**: Reuse existing components from `packages/ui`

### Dependencies
- **Existing API**: `/api/projects` endpoint (POST for creation)
- **Existing Repository**: `projectRepository` with `create` method
- **Existing Integration Functions**: GitHub/GitLab OAuth and API functions in `apps/web/src/lib/integrations/`
- **Existing Config Sync**: `syncConfigFromRepository` function
- **Existing Webhook Registration**: `registerWebhook` function
- **Existing Types**: `Project`, `RepositoryServiceType` from `packages/types`
- **Existing Auth**: `requireAuth` middleware for route protection

### Integrations
- **GitHub API**: Repository listing via `/user/repos` endpoint
- **GitLab API**: Project listing via `/api/v4/projects` endpoint
- **OAuth Flow**: Reuse existing GitHub/GitLab OAuth integration
- **Configuration Sync**: Reuse existing `syncConfigFromRepository` logic
- **Webhook Registration**: Reuse existing webhook registration flow

### Architecture Decisions
- **Server Components First**: Repository listing and import pages will use Server Components for data fetching
- **Client Components for Interactions**: Repository selection, OAuth flow, and import confirmation will use client components
- **Reuse Existing Patterns**: Follow same patterns as repository connection flow (`/api/projects/[projectId]/repositories`)
- **API Endpoints**: New endpoints for repository listing and import, following RESTful conventions
- **Error Handling**: Use Next.js error boundaries and consistent error response format
- **OAuth State Management**: Reuse existing OAuth state handling patterns
- **Project Key Generation**: Auto-generate keys from repository names with conflict resolution

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Repository listing API endpoints - GitHub `/user/repos`, GitLab `/api/v4/projects`
- ✅ **RESOLVED**: Pagination strategy - Use API pagination (per_page/page parameters)
- ✅ **RESOLVED**: Project key generation - Extract from repository name, uppercase, validate uniqueness
- ✅ **RESOLVED**: Repository import flow - Combine project creation + repository connection in single transaction
- ✅ **RESOLVED**: OAuth token scope - Reuse existing scopes (repo, admin:repo_hook for GitHub; api, read_repository, write_repository for GitLab)
- ✅ **RESOLVED**: Webhook registration failure behavior - Fail entire import and rollback transaction

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied - Repository pattern for data access, service layer for business logic
- [x] DRY, YAGNI, KISS followed - Reuse existing functions, no over-engineering
- [x] Type safety enforced - TypeScript strict mode, Zod validation schemas
- [x] Security best practices - OAuth flow, input validation, encrypted credentials
- [x] Accessibility requirements met - Semantic HTML, keyboard navigation, screen reader support

### Code Quality Gates
- [x] No `any` types - Use proper TypeScript types
- [x] Proper error handling - Try/catch with meaningful error messages
- [x] Input validation - Zod schemas for all API inputs
- [x] Test coverage planned - Unit tests for utilities, integration tests for API routes

## Phase 0: Outline & Research

### Research Tasks
- [x] Resolve all NEEDS CLARIFICATION items - All resolved based on existing codebase patterns
- [x] Research GitHub/GitLab API patterns - Repository listing endpoints identified
- [x] Identify integration patterns - Reuse existing OAuth and API integration patterns

### Research Output
- [x] `research.md` generated with all clarifications resolved

## Phase 1: Design & Contracts

### Data Model
- [x] `data-model.md` generated
- [x] Entities defined with relationships
- [x] Validation rules documented

### API Contracts
- [x] REST endpoints defined
- [x] Request/response schemas documented
- [x] Contracts saved to `/contracts/`

### Quickstart
- [x] `quickstart.md` generated
- [x] Setup instructions documented

### Agent Context
- [x] No new technologies introduced - reuses existing stack
- [x] Agent context update not required (no new technologies)

## Phase 2: Implementation Planning

### Component Structure
- [x] Components identified
- [x] Component hierarchy defined
- [x] Props/interfaces designed

**Component Hierarchy**:

```
apps/web/app/projects/
  ├── import/
  │   └── page.tsx (Server Component - auth + renders client component)
  └── page.tsx (Server Component - enhanced with Create Project button)

apps/web/src/components/features/projects/
  ├── CreateProjectModal.tsx (Client Component - modal for project creation)
  ├── CreateProjectForm.tsx (Client Component - reusable project creation form)
  ├── RepositoryImportFlow.tsx (Client Component - main import UI)
  ├── RepositoryList.tsx (Client Component - repository selection)
  ├── RepositoryImportForm.tsx (Client Component - import confirmation)
  └── RepositoryListSkeleton.tsx (Client Component - loading state)
```

**Component Details**:

- **`/projects/page.tsx`** (Server Component - ENHANCED):
  - Handles authentication via `requireAuth`
  - Fetches projects list with pagination
  - Renders projects grid with "Create Project" button in top-right header
  - Button opens `CreateProjectModal` (client component wrapper)
  - After successful creation, page refreshes to show new project

- **`CreateProjectModal.tsx`** (Client Component - NEW):
  - Modal wrapper for project creation form
  - Manages modal open/close state
  - Handles form submission via API
  - Shows success toast and closes modal on success
  - Refreshes page to show new project
  - Props:
    ```typescript
    interface CreateProjectModalProps {
      open: boolean;
      onClose: () => void;
    }
    ```

- **`CreateProjectForm.tsx`** (Client Component - NEW):
  - Reusable project creation form component
  - Extracted from `/onboarding/project/page.tsx`
  - Handles form state, validation, and submission
  - Supports optional repository URL/type fields
  - Can be used in both onboarding (full page) and modal contexts
  - Props:
    ```typescript
    interface CreateProjectFormProps {
      onSubmit: (data: CreateProjectInput) => Promise<void>;
      onCancel?: () => void;
      initialValues?: Partial<CreateProjectInput>;
      isSubmitting?: boolean;
      error?: string | null;
      mode?: 'onboarding' | 'modal'; // Controls styling/layout
    }
    ```

- **`/projects/import/page.tsx`** (Server Component):
  - Handles authentication via `requireAuth`
  - Checks infrastructure OAuth configuration status
  - Renders `RepositoryImportFlow` client component
  - Handles error states and redirects

- **`RepositoryImportFlow.tsx`** (Client Component):
  - Main orchestrator for import flow
  - Manages flow state: provider selection → OAuth → repository list → import confirmation
  - Handles OAuth callback processing
  - Manages error states and loading states
  - Props: None (self-contained flow)

- **`RepositoryList.tsx`** (Client Component):
  - Displays paginated list of repositories from git provider
  - Handles repository selection
  - Shows repository details (name, description, URL, connection status)
  - Supports search/filter (optional enhancement)
  - Props:
    ```typescript
    interface RepositoryListProps {
      repositories: RepositoryInfo[];
      pagination: PaginationInfo;
      onSelectRepository: (repository: RepositoryInfo) => void;
      onPageChange: (page: number) => void;
      loading?: boolean;
    }
    ```

- **`RepositoryImportForm.tsx`** (Client Component):
  - Displays import confirmation form
  - Shows repository details (read-only)
  - Allows editing project key and name
  - Shows validation errors
  - Handles form submission
  - Props:
    ```typescript
    interface RepositoryImportFormProps {
      repository: RepositoryInfo;
      onSubmit: (data: ImportProjectData) => Promise<void>;
      onCancel: () => void;
      loading?: boolean;
      error?: string | null;
    }
    ```

**File Structure**:

```
apps/web/
├── app/
│   ├── api/
│   │   ├── repositories/
│   │   │   └── list/
│   │   │       └── route.ts (NEW - repository listing endpoint)
│   │   └── projects/
│   │       ├── route.ts (ENHANCE - already supports repositoryUrl/repositoryType)
│   │       └── import/
│   │           └── route.ts (NEW - project import endpoint)
│   ├── onboarding/
│   │   └── project/
│   │       └── page.tsx (REFACTOR - use CreateProjectForm component)
│   └── projects/
│       ├── page.tsx (ENHANCE - add Create Project button + modal)
│       └── import/
│           └── page.tsx (NEW - import page)
└── src/
    ├── components/
    │   └── features/
    │       └── projects/
    │           ├── CreateProjectModal.tsx (NEW - modal wrapper)
    │           ├── CreateProjectForm.tsx (NEW - reusable form)
    │           ├── RepositoryImportFlow.tsx (NEW)
    │           ├── RepositoryList.tsx (NEW)
    │           ├── RepositoryImportForm.tsx (NEW)
    │           └── RepositoryListSkeleton.tsx (NEW)
    └── lib/
        ├── integrations/
        │   ├── github.ts (ENHANCE - add listGitHubRepositories - already done)
        │   └── gitlab.ts (ENHANCE - add listGitLabRepositories - already done)
        └── utils/
            └── project-key.ts (NEW - project key generation utility)
```

### State Management
- [x] State requirements identified
- [x] State management strategy chosen
- [x] State flow documented

**State Requirements**:

1. **Project Creation Modal State** (React useState):
   - Modal open/close state
   - Form submission state
   - Error state

2. **Project Creation Form State** (React Hook Form):
   - Project key, name, description
   - Optional repository URL and type
   - Validation state
   - Submission state

3. **Repository Listing State** (TanStack Query):
   - Fetched repositories list
   - Pagination metadata
   - Loading/error states
   - Cache management

4. **OAuth Flow State** (URL + sessionStorage):
   - OAuth state parameter for CSRF protection
   - Return URL after OAuth callback
   - Provider type (GitHub/GitLab)

5. **Import Form State** (React Hook Form):
   - Selected repository
   - Project key (editable)
   - Project name (editable)
   - Validation state
   - Submission state

6. **Flow Navigation State** (React useState):
   - Current step in import flow
   - Selected provider type
   - Access token (temporary, cleared after import)

**State Management Strategy**:

- **React useState**:
  - Modal open/close state (CreateProjectModal)
  - Flow step navigation (RepositoryImportFlow)
  - Temporary OAuth state
  - UI state (loading, errors)

- **React Hook Form** (`react-hook-form`):
  - Project creation form state and validation (CreateProjectForm)
  - Import form state and validation (RepositoryImportForm)
  - Zod schema for validation (reuse project validation schemas)

- **TanStack Query** (`@tanstack/react-query`):
  - Repository listing: `useQuery` for fetching, `useMutation` for import
  - Query keys: `['repositories', providerType, page]`, `['import-project']`
  - Cache invalidation after successful import/project creation

- **URL State** (Next.js searchParams):
  - OAuth callback parameters (code, state)
  - Return URL after OAuth

- **sessionStorage**:
  - OAuth state parameter (CSRF protection)
  - Temporary access token storage (if needed)

**State Flow**:

1. **User navigates to `/projects` (projects listing page)**:
   - Server component renders projects list
   - "Create Project" button visible in top-right header
   - User clicks button → opens `CreateProjectModal`

2. **User creates project via modal**:
   - Modal opens with `CreateProjectForm`
   - User fills form (key, name, description, optional repository URL)
   - Form validates using Zod schema
   - On submit, calls `/api/projects` endpoint
   - On success: modal closes, page refreshes, new project appears in list
   - On error: error message displayed in form

3. **User navigates to `/projects/import`** (repository import flow):
   - Server component renders `RepositoryImportFlow`
   - Client component initializes with provider selection step

4. **User selects git provider (GitHub/GitLab)**:
   - Component initiates OAuth flow
   - Stores state in sessionStorage
   - Redirects to OAuth provider

5. **OAuth callback returns**:
   - Server component extracts code and state from URL
   - Validates state parameter
   - Exchanges code for access token
   - Stores token temporarily (or passes to client component)
   - Client component fetches repository list using TanStack Query

6. **User views repository list**:
   - TanStack Query fetches repositories (with pagination)
   - Component displays list with loading/error states
   - User selects repository

7. **User confirms import**:
   - Form validates project key and name
   - On submit, TanStack Query mutation calls import API
   - On success, invalidate queries, redirect to project page
   - On error, display error message

### Testing Strategy
- [x] Unit test plan
- [x] Integration test plan
- [x] E2E test scenarios

**Unit Tests**:

1. **Repository Listing Functions** (`apps/web/src/lib/integrations/github.ts`, `gitlab.ts`):
   - `listGitHubRepositories()` - Success cases, pagination, error handling
   - `listGitLabRepositories()` - Success cases, pagination, error handling
   - Test with mock fetch responses

2. **Project Key Generation** (`apps/web/src/lib/utils/project-key.ts` - new utility):
   - Generate key from repository name
   - Handle special characters
   - Conflict resolution (append numbers)
   - Validation

3. **CreateProjectForm Component** (`CreateProjectForm.tsx`):
   - Form validation (Zod schema)
   - Project key, name, description fields
   - Optional repository URL/type fields
   - Error display
   - Submit handler
   - Both onboarding and modal modes

4. **CreateProjectModal Component** (`CreateProjectModal.tsx`):
   - Modal open/close behavior
   - Form submission handling
   - Success toast and page refresh
   - Error handling

5. **Import Form Component** (`RepositoryImportForm.tsx`):
   - Form validation
   - Project key editing
   - Error display
   - Submit handler

6. **Repository List Component** (`RepositoryList.tsx`):
   - Repository rendering
   - Selection handling
   - Pagination controls
   - Loading/error states

**Integration Tests**:

1. **Project Creation API** (`/api/projects` - ENHANCED):
   - Success case with optional repository URL/type
   - Validation (project key uniqueness, repository URL format)
   - Error handling (duplicate key, invalid URL)

2. **Repository Listing API** (`/api/repositories/list`):
   - Success cases (GitHub, GitLab)
   - Pagination
   - Authentication validation
   - Error handling (invalid token, provider errors)
   - Response format validation

3. **Project Import API** (`/api/projects/import`):
   - Success case (full import flow)
   - Duplicate repository detection
   - Project key conflict handling
   - Configuration sync (with/without stride.config.yaml)
   - Webhook registration
   - Transaction rollback on webhook failure
   - Error handling (invalid repository, access denied, network errors)

**E2E Tests** (Playwright):

1. **Project Creation via Modal**:
   - Navigate to projects listing page
   - Click "Create Project" button (top-right)
   - Modal opens with project creation form
   - Fill form and submit
   - Verify modal closes
   - Verify new project appears in list
   - Verify page refresh shows new project

2. **Project Creation with Repository URL**:
   - Open create project modal
   - Fill form with repository URL and type
   - Submit
   - Verify project created with repository URL stored
   - Verify repository connection not automatically established

3. **Repository Import Flow**:
   - Navigate to import page
   - Select GitHub provider
   - Complete OAuth flow (mocked)
   - View repository list
   - Select repository
   - Confirm import with default settings
   - Verify project created
   - Verify repository connected
   - Verify webhooks registered

4. **Import with Custom Project Key**:
   - Complete import flow
   - Edit project key in confirmation form
   - Submit import
   - Verify project created with custom key

5. **Error Handling**:
   - Attempt project creation with duplicate key
   - Verify error message displayed
   - Attempt import with duplicate repository
   - Verify error message displayed
   - Attempt import with invalid project key
   - Verify validation errors

6. **Repository Listing Pagination**:
   - View repository list with many repositories
   - Navigate to next page
   - Verify pagination works correctly

**Test Files Structure**:

```
apps/web/src/
├── lib/
│   ├── integrations/
│   │   ├── github.test.ts (unit tests)
│   │   └── gitlab.test.ts (unit tests)
│   └── utils/
│       └── project-key.test.ts (unit tests - new)
├── components/
│   └── features/
│       └── projects/
│           ├── CreateProjectForm.test.tsx (unit tests - new)
│           ├── CreateProjectModal.test.tsx (unit tests - new)
│           ├── RepositoryImportForm.test.tsx (unit tests)
│           └── RepositoryList.test.tsx (unit tests)
└── app/
    ├── api/
    │   ├── projects/
    │   │   └── route.test.ts (integration tests - enhanced)
    │   ├── repositories/
    │   │   └── list/
    │   │       └── route.test.ts (integration tests)
    │   └── projects/
    │       └── import/
    │           └── route.test.ts (integration tests)
└── e2e/
    └── project-import.spec.ts (E2E tests - enhanced)
```

## Phase 3: Implementation

### Tasks
- [ ] Implementation tasks created
- [ ] Dependencies identified
- [ ] Estimated effort

## Notes

- **User Story 1 (Manual Project Creation)**:
  - Modal approach for post-onboarding project creation (clarified in spec)
  - Button placement: top-right of projects listing page header
  - Reusable `CreateProjectForm` component extracted from onboarding page
  - Modal pattern follows existing `CreateIssueModal` and `CreateCycleModal` patterns
  - Repository URL storage only (no automatic connection) - clarified in spec

- **User Stories 2-3 (Repository Import)**:
  - Building on existing repository connection functionality - reuse OAuth flows and API integration patterns
  - Repository listing endpoints are new but follow existing API patterns
  - Project import combines existing project creation and repository connection logic
  - All functionality builds on existing infrastructure (OAuth config, webhook registration, config sync)
  - Webhook registration failures cause transaction rollback (clarified in spec)

- **Component Reuse**:
  - `CreateProjectForm` used in both onboarding (full page) and modal contexts
  - Form supports `mode` prop to adjust styling/layout for different contexts
  - Existing validation schemas reused (`createProjectSchema` from `lib/validation/project.ts`)

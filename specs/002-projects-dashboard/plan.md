# Implementation Plan: Projects Dashboard and Listing Page

**Feature Branch**: `002-projects-dashboard`  
**Created**: 2024-12-19  
**Status**: Planning Complete (Phase 0-1)  
**Feature Spec**: `specs/002-projects-dashboard/spec.md`

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM (existing)
- **Authentication**: HTTP-only cookies with JWT tokens (existing)
- **State Management**: TanStack Query for server state, React state for local UI
- **Styling**: Tailwind CSS with custom design tokens (existing)
- **UI Components**: Reuse existing components from `packages/ui`

### Dependencies
- **Existing API**: `/api/projects` endpoint already exists with pagination support
- **Existing Repository**: `projectRepository` with `findManyPaginated` method
- **Existing Types**: `Project` type from `packages/types`
- **Existing Auth**: `requireAuth` middleware for route protection
- **Existing Components**: Button, Card (if available) from `packages/ui`

### Architecture Decisions
- **Server Component First**: Projects listing page will be a Server Component that fetches data directly
- **Client Component for Interactions**: Project cards and navigation will use client components where needed
- **Reuse Existing Patterns**: Follow same patterns as `/projects/[projectId]/board/page.tsx`
- **Simple Data Fetching**: Use direct repository calls in Server Component, no need for additional API layer
- **Error Handling**: Use Next.js error boundaries and error.tsx pattern
- **Empty State**: Client component to handle empty state UI

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Projects listing uses existing `/api/projects` endpoint - no new API needed
- ✅ **RESOLVED**: Issue count calculation - use aggregation query via repository or count relation
- ✅ **RESOLVED**: Last activity timestamp - use `updatedAt` from Project model or calculate from latest issue update
- ✅ **RESOLVED**: Empty state navigation - link to onboarding flow or project creation

All clarifications resolved. See `research.md` for detailed decisions and rationale.

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied
  - Single Responsibility: Projects listing page handles only project display, separate components for cards
  - Open/Closed: Reuse existing repository and API patterns
  - Liskov Substitution: Use existing Project type interfaces
  - Interface Segregation: Minimal, focused components
  - Dependency Inversion: Depend on repository interface, not implementation
- [x] DRY, YAGNI, KISS followed
  - Reuse existing API and repository methods
  - MVP focus: Basic listing first, enhancements later
  - Simple server component approach
- [x] Type safety enforced
  - TypeScript strict mode
  - Reuse existing Project types
  - No `any` types
- [x] Security best practices
  - Auth at route level (requireAuth middleware)
  - Server-side data fetching (no client-side API exposure)
  - Input validation not needed (read-only listing)
- [x] Accessibility requirements met
  - WCAG 2.1 AA compliance for project cards
  - Keyboard navigation for project links
  - Screen reader support for project information
  - Semantic HTML structure

### Code Quality Gates
- [x] No `any` types (reuse existing Project type)
- [x] Error handling implemented (try/catch in server component, error.tsx)
- [x] Input validation (not applicable - read-only listing)
- [x] Authentication required (requireAuth middleware)
- [x] Type safety (strict TypeScript)

## Phase 0: Research & Clarification

### Research Findings

See `research.md` for detailed research findings on:
1. Issue count aggregation approach
2. Last activity calculation method
3. Empty state navigation pattern
4. Project card component design
5. Error state handling patterns

## Phase 1: Design & Contracts

### Data Model

**No schema changes required** - Existing Project model is sufficient:

```prisma
model Project {
  id             String   @id @default(uuid())
  key            String   @unique
  name           String
  description    String?
  repositoryUrl  String?
  repositoryType RepositoryServiceType?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  issues         Issue[]
  // ... other relations
}
```

**Additional Data Requirements**:
- Issue count per project (calculated via aggregation)
- Last activity timestamp (use `updatedAt` or max issue `updatedAt`)

### API Contracts

**No new API endpoints required** - Reuse existing:

#### GET /api/projects
**Purpose**: List all projects accessible to current user

**Request**:
```
GET /api/projects?page=1&pageSize=20
```

**Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "key": "APP",
      "name": "My App",
      "description": "Project description",
      "repositoryUrl": "https://github.com/...",
      "repositoryType": "GitHub",
      "createdAt": "2024-12-19T...",
      "updatedAt": "2024-12-19T..."
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

**Enhancement Consideration**: Add issue count and last activity to response if needed for performance, but can calculate client-side initially.

### Component Structure

#### ProjectsListingPage (Server Component)
**Location**: `apps/web/app/projects/page.tsx`
**Purpose**: Main projects listing page route
**Responsibilities**:
- Fetch projects from repository
- Render project cards
- Handle empty state
- Error handling

#### ProjectCard (Client Component)
**Location**: `packages/ui/src/molecules/ProjectCard.tsx` or `apps/web/components/ProjectCard.tsx`
**Purpose**: Display individual project information
**Props**:
```typescript
interface ProjectCardProps {
  project: Project;
  issueCount?: number;
  lastActivity?: Date;
}
```

#### ProjectsEmptyState (Client Component)
**Location**: `apps/web/components/ProjectsEmptyState.tsx`
**Purpose**: Display empty state when no projects exist
**Responsibilities**:
- Show friendly message
- Provide call-to-action to create project

### File Structure

```
apps/web/
├── app/
│   └── projects/
│       ├── page.tsx                    # Projects listing page (Server Component)
│       ├── error.tsx                   # Error boundary
│       └── loading.tsx                 # Loading state
├── components/
│   └── ProjectsEmptyState.tsx          # Empty state component
packages/ui/src/molecules/
└── ProjectCard.tsx                     # Project card component (if reusable)
```

## Implementation Strategy

### Phase 1: Core Listing Page (P1 - Critical)
1. Create `/projects/page.tsx` Server Component
2. Implement basic project listing using existing API
3. Add authentication check (requireAuth)
4. Create ProjectCard component
5. Handle empty state
6. Add error boundaries

### Phase 2: Enhanced Features (P2 - Nice to Have)
1. Add issue count display
2. Add last activity timestamp
3. Add search/filter functionality
4. Add pagination UI (if needed)
5. Add loading states
6. Add project creation quick action

### Dependencies
- Existing `/api/projects` endpoint
- Existing `projectRepository`
- Existing `requireAuth` middleware
- Existing UI components (Button, etc.)

## Quickstart

1. Create projects listing page at `apps/web/app/projects/page.tsx`
2. Fetch projects using existing API endpoint
3. Render project cards with navigation
4. Handle empty state
5. Test with onboarding redirect flow

See `quickstart.md` for detailed implementation steps.


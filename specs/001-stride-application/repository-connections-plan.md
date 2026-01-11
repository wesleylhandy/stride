# Implementation Plan: Repository Connection Management in Project Settings

**Feature Branch**: `001-stride-application`  
**Created**: 2024-12-19  
**Status**: Implementation Complete (Phase 0-3 MVP)  
**Feature Spec**: `specs/001-stride-application/spec.md`  
**Related Feature**: Extension of FR-004 (Repository Linking)  
**Tasks**: Documented in `tasks.md` Phase 8.5 (all MVP tasks complete)

## Technical Context

### Technology Stack

- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: HTTP-only cookies with JWT tokens, OAuth for GitHub/GitLab
- **State Management**: Jotai for global state, TanStack Query for server state
- **Styling**: Tailwind CSS with custom design tokens
- **Monorepo**: Turborepo with pnpm

### Dependencies

- **Existing API Endpoints**:
  - `GET /api/projects/[projectId]/repositories` - Fetch existing connection
  - `POST /api/projects/[projectId]/repositories` - Create/update connection
  - `GET /api/projects/[projectId]/repositories?action=oauth&type={type}` - OAuth URL
- **Existing Components**:
  - `ProjectSettingsNavigation` - Settings navigation component
  - `apps/web/app/onboarding/repository/page.tsx` - Onboarding repository connection UI (can be reused/adapted)
- **Database Models**:
  - `RepositoryConnection` - Already exists in schema
  - `Project` - Has relationship to `RepositoryConnection`

### Integrations

- **GitHub OAuth**: Existing OAuth flow via `/api/projects/[projectId]/repositories/callback`
- **GitLab OAuth**: Existing OAuth flow via `/api/projects/[projectId]/repositories/callback`
- **Webhook Management**: Existing webhook registration in POST endpoint

### Architecture Decisions

- **Location**: Project Settings → Integrations section (`/projects/[projectId]/settings/integrations`)
- **Reuse Pattern**: Extract reusable components from onboarding flow
- **API Pattern**: Extend existing repository endpoints (no new endpoints needed initially)
- **UI Pattern**: Follow existing project settings page structure
- **Permission Model**: Admin-only access (matches configuration settings)

### Unknowns / Needs Clarification

- ✅ **RESOLVED**: Repository connection can be managed via existing API endpoints
- ✅ **RESOLVED**: OAuth callback flow works for both onboarding and settings
- ✅ **RESOLVED**: Settings navigation already has commented-out Integrations section
- ✅ **RESOLVED**: Disconnect functionality deferred to future enhancement (see research.md)
- ✅ **RESOLVED**: Basic health indicators (last sync timestamp) for MVP (see research.md)
- ✅ **RESOLVED**: Reconnection supported via existing upsert logic (see research.md)

## Constitution Check

### Principles Compliance

- [x] SOLID principles applied
  - Single Responsibility: Separate settings page component
  - Open/Closed: Reuse existing API endpoints
  - Liskov Substitution: Follow existing settings page patterns
  - Interface Segregation: Specific interfaces for connection management
  - Dependency Inversion: Depend on API abstractions
- [x] DRY, YAGNI, KISS followed
  - Reuse onboarding repository connection UI components
  - Start with MVP (connect/view/update, skip disconnect if not needed)
  - Simple settings page following existing pattern
- [x] Type safety enforced
  - TypeScript strict mode
  - Zod validation for API requests
  - Prisma types for database access
- [x] Security best practices
  - Admin-only access (matches configuration settings)
  - OAuth flow for secure token exchange
  - Encrypted token storage (already implemented)
- [x] Accessibility requirements met
  - Follow existing settings page accessibility patterns
  - Keyboard navigation support
  - Screen reader support

### Code Quality Gates

- [x] No `any` types
  - TypeScript strict mode enforced
- [x] Proper error handling
  - Try/catch for async operations
  - Error states in UI
- [x] Input validation
  - Zod schemas for API requests
  - Server-side validation
- [x] Test coverage planned
  - Unit tests for connection management components
  - Integration tests for settings page
  - E2E tests for connection flow

## Phase 0: Outline & Research

### Research Tasks

- [x] Verify existing API endpoints support post-onboarding connection
- [x] Review onboarding repository connection UI for reusable components
- [x] Check project settings navigation structure
- [x] **RESOLVED**: Disconnect repository functionality requirements (deferred to future)
- [x] **RESOLVED**: Connection health/status indicators (basic timestamp for MVP)
- [x] **RESOLVED**: Reconnection flow (supported via existing upsert logic)

### Research Output

- [x] `repository-connections-research.md` generated with all decisions resolved
- [x] Existing API endpoints (`GET` and `POST /api/projects/[projectId]/repositories`) support both onboarding and settings use cases
- [x] OAuth callback flow works for any project, not just during onboarding
- [x] Settings navigation has commented-out Integrations section ready to enable
- [x] All decisions resolved:
  - Disconnect functionality deferred to future
  - Basic health indicators (timestamp) for MVP
  - Reconnection supported via existing upsert

**Research Notes**:

- The existing `POST /api/projects/[projectId]/repositories` endpoint uses `upsert`, so it can update existing connections
- The OAuth callback redirects to `/api/projects/[projectId]/repositories/callback` which works for any project
- The onboarding repository page (`apps/web/app/onboarding/repository/page.tsx`) contains reusable UI patterns that can be extracted

## Phase 1: Design & Contracts

### Data Model

- [x] `repository-connections-data-model.md` generated
- [x] `RepositoryConnection` model already exists
- [x] No schema changes needed
- [x] Relationships already defined

**Existing Model** (from `packages/database/prisma/schema.prisma`):

```prisma
model RepositoryConnection {
  id            String                @id @default(uuid())
  projectId     String
  repositoryUrl String                @unique
  serviceType   RepositoryServiceType
  accessToken   String // Encrypted
  webhookSecret String // Encrypted
  webhookId     String?
  isActive      Boolean               @default(true)
  lastSyncAt    DateTime?
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("repository_connections")
}
```

### API Contracts

- [x] `repository-connections-contracts.md` generated
- [x] Existing endpoints sufficient for MVP
- [x] DELETE endpoint documented for future enhancement

**Existing Endpoints** (from `apps/web/app/api/projects/[projectId]/repositories/route.ts`):

**GET /api/projects/[projectId]/repositories**

- Fetches existing connection for project
- Returns: `{ id, repositoryUrl, serviceType, isActive, lastSyncAt, createdAt }`
- Returns 404 if no connection exists

**GET /api/projects/[projectId]/repositories?action=oauth&type={GitHub|GitLab}**

- Returns OAuth URL for connection
- Returns: `{ authUrl, state }`

**POST /api/projects/[projectId]/repositories**

- Creates or updates repository connection
- Body: `{ repositoryUrl, repositoryType, accessToken? }` or `{ repositoryUrl, repositoryType, code? }` (OAuth)
- Returns: `{ id, repositoryUrl, serviceType, isActive }`
- Uses `upsert` so can update existing connections

**OPTIONAL: DELETE /api/projects/[projectId]/repositories**

- Would delete connection and remove webhook
- **Decision needed**: Is this required for MVP?

### Quickstart

- [x] `repository-connections-quickstart.md` generated
- [x] Setup instructions documented
- [x] User flow documented
- [x] Testing guide included

### Agent Context

- [x] No new technologies introduced
- [x] Uses existing stack
- [x] No agent context update needed (no new technologies)

## Phase 2: Implementation Planning

### Component Structure

- [x] **Settings Navigation**: Enable Integrations link in `ProjectSettingsNavigation`
- [x] **Integrations Page**: Create `/projects/[projectId]/settings/integrations/page.tsx`
- [x] **Connection Status Component**: Display existing connection info
- [x] **Connection Form Component**: Reuse/extract from onboarding flow
- [x] **OAuth Handler**: Reuse existing callback flow

**Component Hierarchy**:

```
apps/web/app/projects/[projectId]/settings/integrations/
  ├── page.tsx (Server Component - auth + data fetching)
  └── RepositoryConnectionSettings.tsx (Client Component - main UI)

apps/web/src/components/features/projects/
  └── RepositoryConnectionForm.tsx (Extracted from onboarding)
```

**Component Details**:

- `page.tsx`: Server component handles authentication, fetches project, renders client component
- `RepositoryConnectionSettings.tsx`: Main UI component, manages connection state, displays status/form
- `RepositoryConnectionForm.tsx`: Reusable form component extracted from onboarding, supports OAuth and manual flows

### State Management

- [x] **Server State**: TanStack Query for fetching connection status
- [x] **Local State**: React Hook Form for connection form
- [x] **OAuth State**: URL state management for OAuth callback

**State Flow**:

1. Page loads → Fetch connection via TanStack Query (`useQuery`)
2. User clicks "Connect" → Navigate to OAuth or show manual form
3. OAuth callback → Process and redirect back to settings
4. Manual form submit → POST to API → Refetch connection status (`queryClient.invalidateQueries`)

**State Management Details**:

- **TanStack Query**: `useQuery` for fetching connection, `useMutation` for creating/updating
- **React Hook Form**: Form state for manual token entry
- **URL State**: OAuth return URL via query parameter or sessionStorage

### Testing Strategy

- [x] **Unit Tests**: Connection form component validation
- [x] **Integration Tests**: Settings page API integration
- [x] **E2E Tests**: Full connection flow (OAuth and manual)

**Testing Details**:

- **Unit Tests**: Test form validation, error handling, OAuth button clicks
- **Integration Tests**: Test API calls, error responses, success flows
- **E2E Tests**: Test complete user journey (view → connect → verify)

## Phase 3: Implementation

### Tasks

- [x] Enable Integrations link in ProjectSettingsNavigation
- [x] Create integrations settings page route
- [x] Extract reusable RepositoryConnectionForm component
- [x] Create RepositoryConnectionSettings component
- [x] Implement connection status display
- [x] Implement OAuth connection flow
- [x] Implement manual token connection flow
- [x] Add error handling and loading states
- [x] Add success notifications
- [ ] **OPTIONAL**: Implement disconnect functionality (deferred to future enhancement)
- [ ] **OPTIONAL**: Add connection health indicators (basic timestamp implemented for MVP)
- [x] Write unit tests
- [x] Write integration tests
- [x] Write E2E tests

**Note**: All MVP tasks are complete. See `tasks.md` Phase 8.5 (T259-T295) for detailed task breakdown and implementation status.

### Dependencies

- Existing API endpoints (no backend changes needed for MVP)
- Existing OAuth callback handler
- Project settings navigation component
- Onboarding repository connection UI (for extraction)

### Estimated Effort

- **MVP (Connect/View/Update)**: 4-6 hours
- **With Disconnect**: +2 hours
- **With Health Indicators**: +2 hours
- **Testing**: +3-4 hours
- **Total MVP**: ~8-10 hours
- **Total with Extras**: ~12-14 hours

## Notes

### MVP Scope

- View existing repository connection
- Connect new repository (OAuth or manual)
- Update/reconnect existing repository
- Basic error handling

### Future Enhancements (Out of Scope)

- Disconnect repository (requires DELETE endpoint + webhook removal)
- Connection health monitoring
- Multiple repository connections per project
- Global repository connections (organization-level)
- Connection activity logs

### Design Decisions

- **Reuse over Rebuild**: Extract components from onboarding flow
- **Admin-Only Access**: Matches configuration settings permission model
- **OAuth First**: OAuth is recommended, manual token is fallback
- **Settings Pattern**: Follow existing project settings page structure

### Open Questions

1. **Disconnect Functionality**: Should users be able to disconnect repositories? This would require:
   - DELETE endpoint to remove connection
   - Webhook removal from Git service
   - Handling of existing linked issues/branches
   - **Recommendation**: Defer to later if not critical for MVP

2. **Connection Health**: Should we show connection status indicators?
   - Last sync timestamp (already available)
   - Webhook delivery status
   - Token validity check
   - **Recommendation**: Start with last sync timestamp, add health checks later

3. **Reconnection Flow**: What happens when reconnecting?
   - Same repository: Update credentials
   - Different repository: Replace connection
   - **Recommendation**: Support both via existing upsert logic

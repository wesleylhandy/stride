# Implementation Plan: Deployment Documentation Routing

**Feature Branch**: `005-deployment-docs-routing`  
**Created**: 2026-01-23  
**Status**: Planning Complete (Phase 0-1)  
**Feature Spec**: `specs/005-deployment-docs-routing/spec.md`

## Summary

Add Next.js routes for deployment documentation to fix 404 errors when users click links to `/docs/deployment/*` pages. This feature follows the existing `/docs/integrations/*` pattern exactly, ensuring consistency and code reuse. All deployment documentation files already exist in `docs/deployment/` at repository root; this feature only adds the routing layer to serve them via the web application.

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **File System**: Node.js `fs/promises` for reading markdown files
- **Markdown Rendering**: `@stride/ui` `DocumentationPageContent` component (existing)
- **Styling**: Tailwind CSS with custom design tokens (existing)
- **Authentication**: HTTP-only cookies with JWT tokens (existing, via `apps/web/app/docs/layout.tsx`)

### Dependencies
- **Existing Routes**: `/docs/integrations/*` routes as reference implementation
  - `apps/web/app/docs/integrations/page.tsx` - Overview page pattern
  - `apps/web/app/docs/integrations/[service]/page.tsx` - Individual guide pattern
- **Existing Components**: 
  - `@stride/ui` `DocumentationPageContent` - Markdown rendering component
  - `@stride/ui` `PageContainer` - Layout wrapper
- **Existing Layout**: `apps/web/app/docs/layout.tsx` - Authentication and layout wrapper
- **Existing Navigation**: 
  - `apps/web/app/docs/page.tsx` - Documentation index page
  - `apps/web/src/lib/navigation/docs-breadcrumbs.ts` - Breadcrumb generation
- **Documentation Files**: 
  - `docs/deployment/README.md` - Overview/index content
  - `docs/deployment/docker.md` - Docker deployment guide
  - `docs/deployment/infrastructure-configuration.md` - Infrastructure configuration guide
  - `docs/deployment/smtp-configuration.md` - SMTP configuration guide

### Integrations
- **No external integrations required** - This is a pure routing feature

### Architecture Decisions
- **Pattern Reuse**: Follow `/docs/integrations/*` pattern exactly for consistency
  - Same file reading approach (read from repo root `docs/deployment/`)
  - Same component usage (`DocumentationPageContent`)
  - Same dynamic import pattern for code splitting
  - Same error handling approach
- **Route Structure**:
  - `/docs/deployment` - Overview page (serves `docs/deployment/README.md`)
  - `/docs/deployment/docker` - Docker guide (serves `docs/deployment/docker.md`)
  - `/docs/deployment/infrastructure-configuration` - Infrastructure guide (serves `docs/deployment/infrastructure-configuration.md`)
  - `/docs/deployment/smtp-configuration` - SMTP guide (serves `docs/deployment/smtp-configuration.md`)
- **File Reading Pattern**:
  ```typescript
  // Path from apps/web to repo root
  const repoRoot = join(process.cwd(), '..', '..');
  const filePath = join(repoRoot, 'docs', 'deployment', '[filename].md');
  ```
- **Navigation Integration**: Add "Deployment" section to `/docs` index page with subsections
- **Breadcrumb Support**: Update breadcrumb generator to recognize `deployment` segment

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Route pattern - Follow exact pattern from `/docs/integrations/*`
- ✅ **RESOLVED**: File reading - Use same approach as integrations (read from repo root)
- ✅ **RESOLVED**: Navigation structure - Add to main docs index page matching integrations format
- ✅ **RESOLVED**: Breadcrumb labels - Use human-readable labels for deployment guides
- ✅ **RESOLVED**: Error handling - Use same pattern as integrations (graceful fallback message)

All clarifications resolved. See `research.md` for detailed decisions and rationale.

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied
  - Single Responsibility: Each route page handles one documentation file
  - Open/Closed: Reuse existing components and patterns, extend without modification
  - Liskov Substitution: Use existing `DocumentationPageContent` component interface
  - Interface Segregation: Minimal, focused route components
  - Dependency Inversion: Depend on component interfaces, not implementations
- [x] DRY, YAGNI, KISS followed
  - Reuse existing `/docs/integrations/*` pattern exactly (DRY)
  - Build only what's needed - routes for existing files (YAGNI)
  - Simple file reading and rendering (KISS)
- [x] Type safety enforced
  - TypeScript strict mode
  - Proper types for route parameters
  - No `any` types
- [x] Security best practices
  - Auth at route level (existing `docs/layout.tsx` handles authentication)
  - Server-side file reading (no client-side file access)
  - Path validation to prevent directory traversal
- [x] Accessibility requirements met
  - Semantic HTML via `DocumentationPageContent` component
  - Proper heading hierarchy in markdown content
  - Keyboard navigation via existing layout
  - Screen reader support via existing components

### Code Quality Gates
- [x] No `any` types (use proper TypeScript types)
- [x] Error handling implemented (try/catch for file reading, graceful fallback)
- [x] Input validation (validate route parameters, prevent path traversal)
- [x] Authentication required (handled by existing `docs/layout.tsx`)
- [x] Type safety (strict TypeScript, proper route types)

## Phase 0: Outline & Research

### Research Tasks
- [x] Analyze existing `/docs/integrations/*` route implementation
- [x] Identify file reading pattern and path resolution
- [x] Review navigation structure in docs index page
- [x] Review breadcrumb generation logic
- [x] Identify all deployment documentation files

### Research Output
- [x] `research.md` generated with pattern analysis and decisions

## Phase 1: Design & Contracts

### Route Structure Design

**Overview Route**: `/docs/deployment`
- **File**: `apps/web/app/docs/deployment/page.tsx`
- **Content Source**: `docs/deployment/README.md`
- **Pattern**: Match `apps/web/app/docs/integrations/page.tsx`

**Individual Guide Routes**: `/docs/deployment/[guide]`
- **File**: `apps/web/app/docs/deployment/[guide]/page.tsx`
- **Content Source**: `docs/deployment/[guide].md`
- **Pattern**: Match `apps/web/app/docs/integrations/[service]/page.tsx`
- **Route Mapping**:
  - `docker` → `docs/deployment/docker.md`
  - `infrastructure-configuration` → `docs/deployment/infrastructure-configuration.md`
  - `smtp-configuration` → `docs/deployment/smtp-configuration.md`

### Navigation Integration

**Docs Index Page Update**: `apps/web/app/docs/page.tsx`
- Add "Deployment" section to `documentationSections` array
- Include icon, description, and subsections
- Match format of existing "Configuration" and "Integrations" sections

**Breadcrumb Support**: `apps/web/src/lib/navigation/docs-breadcrumbs.ts`
- Add `deployment` to `DOCS_SEGMENT_LABELS` object
- Add human-readable labels for deployment guides:
  - `deployment` → "Deployment"
  - `docker` → "Docker Deployment"
  - `infrastructure-configuration` → "Infrastructure Configuration"
  - `smtp-configuration` → "SMTP Configuration"

### Component Reuse

**No new components required** - Reuse existing:
- `DocumentationPageContent` from `@stride/ui`
- `PageContainer` from `@stride/ui`
- Dynamic import pattern for code splitting
- Error handling pattern

### API Contracts

**No API endpoints required** - This is a pure routing feature with file system access.

### Data Model

**No database changes required** - Documentation is served from markdown files.

### Agent Context

- [x] Agent context update not needed (no new technologies or patterns introduced)

## Phase 2: Implementation Planning

### Route Creation Tasks
- [ ] Create `/docs/deployment` overview page (`apps/web/app/docs/deployment/page.tsx`)
- [ ] Create `/docs/deployment/[guide]` dynamic route (`apps/web/app/docs/deployment/[guide]/page.tsx`)
- [ ] Implement file reading function following integrations pattern
- [ ] Add error handling for missing files
- [ ] Add TypeScript types for route parameters

### Navigation Integration Tasks
- [ ] Update docs index page (`apps/web/app/docs/page.tsx`) to include Deployment section
- [ ] Update breadcrumb generator (`apps/web/src/lib/navigation/docs-breadcrumbs.ts`) with deployment labels
- [ ] Verify navigation sidebar works for deployment pages

### Verification Tasks
- [ ] Test all deployment routes return 200 (no 404s)
- [ ] Verify all existing links to deployment docs work
- [ ] Test breadcrumbs for all deployment routes
- [ ] Verify markdown rendering works correctly
- [ ] Test error handling for missing files
- [ ] Verify authentication works (via existing layout)
- [ ] Test navigation from docs index page

## Project Structure

### New Files (this feature)

```text
apps/web/app/docs/deployment/
├── page.tsx                                    # Overview page
└── [guide]/
    └── page.tsx                                # Dynamic route for individual guides
```

### Modified Files (this feature)

```text
apps/web/app/docs/
└── page.tsx                                    # Add Deployment section

apps/web/src/lib/navigation/
└── docs-breadcrumbs.ts                        # Add deployment labels
```

### Documentation Files (existing, no changes)

```text
docs/deployment/
├── README.md                                   # Overview content
├── docker.md                                  # Docker guide
├── infrastructure-configuration.md            # Infrastructure guide
└── smtp-configuration.md                      # SMTP guide
```

## Complexity Tracking

> **No violations identified** - This is a straightforward routing feature following established patterns. Complexity is low due to code reuse and pattern matching.

## Implementation Notes

### Route Parameter Mapping

For the dynamic `[guide]` route, map URL segments to markdown filenames:
- URL: `/docs/deployment/docker` → File: `docs/deployment/docker.md`
- URL: `/docs/deployment/infrastructure-configuration` → File: `docs/deployment/infrastructure-configuration.md`
- URL: `/docs/deployment/smtp-configuration` → File: `docs/deployment/smtp-configuration.md`

### Path Validation

Ensure route parameters are validated to prevent directory traversal:
- Only allow known guide names, or
- Validate that resolved path is within `docs/deployment/` directory
- Reject paths containing `..` or absolute paths

### Error Handling

Follow existing pattern from integrations:
- Try/catch around file reading
- Log errors server-side
- Display user-friendly error message
- Include helpful guidance (e.g., "Check repository documentation")

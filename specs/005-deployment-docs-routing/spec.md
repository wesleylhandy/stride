# Feature Specification: Deployment Documentation Routing

**Feature Branch**: `005-deployment-docs-routing`  
**Created**: 2026-01-23  
**Status**: Draft  
**Input**: Analysis from `/speckit.analyze` identified that deployment documentation files exist in `docs/deployment/` but are not accessible via web routes, causing 404s when linked from other documentation. Need to add Next.js routes following the existing `/docs/integrations/*` pattern.

## Context

Multiple documentation files reference deployment guides using web routes (e.g., `/docs/deployment/infrastructure-configuration`), but these routes do not exist in the Next.js application. This causes 404 errors when users click these links. The documentation files exist in the repository at `docs/deployment/` but are not served via the web application.

**Current State**:
- Documentation files exist: `docs/deployment/docker.md`, `docs/deployment/infrastructure-configuration.md`, `docs/deployment/smtp-configuration.md`, `docs/deployment/README.md`
- Links in other docs point to `/docs/deployment/*` routes
- No Next.js routes exist for these paths
- Existing pattern: `/docs/integrations/*` routes successfully serve markdown from `docs/integrations/*.md`

**Desired State**:
- All `/docs/deployment/*` routes accessible and serving markdown content
- Consistent with existing `/docs/integrations/*` pattern
- Navigation updated to include deployment section
- All existing links work without 404s

## Clarifications

### Session 2026-01-23

- Q: What specific error handling behavior should be implemented for missing, unreadable, or empty documentation files? → A: Specific error messages per scenario (missing file, read error, empty file) + server logging + repository link
- Q: How should route parameter validation be implemented for the `[guide]` dynamic route? → A: Strict whitelist of known guide names: `['docker', 'infrastructure-configuration', 'smtp-configuration']` - return 404 for any other value
- Q: Which deployment guides should appear in the navigation sidebar when viewing deployment pages? → A: Show all deployment guides (Overview, Docker, Infrastructure Configuration, SMTP Configuration) in sidebar on every deployment page
- Q: What page titles and metadata should deployment documentation pages have? → A: Unique titles and descriptions per guide (e.g., "Docker Deployment - Stride", "Infrastructure Configuration - Stride") with guide-specific descriptions
- Q: Should empty files (file exists but has zero content) be handled differently from missing files? → A: Explicitly check for empty files and show specific "Documentation Empty" message, distinct from missing file errors

## User Scenarios & Testing

### User Story 1 - Access Deployment Documentation (Priority: P1)

A user reading documentation clicks a link to `/docs/deployment/infrastructure-configuration` and successfully views the deployment guide without encountering a 404 error.

**Why this priority**: Broken links create poor user experience and prevent users from accessing critical deployment information. This directly blocks users from successfully deploying Stride.

**Independent Test**: Can be fully tested by clicking links in existing documentation that point to `/docs/deployment/*` routes. Success when all links load the correct documentation pages.

**Acceptance Scenarios**:

1. **Given** a user is reading integration documentation, **When** they click a link to `/docs/deployment/infrastructure-configuration`, **Then** they see the infrastructure configuration guide rendered properly
2. **Given** a user is reading user documentation, **When** they click a link to `/docs/deployment/infrastructure-configuration`, **Then** they see the infrastructure configuration guide rendered properly
3. **Given** a user navigates to `/docs/deployment`, **Then** they see an overview page listing all deployment guides
4. **Given** a user navigates to `/docs/deployment/docker`, **Then** they see the Docker deployment guide rendered properly
5. **Given** a user navigates to `/docs/deployment/smtp-configuration`, **Then** they see the SMTP configuration guide rendered properly

---

### User Story 2 - Navigate Deployment Documentation (Priority: P1)

A user can discover and navigate deployment documentation through the main documentation index page, with proper breadcrumbs and navigation.

**Why this priority**: Users need to be able to discover deployment documentation without relying on external links. Proper navigation ensures all documentation is accessible.

**Independent Test**: Can be fully tested by navigating from `/docs` index page to deployment section and verifying all routes work. Success when deployment section appears in navigation and all sub-pages are accessible.

**Acceptance Scenarios**:

1. **Given** a user is on the `/docs` index page, **When** they view the documentation sections, **Then** they see a "Deployment" section with subsections listed
2. **Given** a user clicks on the "Deployment" section, **When** they navigate to `/docs/deployment`, **Then** they see the deployment overview page
3. **Given** a user is viewing a deployment guide, **When** they view breadcrumbs, **Then** they see "Documentation > Deployment > [Guide Name]" hierarchy
4. **Given** a user is viewing a deployment guide, **When** they view the navigation sidebar, **Then** they can navigate to other deployment guides

---

## Functional Requirements

### FR1: Deployment Documentation Routes

- **Description**: Create Next.js routes for all deployment documentation files
- **Routes Required**:
  - `/docs/deployment` - Overview/index page (serves `docs/deployment/README.md`)
  - `/docs/deployment/docker` - Docker deployment guide (serves `docs/deployment/docker.md`)
  - `/docs/deployment/infrastructure-configuration` - Infrastructure configuration guide (serves `docs/deployment/infrastructure-configuration.md`)
  - `/docs/deployment/smtp-configuration` - SMTP configuration guide (serves `docs/deployment/smtp-configuration.md`)
- **Pattern**: Follow existing `/docs/integrations/*` pattern for consistency
- **File Reading**: Read markdown files from `docs/deployment/` at repository root (same pattern as integrations)
- **Route Parameter Validation**: Use strict whitelist validation for `[guide]` parameter
  - **Valid Guide Names**: `['docker', 'infrastructure-configuration', 'smtp-configuration']`
  - **Invalid Routes**: Any other value for `[guide]` must return 404 (Next.js `notFound()`)
  - **Security**: Whitelist approach prevents path traversal attacks and ensures only intended documentation is accessible
  - **Maintainability**: When new deployment guides are added, whitelist must be updated explicitly
- **Page Metadata**: Each route must have unique, descriptive metadata
  - **Overview Page**: Title: "Deployment Guide - Stride", Description: "Complete guides for deploying Stride (Docker, infrastructure configuration, SMTP)"
  - **Docker Guide**: Title: "Docker Deployment - Stride", Description: "Complete guide for deploying Stride using Docker Compose"
  - **Infrastructure Configuration**: Title: "Infrastructure Configuration - Stride", Description: "Complete guide for configuring global infrastructure settings (Git OAuth and AI Gateway)"
  - **SMTP Configuration**: Title: "SMTP Configuration - Stride", Description: "Email service configuration for invitation emails"
  - **Implementation**: Use Next.js `Metadata` export or `generateMetadata` function for dynamic routes

### FR2: Documentation Index Integration

- **Description**: Add "Deployment" section to main documentation index page (`/docs`)
- **Location**: Update `apps/web/app/docs/page.tsx`
- **Content**: Add deployment section with icon, description, and subsections
- **Subsections**: List all deployment guides (Docker, Infrastructure Configuration, SMTP Configuration)
- **Consistency**: Match format and styling of existing "Configuration" and "Integrations" sections

### FR3: Navigation and Breadcrumbs

- **Description**: Ensure proper navigation and breadcrumb support for deployment routes
- **Breadcrumbs**: Update `apps/web/src/lib/navigation/docs-breadcrumbs.ts` to recognize `deployment` segment
  - Breadcrumb labels: `deployment` → "Deployment", `docker` → "Docker Deployment", `infrastructure-configuration` → "Infrastructure Configuration", `smtp-configuration` → "SMTP Configuration"
  - Breadcrumb hierarchy: "Documentation > Deployment > [Guide Name]" for individual guides, "Documentation > Deployment" for overview
- **Navigation Sidebar**: All deployment guides must appear in the navigation sidebar on every deployment page
  - **Sidebar Sections**: Overview, Docker Deployment, Infrastructure Configuration, SMTP Configuration
  - **Active State**: Current page must be highlighted/indicated in sidebar
  - **Consistency**: Match behavior of existing `/docs/integrations/*` pages (all integration guides visible in sidebar)
- **Consistency**: Match behavior of existing documentation sections

### FR4: Error Handling

- **Description**: Handle missing, unreadable, or empty documentation files gracefully with specific error messages per scenario
- **Error Detection Order**: Check in sequence: (1) File existence, (2) File readability, (3) File content (empty check)
- **Missing File**: If file does not exist at expected path, display "Documentation Not Found" heading with message: "The [guide name] documentation could not be loaded. Please check that the documentation file exists at the repository root in `docs/deployment/`."
- **Read Error**: If file exists but cannot be read (permissions, I/O error), display "Documentation Error" heading with message: "An error occurred while loading the [guide name] documentation. Please try again later or check the repository documentation at `docs/deployment/`."
- **Empty File**: If file exists and is readable but contains no content (0 bytes or whitespace-only after trimming), display "Documentation Empty" heading with message: "The [guide name] documentation file exists but is empty. Please check the repository documentation at `docs/deployment/`."
  - **Empty Check**: After successfully reading file, check if content is empty or contains only whitespace (trim and check length)
  - **Distinction**: Empty file error is distinct from missing file error to help diagnose different issues
- **Logging**: Log all errors server-side with full error details, file path, timestamp, and error type (missing/read/empty) for debugging
- **Repository Link**: All error messages must include reference to repository documentation location (`docs/deployment/`)
- **User Experience**: Error messages must be rendered as markdown content (not raw error pages) to maintain consistent page layout and navigation

## Non-Functional Requirements

### NFR1: Consistency

- **Pattern Matching**: Deployment routes must follow the exact same pattern as `/docs/integrations/*` routes
- **Code Reuse**: Reuse existing components and utilities (e.g., `DocumentationPageContent`, `getDocContent` pattern)
- **Styling**: Match visual design and layout of existing documentation pages

### NFR2: Performance

- **Code Splitting**: Use dynamic imports for markdown rendering (same as integrations)
- **SSR**: Server-side render documentation content for SEO and initial load performance
- **Caching**: Leverage Next.js static generation where appropriate

### NFR3: Maintainability

- **DRY Principle**: Reuse existing documentation rendering patterns, don't duplicate code
- **File Structure**: Keep markdown files in `docs/deployment/` at repository root (single source of truth)
- **Type Safety**: Use TypeScript with proper types for route parameters and content

## Technical Constraints

- **Framework**: Next.js 16+ App Router (React Server Components)
- **File Location**: Markdown files must remain in `docs/deployment/` at repository root
- **Authentication**: Deployment docs should use same authentication as other docs (via `apps/web/app/docs/layout.tsx`)
- **Pattern**: Must follow existing `/docs/integrations/*` pattern exactly for consistency

## Success Criteria

1. ✅ All `/docs/deployment/*` routes accessible and return 200 status (no 404s)
2. ✅ All existing links to deployment docs work correctly
3. ✅ Deployment section appears in main documentation index (`/docs`)
4. ✅ Breadcrumbs work correctly for all deployment routes
5. ✅ Navigation sidebar works for deployment pages
6. ✅ Code follows existing patterns (no duplication, proper reuse)
7. ✅ All markdown files render correctly with proper formatting

## Dependencies

- **Existing Code**: `/docs/integrations/*` routes as reference implementation
- **Components**: `@stride/ui` `DocumentationPageContent` component
- **Layout**: `apps/web/app/docs/layout.tsx` for authentication and layout
- **Navigation**: `apps/web/src/lib/navigation/docs-breadcrumbs.ts` for breadcrumb support

## Out of Scope

- **Content Updates**: This feature does not modify deployment documentation content
- **Marketing Site**: This feature only addresses web app routes, not marketing site (`apps/site`)
- **New Documentation**: This feature does not create new documentation files, only routes existing ones

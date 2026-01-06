# Implementation Tasks: Stride Core Application

**Feature Branch**: `001-stride-application`  
**Created**: 2024-12-19  
**Status**: Ready for Implementation  
**Feature Spec**: `specs/001-stride-application/spec.md`

## Overview

This document provides an actionable, dependency-ordered task breakdown for implementing the Stride Core Application. Tasks are organized by user story priority (P1, P2, P3) to enable independent implementation and testing.

**Total Tasks**: 313  
**MVP Scope**: Phase 1-4 (User Story 1 & 2)  
**Full Implementation**: All phases

## Implementation Strategy

### MVP First Approach

- **Phase 1-4**: Core infrastructure and User Stories 1-2 (deployment, onboarding, issue management)
- **Incremental Delivery**: Each user story phase is independently testable
- **Parallel Opportunities**: Tasks marked with [P] can be executed in parallel

### Task Format

Every task follows this strict format:

- `- [ ] [TaskID] [P?] [Story?] Description with file path`

Where:

- **TaskID**: Sequential number (T001, T002, T003...)
- **[P]**: Optional marker for parallelizable tasks
- **[Story]**: User story label (US1, US2, etc.) for story-specific tasks
- **Description**: Clear action with exact file path

---

## Phase 1: Setup & Project Initialization

**Goal**: Initialize monorepo structure, development environment, and core infrastructure packages.

**Dependencies**: None (foundational phase)

### Setup Tasks

- [x] T001 Create Turborepo monorepo structure with pnpm workspace in root directory
- [x] T002 [P] Create apps/web package structure in apps/web/
- [x] T003 [P] Create apps/site package structure in apps/site/
- [x] T004 [P] Create packages/ui package structure in packages/ui/
- [x] T005 [P] Create packages/database package structure in packages/database/
- [x] T006 [P] Create packages/types package structure in packages/types/
- [x] T007 [P] Create packages/yaml-config package structure in packages/yaml-config/
- [x] T008 [P] Create packages/ai-gateway package structure in packages/ai-gateway/
- [x] T009 Configure turbo.json with build pipeline in root/turbo.json
- [x] T010 Setup shared TypeScript config in root/tsconfig.json and packages/tsconfig/
- [x] T011 Configure ESLint and Prettier in root/eslint.config.mjs
- [x] T012 Create root package.json with workspace configuration
- [x] T013 Create .env.example with all required environment variables in root/.env.example
- [x] T014 Create .gitignore for monorepo in root/.gitignore

**Acceptance Criteria**:

- `pnpm install` completes successfully
- `pnpm build` builds all packages
- `pnpm dev` starts development servers
- All packages are properly linked via workspace protocol

---

## Phase 2: Foundational Infrastructure

**Goal**: Establish database, types, UI foundation, Docker setup, and observability. These are blocking prerequisites for all user stories.

**Dependencies**: Phase 1 complete

### Database Package

- [x] T015 Initialize Prisma with PostgreSQL in packages/database/prisma/schema.prisma
- [x] T016 Create User model in packages/database/prisma/schema.prisma
- [x] T017 Create Project model with configYaml and config JSONB fields in packages/database/prisma/schema.prisma
- [x] T018 Create Issue model with customFields JSONB field and GIN index (using `type: Gin` for Prisma 7) in packages/database/prisma/schema.prisma
- [x] T019 Create Cycle model in packages/database/prisma/schema.prisma
- [x] T020 Create Comment model in packages/database/prisma/schema.prisma
- [x] T021 Create Attachment model in packages/database/prisma/schema.prisma
- [x] T022 Create RepositoryConnection model in packages/database/prisma/schema.prisma
- [x] T023 Create IssueBranch model in packages/database/prisma/schema.prisma
- [x] T024 Create Webhook model in packages/database/prisma/schema.prisma
- [x] T025 Create Session model in packages/database/prisma/schema.prisma
- [x] T026 Add all foreign key relationships and constraints in packages/database/prisma/schema.prisma
- [x] T027 Add database indexes (unique, composite, GIN for JSONB using `type: Gin` syntax for Prisma 7) in packages/database/prisma/schema.prisma
- [x] T028 Create initial migration in packages/database/prisma/migrations/
- [x] T029 Create Prisma client export in packages/database/src/index.ts
- [x] T030 Create database connection utilities in packages/database/src/connection.ts
- [x] T031 Create repository pattern interfaces in packages/database/src/repositories/

**Acceptance Criteria**:

- Prisma schema validates without errors
- Migrations run successfully
- Prisma client generates correctly
- All entities match data-model.md specifications

### Types Package

- [x] T032 [P] Define User types in packages/types/src/user.ts
- [x] T033 [P] Define Project types in packages/types/src/project.ts
- [x] T034 [P] Define Issue types in packages/types/src/issue.ts
- [x] T035 [P] Define Cycle types in packages/types/src/cycle.ts
- [x] T036 [P] Export Prisma types in packages/types/src/prisma.ts
- [x] T037 [P] Create API request/response types in packages/types/src/api.ts
- [x] T038 [P] Create configuration schema types in packages/types/src/config.ts
- [x] T039 Create package.json with proper exports in packages/types/package.json

**Acceptance Criteria**:

- All types compile without errors
- Types are importable from other packages
- Types match API contracts and data model

### UI Package Foundation

- [x] T040 [P] Setup Tailwind CSS with design tokens in packages/ui/tailwind.config.ts
- [x] T041 [P] Create base component structure (atoms/, molecules/, organisms/) in packages/ui/src/
- [x] T042 [P] Implement Button atom component in packages/ui/src/atoms/Button.tsx
- [x] T043 [P] Implement Input atom component in packages/ui/src/atoms/Input.tsx
- [x] T044 [P] Implement Badge atom component in packages/ui/src/atoms/Badge.tsx
- [x] T045 [P] Setup Storybook configuration in packages/ui/.storybook/
- [x] T046 Create package.json with proper exports in packages/ui/package.json

**Acceptance Criteria**:

- Components render correctly
- Tailwind styles apply properly
- Storybook runs and displays components

### Docker & Deployment

- [x] T047 Create docker-compose.yml in root/docker-compose.yml
- [x] T048 Configure PostgreSQL service in root/docker-compose.yml
- [x] T049 Create Dockerfile for Next.js app in apps/web/Dockerfile
- [x] T050 Create Dockerfile for AI Gateway in packages/ai-gateway/Dockerfile
- [x] T051 Setup environment variable management in docker-compose.yml
- [x] T052 Document deployment process in docs/deployment/docker.md

**Acceptance Criteria**:

- `docker compose up` starts all services
- Database initializes correctly
- Application connects to database
- All services are accessible

### Logging & Observability

- [x] T053 [P] Setup structured JSON logging utility in packages/types/src/logger.ts
- [x] T054 [P] Implement request ID middleware in apps/web/src/middleware/request-id.ts
- [x] T055 [P] Create logging utilities in apps/web/src/lib/logger.ts
- [x] T056 [P] Setup metrics collection in apps/web/src/lib/metrics.ts
- [x] T057 [P] Create metrics API endpoint in apps/web/app/api/metrics/route.ts
- [x] T058 [P] Add error tracking setup in apps/web/src/lib/error-tracking.ts

**Acceptance Criteria**:

- Logs output in JSON format with request IDs
- Metrics endpoint returns data
- Error tracking is functional

---

## Phase 3: User Story 1 - Initial Deployment and Onboarding (P1)

**Goal**: Enable users to deploy Stride via Docker, create an admin account, and link their first repository.

**Independent Test**: Deploy Stride in a fresh environment, access the marketing site, follow Docker deployment instructions, create an admin account, and successfully link a GitHub/GitLab repository. Test succeeds when user can access the main application dashboard.

**Dependencies**: Phase 2 complete

### Marketing Site

- [x] T059 [US1] Create Next.js app with MDX support in apps/site/
- [x] T060 [US1] Create hero section component in apps/site/app/page.tsx
- [x] T061 [US1] Add feature highlights section in apps/site/app/page.tsx
- [x] T062 [US1] Create comparison section in apps/site/app/page.tsx
- [x] T063 [US1] Add installation documentation page in apps/site/app/docs/install/page.tsx
- [x] T064 [US1] Implement dark/light theme toggle in apps/site/app/components/ThemeToggle.tsx
- [x] T065 [US1] Optimize for SEO with metadata in apps/site/app/layout.tsx

**Acceptance Criteria**:

- Marketing site is accessible at configured URL
- "Get Started (Self-Host)" link directs to installation docs
- Content clearly communicates value propositions
- SEO metadata is properly configured

### Authentication & User Management

- [x] T066 [US1] Implement password hashing with bcrypt/argon2 in apps/web/src/lib/auth/password.ts
- [x] T067 [US1] Create user registration API route in apps/web/app/api/auth/register/route.ts
- [x] T068 [US1] Create login API route with JWT in apps/web/app/api/auth/login/route.ts
- [x] T069 [US1] Implement session management with database in apps/web/src/lib/auth/session.ts
- [x] T070 [US1] Create logout API route in apps/web/app/api/auth/logout/route.ts
- [x] T071 [US1] Create /api/auth/me endpoint in apps/web/app/api/auth/me/route.ts
- [x] T072 [US1] Implement role enum (Admin, Member, Viewer) in packages/types/src/user.ts
- [x] T073 [US1] Create permission checking utilities in apps/web/src/lib/auth/permissions.ts
- [x] T074 [US1] Add middleware for route protection in apps/web/src/middleware/auth.ts
- [x] T075 [US1] Create first-run detection logic in apps/web/src/lib/setup/first-run.ts
- [x] T076 [US1] Implement admin account creation page in apps/web/app/setup/page.tsx
- [x] T077 [US1] Prevent multiple admin creation in apps/web/src/lib/setup/first-run.ts
- [x] T078 [US1] Add onboarding flow component in apps/web/app/onboarding/page.tsx

**Acceptance Criteria**:

- Users can register and login successfully
- First user becomes admin automatically
- Subsequent users cannot become admin
- Sessions persist correctly
- Passwords are hashed securely
- Role-based permissions are enforced

### Project Management

- [x] T079 [US1] Create project creation API route in apps/web/app/api/projects/route.ts
- [x] T080 [US1] Create project listing API route in apps/web/app/api/projects/route.ts
- [x] T081 [US1] Create project detail API route in apps/web/app/api/projects/[projectId]/route.ts
- [x] T082 [US1] Implement project repository in packages/database/src/repositories/project-repository.ts
- [x] T083 [US1] Add project key uniqueness validation in apps/web/src/lib/validation/project.ts

**Acceptance Criteria**:

- Projects can be created with unique keys
- Projects are listed correctly
- Project details are retrieved successfully

### Repository Connection

- [x] T084 [US1] Create repository connection API route in apps/web/app/api/projects/[projectId]/repositories/route.ts
- [x] T085 [US1] Implement GitHub OAuth integration in apps/web/src/lib/integrations/github.ts
- [x] T086 [US1] Implement GitLab OAuth integration in apps/web/src/lib/integrations/gitlab.ts
- [x] T087 [US1] Store repository credentials securely (encrypted) in apps/web/src/lib/integrations/storage.ts
- [x] T088 [US1] Create webhook registration logic in apps/web/src/lib/integrations/webhooks.ts
- [x] T089 [US1] Implement config file cloning from repository in apps/web/src/lib/integrations/config-sync.ts
- [x] T090 [US1] Create default configuration generator in packages/yaml-config/src/default-config.ts
- [x] T091 [US1] Create repository connection UI in apps/web/app/onboarding/repository/page.tsx

**Acceptance Criteria**:

- Repositories can be connected via OAuth
- OAuth flow completes successfully
- Config file is cloned on connection or default created
- Repository connection is stored securely
- Webhook is registered with Git service

### Onboarding UI

- [x] T092 [US1] Create onboarding flow layout in apps/web/app/onboarding/layout.tsx
- [x] T093 [US1] Create admin account creation form in apps/web/app/onboarding/admin/page.tsx
- [x] T094 [US1] Create repository linking step in apps/web/app/onboarding/repository/page.tsx
- [x] T095 [US1] Create project initialization step in apps/web/app/onboarding/project/page.tsx
- [x] T096 [US1] Create completion/dashboard redirect in apps/web/app/onboarding/complete/page.tsx

**Acceptance Criteria**:

- Onboarding flow guides user through all steps
- Admin account creation works
- Repository linking completes successfully
- User is redirected to dashboard after completion

---

## Phase 4: User Story 2 - Issue Creation and Management (P1)

**Goal**: Enable developers to create issues via command palette, add context (diagrams, links), and manage them through Kanban board workflow.

**Independent Test**: Open command palette, create a new issue with title and description, paste a Mermaid diagram that renders inline, paste a Notion link that displays as a contextual preview, and move the issue between status columns on the Kanban board. Test succeeds when all actions complete without page reloads and the issue persists correctly.

**Dependencies**: Phase 3 complete

### Issue Model & Repository

- [x] T097 [US2] Create IssueRepository with CRUD operations in packages/database/src/repositories/issue-repository.ts
- [x] T098 [US2] Implement issue key generation logic (PROJECT-NUMBER format) in packages/database/src/repositories/issue-repository.ts
- [x] T099 [US2] Implement custom fields storage (JSONB) in packages/database/src/repositories/issue-repository.ts
- [x] T100 [US2] Add issue filtering and pagination in packages/database/src/repositories/issue-repository.ts
- [x] T101 [US2] Create issue search functionality in packages/database/src/repositories/issue-repository.ts
- [x] T102 [US2] Ensure key uniqueness per project with composite unique index in packages/database/prisma/schema.prisma
- [x] T103 [US2] Handle concurrent issue creation to prevent duplicate keys in packages/database/src/repositories/issue-repository.ts

**Acceptance Criteria**:

- Issues can be created with unique keys per project
- Custom fields are stored correctly in JSONB
- Issues can be queried, filtered, and paginated
- Concurrent creation doesn't create duplicate keys

### Issue API Endpoints

- [x] T104 [US2] Create issue creation API route in apps/web/app/api/projects/[projectId]/issues/route.ts
- [x] T105 [US2] Create issue listing API route with filters in apps/web/app/api/projects/[projectId]/issues/route.ts
- [x] T106 [US2] Create issue detail API route in apps/web/app/api/projects/[projectId]/issues/[issueKey]/route.ts
- [x] T107 [US2] Create issue update API route in apps/web/app/api/projects/[projectId]/issues/[issueKey]/route.ts
- [x] T108 [US2] Create issue status update API route in apps/web/app/api/projects/[projectId]/issues/[issueKey]/status/route.ts
- [x] T109 [US2] Implement permission checks (Member+ can create/edit) in apps/web/src/lib/auth/permissions.ts
- [x] T110 [US2] Add input validation with Zod schemas in apps/web/src/lib/validation/issue.ts

**Acceptance Criteria**:

- All issue APIs work correctly
- Permissions are enforced (Viewer cannot create/edit)
- Validation errors are returned for invalid input
- Status updates work correctly

### Command Palette

- [x] T111 [US2] Create CommandPalette component in packages/ui/src/organisms/CommandPalette.tsx
- [x] T112 [US2] Implement keyboard shortcuts (Cmd/Ctrl+K) in packages/ui/src/organisms/CommandPalette.tsx
- [x] T113 [US2] Add fuzzy search functionality in packages/ui/src/organisms/CommandPalette.tsx
- [x] T114 [US2] Create command registry system in apps/web/src/lib/commands/registry.ts
- [x] T115 [US2] Implement "create issue" command in apps/web/src/lib/commands/create-issue.ts
- [x] T116 [US2] Add navigation commands in apps/web/src/lib/commands/navigation.ts
- [x] T117 [US2] Implement recent items tracking in apps/web/src/lib/commands/recent.ts
- [x] T118 [US2] Integrate CommandPalette in main layout in apps/web/app/layout.tsx

**Acceptance Criteria**:

- Command palette opens with Cmd/Ctrl+K shortcut
- Commands are searchable via fuzzy search
- Issue creation works from palette
- Navigation commands work correctly

### Issue Creation Form

- [x] T119 [US2] Create IssueForm component in packages/ui/src/organisms/IssueForm.tsx
- [x] T120 [US2] Integrate React Hook Form in packages/ui/src/organisms/IssueForm.tsx
- [x] T121 [US2] Add custom field inputs (dynamic from config) in packages/ui/src/organisms/IssueForm.tsx
- [x] T122 [US2] Implement Markdown editor for description in packages/ui/src/molecules/MarkdownEditor.tsx
- [x] T123 [US2] Add form validation in packages/ui/src/organisms/IssueForm.tsx
- [x] T124 [US2] Implement save functionality in packages/ui/src/organisms/IssueForm.tsx

**Acceptance Criteria**:

- Form validates correctly
- Custom fields render dynamically from project config
- Markdown editor works for descriptions
- Issue is created on submit

### Issue Detail View

- [x] T125 [US2] Create IssueDetail component in packages/ui/src/organisms/IssueDetail.tsx
- [x] T126 [US2] Display issue information in packages/ui/src/organisms/IssueDetail.tsx
- [x] T127 [US2] Show custom fields in packages/ui/src/organisms/IssueDetail.tsx
- [x] T128 [US2] Display linked branches/PRs in packages/ui/src/organisms/IssueDetail.tsx
- [x] T129 [US2] Add edit functionality in packages/ui/src/organisms/IssueDetail.tsx
- [x] T130 [US2] Implement status change UI in packages/ui/src/organisms/IssueDetail.tsx
- [x] T131 [US2] Create issue detail page route in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx

**Acceptance Criteria**:

- Issue details display correctly
- All fields are shown including custom fields
- Editing works for authorized users
- Status changes work correctly

### Markdown Rendering

- [x] T132 [US2] Create MarkdownRenderer component in packages/ui/src/molecules/MarkdownRenderer.tsx
- [x] T133 [US2] Integrate react-markdown in packages/ui/src/molecules/MarkdownRenderer.tsx
- [x] T134 [US2] Add GitHub Flavored Markdown support in packages/ui/src/molecules/MarkdownRenderer.tsx
- [x] T135 [US2] Implement code syntax highlighting in packages/ui/src/molecules/MarkdownRenderer.tsx
- [x] T136 [US2] Add table rendering in packages/ui/src/molecules/MarkdownRenderer.tsx
- [x] T137 [US2] Sanitize HTML output in packages/ui/src/molecules/MarkdownRenderer.tsx

**Acceptance Criteria**:

- Markdown renders correctly
- GFM features work (tables, strikethrough, etc.)
- Code blocks are syntax-highlighted
- HTML is sanitized for security

### Mermaid Diagram Rendering

- [x] T138 [US2] Create MermaidDiagram component in packages/ui/src/molecules/MermaidDiagram.tsx
- [x] T139 [US2] Integrate mermaid.js in packages/ui/src/molecules/MermaidDiagram.tsx
- [x] T140 [US2] Parse Mermaid code blocks from markdown in packages/ui/src/molecules/MarkdownRenderer.tsx
- [x] T141 [US2] Render diagrams client-side in packages/ui/src/molecules/MermaidDiagram.tsx
- [x] T142 [US2] Add error handling for invalid diagrams in packages/ui/src/molecules/MermaidDiagram.tsx
- [x] T143 [US2] Implement lazy loading for performance in packages/ui/src/molecules/MermaidDiagram.tsx

**Acceptance Criteria**:

- Mermaid diagrams render inline in issue descriptions
- Error states are handled gracefully
- Performance is acceptable (renders in <1 second)
- Diagrams are lazy-loaded

### Link Preview Integration

- [x] T144 [US2] Create link preview API endpoint in apps/web/app/api/preview-link/route.ts
- [x] T145 [US2] Implement oembed/og:meta parsing in apps/web/src/lib/integrations/link-preview.ts
- [x] T146 [US2] Create LinkPreview component in packages/ui/src/molecules/LinkPreview.tsx
- [x] T147 [US2] Add caching for previews in apps/web/src/lib/integrations/link-preview.ts
- [x] T148 [US2] Implement graceful degradation (show link if preview fails) in packages/ui/src/molecules/LinkPreview.tsx
- [x] T149 [US2] Support Notion, Google Drive, Confluence in apps/web/src/lib/integrations/link-preview.ts
- [x] T150 [US2] Parse links from markdown and render previews in packages/ui/src/molecules/MarkdownRenderer.tsx

**Acceptance Criteria**:

- Link previews display for supported services
- Graceful degradation works (shows link if preview unavailable)
- Caching improves performance
- Preview API handles timeouts correctly

### Kanban Board

- [x] T151 [US2] Create KanbanBoard component in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T152 [US2] Integrate dnd-kit for drag-and-drop in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T153 [US2] Generate columns from workflow statuses in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T154 [US2] Create IssueCard component in packages/ui/src/molecules/IssueCard.tsx
- [x] T155 [US2] Implement drag-and-drop functionality in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T156 [US2] Add keyboard navigation in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T157 [US2] Implement column filtering in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T158 [US2] Add issue count badges in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T159 [US2] Optimize for performance (virtualization if needed) in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T160 [US2] Create Kanban board page route in apps/web/app/projects/[projectId]/board/page.tsx

**Acceptance Criteria**:

- Kanban board displays issues organized by status
- Drag-and-drop works smoothly
- Status updates on drop
- Keyboard navigation works
- Performance is acceptable for 100+ issues

### Workflow Validation

- [x] T161 [US2] Implement status transition validation in apps/web/src/lib/workflow/validation.ts
- [x] T162 [US2] Check workflow rules from config in apps/web/src/lib/workflow/validation.ts
- [x] T163 [US2] Validate required custom fields in apps/web/src/lib/workflow/validation.ts
- [x] T164 [US2] Show validation errors in UI in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T165 [US2] Prevent invalid transitions in packages/ui/src/organisms/KanbanBoard.tsx

**Acceptance Criteria**:

- Invalid status transitions are blocked
- Required fields are enforced before status change
- Errors are displayed clearly to users
- Workflow rules from config are respected

---

## Phase 5: User Story 3 - Configuration as Code Management (P2)

**Goal**: Enable admin users to edit project configuration file in browser-based editor, validate syntax, and apply changes that dynamically update workflow, statuses, and custom fields.

**Independent Test**: Navigate to Project Settings, load configuration file in editor, modify workflow statuses or custom fields, validate YAML syntax, save changes, and verify that Kanban board and issue forms reflect the new configuration. Test succeeds when configuration changes are immediately reflected in UI without requiring restart.

**Dependencies**: Phase 4 complete

### YAML Config Package

- [x] T166 [US3] Create YAML parsing with js-yaml in packages/yaml-config/src/parser.ts
- [x] T167 [US3] Create configuration schema with Zod in packages/yaml-config/src/schema.ts
- [x] T168 [US3] Implement validation logic in packages/yaml-config/src/validator.ts
- [x] T169 [US3] Add error reporting with line numbers in packages/yaml-config/src/validator.ts
- [x] T170 [US3] Create default configuration generator in packages/yaml-config/src/default-config.ts
- [x] T171 [US3] Export configuration types in packages/yaml-config/src/index.ts

**Acceptance Criteria**:

- Valid YAML parses correctly
- Invalid YAML shows errors with line numbers
- Schema validation works
- Default config is generated correctly

### Configuration Storage

- [x] T172 [US3] Store configYaml in database (Project.configYaml) in packages/database/src/repositories/project-repository.ts
- [x] T173 [US3] Store parsed config in JSONB (Project.config) in packages/database/src/repositories/project-repository.ts
- [x] T174 [US3] Implement config versioning in packages/database/src/repositories/project-repository.ts
- [x] T175 [US3] Create config sync from Git in apps/web/src/lib/integrations/config-sync.ts
- [x] T176 [US3] Add config history tracking in packages/database/src/repositories/project-repository.ts

**Acceptance Criteria**:

- Config is stored and retrieved correctly
- Config syncs from Git repository
- Version history is tracked
- JSONB provides fast access

### Configuration Editor UI

- [x] T177 [US3] Create ConfigEditor component in packages/ui/src/organisms/ConfigEditor.tsx
- [x] T178 [US3] Integrate CodeMirror for YAML editing in packages/ui/src/organisms/ConfigEditor.tsx
- [x] T179 [US3] Implement real-time syntax validation in packages/ui/src/organisms/ConfigEditor.tsx
- [x] T180 [US3] Add schema validation display in packages/ui/src/organisms/ConfigEditor.tsx
- [x] T181 [US3] Create config preview in packages/ui/src/organisms/ConfigEditor.tsx
- [x] T182 [US3] Implement save functionality in packages/ui/src/organisms/ConfigEditor.tsx
- [x] T183 [US3] Add error display in packages/ui/src/organisms/ConfigEditor.tsx
- [x] T184 [US3] Create configuration settings page in apps/web/app/projects/[projectId]/settings/config/page.tsx
- [x] T185 [US3] Enforce Admin-only access in apps/web/app/projects/[projectId]/settings/config/page.tsx

**Acceptance Criteria**:

- YAML editor works with syntax highlighting
- Real-time validation shows errors
- Schema validation displays specific errors
- Config saves successfully
- Admin-only access is enforced

### Configuration API

- [x] T186 [US3] Create GET /api/projects/[projectId]/config endpoint in apps/web/app/api/projects/[projectId]/config/route.ts
- [x] T187 [US3] Create PUT /api/projects/[projectId]/config endpoint in apps/web/app/api/projects/[projectId]/config/route.ts
- [x] T188 [US3] Validate YAML syntax before saving in apps/web/app/api/projects/[projectId]/config/route.ts
- [x] T189 [US3] Validate schema before saving in apps/web/app/api/projects/[projectId]/config/route.ts
- [x] T190 [US3] Return validation errors in response in apps/web/app/api/projects/[projectId]/config/route.ts

**Acceptance Criteria**:

- Config can be retrieved as YAML
- Config can be updated via API
- Validation errors are returned
- Invalid config is rejected

### Dynamic Workflow Updates

- [x] T191 [US3] Reload workflow on config change in apps/web/src/lib/workflow/reload.ts
- [x] T192 [US3] Update Kanban columns dynamically in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T193 [US3] Update issue status options dynamically in packages/ui/src/organisms/IssueForm.tsx
- [x] T194 [US3] Update custom field forms dynamically in packages/ui/src/organisms/IssueForm.tsx
- [x] T195 [US3] Invalidate affected caches in apps/web/src/lib/cache/invalidation.ts
- [x] T196 [US3] Implement real-time config updates via WebSocket or polling in apps/web/src/lib/config/sync.ts

**Acceptance Criteria**:

- UI updates immediately after config save
- No page refresh required
- All affected components update (Kanban, forms, dropdowns)
- Changes are reflected within 2 seconds

---

## Phase 6: User Story 4 - Git Integration and Automated Status Updates (P2)

**Goal**: Enable automatic issue status updates based on Git activity via webhooks when branches or pull requests are created/merged.

**Independent Test**: Create a branch with an issue key in the name (e.g., `feature/APP-123-auth-fix`), trigger a webhook from the Git service, and verify that Stride detects the issue key and updates the issue status. Test succeeds when branch creation automatically moves the issue to "In Progress" and PR merge moves it to the appropriate completion status.

**Dependencies**: Phase 4 complete

### Webhook Endpoints

- [x] T197 [US4] Create GitHub webhook endpoint in apps/web/app/api/webhooks/github/route.ts
- [x] T198 [US4] Create GitLab webhook endpoint in apps/web/app/api/webhooks/gitlab/route.ts
- [x] T199 [US4] Create Bitbucket webhook endpoint in apps/web/app/api/webhooks/bitbucket/route.ts
- [x] T200 [US4] Implement HMAC signature verification in apps/web/src/lib/webhooks/verification.ts
- [x] T201 [US4] Add webhook payload parsing in apps/web/src/lib/webhooks/parsers.ts
- [x] T202 [US4] Handle webhook errors gracefully in apps/web/src/lib/webhooks/handlers.ts

**Acceptance Criteria**:

- Webhooks are received from all supported services
- Signatures are verified correctly
- Errors are handled gracefully
- Failed webhooks are logged

### Branch Detection & Linking

- [x] T203 [US4] Parse branch names for issue keys in apps/web/src/lib/webhooks/branch-detection.ts
- [x] T204 [US4] Link branches to issues in packages/database/src/repositories/issue-branch-repository.ts
- [x] T205 [US4] Store branch information in IssueBranch table in packages/database/src/repositories/issue-branch-repository.ts
- [x] T206 [US4] Update issue status on branch creation in apps/web/src/lib/webhooks/branch-detection.ts
- [x] T207 [US4] Handle multiple branches per issue in apps/web/src/lib/webhooks/branch-detection.ts

**Acceptance Criteria**:

- Issue keys are detected in branch names (PROJECT-NUMBER format)
- Branches are linked to issues correctly
- Status updates automatically on branch creation
- Multiple branches per issue are supported

### Pull Request Integration

- [x] T208 [US4] Parse PR webhook payloads in apps/web/src/lib/webhooks/pr-parser.ts
- [x] T209 [US4] Link PRs to issues in packages/database/src/repositories/issue-branch-repository.ts
- [x] T210 [US4] Display PR status in issue view in packages/ui/src/organisms/IssueDetail.tsx
- [x] T211 [US4] Update issue status on PR merge in apps/web/src/lib/webhooks/status-updates.ts
- [x] T212 [US4] Handle PR state changes (open, merged, closed) in apps/web/src/lib/webhooks/pr-parser.ts

**Acceptance Criteria**:

- PRs are linked to issues correctly
- PR status displays in issue view
- Status updates on PR merge
- PR state changes are handled

### Issue Branch Display

- [x] T213 [US4] Display linked branches in issue view in packages/ui/src/organisms/IssueDetail.tsx
- [x] T214 [US4] Show PR links in issue view in packages/ui/src/organisms/IssueDetail.tsx
- [x] T215 [US4] Display commit information in packages/ui/src/organisms/IssueDetail.tsx
- [x] T216 [US4] Add branch status indicators in packages/ui/src/organisms/IssueDetail.tsx

**Acceptance Criteria**:

- Branches display in issue view
- PR links work and open in new tab
- Commit information is shown
- Status indicators are clear

---

## Phase 7: User Story 5 - Sprint Planning and Kanban Board Management (P2)

**Goal**: Enable product managers to create sprints, assign issues, and track progress through Kanban board with burndown metrics.

**Independent Test**: Create a new sprint, assign multiple issues to it, view the Kanban board with issues organized by status, and verify that burndown charts and cycle time metrics update as issues move through the workflow. Test succeeds when sprint data is accurately tracked and displayed.

**Dependencies**: Phase 4 complete (Kanban board must exist)

### Cycle Model & API

- [x] T217 [US5] Create cycle creation API route in apps/web/app/api/projects/[projectId]/cycles/route.ts
- [x] T218 [US5] Create cycle listing API route in apps/web/app/api/projects/[projectId]/cycles/route.ts
- [x] T219 [US5] Create cycle detail API route in apps/web/app/api/projects/[projectId]/cycles/[cycleId]/route.ts
- [x] T220 [US5] Implement issue assignment to cycles in apps/web/app/api/projects/[projectId]/cycles/[cycleId]/issues/route.ts
- [x] T221 [US5] Add cycle update API in apps/web/app/api/projects/[projectId]/cycles/[cycleId]/route.ts
- [x] T222 [US5] Create CycleRepository in packages/database/src/repositories/cycle-repository.ts

**Acceptance Criteria**:

- Cycles can be created and managed
- Issues can be assigned to cycles
- Cycle data is persisted correctly

### Sprint Planning UI

- [x] T223 [US5] Create SprintPlanning component in packages/ui/src/organisms/SprintPlanning.tsx
- [x] T224 [US5] Implement drag-and-drop from backlog in packages/ui/src/organisms/SprintPlanning.tsx
- [x] T225 [US5] Display sprint capacity in packages/ui/src/organisms/SprintPlanning.tsx
- [x] T226 [US5] Show story points in packages/ui/src/organisms/SprintPlanning.tsx
- [x] T227 [US5] Add sprint goal input in packages/ui/src/organisms/SprintPlanning.tsx
- [x] T228 [US5] Implement issue assignment in packages/ui/src/organisms/SprintPlanning.tsx
- [x] T229 [US5] Create sprint planning page route in apps/web/app/projects/[projectId]/sprints/new/page.tsx

**Acceptance Criteria**:

- Sprint planning interface works
- Issues can be assigned via drag-and-drop
- Capacity is tracked and displayed
- Story points are shown

### Burndown Charts

- [x] T230 [US5] Create BurndownChart component in packages/ui/src/molecules/BurndownChart.tsx
- [x] T231 [US5] Calculate burndown data in apps/web/src/lib/metrics/burndown.ts
- [x] T232 [US5] Integrate chart library (recharts) in packages/ui/src/molecules/BurndownChart.tsx
- [x] T233 [US5] Display remaining story points over time in packages/ui/src/molecules/BurndownChart.tsx
- [x] T234 [US5] Add tooltips and legends in packages/ui/src/molecules/BurndownChart.tsx
- [x] T235 [US5] Create burndown API endpoint in apps/web/app/api/projects/[projectId]/cycles/[cycleId]/burndown/route.ts

**Acceptance Criteria**:

- Burndown charts display correctly
- Data is accurate
- Charts are interactive with tooltips
- Updates as issues move through workflow

### Cycle Time Metrics

- [x] T236 [US5] Calculate cycle time per issue in apps/web/src/lib/metrics/cycle-time.ts
- [x] T237 [US5] Compute average cycle time in apps/web/src/lib/metrics/cycle-time.ts
- [x] T238 [US5] Create metrics API endpoint in apps/web/app/api/projects/[projectId]/cycles/[cycleId]/metrics/route.ts
- [x] T239 [US5] Display metrics in UI in packages/ui/src/organisms/SprintPlanning.tsx
- [x] T240 [US5] Add time range filtering in apps/web/src/lib/metrics/cycle-time.ts

**Acceptance Criteria**:

- Cycle time is calculated correctly (In Progress to Done)
- Average cycle time is computed
- Metrics display in UI
- Filtering works for different time ranges

---

## Phase 8: User Story 6 - Root Cause Diagnostics Integration (P3)

**Goal**: Enable automatic issue creation from monitoring service webhooks with error traces displayed in Root Cause Dashboard section.

**Independent Test**: Configure a webhook from a monitoring service, trigger a test error event, and verify that Stride creates a new issue with the error details, stack trace, and diagnostic information displayed in a dedicated section. Test succeeds when error context is immediately available in the issue view.

**Dependencies**: Phase 4 complete (issues must exist)

### Monitoring Webhook Endpoints

- [ ] T241 [US6] Create Sentry webhook endpoint in apps/web/app/api/webhooks/sentry/route.ts
- [ ] T242 [US6] Create Datadog webhook endpoint in apps/web/app/api/webhooks/datadog/route.ts
- [ ] T243 [US6] Create New Relic webhook endpoint in apps/web/app/api/webhooks/newrelic/route.ts
- [ ] T244 [US6] Parse error payloads in apps/web/src/lib/webhooks/error-parsers.ts
- [ ] T245 [US6] Extract stack traces in apps/web/src/lib/webhooks/error-parsers.ts
- [ ] T246 [US6] Handle webhook errors gracefully in apps/web/src/lib/webhooks/error-handlers.ts

**Acceptance Criteria**:

- Webhooks are received from all supported services
- Error data is extracted correctly
- Errors are handled gracefully
- Failed webhooks are logged

### Automatic Issue Creation

- [ ] T247 [US6] Create issues from error webhooks in apps/web/src/lib/webhooks/error-handlers.ts
- [ ] T248 [US6] Extract error details (title, severity, timestamp) in apps/web/src/lib/webhooks/error-parsers.ts
- [ ] T249 [US6] Set issue type to Bug automatically in apps/web/src/lib/webhooks/error-handlers.ts
- [ ] T250 [US6] Link error traces to issues in packages/database/src/repositories/issue-repository.ts
- [ ] T251 [US6] Group similar errors in apps/web/src/lib/webhooks/error-grouping.ts

**Acceptance Criteria**:

- Issues are created from errors automatically
- Error details are captured correctly
- Similar errors are grouped together
- Issue type is set to Bug

### Root Cause Dashboard

- [ ] T252 [US6] Create RootCauseDashboard component in packages/ui/src/organisms/RootCauseDashboard.tsx
- [ ] T253 [US6] Display error traces in packages/ui/src/organisms/RootCauseDashboard.tsx
- [ ] T254 [US6] Show stack traces with syntax highlighting in packages/ui/src/organisms/RootCauseDashboard.tsx
- [ ] T255 [US6] Display error frequency in packages/ui/src/organisms/RootCauseDashboard.tsx
- [ ] T256 [US6] Show last occurrence time in packages/ui/src/organisms/RootCauseDashboard.tsx
- [ ] T257 [US6] Add error aggregation in packages/ui/src/organisms/RootCauseDashboard.tsx
- [ ] T258 [US6] Integrate RootCauseDashboard in issue detail view in packages/ui/src/organisms/IssueDetail.tsx

**Acceptance Criteria**:

- Error traces display correctly
- Stack traces are readable with syntax highlighting
- Metrics are shown (frequency, last occurrence)
- Dashboard appears in issue view when error data exists

---

## Phase 9: User Story 7 - AI-Powered Triage and Analysis (P3)

**Goal**: Enable AI-powered issue triage that sends issue context to self-hosted AI gateway and displays analysis, priority suggestions, and assignment recommendations.

**Independent Test**: Open an issue with error context, click the AI triage button, verify the request is sent to the configured AI gateway, and confirm that AI-generated analysis (summary, priority, assignment suggestion) is displayed in the issue view. Test succeeds when AI analysis enhances issue understanding without exposing data outside the organization's network.

**Dependencies**: Phase 4 complete (issues must exist)

### AI Gateway Service

- [ ] T259 [US7] Create AI Gateway package structure in packages/ai-gateway/
- [ ] T260 [US7] Implement API endpoints in packages/ai-gateway/src/routes.ts
- [ ] T261 [US7] Support commercial APIs (OpenAI, Anthropic) in packages/ai-gateway/src/providers/commercial.ts
- [ ] T262 [US7] Support self-hosted LLMs in packages/ai-gateway/src/providers/self-hosted.ts
- [ ] T263 [US7] Add request/response logging in packages/ai-gateway/src/middleware/logging.ts
- [ ] T264 [US7] Implement rate limiting in packages/ai-gateway/src/middleware/rate-limit.ts
- [ ] T265 [US7] Add mock mode for development in packages/ai-gateway/src/providers/mock.ts

**Acceptance Criteria**:

- AI Gateway service runs
- Commercial and self-hosted LLMs work
- Logging is functional
- Rate limiting prevents abuse

### AI Triage Integration

- [ ] T266 [US7] Create "Triage with AI" button in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T267 [US7] Send issue context to AI Gateway in apps/web/src/lib/ai/triage.ts
- [ ] T268 [US7] Display AI analysis in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T269 [US7] Show priority suggestions in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T270 [US7] Show assignee suggestions in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T271 [US7] Allow accepting/modifying suggestions in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T272 [US7] Implement graceful degradation when AI unavailable in packages/ui/src/organisms/IssueDetail.tsx
- [ ] T273 [US7] Create AI triage API endpoint in apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts

**Acceptance Criteria**:

- AI triage works when gateway is available
- Suggestions are displayed clearly
- Users can accept/modify suggestions
- Graceful degradation works (shows error, issue remains functional)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Goal**: Complete testing, performance optimization, documentation, and production readiness.

**Dependencies**: All previous phases complete

### Testing

- [ ] T274 Setup Vitest for unit tests in root/vitest.config.ts
- [ ] T275 Configure test environment in root/vitest.config.ts
- [ ] T276 Create test utilities in apps/web/src/**tests**/utils.ts
- [ ] T277 Write unit tests for utilities in apps/web/src/**tests**/unit/
- [ ] T278 Write unit tests for components in packages/ui/src/**tests**/
- [ ] T279 Setup test database for integration tests in apps/web/src/**tests**/setup.ts
- [ ] T280 Create test fixtures in apps/web/src/**tests**/fixtures.ts
- [ ] T281 Write API route tests in apps/web/src/**tests**/api/
- [ ] T282 Write database operation tests in apps/web/src/**tests**/database/
- [ ] T283 Write webhook tests in apps/web/src/**tests**/webhooks/
- [ ] T284 Setup Playwright for E2E tests in root/playwright.config.ts
- [ ] T285 Create E2E test utilities in apps/web/e2e/utils.ts
- [ ] T286 Write E2E tests for User Story 1 in apps/web/e2e/us1-deployment.spec.ts
- [ ] T287 Write E2E tests for User Story 2 in apps/web/e2e/us2-issues.spec.ts
- [ ] T288 Write E2E tests for critical flows in apps/web/e2e/critical-flows.spec.ts
- [ ] T289 Setup CI/CD integration in .github/workflows/test.yml

**Acceptance Criteria**:

- All unit tests pass
- Integration tests pass
- E2E tests pass for critical flows
- Test coverage meets targets (80%+ for critical paths)

### Performance Optimization

- [ ] T290 Optimize database queries (add missing indexes) in packages/database/prisma/schema.prisma
- [ ] T291 Implement query result caching in apps/web/src/lib/cache/query-cache.ts
- [ ] T292 Optimize Kanban board rendering (virtualization if needed) in packages/ui/src/organisms/KanbanBoard.tsx
- [ ] T293 Add code splitting for heavy components in apps/web/app/
- [ ] T294 Optimize bundle size in apps/web/next.config.ts
- [ ] T295 Implement image optimization in apps/web/next.config.ts

**Acceptance Criteria**:

- Page load times meet success criteria (<2s for config updates, <500ms for drag-drop)
- Bundle size is optimized
- Database queries are efficient

### Documentation

- [ ] T296 Create API documentation in docs/api/
- [ ] T297 Create deployment guide in docs/deployment/
- [ ] T298 Create developer guide in docs/development/
- [ ] T299 Create user guide in docs/user/
- [ ] T300 Add inline code documentation (JSDoc) in apps/web/src/
- [ ] T301 Create README for each package in packages/\*/README.md

**Acceptance Criteria**:

- All documentation is complete
- API docs match actual endpoints
- Deployment guide is accurate
- Code is well-documented

### Security Hardening

- [ ] T302 Review and fix security vulnerabilities in apps/web/
- [ ] T303 Implement rate limiting on all API routes in apps/web/src/middleware/rate-limit.ts
- [ ] T304 Add security headers in apps/web/next.config.ts
- [ ] T305 Audit authentication and authorization in apps/web/src/lib/auth/
- [ ] T306 Review input validation in apps/web/src/lib/validation/
- [ ] T307 Implement CSRF protection in apps/web/src/middleware/csrf.ts

**Acceptance Criteria**:

- No critical security vulnerabilities
- Rate limiting is active
- Security headers are configured
- Input validation is comprehensive

### Production Readiness

- [ ] T308 Create production environment configuration in .env.production.example
- [ ] T309 Setup error monitoring (Sentry integration) in apps/web/src/lib/error-tracking.ts
- [ ] T310 Create health check endpoint in apps/web/app/api/health/route.ts
- [ ] T311 Implement graceful shutdown in apps/web/src/lib/shutdown.ts
- [ ] T312 Create production deployment scripts in scripts/deploy/
- [ ] T313 Setup logging aggregation in apps/web/src/lib/logger.ts

**Acceptance Criteria**:

- Production environment is configured
- Error monitoring is active
- Health checks work
- Deployment scripts are tested

---

## Dependencies Graph

### User Story Completion Order

```
Phase 1: Setup
  └─> Phase 2: Foundational Infrastructure
        └─> Phase 3: User Story 1 (Deployment & Onboarding)
              └─> Phase 4: User Story 2 (Issue Management)
                    ├─> Phase 5: User Story 3 (Configuration)
                    ├─> Phase 6: User Story 4 (Git Integration)
                    └─> Phase 7: User Story 5 (Sprint Planning)
                          ├─> Phase 8: User Story 6 (Diagnostics)
                          └─> Phase 9: User Story 7 (AI Triage)
                                └─> Phase 10: Polish & Testing
```

### Story Dependencies

- **US1** (Deployment): Blocks all other stories (foundational)
- **US2** (Issues): Blocks US3, US4, US5, US6, US7 (core functionality)
- **US3** (Configuration): Depends on US2 (needs issues to configure)
- **US4** (Git Integration): Depends on US2 (needs issues to link)
- **US5** (Sprints): Depends on US2 (needs issues to assign)
- **US6** (Diagnostics): Depends on US2 (needs issues to create from errors)
- **US7** (AI): Depends on US2 (needs issues to triage)

### Parallel Execution Opportunities

**Within Phase 2 (Foundational)**:

- T032-T038 (Types package) can be parallelized
- T040-T045 (UI foundation) can be parallelized
- T053-T058 (Observability) can be parallelized

**Within Phase 3 (US1)**:

- T059-T065 (Marketing site) can be parallelized with T066-T078 (Auth)
- T079-T083 (Projects) can be parallelized with T084-T091 (Repository)

**Within Phase 4 (US2)**:

- T097-T103 (Issue model) can be parallelized with T111-T118 (Command palette)
- T132-T137 (Markdown) can be parallelized with T138-T143 (Mermaid)
- T144-T150 (Link preview) can be parallelized with T151-T160 (Kanban)

**Within Phase 5 (US3)**:

- T166-T171 (YAML package) can be parallelized with T172-T176 (Storage)
- T177-T185 (Editor UI) can be parallelized with T186-T190 (API)

**Within Phase 6 (US4)**:

- T197-T202 (Webhooks) can be parallelized with T203-T207 (Branch detection)

**Within Phase 8 (US6)**:

- T241-T246 (Webhooks) can be parallelized with T247-T251 (Issue creation)

**Within Phase 9 (US7)**:

- T259-T265 (AI Gateway) can be parallelized with T266-T273 (Integration)

---

## Independent Test Criteria

### User Story 1 - Deployment & Onboarding

**Test**: Deploy Stride in a fresh environment, access the marketing site, follow Docker deployment instructions, create an admin account, and successfully link a GitHub/GitLab repository.  
**Success**: User can access the main application dashboard after completing these steps.

### User Story 2 - Issue Management

**Test**: Open command palette, create a new issue with title and description, paste a Mermaid diagram that renders inline, paste a Notion link that displays as a contextual preview, and move the issue between status columns on the Kanban board.  
**Success**: All actions complete without page reloads and the issue persists correctly.

### User Story 3 - Configuration as Code

**Test**: Navigate to Project Settings, load configuration file in editor, modify workflow statuses or custom fields, validate YAML syntax, save changes, and verify that Kanban board and issue forms reflect the new configuration.  
**Success**: Configuration changes are immediately reflected in UI without requiring restart.

### User Story 4 - Git Integration

**Test**: Create a branch with an issue key in the name (e.g., `feature/APP-123-auth-fix`), trigger a webhook from the Git service, and verify that Stride detects the issue key and updates the issue status.  
**Success**: Branch creation automatically moves the issue to "In Progress" and PR merge moves it to the appropriate completion status.

### User Story 5 - Sprint Planning

**Test**: Create a new sprint, assign multiple issues to it, view the Kanban board with issues organized by status, and verify that burndown charts and cycle time metrics update as issues move through the workflow.  
**Success**: Sprint data is accurately tracked and displayed.

### User Story 6 - Diagnostics Integration

**Test**: Configure a webhook from a monitoring service, trigger a test error event, and verify that Stride creates a new issue with the error details, stack trace, and diagnostic information displayed in a dedicated section.  
**Success**: Error context is immediately available in the issue view.

### User Story 7 - AI Triage

**Test**: Open an issue with error context, click the AI triage button, verify the request is sent to the configured AI gateway, and confirm that AI-generated analysis (summary, priority, assignment suggestion) is displayed in the issue view.  
**Success**: AI analysis enhances issue understanding without exposing data outside the organization's network.

---

## MVP Scope Recommendation

**Suggested MVP**: Phase 1-4 (User Stories 1 & 2)

**Rationale**:

- User Story 1 enables deployment and onboarding (foundational)
- User Story 2 provides core issue management (primary value)
- These two stories deliver a functional MVP that demonstrates key value propositions
- Remaining stories (P2, P3) can be added incrementally

**MVP Deliverables**:

- ✅ Working deployment via Docker
- ✅ Admin account creation and onboarding
- ✅ Repository connection
- ✅ Issue creation via command palette
- ✅ Issue management with Kanban board
- ✅ Mermaid diagram rendering
- ✅ Link previews
- ✅ Workflow validation

**Post-MVP Enhancements**:

- Configuration as Code (US3)
- Git Integration (US4)
- Sprint Planning (US5)
- Diagnostics (US6)
- AI Triage (US7)

---

## Task Summary

**Total Tasks**: 313  
**Phase 1 (Setup)**: 14 tasks  
**Phase 2 (Foundational)**: 44 tasks  
**Phase 3 (US1)**: 38 tasks  
**Phase 4 (US2)**: 69 tasks  
**Phase 5 (US3)**: 31 tasks  
**Phase 6 (US4)**: 20 tasks  
**Phase 7 (US5)**: 24 tasks  
**Phase 8 (US6)**: 18 tasks  
**Phase 9 (US7)**: 15 tasks  
**Phase 10 (Polish)**: 40 tasks

**Parallel Opportunities**: ~80 tasks marked with [P]

**Estimated Timeline**:

- **MVP (Phase 1-4)**: 8-10 weeks
- **Full Implementation (All Phases)**: 15-20 weeks

---

## Format Validation

✅ All tasks follow the strict checklist format:

- Checkbox: `- [ ]`
- Task ID: `T001`, `T002`, etc.
- Parallel marker: `[P]` where applicable
- Story label: `[US1]`, `[US2]`, etc. for story-specific tasks
- Description with file path: Every task includes exact file path

✅ All tasks are organized by user story to enable independent implementation

✅ Each phase includes independent test criteria

✅ Dependencies are clearly identified

✅ Parallel execution opportunities are marked

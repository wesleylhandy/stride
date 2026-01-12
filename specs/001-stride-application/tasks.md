# Implementation Tasks: Stride Core Application

**Feature Branch**: `001-stride-application`  
**Created**: 2024-12-19  
**Status**: Ready for Implementation  
**Feature Spec**: `specs/001-stride-application/spec.md`

## Overview

This document provides an actionable, dependency-ordered task breakdown for implementing the Stride Core Application. Tasks are organized by user story priority (P1, P2, P3) to enable independent implementation and testing.

**Total Tasks**: 427  
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

## Phase 7.5: Authenticated Layouts and Navigation Infrastructure (P2)

**Goal**: Provide consistent layout, navigation, and logout access across all authenticated pages to ensure professional UX and security (logout always accessible).

**Independent Test**: Navigate to any authenticated page (projects listing, kanban board, project settings), verify that a header with user menu and logout is visible, and confirm that navigation between pages works consistently. Test succeeds when all authenticated pages have consistent layout with accessible logout functionality.

**Dependencies**: Phase 3 complete (authentication and user management must exist)

**Rationale**: This infrastructure should be in place before building additional features. While onboarding has a layout, post-onboarding pages currently lack consistent navigation/logout. This phase ensures all authenticated pages have proper layout infrastructure.

### TopBar Component

- [x] T240.1 [P] Create TopBar component in packages/ui/src/organisms/TopBar.tsx
- [x] T240.2 [P] Integrate UserMenu in TopBar component in packages/ui/src/organisms/TopBar.tsx
- [x] T240.3 [P] Add search functionality placeholder to TopBar in packages/ui/src/organisms/TopBar.tsx
- [x] T240.4 [P] Add notifications placeholder to TopBar in packages/ui/src/organisms/TopBar.tsx
- [x] T240.5 [P] Style TopBar with Tailwind CSS using existing design tokens in packages/ui/src/organisms/TopBar.tsx
- [x] T240.6 [P] Ensure TopBar is responsive and works on mobile devices in packages/ui/src/organisms/TopBar.tsx

**Acceptance Criteria**:

- TopBar displays on all authenticated pages
- UserMenu with logout is accessible from TopBar
- TopBar has consistent styling with onboarding header
- Responsive design works on mobile

### Sidebar Component

- [x] T240.7 [P] Create Sidebar component in packages/ui/src/organisms/Sidebar.tsx
- [x] T240.8 [P] Add navigation items (Projects, Dashboard) to Sidebar in packages/ui/src/organisms/Sidebar.tsx
- [x] T240.9 [P] Create ProjectSelector component for sidebar in packages/ui/src/molecules/ProjectSelector.tsx
- [x] T240.10 [P] Add collapsible state management with Jotai atom in packages/ui/src/organisms/Sidebar.tsx
- [x] T240.11 [P] Implement keyboard navigation for sidebar items in packages/ui/src/organisms/Sidebar.tsx
- [x] T240.12 [P] Style Sidebar with Tailwind CSS using existing design tokens in packages/ui/src/organisms/Sidebar.tsx
- [x] T240.13 [P] Ensure Sidebar is responsive (collapses on mobile) in packages/ui/src/organisms/Sidebar.tsx

**Acceptance Criteria**:

- Sidebar displays navigation items
- Project selector allows switching between projects
- Collapsible state persists (Jotai atom)
- Keyboard navigation works
- Responsive design works on mobile

### DashboardLayout Component

- [x] T240.14 Create DashboardLayout server component in apps/web/app/components/templates/DashboardLayout.tsx
- [x] T240.15 Integrate Sidebar in DashboardLayout in apps/web/app/components/templates/DashboardLayout.tsx
- [x] T240.16 Integrate TopBar in DashboardLayout in apps/web/app/components/templates/DashboardLayout.tsx
- [x] T240.17 Create Breadcrumbs component in packages/ui/src/molecules/Breadcrumbs.tsx
- [x] T240.18 Add Breadcrumbs to DashboardLayout in apps/web/app/components/templates/DashboardLayout.tsx
- [x] T240.19 Style DashboardLayout with proper layout structure (sidebar + main content) in apps/web/app/components/templates/DashboardLayout.tsx
- [x] T240.20 Create layout wrapper for /projects route using DashboardLayout in apps/web/app/projects/layout.tsx
- [x] T240.21 Verify DashboardLayout displays correctly on projects listing page

**Acceptance Criteria**:

- DashboardLayout wraps authenticated pages consistently
- Sidebar and TopBar are visible
- Breadcrumbs show navigation path
- Layout structure is responsive
- Projects listing page uses DashboardLayout

### ProjectLayout Component

- [x] T240.22 Create ProjectLayout server component in apps/web/app/components/templates/ProjectLayout.tsx
- [x] T240.23 Create ProjectHeader component in apps/web/app/components/features/projects/ProjectHeader.tsx
- [x] T240.24 Display project name and key in ProjectHeader in apps/web/app/components/features/projects/ProjectHeader.tsx
- [x] T240.25 Add settings link to ProjectHeader in apps/web/app/components/features/projects/ProjectHeader.tsx
- [x] T240.26 Create ProjectTabs component in packages/ui/src/organisms/ProjectTabs.tsx
- [x] T240.27 Add tabs (Board, List, Roadmap, Settings) to ProjectTabs in packages/ui/src/organisms/ProjectTabs.tsx
- [x] T240.28 Integrate ProjectHeader and ProjectTabs in ProjectLayout in apps/web/app/components/templates/ProjectLayout.tsx
- [x] T240.29 Wrap ProjectLayout in DashboardLayout for consistent navigation in apps/web/app/components/templates/ProjectLayout.tsx
- [x] T240.30 Create layout wrapper for /projects/[projectId] route using ProjectLayout in apps/web/app/projects/[projectId]/layout.tsx
- [x] T240.31 Verify ProjectLayout displays correctly on kanban board page

**Acceptance Criteria**:

- ProjectLayout wraps project-specific pages
- ProjectHeader displays project information
- ProjectTabs allow navigation between project views
- Layout is nested within DashboardLayout for consistent navigation
- Kanban board page uses ProjectLayout

### Integration and Testing

- [x] T240.32 Verify all authenticated routes use appropriate layout (DashboardLayout or ProjectLayout)
- [x] T240.33 Ensure logout works from all authenticated pages
- [x] T240.34 Test navigation between projects listing and individual project pages
- [x] T240.35 Verify responsive design works on mobile devices
- [x] T240.36 Ensure keyboard navigation works throughout layout components
- [x] T240.37 Verify accessibility (WCAG 2.1 AA) for layout components

**Acceptance Criteria**:

- All authenticated pages have consistent layout
- Logout is accessible from every page
- Navigation works smoothly
- Responsive design is functional
- Accessibility requirements are met

---

## Phase 7.6: Settings Pages and Navigation Fixes (P2 - Critical Fixes)

**Goal**: Fix critical 404 errors for settings navigation and provide essential user account and project settings pages.

**Independent Test**: Access account settings via command palette (Cmd/Ctrl+K → "Go to Settings"), verify page loads correctly. Click "Settings" link on project card, verify project settings index page loads. Test succeeds when all settings navigation works without 404 errors.

**Dependencies**: Phase 3 complete (authentication must exist), Phase 7.5 optional (layouts can enhance these pages later)

**Rationale**: These are critical fixes preventing 404 errors. Navigation commands and UI links reference routes that don't exist. Quick fixes ensure application works as expected before building additional features.

### User Account Settings Page

- [x] T240.38 Create user account settings page route in apps/web/app/settings/page.tsx
- [x] T240.39 Add authentication check for settings page in apps/web/app/settings/page.tsx
- [x] T240.40 Create UserProfileForm component in apps/web/app/components/features/settings/UserProfileForm.tsx
- [x] T240.41 Display current user profile information (name, email, username) in UserProfileForm in apps/web/app/components/features/settings/UserProfileForm.tsx
- [x] T240.42 Implement profile update functionality in UserProfileForm in apps/web/app/components/features/settings/UserProfileForm.tsx
- [x] T240.43 Create ChangePasswordForm component in apps/web/app/components/features/settings/ChangePasswordForm.tsx
- [x] T240.44 Implement password change functionality in ChangePasswordForm in apps/web/app/components/features/settings/ChangePasswordForm.tsx
- [x] T240.45 Create user profile update API route in apps/web/app/api/user/profile/route.ts
- [x] T240.46 Create password change API route in apps/web/app/api/user/password/route.ts
- [x] T240.47 Add input validation with Zod schemas for profile and password forms in apps/web/src/lib/validation/user.ts
- [x] T240.48 Style settings page with Tailwind CSS using existing design tokens in apps/web/app/settings/page.tsx
- [x] T240.49 Verify navigation command "Go to Settings" works correctly (navigates to /settings)

**Acceptance Criteria**:

- User account settings page is accessible at `/settings`
- Profile information displays correctly
- Profile updates work successfully
- Password change functionality works
- Authentication is enforced
- Navigation command works without 404

### Project Settings Index Page

- [x] T240.50 Create project settings index page route in apps/web/app/projects/[projectId]/settings/page.tsx
- [x] T240.51 Add project access permission check for settings page in apps/web/app/projects/[projectId]/settings/page.tsx
- [x] T240.52 Create ProjectSettingsNavigation component in apps/web/app/components/features/projects/ProjectSettingsNavigation.tsx
- [x] T240.53 Add navigation link to Configuration page in ProjectSettingsNavigation in apps/web/app/components/features/projects/ProjectSettingsNavigation.tsx
- [x] T240.54 Display project name and key in project settings header in apps/web/app/projects/[projectId]/settings/page.tsx
- [x] T240.55 Style project settings index page with Tailwind CSS using existing design tokens in apps/web/app/projects/[projectId]/settings/page.tsx
- [x] T240.56 Verify ProjectCard "Settings" link works correctly (navigates to /projects/[projectId]/settings)

**Acceptance Criteria**:

- Project settings index page is accessible at `/projects/[projectId]/settings`
- Navigation to Configuration sub-page works
- Project access permissions are enforced
- ProjectCard settings link works without 404
- Page displays project information correctly

### Navigation Fixes

- [x] T240.57 Verify all navigation commands in command palette point to existing routes
- [x] T240.58 Update navigation.ts if any commands need route adjustments
- [x] T240.59 Test navigation from all entry points (command palette, ProjectCard, menus)

**Acceptance Criteria**:

- All navigation commands work without 404 errors
- All UI links point to existing routes
- Navigation is consistent across the application

---

## Phase 8: User Story 6 - Root Cause Diagnostics Integration (P3)

**Goal**: Enable automatic issue creation from monitoring service webhooks with error traces displayed in Root Cause Dashboard section.

**Independent Test**: Configure a webhook from a monitoring service, trigger a test error event, and verify that Stride creates a new issue with the error details, stack trace, and diagnostic information displayed in a dedicated section. Test succeeds when error context is immediately available in the issue view.

**Dependencies**: Phase 4 complete (issues must exist)

### Monitoring Webhook Endpoints

- [x] T241 [US6] Create Sentry webhook endpoint in apps/web/app/api/webhooks/sentry/route.ts
- [x] T242 [US6] Create Datadog webhook endpoint in apps/web/app/api/webhooks/datadog/route.ts
- [x] T243 [US6] Create New Relic webhook endpoint in apps/web/app/api/webhooks/newrelic/route.ts
- [x] T244 [US6] Parse error payloads in apps/web/src/lib/webhooks/error-parsers.ts
- [x] T245 [US6] Extract stack traces in apps/web/src/lib/webhooks/error-parsers.ts
- [x] T246 [US6] Handle webhook errors gracefully in apps/web/src/lib/webhooks/error-handlers.ts

**Acceptance Criteria**:

- Webhooks are received from all supported services
- Error data is extracted correctly
- Errors are handled gracefully
- Failed webhooks are logged

### Automatic Issue Creation

- [x] T247 [US6] Create issues from error webhooks in apps/web/src/lib/webhooks/error-handlers.ts
- [x] T248 [US6] Extract error details (title, severity, timestamp) in apps/web/src/lib/webhooks/error-parsers.ts
- [x] T249 [US6] Set issue type to Bug automatically in apps/web/src/lib/webhooks/error-handlers.ts
- [x] T250 [US6] Link error traces to issues in packages/database/src/repositories/issue-repository.ts
- [x] T251 [US6] Group similar errors in apps/web/src/lib/webhooks/error-grouping.ts

**Acceptance Criteria**:

- Issues are created from errors automatically
- Error details are captured correctly
- Similar errors are grouped together
- Issue type is set to Bug

### Root Cause Dashboard

- [x] T252 [US6] Create RootCauseDashboard component in packages/ui/src/organisms/RootCauseDashboard.tsx
- [x] T253 [US6] Display error traces in packages/ui/src/organisms/RootCauseDashboard.tsx
- [x] T254 [US6] Show stack traces with syntax highlighting in packages/ui/src/organisms/RootCauseDashboard.tsx
- [x] T255 [US6] Display error frequency in packages/ui/src/organisms/RootCauseDashboard.tsx
- [x] T256 [US6] Show last occurrence time in packages/ui/src/organisms/RootCauseDashboard.tsx
- [x] T257 [US6] Add error aggregation in packages/ui/src/organisms/RootCauseDashboard.tsx
- [x] T258 [US6] Integrate RootCauseDashboard in issue detail view in packages/ui/src/organisms/IssueDetail.tsx

**Acceptance Criteria**:

- Error traces display correctly
- Stack traces are readable with syntax highlighting
- Metrics are shown (frequency, last occurrence)
- Dashboard appears in issue view when error data exists

---

## Phase 8.5: Repository Connection Management in Project Settings

**Goal**: Enable Admin users to configure GitHub/GitLab repository connections for projects after onboarding is complete through Project Settings → Integrations.

**Independent Test**: Navigate to Project Settings → Integrations, view existing connection (if any), connect a new repository via OAuth or manual token, and verify the connection is displayed and functional. Test succeeds when users can manage repository connections without going through onboarding again.

**Dependencies**: Phase 7.6 complete (project settings pages must exist), Phase 3 complete (repository connection API endpoints must exist)

### Settings Navigation

- [x] T259 [P] Enable Integrations link in ProjectSettingsNavigation component in apps/web/src/components/features/projects/ProjectSettingsNavigation.tsx

**Acceptance Criteria**:

- Integrations link appears in project settings navigation
- Link is only visible to Admin users
- Link navigates to `/projects/[projectId]/settings/integrations`

### Integrations Settings Page

- [x] T260 Create integrations settings page route in apps/web/app/projects/[projectId]/settings/integrations/page.tsx
- [x] T261 [P] Implement server-side authentication check in apps/web/app/projects/[projectId]/settings/integrations/page.tsx
- [x] T262 [P] Fetch project data in apps/web/app/projects/[projectId]/settings/integrations/page.tsx
- [x] T263 Create RepositoryConnectionSettings client component in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx

**Acceptance Criteria**:

- Page requires Admin authentication
- Page displays project information
- Page renders RepositoryConnectionSettings component
- 403 error shown for non-admin users

### Reusable Connection Form Component

- [x] T264 Extract RepositoryConnectionForm component from onboarding flow in apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
- [x] T265 [P] Implement OAuth connection buttons (GitHub/GitLab) in apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
- [x] T266 [P] Implement manual token form fields in apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
- [x] T267 [P] Add form validation with Zod schemas in apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
- [x] T268 [P] Implement token show/hide toggle in apps/web/src/components/features/projects/RepositoryConnectionForm.tsx

**Acceptance Criteria**:

- Component is reusable for both onboarding and settings
- OAuth buttons trigger OAuth flow
- Manual form validates inputs
- Token field has show/hide functionality
- Component accepts props for projectId and onSuccess callback

### Connection Status Display

- [x] T269 Implement connection status display in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T270 [P] Fetch existing connection using TanStack Query in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T271 [P] Display repository URL and service type in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T272 [P] Display last sync timestamp in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T273 [P] Show connection status badge (Connected/Not Connected) in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx

**Acceptance Criteria**:

- Connection info displays when connection exists
- "Not Connected" state displays when no connection
- Last sync timestamp formats correctly
- Service type displays with appropriate icon/badge

### OAuth Connection Flow

- [x] T274 Implement OAuth URL fetching in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T275 [P] Handle OAuth redirect with returnTo parameter in apps/web/app/api/projects/[projectId]/repositories/callback/route.ts
- [x] T276 [P] Store returnTo URL in sessionStorage for OAuth callback in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T277 [P] Redirect to settings page after OAuth success in apps/web/app/api/projects/[projectId]/repositories/callback/route.ts

**Acceptance Criteria**:

- OAuth flow redirects to Git service
- Callback redirects back to settings page
- Connection is created/updated after OAuth
- Success message displays after redirect

### Manual Token Connection Flow

- [x] T278 Implement manual token connection submission in apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
- [x] T279 [P] Create connection mutation using TanStack Query in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T280 [P] Handle connection success response in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T281 [P] Refetch connection status after successful connection in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx

**Acceptance Criteria**:

- Manual form submits connection data
- API call creates/updates connection
- Connection status updates after submission
- Form clears on success

### Error Handling and Loading States

- [x] T282 [P] Add loading states for connection fetch in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T283 [P] Add loading states for OAuth flow in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T284 [P] Add loading states for manual connection in apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
- [x] T285 [P] Display API error messages in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T286 [P] Display validation errors in form in apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
- [x] T287 [P] Handle 404 when no connection exists gracefully in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx

**Acceptance Criteria**:

- Loading indicators show during async operations
- Error messages display clearly
- Validation errors show inline
- 404 errors handled without breaking UI

### Success Notifications

- [x] T288 [P] Add success notification after OAuth connection in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T289 [P] Add success notification after manual connection in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx
- [x] T290 [P] Add success notification after connection update in apps/web/src/components/features/projects/RepositoryConnectionSettings.tsx

**Acceptance Criteria**:

- Success messages display after connection operations
- Messages are dismissible
- Messages don't block UI interaction

### Testing

- [x] T291 Write unit tests for RepositoryConnectionForm component in apps/web/src/components/features/projects/**tests**/RepositoryConnectionForm.test.tsx
- [x] T292 Write unit tests for RepositoryConnectionSettings component in apps/web/src/components/features/projects/**tests**/RepositoryConnectionSettings.test.tsx
- [x] T293 Write integration tests for settings page API calls in apps/web/app/projects/[projectId]/settings/integrations/**tests**/page.test.ts
- [x] T294 Write E2E test for OAuth connection flow in apps/web/**e2e**/repository-connection-oauth.spec.ts
- [x] T295 Write E2E test for manual token connection flow in apps/web/**e2e**/repository-connection-manual.spec.ts

**Acceptance Criteria**:

- Unit tests cover form validation and component behavior
- Integration tests verify API interactions
- E2E tests verify complete user flows
- All tests pass

---

## Phase 8.6: Toast Notifications & YAML Configuration Documentation (P2)

**Goal**: Replace window alerts with accessible toast notifications and add comprehensive YAML configuration documentation to both marketing site and internal application.

**Independent Test**: Trigger an error (e.g., invalid status transition), verify a toast notification appears instead of an alert dialog, check that error message includes configuration context and help link. Navigate to configuration documentation from both marketing site and internal app, verify all schema options are documented with examples. Test succeeds when all alerts are replaced with toasts and documentation is comprehensive and accessible.

**Dependencies**: Phase 4 complete (error handling patterns exist), Phase 5 complete (configuration system exists)

### Toast System Setup

- [x] T351 [P] Install sonner toast library in root package.json
- [x] T352 [P] Add Toaster component to root layout in apps/web/app/layout.tsx
- [x] T353 [P] Create useToast hook wrapper in packages/ui/src/hooks/useToast.ts
- [x] T354 [P] Export useToast hook from packages/ui/src/index.ts
- [x] T355 Configure Toaster styling to match design system in apps/web/app/layout.tsx

**Acceptance Criteria**:

- sonner library installed and configured
- Toaster component renders in app
- useToast hook available throughout app
- Toast styling matches design system

### Replace Alert Calls with Toasts

- [x] T356 Replace alert() in KanbanBoardClient error handling in apps/web/src/components/KanbanBoardClient.tsx
- [x] T357 Replace alert() in CreateIssueModal error handling in apps/web/src/components/CreateIssueModal.tsx
- [x] T358 [P] Replace alert() in API error handlers in apps/web/app/api/projects/[projectId]/issues/[issueKey]/status/route.ts
- [x] T359 [P] Replace alert() in webhook error handlers in apps/web/src/lib/webhooks/error-handlers.ts
- [x] T360 [P] Replace alert() in configuration validation errors in apps/web/src/components/features/projects/ConfigEditor.tsx
- [x] T361 Add toast.error() for network failures in apps/web/src/components/KanbanBoardClient.tsx
- [x] T362 Add toast.success() for successful operations in apps/web/src/components/CreateIssueModal.tsx

**Acceptance Criteria**:

- All alert() calls replaced with toast notifications
- Error toasts show detailed messages with configuration context
- Success toasts provide feedback for user actions
- Toast positioning and styling consistent

### Enhanced Error Messages

- [x] T363 Enhance error messages with configuration context in apps/web/src/components/KanbanBoardClient.tsx
- [x] T364 Add helpUrl to error responses in apps/web/app/api/projects/[projectId]/issues/[issueKey]/status/route.ts
- [x] T365 [P] Add helpUrl to validation error responses in apps/web/src/lib/workflow/validation.ts
- [x] T366 [P] Add action buttons (Retry, View Help) to error toasts in apps/web/src/components/KanbanBoardClient.tsx
- [x] T367 Format validation errors for toast display in apps/web/src/components/KanbanBoardClient.tsx
- [x] T368 Add undo action for reversible operations in apps/web/src/components/KanbanBoardClient.tsx

**Acceptance Criteria**:

- Error messages explain configuration issues clearly
- Help links navigate to relevant documentation
- Action buttons work correctly (retry, undo, view help)
- Error formatting is user-friendly

### Marketing Site Documentation

- [x] T369 [P] Create docs route structure in apps/site/app/docs/configuration/page.tsx
- [x] T370 [P] Create configuration overview content in apps/site/content/docs/configuration.md
- [x] T371 [P] Add quick start guide with minimal example in apps/site/content/docs/configuration.md
- [x] T372 [P] Add common patterns section (workflow setup, custom fields) in apps/site/content/docs/configuration.md
- [x] T373 [P] Add link to full documentation in apps/site/content/docs/configuration.md
- [x] T374 [P] Style documentation page to match marketing site in apps/site/app/docs/configuration/page.tsx
- [x] T375 [P] Add navigation link to docs in apps/site/app/components/

**Acceptance Criteria**:

- Documentation accessible at /docs/configuration on marketing site
- Quick start guide provides working example
- Common patterns section helpful for new users
- Navigation links work correctly

### Internal Application Documentation

- [x] T376 [P] Create docs route in apps/web/app/docs/configuration/page.tsx
- [x] T377 [P] Create comprehensive configuration reference in apps/web/content/docs/configuration-reference.md
- [x] T378 [P] Document project_key and project_name fields in apps/web/content/docs/configuration-reference.md
- [x] T379 [P] Document workflow configuration section in apps/web/content/docs/configuration-reference.md
- [x] T380 [P] Document status configuration (key, name, type) in apps/web/content/docs/configuration-reference.md
- [x] T381 [P] Document custom fields configuration in apps/web/content/docs/configuration-reference.md
- [x] T382 [P] Document automation rules configuration in apps/web/content/docs/configuration-reference.md
- [x] T383 [P] Add validation rules documentation in apps/web/content/docs/configuration-reference.md
- [x] T384 [P] Create troubleshooting guide in apps/web/content/docs/configuration-troubleshooting.md
- [x] T385 [P] Document common error messages and solutions in apps/web/content/docs/configuration-troubleshooting.md
- [x] T386 [P] Add examples section with validated YAML snippets in apps/web/content/docs/configuration-examples.md
- [x] T387 [P] Style documentation pages to match internal app design in apps/web/app/docs/configuration/page.tsx
- [x] T388 [P] Add navigation link to docs in apps/web/app/components/

**Acceptance Criteria**:

- Documentation accessible at /docs/configuration in internal app
- All schema options documented with examples
- Validation rules clearly explained
- Troubleshooting guide helps resolve common issues
- All examples validate against schema

### Documentation Integration

- [x] T389 Link documentation from error toasts in apps/web/src/components/KanbanBoardClient.tsx
- [x] T390 [P] Add help tooltips in configuration editor in apps/web/src/components/features/projects/ConfigEditor.tsx
- [x] T391 [P] Add contextual help links in validation error messages in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T392 [P] Create documentation link component in packages/ui/src/molecules/DocumentationLink.tsx
- [x] T393 Validate all documentation examples against schema in apps/web/scripts/validate-docs.ts

**Acceptance Criteria**:

- Error messages link to relevant documentation
- Help tooltips provide quick reference
- Documentation examples are all valid YAML
- Links work correctly from all locations

### Testing

- [x] T394 Write unit tests for useToast hook in packages/ui/src/hooks/**tests**/useToast.test.ts
- [x] T395 Write integration tests for toast notifications in apps/web/src/**tests**/integration/toast.test.ts
- [x] T396 Write accessibility tests for toast system in apps/web/src/**tests**/accessibility/toast.test.ts
- [x] T397 Write tests for documentation example validation in apps/web/scripts/**tests**/validate-docs.test.ts
- [x] T398 Write E2E test for toast notifications in apps/web/e2e/toast-notifications.spec.ts
- [x] T399 Write E2E test for documentation access in apps/web/e2e/documentation.spec.ts

**Acceptance Criteria**:

- Unit tests cover toast hook functionality
- Integration tests verify toast integration
- Accessibility tests confirm WCAG 2.1 AA compliance
- Documentation examples validated
- E2E tests verify user flows

---

## Phase 8.7: User Assignment & Issue Clone Enhancements (P1 Enhancement)

**Goal**: Enhance issue management with user assignment dropdown and issue clone functionality.

**Independent Test**:

1. **User Assignment**: Create or edit an issue, select a user from the assignee dropdown, save the issue, and verify the assignee is correctly stored and displayed. Test succeeds when assignee dropdown appears, user can select from list, selection persists, and displays correctly.
2. **Issue Clone**: Open an existing issue detail page, click "Clone" button, verify create modal opens with all relevant fields prefilled (excluding metadata), edit if desired, save new issue. Test succeeds when clone button appears, modal opens prefilled, new issue gets new key, and metadata is excluded.

**Dependencies**: Phase 4 complete (User Story 2 - Issue Creation and Management)

### User Assignment Feature

- [x] T400 [P] [US2] Create GET /api/users endpoint in apps/web/app/api/users/route.ts
- [x] T401 [US2] Implement authentication check in apps/web/app/api/users/route.ts
- [x] T402 [US2] Implement user list query (select id, username, name, avatarUrl, role) in apps/web/app/api/users/route.ts
- [x] T403 [US2] Add error handling (401, 500) and response formatting in apps/web/app/api/users/route.ts
- [x] T404 [P] [US2] Add users prop to IssueFormProps interface in packages/ui/src/organisms/IssueForm.tsx
- [x] T405 [US2] Add assignee dropdown field after Priority field in packages/ui/src/organisms/IssueForm.tsx
- [x] T406 [US2] Implement user display format (name (username) or username) in assignee dropdown in packages/ui/src/organisms/IssueForm.tsx
- [x] T407 [US2] Add "Unassigned" option to assignee dropdown in packages/ui/src/organisms/IssueForm.tsx
- [x] T408 [P] [US2] Add user fetching in CreateIssueModal component in apps/web/src/components/CreateIssueModal.tsx
- [x] T409 [US2] Pass users prop to IssueForm in CreateIssueModal in apps/web/src/components/CreateIssueModal.tsx
- [x] T410 [US2] Add user fetching in IssueDetail edit mode in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [x] T411 [US2] Pass users prop to IssueForm when editing in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [x] T412 [US2] Update IssueDetail display to show assignee name/username instead of ID in packages/ui/src/organisms/IssueDetail.tsx

**Checkpoint**: User assignment feature complete - users can assign issues from create/edit forms

### Issue Clone Feature

- [x] T413 [P] [US2] Add onClone callback prop to IssueDetailProps interface in packages/ui/src/organisms/IssueDetail.tsx
- [x] T414 [US2] Add Clone button next to Edit button in IssueDetail header in packages/ui/src/organisms/IssueDetail.tsx
- [x] T415 [US2] Style Clone button as ghost variant in packages/ui/src/organisms/IssueDetail.tsx
- [x] T416 [P] [US2] Create clone handler function in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [x] T417 [US2] Map issue data to CreateIssueInput excluding metadata (id, key, createdAt, updatedAt, closedAt, reporterId) in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [x] T418 [US2] Open CreateIssueModal with prefilled initialValues in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [x] T419 [US2] Pass clone handler to IssueDetail component via onClone prop in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [x] T420 [US2] Support initialValues prop in CreateIssueModal for prefilling form in apps/web/src/components/CreateIssueModal.tsx
- [x] T421 [US2] Pass initialValues to IssueForm when provided in CreateIssueModal in apps/web/src/components/CreateIssueModal.tsx

**Checkpoint**: Issue clone feature complete - users can clone issues with prefilled data

### User Assignment Configuration

- [x] T422 [US2] Add UserAssignmentConfigSchema to packages/yaml-config/src/schema.ts with fields: default_assignee (enum: 'none' | 'reporter'), assignee_required (boolean), clone_preserve_assignee (boolean), require_assignee_for_statuses (array of status keys)
- [x] T423 [US2] Update ProjectConfigSchema to include optional user_assignment field in packages/yaml-config/src/schema.ts
- [x] T424 [US2] Add default values to UserAssignmentConfigSchema (default_assignee: 'none', assignee_required: false, clone_preserve_assignee: true, require_assignee_for_statuses: []) in packages/yaml-config/src/schema.ts
- [x] T425 [US2] Update default config generator to include user_assignment defaults in packages/yaml-config/src/default-config.ts
- [x] T426 [US2] Implement default assignee logic (auto-assign to reporter if default_assignee: 'reporter') in issue creation in apps/web/app/api/projects/[projectId]/issues/route.ts
- [x] T427 [US2] Implement clone assignment preservation logic based on user_assignment.clone_preserve_assignee config in clone handler in apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx
- [x] T428 [US2] Add assignee requirement validation for status transitions in apps/web/src/lib/workflow/validation.ts checking require_assignee_for_statuses array
- [x] T429 [US2] Add user assignment configuration section to apps/web/content/docs/configuration-reference.md documenting all user_assignment fields with examples
- [x] T430 [US2] Update configuration examples to include user_assignment examples in apps/web/content/docs/configuration-examples.md

**Checkpoint**: User assignment configuration complete - configurable defaults and requirements

**Acceptance Criteria**:

- Users can select assignee from dropdown in create/edit forms
- Assignee selection persists correctly (create and update)
- Clone button appears on issue detail pages for users with edit permission
- Clone opens create modal with all relevant fields prefilled
- Cloned issues get new key and have current user as reporter
- User list endpoint returns data in <200ms for typical team sizes
- Configuration-driven default assignee works (reporter vs none based on config)
- Configuration-driven clone assignment preservation works (preserve vs clear based on config)
- Status transition validation enforces assignee requirements when configured
- User assignment configuration is documented with examples
- All configuration options are backward compatible (defaults maintain current behavior)
- All existing functionality continues to work

---

## Phase 9: User Story 7 - AI-Powered Triage and Analysis (P3)

**Goal**: Enable AI-powered issue triage that sends issue context (title, description, status, custom fields, error traces if available, recent 5-10 comments) to self-hosted AI gateway and displays analysis in a dedicated expandable "AI Triage Analysis" section with priority suggestions (matching project config or standard format) and assignee recommendations (natural language description with manual selection).

**Independent Test**: Open an issue with error context, click the AI triage button (visible only to Admin by default, or roles allowed by project configuration), verify the request is sent to the configured AI gateway with correct payload structure, and confirm that AI-generated analysis (summary, priority, assignment suggestion) is displayed in the expandable "AI Triage Analysis" section positioned after issue details but before comments. Test succeeds when AI analysis enhances issue understanding without exposing data outside the organization's network.

**Dependencies**: Phase 4 complete (issues must exist), Phase 5 complete (configuration system must exist for priority matching and permission configuration), Phase 8.5 complete (Project Settings → Integrations page pattern established for UI consistency)

**Phase 9 Structure**:

1. Configuration Schema Updates
2. AI Provider Configuration UI (FR-028a through FR-028e)
3. AI Gateway Service
4. AI Prompt Strategy Implementation
5. Issue Context Payload Builder
6. Permission System
7. AI Triage API Endpoint
8. UI Components - Core Structure
9. UI Components - Integration & State
10. Error Handling & Edge Cases
11. Documentation Updates

### Configuration Schema Updates

- [x] T511 [US7] Add aiTriageConfig schema to packages/yaml-config/src/schema.ts with fields: permissions (array of 'admin'|'member'|'viewer', default ['admin']), enabled (boolean, default true). Note: YAML config uses snake_case `ai_triage_permissions`, TypeScript schema property is `aiTriageConfig.permissions` (camelCase).
- [x] T512 [US7] Update default config generator to include aiTriageConfig defaults in packages/yaml-config/src/default-config.ts
- [x] T513 [US7] Add priority values extraction helper function in packages/yaml-config/src/priority-extractor.ts to read custom priority values from project config for AI gateway

**Acceptance Criteria**:

- Configuration schema validates aiTriageConfig correctly
- Default config includes AI triage settings
- Priority extraction works for both custom and standard priorities

### AI Gateway Service

- [x] T514 [US7] Verify AI Gateway package structure exists in packages/ai-gateway/ (already created in Phase 1, T008)
- [x] T515 [US7] Implement POST /analyze-issue endpoint in packages/ai-gateway/src/routes.ts accepting issue context payload (title, description, status, customFields, errorTraces?, recentComments) and projectConfig (priorityValues?)
- [x] T516 [US7] Support commercial APIs (OpenAI, Anthropic) in packages/ai-gateway/src/providers/commercial.ts
- [x] T517 [US7] Support self-hosted LLMs in packages/ai-gateway/src/providers/self-hosted.ts
- [x] T518 [US7] Implement priority mapping logic in packages/ai-gateway/src/mappers/priority.ts: if projectConfig.priorityValues exists, return one of those values; otherwise return standard (low/medium/high)
- [x] T519 [US7] Add request/response logging in packages/ai-gateway/src/middleware/logging.ts
- [x] T520 [US7] Implement rate limiting in packages/ai-gateway/src/middleware/rate-limit.ts
- [x] T520.1 [US7] [P] Add mock mode for development in packages/ai-gateway/src/providers/mock.ts returning sample responses matching response format

**Acceptance Criteria**:

- AI Gateway service runs and accepts correct payload format
- Commercial and self-hosted LLMs work
- Priority mapping matches project config or falls back to standard
- Logging is functional
- Rate limiting prevents abuse
- Mock mode returns properly formatted responses

### AI Provider Configuration UI (FR-028a through FR-028e)

**Based on Phase 9 Clarifications (Session 2026-01-10)**: Admin-only AI provider configuration management in Project Settings → Integrations page. Supports multiple providers per project with encrypted credential storage and model selection.

- [x] T521 [US7] [P] Add AI Provider Configuration section to Project Settings → Integrations page in apps/web/app/projects/[projectId]/settings/integrations/page.tsx (reuse pattern from Phase 8.5 repository connections)
- [x] T522 [US7] [P] Create AiProviderSettings component in apps/web/src/components/features/projects/AiProviderSettings.tsx to display list of configured providers with add/edit/delete actions
- [x] T523 [US7] [P] Create AiProviderForm component in apps/web/src/components/features/projects/AiProviderForm.tsx with fields: provider type (dropdown: OpenAI, Anthropic, Ollama), API key/token (password-type masked field), endpoint URL (for self-hosted LLMs), optional auth token (password-type for self-hosted)
- [x] T524 [US7] [P] Implement password-type input fields in AiProviderForm for API keys/tokens with masked display in apps/web/src/components/features/projects/AiProviderForm.tsx - tokens never displayed in plain text after entry, must be re-entered to change
- [x] T525 [US7] [P] Add model selection multiselect interface in AiProviderForm in apps/web/src/components/features/projects/AiProviderForm.tsx allowing Admin to select which models from each provider are available to users
- [x] T526 [US7] [P] Implement model auto-discovery for self-hosted LLMs in apps/web/src/components/features/projects/AiProviderForm.tsx: query Ollama `/api/tags` endpoint when endpoint URL is provided, populate available models in multiselect, handle discovery failures gracefully (show error, allow manual entry)
- [x] T527 [US7] [P] Add optional "Test Connection" button for self-hosted LLM endpoints in AiProviderForm in apps/web/src/components/features/projects/AiProviderForm.tsx - form submission not blocked if test fails
- [x] T528 [US7] [P] Create API endpoint for AI provider configuration in apps/web/app/api/projects/[projectId]/ai-providers/route.ts supporting GET (list), POST (create), PUT (update), DELETE operations
- [x] T529 [US7] [P] Implement encrypted credential storage in AI provider API routes in apps/web/app/api/projects/[projectId]/ai-providers/route.ts: encrypt API keys/tokens before database storage, store endpoint URLs as plain text for self-hosted LLMs
- [x] T530 [US7] [P] Add model discovery API endpoint for all providers in apps/web/app/api/projects/[projectId]/ai-providers/discover-models/route.ts that queries provider API endpoints (OpenAI, Anthropic, Google Gemini) or self-hosted endpoint (Ollama) and returns available models
- [x] T531 [US7] [P] Add test connection API endpoint for self-hosted LLMs in apps/web/app/api/projects/[projectId]/ai-providers/test-connection/route.ts that validates endpoint connectivity
- [x] T532 [US7] [P] Implement default model assignment logic in apps/web/src/lib/ai/provider-selector.ts: system assigns default model automatically when AI triage is triggered from configured allowed models
- [x] T533 [US7] [P] Support multiple providers configured simultaneously per project in apps/web/src/lib/ai/provider-selector.ts: allow selection from configured allowed models when multiple providers available

**Acceptance Criteria**:

- Admin can configure multiple AI providers per project via Project Settings → Integrations UI
- API keys/tokens stored encrypted in database, endpoint URLs stored as plain text
- Password-type fields mask sensitive credentials, never display in plain text
- Model selection multiselect works for all provider types
- Dynamic model fetching works for cloud providers (OpenAI, Anthropic, Google Gemini), auto-discovery works for self-hosted LLMs (Ollama), falls back to manual entry on failure
- Test connection button is optional and non-blocking
- Multiple providers can be configured simultaneously
- Default model assignment works correctly
- UI follows same pattern as repository connections (Phase 8.5)

### AI Prompt Strategy Implementation

**Based on Phase 9 Clarifications (Session 2026-01-23, updated)**: Single system prompt stored in markdown file (version controlled) + structured user message with JSON schema and example. Direct LLM API calls (no agent frameworks). Prompt stored in markdown file for easy editing and external testing (Google AI Studio, OpenAI dashboard).

- [x] T534 [US7] [P] Create system prompt markdown file in packages/ai-gateway/prompts/system-prompt.md (version controlled) with prompt defining: AI role ("You are an issue triage specialist for software development teams"), output format requirements (JSON with summary, priority, suggestedAssignee fields), analysis guidelines (focus on root cause, consider error traces, match project priority values)
- [x] T535 [US7] [P] Add JSON schema definition to system prompt in packages/ai-gateway/prompts/system-prompt.md with structure: summary (string - plain-language root cause summary), priority (string - matches project config or standard low/medium/high), suggestedAssignee (string - natural language description)
- [x] T536 [US7] [P] Add example output to system prompt in packages/ai-gateway/prompts/system-prompt.md demonstrating expected format and quality (authentication failure example with high priority and backend developer assignee suggestion)
- [x] T537 [US7] Implement prompt file loader in packages/ai-gateway/src/lib/load-prompt.ts that reads system-prompt.md at service startup, caches content in memory, handles file read errors gracefully (log error, fail startup if critical)
- [x] T538 [US7] Create build-user-message.ts in packages/ai-gateway/src/lib/build-user-message.ts that constructs structured user message from issue context payload: title, description, status, customFields (JSON), errorTraces (if available), recentComments (last 5-10), plus project-specific context injection (priorityValues, workflowRules, customFieldDefinitions)
- [x] T539 [US7] [P] Implement OpenAI client in packages/ai-gateway/src/lib/openai-client.ts using direct openai.chat.completions.create() API with system and user messages, using response_format: { type: "json_object" } for JSON mode when available
- [x] T540 [US7] [P] Implement Anthropic client in packages/ai-gateway/src/lib/anthropic-client.ts using direct anthropic.messages.create() API with system and user messages, using structured outputs feature if available
- [x] T541 [US7] [P] Implement Ollama client in packages/ai-gateway/src/lib/ollama-client.ts using direct fetch() to Ollama API with system and user messages, relying on schema + example in prompt (no structured output mode support)
- [x] T541.1 [US7] [P] Implement Google Gemini client in packages/ai-gateway/src/lib/google-gemini-client.ts using direct fetch() to Google Gemini API with system and user messages, relying on schema + example in prompt (no structured output mode support)
- [x] T542 [US7] Create provider selection logic in packages/ai-gateway/src/lib/provider-selector.ts that selects appropriate client (OpenAI, Anthropic, Google Gemini, Ollama) based on configured provider type and model from database
- [x] T543 [US7] Implement error handling for prompt/response in packages/ai-gateway/src/lib/response-parser.ts: if LLM response doesn't match JSON schema, log error and attempt to parse with fallback; if structured output mode fails, fall back to schema + example in prompt; if response missing required fields, log error and return user-friendly message
- [x] T544 [US7] Update POST /analyze-issue endpoint in packages/ai-gateway/src/routes.ts to: load system prompt using load-prompt.ts (from T537), build user message using build-user-message.ts, call appropriate provider client (OpenAI/Anthropic/Google Gemini/Ollama), parse response with error handling, return formatted response

**Acceptance Criteria**:

- System prompt is stored in markdown file (packages/ai-gateway/prompts/system-prompt.md) with JSON schema and example
- Prompt file is version controlled and can be easily edited and tested externally (Google AI Studio, OpenAI dashboard)
- Service reads prompt file at startup and caches in memory
- Changes to prompt file require service restart to take effect
- User message builder constructs structured payload with project context injection
- Direct LLM API calls work for all providers (OpenAI, Anthropic, Google Gemini, Ollama)
- Structured output modes used when available (OpenAI JSON mode, Anthropic structured outputs)
- Schema + example fallback works for providers without structured output support
- Error handling gracefully handles malformed responses and missing fields
- No agent frameworks or tool definitions used

### Issue Context Payload Builder

- [x] T545 [US7] Create issue context payload builder function in apps/web/src/lib/ai/triage.ts that extracts: title, description, status, customFields (JSON), errorTraces (if available from issue.customFields or linked error webhook data - does not require Phase 8 completion), recentComments (last 5-10 ordered by timestamp)
- [x] T546 [US7] Add project config reader helper in apps/web/src/lib/ai/triage.ts to extract priorityValues from project configuration for AI gateway request
- [x] T547 [US7] Create HTTP client for AI Gateway in apps/web/src/lib/ai/triage.ts with error handling and timeout (30 seconds per SC-011)

**Acceptance Criteria**:

- Payload includes all required core fields
- Error traces included only if available
- Recent comments limited to last 5-10
- Priority values extracted from config correctly
- HTTP client handles errors and timeouts gracefully

### Permission System

- [x] T548 [US7] Create permission check utility in apps/web/src/lib/ai/permissions.ts that reads aiTriageConfig.permissions from project config (maps YAML snake_case `ai_triage_permissions` to schema camelCase `aiTriageConfig.permissions`), defaults to ['admin'] if not configured, and checks if user role is in allowed list
- [x] T549 [US7] Add permission check to AI triage API route in apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts returning 403 with clear message if user lacks permission

**Acceptance Criteria**:

- Default permission is Admin only
- Configuration override works correctly
- Permission denied returns appropriate 403 error
- Error messages are user-friendly

### AI Triage API Endpoint

- [x] T550 [US7] Create AI triage API endpoint in apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts
- [x] T551 [US7] Implement permission check in API route using permission utility from T548 in apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts
- [x] T552 [US7] Build issue context payload in API route using payload builder from T545 in apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts
- [x] T553 [US7] Call AI Gateway HTTP client in API route and return formatted response (summary, priority, suggestedAssignee)
- [x] T554 [US7] Add error handling in API route for: AI Gateway unavailable, malformed response, timeout, permission denied

**Acceptance Criteria**:

- API endpoint accepts requests and validates permissions
- Payload is correctly built and sent to AI Gateway
- Responses are formatted correctly
- All error cases handled gracefully with user-friendly messages

### UI Components - Core Structure

- [x] T555 [US7] Create AITriageAnalysis component in packages/ui/src/organisms/AITriageAnalysis.tsx as expandable accordion section with props: issueId, projectId, analysis (from API), onAccept, onDismiss
- [x] T556 [US7] Create AISummary component in packages/ui/src/molecules/AISummary.tsx to display plain-language root cause summary
- [x] T557 [US7] Create AIPrioritySuggestion component in packages/ui/src/molecules/AIPrioritySuggestion.tsx to display priority suggestion with accept/modify buttons
- [x] T558 [US7] Create AIAssigneeSuggestion component in packages/ui/src/molecules/AIAssigneeSuggestion.tsx to display natural language assignee description with "Select Assignee" button that opens project members selector
- [x] T559 [US7] Integrate AITriageAnalysis component into IssueDetail in packages/ui/src/organisms/IssueDetail.tsx positioned after issue details section, before comments section
- [x] T560 [US7] Add "Triage with AI" button to IssueDetail header in packages/ui/src/organisms/IssueDetail.tsx with permission check (hide/disable if user lacks permission)

**Acceptance Criteria**:

- AITriageAnalysis section is expandable/collapsible accordion
- Section positioned correctly (after details, before comments)
- All sub-components render correctly
- Button visibility respects permissions
- Section expands automatically when suggestions available

### UI Components - Integration & State

- [x] T561 [US7] Add state management for AI triage in IssueDetail using TanStack Query for API calls in packages/ui/src/organisms/IssueDetail.tsx
- [x] T562 [US7] Implement "Triage with AI" button click handler that calls API endpoint and updates AITriageAnalysis with results in packages/ui/src/organisms/IssueDetail.tsx
- [x] T563 [US7] Implement accept/modify functionality for priority suggestion in AIPrioritySuggestion component in packages/ui/src/molecules/AIPrioritySuggestion.tsx
- [x] T564 [US7] Implement assignee selection flow in AIAssigneeSuggestion component: display description, show project members selector on click, allow manual selection in packages/ui/src/molecules/AIAssigneeSuggestion.tsx
- [x] T565 [US7] Add loading states for AI triage request in AITriageAnalysis component in packages/ui/src/organisms/AITriageAnalysis.tsx
- [x] T566 [US7] Add error display in AITriageAnalysis component for: gateway unavailable, malformed response, timeout, permission denied in packages/ui/src/organisms/AITriageAnalysis.tsx
- [x] T567 [US7] Implement retry functionality for failed AI triage requests in AITriageAnalysis component in packages/ui/src/organisms/AITriageAnalysis.tsx
- [x] T568 [US7] Style AITriageAnalysis section to match existing design tokens and accordion pattern in packages/ui/src/organisms/AITriageAnalysis.tsx

**Acceptance Criteria**:

- Button triggers API call correctly
- Loading states display during request
- Error states display with retry option
- Priority suggestions can be accepted or modified
- Assignee selection works with project members list
- All styling matches design system
- Issue functionality remains fully available even when AI unavailable

### Error Handling & Edge Cases

- [x] T569 [US7] Handle AI Gateway unavailable: display error message in AITriageAnalysis section, allow retry, ensure issue remains functional in packages/ui/src/organisms/AITriageAnalysis.tsx
- [x] T570 [US7] Handle malformed AI Gateway response: log error server-side, display "Unable to analyze issue" message, allow retry in apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts and packages/ui/src/organisms/AITriageAnalysis.tsx
- [x] T571 [US7] Handle timeout (30s): display timeout message, allow retry in apps/web/src/lib/ai/triage.ts and packages/ui/src/organisms/AITriageAnalysis.tsx
- [x] T572 [US7] Handle permission denied: hide button in UI, return 403 from API with clear message in apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts and packages/ui/src/organisms/IssueDetail.tsx
- [x] T573 [US7] Handle no project priority config: use standard low/medium/high mapping in packages/ai-gateway/src/mappers/priority.ts
- [x] T574 [US7] Handle assignee description with no match: user manually selects from project members list (already handled in T564 - assignee selection flow)

**Error Handling Acceptance Criteria**:

- All error cases handled gracefully
- Error messages are user-friendly
- Retry functionality works for recoverable errors
- Issue remains fully functional in all error scenarios
- Permission checks work correctly in both UI and API

**Overall Phase 9 Acceptance Criteria**:

- AI triage works when gateway is available
- Issue context payload includes correct core fields (title, description, status, custom fields, error traces if available, recent 5-10 comments)
- AI Triage Analysis section displays in correct position (after details, before comments)
- Priority suggestions match project configuration or use standard format
- Assignee suggestions display as natural language descriptions with manual selection
- Permission system defaults to Admin only but allows configuration override
- All error cases handled with graceful degradation
- Issue functionality remains fully available when AI unavailable

### Documentation Updates

**Based on Phase 9 Clarifications (Session 2026-01-23)**: Phase 9 requires comprehensive documentation updates to reflect the new AI triage feature and UI-based AI provider configuration. Follow hybrid approach: keep infrastructure-level documentation, add project-level UI configuration sections.

#### AI Providers Integration Documentation Updates

- [x] T575 [US7] [P] Update docs/integrations/ai-providers.md to add new "Project-Level AI Provider Configuration" section with navigation instructions to Project Settings → Integrations page
- [x] T576 [US7] [P] Document UI form fields (API key, endpoint URL, model selection) in docs/integrations/ai-providers.md with descriptions of password-type masked fields and required vs optional fields
- [x] T577 [US7] [P] Document model selection workflow in docs/integrations/ai-providers.md: dynamic model fetching for cloud providers (OpenAI, Anthropic, Google Gemini) via provider APIs, auto-discovery for self-hosted LLMs (Ollama /api/tags), manual entry fallback on failure, model multiselect interface usage
- [x] T578 [US7] [P] Document test connection functionality for self-hosted LLMs in docs/integrations/ai-providers.md including optional non-blocking test button workflow
- [x] T579 [US7] [P] Document database storage details in docs/integrations/ai-providers.md: encrypted credentials (API keys/tokens), plain text endpoint URLs for self-hosted LLMs, per-project storage
- [x] T580 [US7] [P] Add clear distinction section in docs/integrations/ai-providers.md separating infrastructure setup (system-wide, environment variables, Docker Compose) from project-level configuration (per-project, UI-based, database storage)
- [x] T581 [US7] [P] Update examples in docs/integrations/ai-providers.md to include UI-based configuration examples alongside existing environment variable examples, showing Project Settings → Integrations UI workflow
- [x] T582 [US7] [P] Verify existing infrastructure setup sections (environment variables, Docker Compose, bare-metal) remain intact in docs/integrations/ai-providers.md and are clearly labeled as "Infrastructure Setup"

**Acceptance Criteria**:

- Infrastructure setup documentation (environment variables, Docker) remains unchanged and clearly labeled
- Project-level UI configuration documentation clearly separated from infrastructure setup
- All form fields and workflows documented with clear examples
- Database storage and encryption details explained
- Users can understand difference between infrastructure and project-level configuration

#### AI Triage Feature Documentation

- [x] T583 [US7] [P] Create docs/user/ai-triage.md (or add section to existing user docs) with feature overview: what AI triage is, when to use it, benefits
- [x] T584 [US7] [P] Document how to trigger AI triage in docs/user/ai-triage.md: button location in IssueDetail view, permission requirements (Admin by default, configurable), button visibility based on permissions
- [x] T585 [US7] [P] Document interpreting AI triage results in docs/user/ai-triage.md: summary section (plain-language root cause), priority suggestion (matches project config or standard), assignee suggestion (natural language description)
- [x] T586 [US7] [P] Document accepting/modifying AI suggestions in docs/user/ai-triage.md: accepting priority updates, selecting assignee from project members based on description, dismissing suggestions, collapsing/expanding AI Triage Analysis section
- [x] T587 [US7] [P] Add troubleshooting section for AI triage errors in docs/user/ai-triage.md covering: gateway unavailable (error message, retry functionality), permission denied (button visibility, 403 errors), timeout (30s limit, retry option), malformed response (error display, retry)
- [x] T588 [US7] [P] Add cross-reference links in docs/user/ai-triage.md: link to Project Settings → Integrations for provider setup, link to configuration docs for ai_triage_permissions setting
- [x] T589 [US7] [P] Ensure docs/user/ai-triage.md includes links to AI providers integration documentation (docs/integrations/ai-providers.md) for infrastructure and project-level setup

**Acceptance Criteria**:

- Feature documentation is comprehensive and covers all user-facing aspects
- Users can understand how to use AI triage feature without consulting multiple files
- Troubleshooting covers common error scenarios with actionable solutions
- All cross-references to related documentation work correctly
- Documentation is accessible and discoverable in user/project docs structure

#### Configuration Documentation Updates

- [x] T590 [US7] [P] Update configuration reference documentation (apps/web/content/docs/configuration-reference.md or similar) to add aiTriageConfig section with schema definition
- [x] T591 [US7] [P] Document ai_triage_permissions field in configuration reference with YAML examples showing snake_case format: array of 'admin'|'member'|'viewer', default ['admin'], optional configuration
- [x] T592 [US7] [P] Document default behavior in configuration reference: Admin only if ai_triage_permissions not configured, how to override default, permission configuration scenarios with examples
- [x] T593 [US7] [P] Add aiTriageConfig.enabled field documentation in configuration reference: boolean default true, optional configuration
- [x] T594 [US7] [P] Include configuration examples in configuration reference showing aiTriageConfig in full stride.config.yaml context with comments explaining each field
- [x] T595 [US7] [P] Add cross-reference from configuration reference to AI triage feature documentation (docs/user/ai-triage.md) and AI providers integration docs (docs/integrations/ai-providers.md)

**Acceptance Criteria**:

- aiTriageConfig schema fully documented with all fields
- YAML examples are correct and validated
- Default behavior clearly explained
- Configuration examples are complete and tested
- Cross-references to related documentation work correctly

#### Documentation Link Verification and Navigation

- [x] T596 [US7] [P] Verify all documentation links work correctly: test cross-references between docs/user/ai-triage.md, docs/integrations/ai-providers.md, configuration reference, and any other related docs
- [x] T597 [US7] [P] Update documentation navigation/sidebar (if applicable) to include AI triage feature documentation link in apps/web/src/components/features/docs/DocsNavigation.tsx or equivalent navigation component
- [x] T598 [US7] [P] Ensure AI triage documentation is discoverable: verify it appears in appropriate documentation index/overview pages if they exist
- [x] T599 [US7] [P] Validate all file paths referenced in documentation (e.g., Project Settings → Integrations page route) are correct and match actual implementation
- [x] T600 [US7] [P] Test all documentation examples: verify YAML configuration examples pass validation, verify UI workflow descriptions match actual implementation

**Acceptance Criteria**:

- All documentation links resolve correctly (internal and cross-references)
- Navigation includes AI triage documentation where appropriate
- Documentation is discoverable through navigation and search
- All examples in documentation are valid and tested
- File paths and routes referenced in docs match implementation

---

## Phase 8.8: Troubleshooting Documentation & Permissive Default Configuration (P2 Enhancement)

**Goal**: Enhance default configuration to be maximally permissive and expand troubleshooting documentation to help users resolve common board status configuration errors.

**Independent Test**: Create a new project, verify the default configuration includes "reopened" status allowing closed issues to be reopened, move issues between all default status columns without errors, and verify troubleshooting documentation covers common board/status errors with actionable solutions. Test succeeds when new users can start using the board immediately without configuration barriers and troubleshooting guide helps resolve configuration issues.

**Dependencies**: Phase 5 complete (Configuration as Code must exist), Phase 4 complete (Kanban board must exist)

### Default Configuration Enhancement

- [x] T415 [P] [US3] Add "reopened" status to default configuration in packages/yaml-config/src/default-config.ts
- [x] T416 [US3] Add documentation comments explaining permissive design philosophy in packages/yaml-config/src/default-config.ts
- [x] T417 [US3] Update generateDefaultConfig function documentation in packages/yaml-config/src/default-config.ts
- [x] T418 [US3] Verify priority field is optional (required: false) in packages/yaml-config/src/default-config.ts
- [x] T419 [US3] Verify default config passes Zod validation in packages/yaml-config/src/validator.ts

**Acceptance Criteria**:

- Default configuration includes "reopened" status
- Default configuration allows reopening closed issues
- All custom fields are optional by default
- Configuration passes all validation rules
- Function documentation explains permissive design

### Troubleshooting Documentation Expansion

- [x] T420 [P] [US3] Add "Quick Fixes" section at top of troubleshooting guide in apps/web/content/docs/configuration-troubleshooting.md
- [x] T421 [P] [US3] Add "Board Status Issues" section with common board errors in apps/web/content/docs/configuration-troubleshooting.md
- [x] T422 [US3] Add "Cannot move issue between status blocks" troubleshooting in apps/web/content/docs/configuration-troubleshooting.md
- [x] T423 [US3] Add "Status 'X' is not defined" error troubleshooting in apps/web/content/docs/configuration-troubleshooting.md
- [x] T424 [US3] Add "Cannot transition from closed status" troubleshooting in apps/web/content/docs/configuration-troubleshooting.md
- [x] T425 [US3] Add diagnostic steps for each error type in apps/web/content/docs/configuration-troubleshooting.md
- [x] T426 [US3] Add "Configuration Migration" section for existing projects in apps/web/content/docs/configuration-troubleshooting.md
- [x] T427 [US3] Add cross-reference links to board status configuration guide in apps/web/content/docs/configuration-troubleshooting.md
- [x] T428 [US3] Add diagnostic checklist in "Getting Help" section in apps/web/content/docs/configuration-troubleshooting.md

**Acceptance Criteria**:

- Quick fixes section provides immediate solutions
- Board status issues are comprehensively documented
- Each error type has diagnostic steps
- Migration guidance for existing projects included
- Links to related documentation work correctly

### Validation Message Improvements

- [x] T429 [US3] Review validation error messages for helpful hints in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T430 [US3] Ensure error messages suggest missing statuses when applicable in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T431 [US3] Update validation messages to reference permissive defaults in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T432 [US3] Review API validation error messages in apps/web/app/api/projects/[projectId]/issues/[issueKey]/status/route.ts
- [x] T433 [US3] Ensure API errors reference troubleshooting documentation in apps/web/app/api/projects/[projectId]/issues/[issueKey]/status/route.ts

**Acceptance Criteria**:

- Error messages are helpful and actionable
- Error messages suggest solutions
- Error messages reference relevant documentation
- Validation errors guide users to fixes

### Testing

- [x] T434 [P] [US3] Create unit test for default config generation with reopened status in packages/yaml-config/src/**tests**/default-config.test.ts
- [x] T435 [P] [US3] Test default config allows closed → reopened transition in packages/yaml-config/src/**tests**/default-config.test.ts
- [x] T436 [US3] Verify default config has no required custom fields in packages/yaml-config/src/**tests**/default-config.test.ts
- [x] T437 [US3] Create integration test for board with new default config in apps/web/src/**tests**/integration/board-default-config.test.ts
- [x] T438 [US3] Test all default status transitions work correctly in apps/web/src/**tests**/integration/board-default-config.test.ts
- [x] T439 [US3] Verify backward compatibility with existing projects in apps/web/src/**tests**/integration/config-compatibility.test.ts
- [x] T440 [US3] Test documentation links resolve correctly in apps/web/src/**tests**/docs/links.test.ts
- [x] T441 [US3] Manual test: Create new project and verify default config works in TESTING_GUIDE.md

**Acceptance Criteria**:

- Default config generation tests pass
- Board integration tests pass with new defaults
- Backward compatibility verified
- Documentation links work correctly
- Manual testing confirms permissive defaults work

---

## Phase 8.9: Service Integration Documentation (P2)

**Goal**: Create comprehensive documentation for all service integrations (SMTP, Sentry, AI Providers, Git OAuth, Monitoring Webhooks). Marketing site displays a simple integrations section with SVG icons for supported services. Web app provides full implementation details served from root `docs` folder (single-source of truth). Cross-site synchronization of how-to/troubleshooting content between marketing and web app is deferred to a later phase.

**Independent Test**: Navigate to marketing site integrations section, verify it displays SVG icons for all 5 integration categories (SMTP, Sentry, AI Providers, Git OAuth, Monitoring Webhooks) with supported service icons listed. Navigate to `/docs/integrations` on web app (authenticated), verify comprehensive guide with status indicators. Navigate to `/docs/integrations/smtp` on web app, verify full setup guide with environment variables, step-by-step instructions, examples, and troubleshooting served from root `docs` folder. Test succeeds when marketing site shows visual integration capabilities and web app provides complete documentation.

**Dependencies**: Phase 7.6 complete (docs structure must exist), Phase 8.6 complete (documentation patterns established)

### Clarifications

#### Session 2025-01-23

- Q: How should shared factual content (like supported services lists) maintain consistency between marketing site and web app? → A: Marketing site integrations should be a simple section on the main site displaying SVG icons for supported services (not full markdown documentation pages). Web app documentation is served from root `docs` folder (single-source of truth). Cross-site synchronization of how-to/troubleshooting content between marketing site and web app is deferred to a later phase. Current single-source of truth pattern (root `docs` folder) should be maintained.
- Q: Should web app integration documentation include Docker-specific setup instructions and comprehensive troubleshooting? → A: Yes. Web app integration docs must be thorough how-to guides including: (1) Docker-specific setup instructions (docker-compose.yml examples, secrets management, container configuration), (2) Bare-metal setup instructions (.env file examples), (3) Comprehensive troubleshooting sections covering Docker container issues, env var problems, connection failures, authentication errors, service-specific problems, and debugging techniques. All Docker Compose examples must be tested and verified.

### Marketing Site Integrations Section

- [x] T465 Create integrations section component in apps/site/app/components/integrations/IntegrationsSection.tsx
- [x] T466 [P] Create SVG icon components for SMTP services (SendGrid, AWS SES, Mailgun, Gmail, Microsoft 365, Self-hosted) in apps/site/app/components/integrations/smtp-icons.tsx
- [x] T467 [P] Create SVG icon components for Sentry in apps/site/app/components/integrations/sentry-icon.tsx
- [x] T468 [P] Create SVG icon components for AI providers (Ollama, OpenAI, Anthropic) in apps/site/app/components/integrations/ai-icons.tsx
- [x] T469 [P] Create SVG icon components for Git OAuth (GitHub, GitLab) in apps/site/app/components/integrations/git-icons.tsx
- [x] T470 [P] Create SVG icon components for monitoring webhooks (Sentry, Datadog, New Relic) in apps/site/app/components/integrations/monitoring-icons.tsx
- [x] T471 Add integrations section to main marketing site page (homepage or features page)

**Acceptance Criteria**:

- Integrations section displays all 5 integration categories with appropriate SVG icons
- Supported services are represented with recognizable SVG icons for each integration type
- Section is visually appealing and demonstrates flexibility/compatibility (marketing appeal)
- Icons are accessible (alt text, semantic HTML)
- Section is statically generated for SEO
- No full documentation pages created on marketing site (simple icon list only)

### Web App Content Files (Root `docs` Folder - Single-Source of Truth)

- [x] T479 Create SMTP detailed guide content in docs/integrations/smtp.md
- [x] T480 [P] Create Sentry detailed guide content in docs/integrations/sentry.md
- [x] T481 [P] Create AI providers detailed guide content in docs/integrations/ai-providers.md
- [x] T482 [P] Create Git OAuth detailed guide content in docs/integrations/git-oauth.md
- [x] T483 [P] Create monitoring webhooks detailed guide content in docs/integrations/monitoring-webhooks.md
- [x] T484 Create integrations overview content in docs/integrations/index.md

**Acceptance Criteria**:

- All content markdown files created in root `docs/integrations/` folder (single-source of truth)
- Files follow content structure contract (Overview, Prerequisites, Configuration, Verification, Examples, Troubleshooting, Related Documentation)
- All environment variables documented with descriptions, defaults, requirements
- **Docker-specific setup instructions included**: How to configure via docker-compose.yml, environment variable management, secrets handling, container restart requirements
- **Docker Compose examples provided**: Working examples showing env vars in docker-compose.yml context
- **Bare-metal setup instructions included**: How to configure without Docker (for non-containerized deployments)
- Step-by-step setup instructions included (both Docker and bare-metal paths)
- Code examples are working and tested (Docker Compose snippets and .env file examples)
- **Comprehensive troubleshooting section**: Common Docker-specific issues (container logs, env var not loading, secrets issues), connection problems, authentication failures, service-specific errors, debugging commands and techniques
- Consistent structure across all service docs
- Root `docs` folder pattern maintained (consistent with existing documentation structure)

### Web App Structure

- [x] T485 Create integrations overview page route in apps/web/app/docs/integrations/page.tsx
- [x] T486 [P] Create SMTP service page route in apps/web/app/docs/integrations/smtp/page.tsx
- [x] T487 [P] Create Sentry service page route in apps/web/app/docs/integrations/sentry/page.tsx
- [x] T488 [P] Create AI providers service page route in apps/web/app/docs/integrations/ai-providers/page.tsx
- [x] T489 [P] Create Git OAuth service page route in apps/web/app/docs/integrations/git-oauth/page.tsx
- [x] T490 [P] Create monitoring webhooks service page route in apps/web/app/docs/integrations/monitoring-webhooks/page.tsx

**Acceptance Criteria**:

- All 6 web app pages created (overview + 5 services)
- Pages follow existing web app docs pattern (see apps/web/app/docs/configuration/page.tsx)
- Overview page reads from root `docs/integrations/index.md` (single-source of truth)
- Service pages read from root `docs/integrations/[service].md` using MarkdownRenderer component
- Pages support authenticated access with proper layout
- Pages use DocumentationPageContent component from @stride/ui
- Content is served from root `docs` folder (maintains single-source of truth pattern)

### Web App Overview Page Implementation

- [x] T491 Implement integration status indicators in apps/web/app/docs/integrations/page.tsx (if dynamic status API available, otherwise static table)
- [x] T492 [P] Add environment variables reference table in docs/integrations/index.md
- [x] T493 [P] Add integration list with links to service-specific guides in docs/integrations/index.md

**Acceptance Criteria**:

- Overview page reads from root `docs/integrations/index.md`
- Overview page shows comprehensive integration guide
- Integration status table displays (Configured/Not Configured, Required/Optional) if dynamic API available, otherwise static table
- Environment variables reference table included in overview content
- Links to all service-specific guides work correctly
- Content follows root `docs` folder structure (single-source of truth)

### Web App Navigation

- [x] T494 Add "Integrations" to docs navigation sidebar in apps/web/src/components/features/docs/DocsNavigation.tsx (or equivalent)
- [x] T495 Ensure integration docs accessible from main docs page in apps/web/app/docs/page.tsx
- [x] T496 Update docs breadcrumbs to support integrations routes in apps/web/src/lib/navigation/docs-breadcrumbs.ts

**Acceptance Criteria**:

- Integrations link appears in web app docs navigation sidebar
- Integration docs accessible from main docs page
- Breadcrumbs work correctly for all integration doc routes
- Navigation maintains proper hierarchy

### Update Existing SMTP Documentation

- [x] T497 Review existing SMTP documentation in docs/deployment/smtp-configuration.md
- [x] T498 [P] Move and update SMTP content to match new structure in docs/integrations/smtp.md (incorporate existing content, enhance with full details)
- [x] T499 Update or redirect references to old SMTP documentation location in docs/deployment/smtp-configuration.md (or move file to archive if no longer needed)

**Acceptance Criteria**:

- Existing SMTP documentation content preserved and enhanced in root `docs/integrations/smtp.md`
- New SMTP guide matches content structure contract
- Old documentation location updated/redirected or archived
- No broken links or references
- Root `docs` folder structure maintained (single-source of truth)

### Cross-References and Links

**Note**: Cross-site synchronization of how-to/troubleshooting content between marketing site and web app is deferred to a later phase. Focus on internal documentation linking within web app.

- [x] T500 [P] Add links to related documentation (installation, configuration) from integration docs in root `docs/integrations/`
- [x] T501 [P] Verify all internal links work correctly within web app documentation
- [x] T502 [P] Add external links to service provider documentation where helpful in root `docs/integrations/` content

**Acceptance Criteria**:

- Related documentation links included where appropriate in integration docs
- All internal links verified and working within web app
- External links open in new tab with proper attributes
- Links reference root `docs` folder structure (single-source of truth)

### Quality Assurance

- [x] T503 [P] Verify marketing site integrations section displays correctly with all SVG icons
- [x] T504 [P] Verify documentation structure consistency across all 5 services in root `docs/integrations/`
- [x] T505 [P] Verify all environment variables documented with descriptions, defaults, requirements in root `docs/integrations/`
- [x] T505a [P] Verify Docker-specific setup instructions included (docker-compose.yml examples, secrets management, container configuration)
- [x] T505b [P] Verify bare-metal setup instructions included (non-Docker deployment paths)
- [x] T506 [P] Test Docker Compose examples are working and accurate (verify env vars in docker-compose.yml context)
- [x] T506a [P] Test bare-metal .env file examples are working and accurate
- [x] T507 [P] Verify comprehensive troubleshooting sections in root `docs/integrations/` content:
  - Docker-specific issues (container logs, env var loading, secrets)
  - Connection problems and authentication failures
  - Service-specific error messages and solutions
  - Debugging commands and diagnostic techniques
- [x] T508 [P] Verify accessibility standards (proper headings, semantic HTML, keyboard navigation) in web app docs and marketing site icons
- [x] T509 [P] Verify SEO metadata on marketing site integrations section
- [x] T510 Verify documentation follows established patterns from Phase 8.6 (configuration docs) and root `docs` folder structure

**Acceptance Criteria**:

- Marketing site integrations section displays correctly with accessible SVG icons
- Documentation structure consistent across all services in root `docs/integrations/` (single-source of truth)
- All environment variables complete and accurate in root `docs/integrations/` content
- **Docker-specific setup thoroughly documented**: docker-compose.yml examples, secrets handling, container restart procedures, env var management in Docker context
- **Bare-metal setup documented**: Non-Docker deployment paths with .env file examples
- **Docker Compose examples tested and verified**: All code snippets work when applied to docker-compose.yml
- **Bare-metal examples tested**: All .env examples work in standalone deployments
- **Comprehensive troubleshooting included**: Docker container issues, env var problems, connection failures, authentication errors, service-specific problems, debugging techniques
- Accessibility standards met (web app docs and marketing site icon section)
- SEO metadata properly configured on marketing site integrations section
- Documentation patterns consistent with existing docs and root `docs` folder structure maintained

---

## Phase 10: Polish & Cross-Cutting Concerns

**Goal**: Complete testing, performance optimization, documentation, and production readiness.

**Dependencies**: All previous phases complete

### Testing ⚠️ DEFERRED - Avoid Testing Technical Debt

**Note**: Testing tasks are deferred until test infrastructure is organized (playwright-reorganization complete) and existing tests are validated. Tests may fail or not accurately reflect behavior until test organization is complete.

- [ ] T329 [DEFERRED] Setup Vitest for unit tests in root/vitest.config.ts
- [ ] T330 [DEFERRED] Configure test environment in root/vitest.config.ts
- [ ] T331 [DEFERRED] Create test utilities in apps/web/src/**tests**/utils.ts
- [ ] T332 [DEFERRED] Write unit tests for utilities in apps/web/src/**tests**/unit/
- [ ] T333 [DEFERRED] Write unit tests for components in packages/ui/src/**tests**/
- [ ] T334 [DEFERRED] Setup test database for integration tests in apps/web/src/**tests**/setup.ts
- [ ] T335 [DEFERRED] Create test fixtures in apps/web/src/**tests**/fixtures.ts
- [ ] T336 [DEFERRED] Write API route tests in apps/web/src/**tests**/api/
- [ ] T337 [DEFERRED] Write database operation tests in apps/web/src/**tests**/database/
- [ ] T338 [DEFERRED] Write webhook tests in apps/web/src/**tests**/webhooks/
- [ ] T339 [DEFERRED] Setup Playwright for E2E tests in root/playwright.config.ts
- [ ] T340 [DEFERRED] Create E2E test utilities in apps/web/e2e/utils.ts
- [ ] T341 [DEFERRED] Write E2E tests for User Story 1 in apps/web/e2e/us1-deployment.spec.ts
- [ ] T342 [DEFERRED] Write E2E tests for User Story 2 in apps/web/e2e/us2-issues.spec.ts
- [ ] T343 [DEFERRED] Write E2E tests for critical flows in apps/web/e2e/critical-flows.spec.ts
- [ ] T344 [DEFERRED] Setup CI/CD integration in .github/workflows/test.yml

**Acceptance Criteria**:

- All unit tests pass
- Integration tests pass
- E2E tests pass for critical flows
- Test coverage meets targets (80%+ for critical paths)

### Performance Optimization

- [x] T311 Optimize database queries (add missing indexes) in packages/database/prisma/schema.prisma
- [x] T312 Implement query result caching in apps/web/src/lib/cache/query-cache.ts
- [x] T313 Optimize Kanban board rendering (virtualization if needed) in packages/ui/src/organisms/KanbanBoard.tsx
- [x] T314 Add code splitting for heavy components in apps/web/app/
- [x] T315 Optimize bundle size in apps/web/next.config.ts
- [x] T316 Implement image optimization in apps/web/next.config.ts

**Acceptance Criteria**:

- Page load times meet success criteria (<2s for config updates, <500ms for drag-drop)
- Bundle size is optimized
- Database queries are efficient

### Documentation

- [x] T317 Create API documentation in docs/api/
- [x] T318 Create deployment guide in docs/deployment/
- [x] T319 Create developer guide in docs/development/
- [x] T320 Create user guide in docs/user/
- [x] T321 Add inline code documentation (JSDoc) in apps/web/src/
- [x] T322 Create README for each package in packages/\*/README.md

**Acceptance Criteria**:

- All documentation is complete
- API docs match actual endpoints
- Deployment guide is accurate
- Code is well-documented

### Security Hardening

- [x] T323 Review and fix security vulnerabilities in apps/web/
- [x] T324 Implement rate limiting on all API routes in apps/web/src/middleware/rate-limit.ts
- [x] T325 Add security headers in apps/web/next.config.ts
- [x] T326 Audit authentication and authorization in apps/web/src/lib/auth/
- [x] T327 Review input validation in apps/web/src/lib/validation/
- [x] T328 Implement CSRF protection in apps/web/src/middleware/csrf.ts

**Acceptance Criteria**:

- No critical security vulnerabilities
- Rate limiting is active
- Security headers are configured
- Input validation is comprehensive

### Production Readiness

- [x] T345 Create production environment configuration in .env.production.example
- [x] T346 Setup error monitoring (Sentry integration) in apps/web/src/lib/error-tracking.ts
- [x] T347 Create health check endpoint in apps/web/app/api/health/route.ts
- [x] T348 Implement graceful shutdown in apps/web/src/lib/shutdown.ts
- [x] T349 Create production deployment scripts in scripts/deploy/
- [x] T350 Setup logging aggregation in apps/web/src/lib/logger.ts

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
                    │     └─> Phase 8.8: Troubleshooting & Permissive Config (Enhancement)
                    ├─> Phase 6: User Story 4 (Git Integration)
                    └─> Phase 7: User Story 5 (Sprint Planning)
                          └─> Phase 7.5: Authenticated Layouts Infrastructure
                                └─> Phase 7.6: Settings Pages and Navigation Fixes
                                      ├─> Phase 8: User Story 6 (Diagnostics)
                                      ├─> Phase 8.5: Repository Connections (Settings)
                                      ├─> Phase 8.6: Toast & Config Documentation
                                      ├─> Phase 8.7: User Assignment & Clone
                                      ├─> Phase 8.8: Troubleshooting & Permissive Config
                                      ├─> Phase 8.9: Service Integration Documentation
                                      ├─> Phase 9: User Story 7 (AI Triage)
                                      └─> Phase 10: Polish & Testing
```

### Story Dependencies

- **US1** (Deployment): Blocks all other stories (foundational)
- **US2** (Issues): Blocks US3, US4, US5, US6, US7 (core functionality)
- **US3** (Configuration): Depends on US2 (needs issues to configure)
- **Phase 8.8** (Troubleshooting & Permissive Config): Depends on US3 (Configuration as Code must exist), US2 (Kanban board must exist)
- **US4** (Git Integration): Depends on US2 (needs issues to link)
- **US5** (Sprints): Depends on US2 (needs issues to assign)
- **Phase 7.5** (Authenticated Layouts): Depends on US1 (needs authentication infrastructure)
- **Phase 7.6** (Settings Pages): Depends on US1 (needs authentication), optional dependency on Phase 7.5 (layouts enhance UX)
- **Phase 8.5** (Repository Connections): Depends on Phase 7.6 (project settings pages must exist), Phase 3 (repository connection API endpoints must exist)
- **Phase 8.6** (Toast & Config Documentation): Depends on Phase 4 (error handling patterns exist), Phase 5 (configuration system exists)
- **Phase 8.8** (Troubleshooting & Permissive Config): Depends on US3 (Configuration as Code must exist), US2 (Kanban board must exist)
- **Phase 8.9** (Service Integration Documentation): Depends on Phase 7.6 (docs structure must exist), Phase 8.6 (documentation patterns established)
- **US6** (Diagnostics): Depends on US2 (needs issues to create from errors)
- **US7** (AI): Depends on US2 (needs issues to triage), US3 (needs configuration system for priority matching and permission configuration)

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

**Within Phase 7.5 (Authenticated Layouts)**:

- T240.1-T240.6 (TopBar) can be parallelized with T240.7-T240.13 (Sidebar)
- T240.14-T240.21 (DashboardLayout) can be parallelized with T240.22-T240.31 (ProjectLayout)
- All TopBar and Sidebar tasks (T240.1-T240.13) can run in parallel

**Within Phase 7.6 (Settings Pages)**:

- T240.40-T240.44 (User forms) can be parallelized with T240.45-T240.46 (API routes)
- T240.50-T240.54 (Project settings page) can run in parallel with user settings tasks

**Within Phase 8 (US6)**:

- T241-T246 (Webhooks) can be parallelized with T247-T251 (Issue creation)

**Within Phase 8.5 (Repository Connections)**:

- T260-T263 (Settings page) can be parallelized with T264-T268 (Form component)
- T269-T273 (Status display) can be parallelized with T274-T277 (OAuth flow)
- T278-T281 (Manual flow) can be parallelized with T282-T287 (Error handling)
- T288-T290 (Notifications) can run in parallel

**Within Phase 8.9 (Service Integration Documentation)**:

- T466-T470 (Marketing site service pages) can be parallelized
- T472-T476 (Marketing site content) can be parallelized
- T480-T483 (Web app content files) can be parallelized
- T485-T489 (Web app service pages) can be parallelized
- T492-T493 (Web app overview content) can be parallelized
- T500-T503 (Cross-references and links) can be parallelized
- T504-T509 (Quality assurance checks) can be parallelized

**Within Phase 9 (US7)**:

- T511-T513 (Configuration schema) can be parallelized
- T514-T520.1 (AI Gateway service) can be parallelized after T513
- T521-T533 (AI Provider Configuration UI) can be parallelized after Phase 8.5 complete
- T534-T544 (AI Prompt Strategy) can be parallelized (T537 must complete before T544, T541.1 can be parallelized with T539-T541)
- T545-T547 (Payload builder & HTTP client) can be parallelized
- T548-T549 (Permission system) can be parallelized
- T550-T554 (API endpoint) must run sequentially (dependencies)
- T555-T560 (UI components - core structure) can be parallelized
- T561-T568 (UI components - integration) must run sequentially (dependencies)
- T569-T574 (Error handling) can be parallelized
- T575-T600 (Documentation) can be parallelized
- T546-T551 (Error handling) can be parallelized

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

### Phase 8.9 - Service Integration Documentation

**Test**: Navigate to `/docs/integrations` on marketing site, verify overview page lists all 5 integrations with supported services. Navigate to `/docs/integrations/smtp` on marketing site, verify it shows capabilities and supported providers (SendGrid, AWS SES, etc.) but no implementation steps. Navigate to `/docs/integrations` on web app (authenticated), verify comprehensive guide with status indicators. Navigate to `/docs/integrations/smtp` on web app, verify full setup guide with environment variables, step-by-step instructions, examples, and troubleshooting.  
**Success**: All integrations are documented on both sites with appropriate detail level - marketing shows capabilities, web app provides implementation details.

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

**Total Tasks**: 548  
**Phase 1 (Setup)**: 14 tasks  
**Phase 2 (Foundational)**: 44 tasks  
**Phase 3 (US1)**: 38 tasks  
**Phase 4 (US2)**: 69 tasks  
**Phase 5 (US3)**: 31 tasks  
**Phase 6 (US4)**: 20 tasks  
**Phase 7 (US5)**: 24 tasks  
**Phase 7.5 (Authenticated Layouts)**: 37 tasks  
**Phase 7.6 (Settings Pages Fixes)**: 22 tasks  
**Phase 8 (US6)**: 18 tasks  
**Phase 8.5 (Repository Connections)**: 37 tasks  
**Phase 8.6 (Toast & Config Docs)**: 25 tasks  
**Phase 8.7 (User Assignment & Clone)**: 8 tasks  
**Phase 8.8 (Troubleshooting & Permissive Config)**: 27 tasks  
**Phase 8.9 (Service Integration Documentation)**: 46 tasks (T465-T510)  
**Phase 9 (US7)**: 90 tasks (T511-T600, deferred - P3 priority)
**Phase 10 (Polish)**: 40 tasks (6 testing deferred, 34 non-testing tasks remaining)

**Parallel Opportunities**: ~148 tasks marked with [P]

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

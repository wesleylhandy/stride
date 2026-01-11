# Feature Specification: Stride Core Application

**Feature Branch**: `001-stride-application`  
**Created**: 2024-12-19  
**Status**: Draft  
**Input**: User description: "We are looking to build a developer-first, open-source flow tracker called Stride. The developer-first, open-source flow tracker that matches the speed and developer experience of proprietary tools like Linear, but with a narrow, opinionated focus on the Engineering-Product-Design (EPD) flow, avoiding the enterprise bloat of Jira or the broad, unfocused nature of other open-source alternatives."

## Clarifications

### Session 2024-12-19

- Q: What authentication and authorization model should be used? → A: Simple role-based access control with three roles: Admin (full access including configuration management), Member (create/edit issues, manage sprints), Viewer (read-only). Permissions checked at API/action level.
- Q: What data persistence strategy should be used? → A: Single PostgreSQL database with connection pooling. All entities (issues, users, sprints, config) stored relationally.
- Q: What format should issue identifiers use? → A: Project key prefix + auto-incrementing number (e.g., APP-123, PROJ-456). Format: `{PROJECT_KEY}-{NUMBER}`. Uniqueness enforced per project.
- Q: How should the system handle failures of external services (Notion, Sentry, Git webhooks)? → A: Graceful degradation with user notification. Show error states for unavailable features, notify users. Issues remain fully functional. External integrations (previews, diagnostics) disabled when services unavailable.
- Q: What observability requirements should be implemented? → A: Structured logging (JSON format with request IDs, error details, user actions) plus basic metrics (request counts, error rates, latency percentiles). Logs to stdout/files, simple metrics endpoint or log aggregation.

### Session 2024-12-19 (Phase 9 Clarifications)

- Q: What exact fields should be included in the "issue context" payload sent to the AI gateway? → A: Core fields (title, description, status, custom fields, error traces if available, recent comments - last 5-10 comments). Balance context richness with payload size. Allows for future customization via configuration.
- Q: Where and how should AI-generated analysis and suggestions be displayed in the issue view? → A: Dedicated expandable section within issue detail view. Create a collapsible "AI Triage Analysis" section positioned after issue details but before comments. Section expands automatically when suggestions are available, can be collapsed by user. Keeps context visible without cluttering default view.
- Q: What format should AI priority suggestions use? → A: Match existing project priority system. If project has configured priority values (from configuration), use those values. If no custom priorities are defined, fallback to standard format (low/medium/high). Ensures suggestions are consistent with project's workflow configuration.
- Q: How should AI assignee suggestions reference users? → A: Free-form natural language description. AI provides natural language description of suggested assignee (e.g., "frontend developer with React experience", "person familiar with authentication system"). System displays this description and allows users to manually select from project members, or system can attempt fuzzy matching to suggest relevant users. If no match found, user selects manually from member list.
- Q: Who has permission to trigger AI triage on issues? → A: Default Admin only, but allow project configuration rule to override. By default, only Admin users can trigger AI triage. Project configuration may include a setting (e.g., `ai_triage_permissions: ['admin', 'member']` or `ai_triage_permissions: ['admin']`) to allow Members or other roles. This provides flexibility while maintaining security and cost control defaults.

### Session 2026-01-10 (Phase 9 AI Provider Configuration Clarifications)

- Q: Where should AI provider tokens and configuration be stored? → A: Database storage with encryption. AI provider configuration (tokens, endpoints, enabled models) stored in PostgreSQL database with encrypted fields for sensitive credentials (API keys, tokens). Enables UI-based configuration management without requiring redeployment. Tokens encrypted at rest using secure encryption methods.
- Q: What should the "multiselect to choose what models are allowed to others" control? → A: Model selection with default assignment. Admin configures multiple AI providers, selects which models from each provider are available to non-admin users via multiselect interface. System assigns a default model automatically when AI triage is triggered, but users can select from allowed models if multiple are configured. Provides balance between admin control and user convenience.
- Q: Where should AI provider configuration be managed? → A: Project Settings - Integrations page. AI provider configuration managed at project level via Project Settings → Integrations page (similar to repository connection management pattern). Allows per-project AI provider configuration, enabling different projects to use different AI providers or models as needed.
- Q: How should API tokens be handled in the secure forms? → A: Password-type fields with masked display. API tokens entered in password-type input fields (masked/obscured display). Tokens never displayed in plain text after entry - must be re-entered to change. Prevents accidental exposure of sensitive credentials while maintaining security best practices.
- Q: Can multiple AI providers be configured simultaneously, and how does the system select which provider/model to use? → A: Multiple providers with explicit selection. Admin can configure multiple AI providers simultaneously (OpenAI, Anthropic, Ollama, etc.). Admin explicitly selects which models from each configured provider are available to users via multiselect interface. When AI triage is triggered, system uses default model assignment (from allowed models) or allows user/model selection from configured allowed models. Supports failover/fallback scenarios and gives admins full control over available options.

### Session 2026-01-10 (Phase 9 Self-Hosted LLM Configuration Clarifications)

- Q: For self-hosted LLMs (Ollama), what configuration fields should the form show? → A: Endpoint URL + optional authentication token field. Self-hosted LLMs like Ollama use endpoint URLs (e.g., `http://localhost:11434`) instead of API keys. Form provides endpoint URL field (required) and optional authentication token field for future authentication support if needed. Keeps configuration simple while allowing extensibility.
- Q: How should available models be discovered for self-hosted LLMs (Ollama) in the multiselect interface? → A: Auto-discovery via API when endpoint is provided. System automatically queries Ollama's `/api/tags` endpoint when endpoint URL is entered or updated, populates available models in multiselect interface. Reduces manual errors and keeps model list current with what's actually available on the endpoint.
- Q: Should self-hosted LLM endpoint URLs be stored encrypted in the database, or stored as plain text? → A: Plain text storage. Endpoint URLs are not sensitive credentials (unlike API keys), so encryption is unnecessary. Endpoint URLs stored as plain text in database, enabling efficient connectivity checks and simpler implementation. Only sensitive credentials (API keys, tokens) are encrypted.
- Q: Should the system validate/test the endpoint connection when configuring self-hosted LLMs? → A: Optional "Test Connection" button. Admin can optionally test endpoint connectivity before saving configuration via "Test Connection" button. Form submission not blocked if test fails - allows offline configuration and gives admins control over when to validate. Provides validation without blocking workflow.
- Q: What should happen if model auto-discovery fails (endpoint unreachable, invalid response, etc.)? → A: Show error message, allow manual model entry. If auto-discovery fails (endpoint unreachable, invalid response, timeout), system displays error message indicating discovery failure but allows form submission. Admin can manually enter model names in multiselect if auto-discovery fails. Provides graceful degradation and flexibility for edge cases.

### Session 2026-01-23 (Phase 9 Documentation Updates Clarifications)

- Q: What specific documentation updates are required for the AI providers integration documentation (created in Phase 8.9)? → A: Hybrid approach. Keep environment variable setup for AI Gateway service configuration (infrastructure-level), add UI-based documentation for per-project provider configuration (project-level), clearly distinguish infrastructure vs project-level configuration. Phase 8.9 documentation (`docs/integrations/ai-providers.md`) should retain infrastructure-level AI Gateway setup instructions (environment variables, Docker Compose configuration). Phase 9 requires new documentation sections covering per-project AI provider configuration via Project Settings → Integrations UI, including: navigation instructions, form field descriptions, model selection workflow, test connection functionality, and database storage details. Clearly separate infrastructure setup (one-time, system-wide) from project configuration (per-project, UI-based).
- Q: What documentation updates are required for projects documentation to reflect Phase 9 changes? → A: Comprehensive project features documentation. Add new "AI Triage" section to project documentation covering: how to use AI triage feature (triggering, interpreting results, accepting/modifying suggestions), how to configure `ai_triage_permissions` in `stride.config.yaml` with examples, link to Project Settings → Integrations for provider setup, troubleshooting AI triage errors. Update existing configuration documentation to include `aiTriageConfig` schema definition with examples. Separates "how to use" (feature usage) from "how to configure" (provider setup, permissions) for clarity.
- Q: What documentation update tasks should be added to Phase 9 in tasks.md? → A: Dedicated documentation section with specific tasks. Add new "Documentation Updates" section to Phase 9 tasks.md with specific tasks for: updating `docs/integrations/ai-providers.md` with UI-based configuration sections, adding AI triage feature documentation to project docs, updating configuration reference to include `aiTriageConfig` schema with examples, adding troubleshooting for AI triage errors, verifying all documentation links work correctly. Follows Phase 8.9 pattern of tracking documentation updates as explicit tasks within the phase to ensure nothing is missed.
- Q: Where should the AI triage feature documentation be located in the documentation structure? → A: Within existing project documentation structure. Add AI triage documentation to existing project/user documentation (e.g., `docs/user/` or similar project features section). If no user/project docs exist yet, create `docs/user/ai-triage.md` or add as section in main project docs. AI triage is a project-level feature users interact with directly, so it belongs in user/project documentation alongside other features. Keeps feature documentation co-located with other project features, maintains single documentation location for users.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Deployment and Onboarding (Priority: P1)

A new user discovers Stride through the marketing site, deploys it via Docker, and completes initial setup by creating an admin account and linking their first repository.

**Why this priority**: This is the foundational user journey that enables all other functionality. Without successful deployment and onboarding, users cannot access any features. This must work flawlessly to establish trust and demonstrate the "self-host in minutes" value proposition.

**Independent Test**: Can be fully tested by deploying Stride in a fresh environment, accessing the marketing site, following the Docker deployment instructions, creating an admin account, and successfully linking a GitHub/GitLab repository. The test is successful when the user can access the main application dashboard after completing these steps.

**Acceptance Scenarios**:

1. **Given** a visitor lands on the marketing site, **When** they click "Get Started (Self-Host)", **Then** they are directed to installation documentation with clear Docker deployment instructions
2. **Given** a user has deployed Stride via Docker, **When** they navigate to the application URL, **Then** they are presented with an admin account creation form
3. **Given** a new admin user has created their account, **When** they complete the onboarding flow, **Then** they can link a GitHub or GitLab repository
4. **Given** a repository is linked, **When** the system processes the connection, **Then** it automatically clones the `.stride/config.yaml` file (if present) or creates a default configuration
5. **Given** onboarding is complete, **When** the user accesses the dashboard, **Then** they see their project initialized with the repository name as the project key

---

### User Story 2 - Issue Creation and Management (Priority: P1)

A developer uses the keyboard-driven command palette to create issues, add context (diagrams, links), and manage them through the Kanban board workflow.

**Why this priority**: Issue management is the core functionality of any flow tracker. The keyboard-first interface and context integration are key differentiators that must work immediately to demonstrate the "blazing fast UX" value proposition.

**Independent Test**: Can be fully tested by opening the command palette, creating a new issue with a title and description, pasting a Mermaid diagram that renders inline, pasting a Notion link that displays as a contextual preview, and moving the issue between status columns on the Kanban board. The test is successful when all these actions complete without page reloads and the issue persists correctly.

**Acceptance Scenarios**:

1. **Given** a user is logged into Stride, **When** they press the keyboard shortcut (Cmd/Ctrl+K), **Then** the command palette opens instantly
2. **Given** the command palette is open, **When** the user types "create issue" and selects it, **Then** an issue creation form appears
3. **Given** an issue creation form is open, **When** a user with Member or Admin role enters a title and description, **Then** they can save the issue and it appears in the default status column
4. **Given** a user with Viewer role attempts to create an issue, **When** they try to access the issue creation form, **Then** access is denied with an appropriate permission error message
5. **Given** a user is editing an issue description, **When** they paste Mermaid diagram syntax, **Then** the diagram renders inline in the description view
6. **Given** a user is editing an issue description, **When** they paste a link to Notion, Google Drive, or Confluence, **Then** a contextual link block with inline preview appears
7. **Given** an issue exists on the Kanban board, **When** a user with Member or Admin role drags it to a different status column, **Then** the issue status updates and the move is validated against workflow rules
8. **Given** a workflow rule requires a custom field, **When** a user attempts to move an issue to a status that triggers the rule, **Then** the system prevents the move and prompts for the required field

---

### User Story 3 - Configuration as Code Management (Priority: P2)

An admin user edits the project configuration file (`stride.config.yaml`) in the browser-based editor, validates the syntax, and applies changes that dynamically update the workflow, statuses, and custom fields.

**Why this priority**: Configuration as Code is a core differentiator that enables version control, reproducibility, and portability. While not required for initial issue creation, it's essential for customizing workflows to match team needs and demonstrates the "workflow as code" value proposition.

**Independent Test**: Can be fully tested by navigating to Project Settings, loading the configuration file in the editor, modifying workflow statuses or custom fields, validating the YAML syntax, saving the changes, and verifying that the Kanban board and issue forms reflect the new configuration. The test is successful when configuration changes are immediately reflected in the UI without requiring a restart.

**Acceptance Scenarios**:

1. **Given** a user with Admin role accesses Project Settings, **When** they navigate to the configuration editor, **Then** the current `stride.config.yaml` content is displayed in a code editor
2. **Given** a user with Member or Viewer role attempts to access Project Settings configuration editor, **When** they navigate to the page, **Then** access is denied with an appropriate permission error message
3. **Given** the configuration editor is open, **When** the user modifies YAML syntax, **Then** real-time validation highlights any syntax errors
4. **Given** a user edits the workflow statuses section, **When** they add a new status definition with required fields (key, name, type), **Then** the validation passes and the status appears in available options
5. **Given** a user edits custom fields, **When** they define a new dropdown field with options, **Then** the field appears in issue forms with the specified options
6. **Given** configuration changes are saved, **When** the system processes the update, **Then** the Kanban board columns, issue status dropdowns, and custom field forms immediately reflect the new configuration
7. **Given** invalid configuration is attempted, **When** the user tries to save, **Then** the system displays specific validation errors and prevents saving

---

### User Story 4 - Git Integration and Automated Status Updates (Priority: P2)

A developer creates a branch or pull request linked to an issue, and Stride automatically updates the issue status based on Git activity via webhooks.

**Why this priority**: Git integration reduces manual status updates and provides automatic traceability between code and issues. This demonstrates the "deep Git integration" value proposition and significantly improves developer workflow efficiency.

**Independent Test**: Can be fully tested by creating a branch with an issue key in the name (e.g., `feature/APP-123-auth-fix`), triggering a webhook from the Git service, and verifying that Stride detects the issue key and updates the issue status. The test is successful when branch creation automatically moves the issue to "In Progress" and PR merge moves it to the appropriate completion status.

**Acceptance Scenarios**:

1. **Given** a repository is connected to Stride, **When** a developer creates a branch named with an issue key pattern (e.g., `feature/APP-123-description`), **Then** Stride receives a webhook and identifies the issue
2. **Given** a branch is created with an issue key, **When** Stride processes the webhook, **Then** the corresponding issue status automatically updates to "In Progress"
3. **Given** a pull request is opened for a branch linked to an issue, **When** the PR is created, **Then** the issue view displays a link to the PR and shows PR status
4. **Given** a pull request linked to an issue is merged, **When** Stride receives the merge webhook, **Then** the issue status updates according to automation rules (e.g., moves to "In Review" or "Done")
5. **Given** multiple branches reference the same issue, **When** viewing the issue, **Then** all linked branches and PRs are displayed

---

### User Story 5 - Sprint Planning and Kanban Board Management (Priority: P2)

A product manager or team lead creates a sprint, assigns issues to it, and tracks progress through the Kanban board with burndown metrics.

**Why this priority**: Sprint planning and visual workflow management are essential for EPD teams. The Kanban board provides the primary interface for daily work, and sprint metrics enable planning and velocity tracking.

**Independent Test**: Can be fully tested by creating a new sprint, assigning multiple issues to it, viewing the Kanban board with issues organized by status, and verifying that burndown charts and cycle time metrics update as issues move through the workflow. The test is successful when sprint data is accurately tracked and displayed.

**Acceptance Scenarios**:

1. **Given** a user with Member or Admin role, **When** they create a new sprint with a name and date range, **Then** the sprint is created and appears in sprint selection dropdowns
2. **Given** issues exist in the backlog, **When** a user assigns issues to a sprint, **Then** the issues are associated with the sprint and appear in sprint views
3. **Given** a Kanban board is displayed, **When** issues are organized by status columns, **Then** users can drag issues between columns to update status
4. **Given** a sprint contains issues, **When** viewing the sprint burndown chart, **Then** it displays remaining story points or issue count over time
5. **Given** issues move through workflow statuses, **When** calculating cycle time, **Then** the system tracks time from "In Progress" to "Done" and displays average cycle time metrics

---

### User Story 6 - Root Cause Diagnostics Integration (Priority: P3)

An error occurs in production, triggering a webhook from a monitoring service (Sentry, Datadog), and Stride automatically creates an issue with the error trace displayed in a Root Cause Dashboard section.

**Why this priority**: While powerful for reducing MTTR, diagnostic integration is an enhancement feature that requires external service setup. It can be added after core issue management is stable, making it a P3 priority.

**Independent Test**: Can be fully tested by configuring a webhook from a monitoring service, triggering a test error event, and verifying that Stride creates a new issue with the error details, stack trace, and diagnostic information displayed in a dedicated section. The test is successful when error context is immediately available in the issue view.

**Acceptance Scenarios**:

1. **Given** a monitoring service (Sentry, Datadog) is configured with Stride webhooks, **When** an error occurs in production, **Then** Stride receives the webhook payload
2. **Given** an error webhook is received, **When** Stride processes it, **Then** a new issue is automatically created with error details (title, severity, timestamp)
3. **Given** an issue is created from an error webhook, **When** viewing the issue, **Then** a "Root Cause Dashboard" section displays the error message, stack trace, frequency, and last occurrence time
4. **Given** error trace data is available, **When** viewing the issue, **Then** the stack trace is formatted and syntax-highlighted for readability
5. **Given** multiple errors reference the same root cause, **When** viewing the issue, **Then** the system displays error frequency and aggregation information

---

### User Story 7 - AI-Powered Triage and Analysis (Priority: P3)

A developer clicks "Triage with AI" on an issue, and the system sends the issue context to the self-hosted AI gateway, which returns a plain-language summary, suggested priority, and assignment recommendation.

**Why this priority**: AI features provide significant value but require additional infrastructure (AI gateway, LLM setup). This is a differentiating feature that can be implemented after core functionality is stable, making it P3.

**Independent Test**: Can be fully tested by opening an issue with error context, clicking the AI triage button, verifying the request is sent to the configured AI gateway, and confirming that AI-generated analysis (summary, priority, assignment suggestion) is displayed in the issue view. The test is successful when AI analysis enhances issue understanding without exposing data outside the organization's network.

**Acceptance Scenarios**:

1. **Given** an issue exists with sufficient context (description, error traces, comments), **When** a user with permission (Admin by default, or roles allowed by project configuration) clicks "Triage with AI" or "Run AI Triage", **Then** the system sends the issue context (title, description, status, custom fields, error traces if available, recent comments - last 5-10) to the configured AI gateway. If user lacks permission, access is denied with appropriate error message.
2. **Given** the AI gateway is configured with a self-hosted LLM, **When** the triage request is processed, **Then** all data remains within the organization's network (no external API calls)
3. **Given** AI analysis is requested, **When** the gateway returns results, **Then** the issue view displays a plain-language summary in an expandable "AI Triage Analysis" section (positioned after issue details, before comments) that expands automatically with the analysis
4. **Given** AI analysis completes, **When** results are returned, **Then** the system displays priority level suggestion (matching project's configured priority values, or standard low/medium/high if none configured) and assignee suggestion as natural language description (e.g., "frontend developer with React experience") in the "AI Triage Analysis" section based on issue content and team member expertise
5. **Given** AI suggestions are provided, **When** viewing the issue, **Then** users can accept AI recommendations (selecting actual assignee from project members based on description), modify suggestions, or dismiss them directly from the "AI Triage Analysis" section. System may optionally provide fuzzy matching to suggest relevant users based on description, but user makes final selection. Section can be collapsed/expanded as needed
6. **Given** the AI gateway is unavailable or misconfigured, **When** a user requests AI triage, **Then** the system displays a clear error message with user notification, and issue functionality remains fully available (graceful degradation)

---

### Edge Cases

- What happens when a user tries to move an issue to a status that violates workflow rules (e.g., skipping required steps)?
- How does the system handle invalid YAML syntax in the configuration file that breaks existing functionality?
- What occurs when a Git webhook is received for a branch that doesn't match any existing issue key pattern?
- How does the system handle concurrent edits to the configuration file by multiple admins?
- What happens when a linked external service (Notion, Sentry) is temporarily unavailable - does the issue remain functional? **Answer**: Issues remain fully functional. External integrations (link previews, diagnostic data) show error states with user notifications. Core issue operations (create, edit, status updates) continue to work normally.
- How does the system handle issues with extremely long descriptions or large numbers of custom fields?
- What occurs when a sprint end date passes but issues remain incomplete?
- How does the system handle repository disconnection or access token expiration?
- What happens when the AI gateway returns malformed or incomplete responses? **Answer**: System displays error state with user notification, allows user to retry or dismiss, and issue functionality remains fully available (graceful degradation). Invalid responses are logged for debugging.
- What happens when a user without permission (non-Admin by default, or roles not allowed by project configuration) attempts to trigger AI triage? **Answer**: Access is denied with appropriate permission error message (e.g., "AI triage is only available to Admin users" or "This feature requires Member role or higher based on project settings"). Button/link may be hidden or disabled based on user's permissions. Issue functionality remains fully available.
- What happens when self-hosted LLM model auto-discovery fails (endpoint unreachable, invalid response, timeout)? **Answer**: System displays error message indicating discovery failure but allows form submission. Admin can manually enter model names in multiselect if auto-discovery fails. Provides graceful degradation and flexibility for edge cases. Configuration can be saved even if discovery fails, and validation occurs when AI triage is actually triggered.
- How does the system handle issues created from error webhooks when the error pattern doesn't match any known issue?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a marketing/landing page that communicates core value propositions (speed, open-source, configuration as code, self-hosting)
- **FR-002**: System MUST support deployment via Docker Compose with a single command that starts all required services
- **FR-003**: System MUST allow creation of an initial admin account on first launch
- **FR-003a**: System MUST support role-based access control with three roles: Admin (full access), Member (create/edit issues, manage sprints), Viewer (read-only)
- **FR-003b**: System MUST enforce role-based permissions at API/action level (e.g., only Admin can edit configuration, only Member+ can create issues)
- **FR-004**: System MUST support linking GitHub and GitLab repositories during onboarding
- **FR-005**: System MUST automatically clone or create a `stride.config.yaml` file when a repository is linked
- **FR-006**: System MUST provide a browser-based code editor for editing the project configuration file
- **FR-007**: System MUST perform real-time YAML syntax validation in the configuration editor
- **FR-008**: System MUST validate configuration schema (required fields, unique keys, valid types) before applying changes
- **FR-009**: System MUST dynamically update available statuses, custom fields, and workflow rules based on configuration changes
- **FR-010**: System MUST provide a keyboard-driven command palette accessible via Cmd/Ctrl+K shortcut
- **FR-011**: System MUST allow users to create issues with title and description through the command palette
- **FR-011a**: System MUST automatically generate unique issue identifiers in format `{PROJECT_KEY}-{NUMBER}` where PROJECT_KEY comes from project configuration and NUMBER auto-increments per project (e.g., APP-123, APP-124)
- **FR-011b**: System MUST enforce issue key uniqueness per project (no duplicate keys within the same project)
- **FR-012**: System MUST render Mermaid diagrams inline within issue descriptions
- **FR-013**: System MUST render contextual link blocks with inline previews for Notion, Google Drive, and Confluence links
- **FR-013a**: System MUST gracefully degrade when external link preview services are unavailable: show error state with user notification, but issue remains fully functional
- **FR-014**: System MUST provide a Kanban board interface with drag-and-drop status updates
- **FR-015**: System MUST validate status transitions against workflow rules defined in configuration
- **FR-016**: System MUST enforce required custom fields when workflow rules specify them for status transitions
- **FR-017**: System MUST receive and process webhooks from Git services (GitHub, GitLab, Bitbucket)
- **FR-017a**: System MUST handle Git webhook failures gracefully: log errors, notify administrators, but core issue operations remain functional
- **FR-018**: System MUST automatically detect issue keys in branch names using the format `{PROJECT_KEY}-{NUMBER}` (e.g., `feature/APP-123-description` matches issue APP-123)
- **FR-019**: System MUST automatically update issue status when linked branches are created or PRs are merged
- **FR-020**: System MUST display linked branches and pull requests in issue views
- **FR-021**: System MUST support creating and managing sprints with name and date range
- **FR-022**: System MUST allow assigning issues to sprints
- **FR-023**: System MUST calculate and display burndown charts for sprints
- **FR-024**: System MUST track and display cycle time metrics (time from "In Progress" to "Done")
- **FR-025**: System MUST receive webhooks from monitoring services (Sentry, Datadog, New Relic)
- **FR-026**: System MUST automatically create issues from error webhooks with error details
- **FR-027**: System MUST display error traces, stack traces, and diagnostic information in a dedicated "Root Cause Dashboard" section
- **FR-027a**: System MUST handle monitoring service unavailability gracefully: show error state in Root Cause Dashboard section, but issue remains fully functional with all other features available
- **FR-028**: System MUST support configuring an AI gateway endpoint for triage and analysis. Permission to trigger AI triage defaults to Admin only, but can be overridden via project configuration (e.g., `ai_triage_permissions` setting allowing Members or other roles).
- **FR-028a**: System MUST provide Admin-only AI provider configuration management in Project Settings → Integrations page. Admin users can configure multiple AI providers (OpenAI, Anthropic, Ollama, etc.) per project, including API tokens/keys, endpoints, and enabled models. Configuration stored in database with encrypted fields for sensitive credentials (API keys, tokens). Endpoint URLs for self-hosted LLMs stored as plain text (not sensitive credentials).
- **FR-028b**: System MUST use password-type input fields (masked display) for API tokens/keys in AI provider configuration forms. Tokens never displayed in plain text after entry - must be re-entered to change. Prevents accidental exposure of sensitive credentials. For self-hosted LLMs (Ollama), form provides endpoint URL field (required) and optional authentication token field (password-type) for future authentication support.
- **FR-028c**: System MUST allow Admin to select which models from each configured provider are available to users via multiselect interface. Admin configures model availability per provider, system assigns default model automatically when AI triage is triggered, users can select from allowed models if multiple are configured. For self-hosted LLMs, system automatically queries provider's model list API (e.g., Ollama `/api/tags`) when endpoint URL is provided and populates available models in multiselect. If auto-discovery fails (endpoint unreachable, invalid response), system displays error message but allows manual model entry.
- **FR-028d**: System MUST support multiple AI providers configured simultaneously per project. Admin can configure multiple providers (e.g., OpenAI, Anthropic, Ollama), explicitly select which models from each provider are available, and system uses default model assignment or allows selection from configured allowed models when triage is triggered.
- **FR-028e**: System MUST provide optional "Test Connection" button for self-hosted LLM endpoint validation in AI provider configuration forms. Admin can optionally test endpoint connectivity before saving configuration. Form submission not blocked if test fails - allows offline configuration and gives admins control over when to validate.
- **FR-029**: System MUST send issue context to the AI gateway when triage is requested. Issue context includes: title, description, current status, custom fields, error traces (if available), and recent comments (last 5-10 comments).
- **FR-030**: System MUST display AI-generated summaries, priority suggestions, and assignment recommendations in a dedicated expandable "AI Triage Analysis" section within the issue detail view, positioned after issue details but before comments. Section expands automatically when suggestions are available and can be collapsed by the user. Assignee suggestions are provided as natural language descriptions (e.g., "frontend developer with React experience"), and users select actual assignees from project members. System MAY optionally provide fuzzy matching to suggest relevant users based on description.
- **FR-031**: System MUST ensure AI gateway requests can use self-hosted LLMs without external data transmission
- **FR-032**: System MUST persist issues with all metadata (status, assignee, custom fields, descriptions)
- **FR-033**: System MUST persist sprint/cycle data with issue associations
- **FR-034**: System MUST persist configuration file content and version history
- **FR-035**: System MUST provide a consistent layout for all authenticated pages with navigation and logout access
- **FR-035a**: System MUST display a top navigation bar with user menu (including logout) on all authenticated pages
- **FR-035b**: System MUST provide a dashboard layout with sidebar navigation for accessing projects and main application areas
- **FR-035c**: System MUST provide a project-specific layout with project header and tabs for project views (Board, List, Settings)
- **FR-035d**: System MUST ensure logout functionality is accessible from any authenticated page
- **FR-036**: System MUST provide a user account settings page accessible at `/settings` route
- **FR-036a**: System MUST allow users to view and edit their profile information (name, email, username) on the account settings page
- **FR-036b**: System MUST allow users to change their password on the account settings page
- **FR-036c**: System MUST enforce authentication requirements for accessing account settings page
- **FR-037**: System MUST provide a project settings index page accessible at `/projects/[projectId]/settings` route
- **FR-037a**: System MUST display navigation tabs or links to project settings sub-pages (Configuration, Integrations, etc.) on the project settings index page
- **FR-037b**: System MUST enforce project access permissions when accessing project settings pages

### Key Entities *(include if feature involves data)*

- **Issue**: Represents a work item, bug, feature request, or task. Key attributes include: unique identifier (format: `{PROJECT_KEY}-{NUMBER}` where PROJECT_KEY comes from project configuration and NUMBER is auto-incrementing per project, e.g., APP-123), title, description, status, assignee, reporter, creation/update timestamps, custom fields (stored as JSON), linked branches/PRs, sprint association, and related comments. Issues can contain Mermaid diagrams and contextual links in descriptions. Issue key uniqueness is enforced per project.

- **Sprint/Cycle**: Represents a time-bounded work period for planning and tracking. Key attributes include: name, start date, end date, associated issues, and calculated metrics (burndown, velocity, cycle time).

- **Project Configuration**: Represents the workflow, statuses, custom fields, and automation rules defined in `stride.config.yaml`. Key attributes include: project key, project name, workflow status definitions, custom field definitions, and automation rules. This is version-controlled and editable through the UI.

- **User**: Represents a team member with access to the system. Key attributes include: username, email, role (Admin, Member, or Viewer), and assignment history. Users can be assigned to issues and mentioned in comments. Role determines access: Admin (full access including configuration management), Member (create/edit issues, manage sprints), Viewer (read-only access).

- **Repository Connection**: Represents the link between Stride and a Git repository. Key attributes include: repository URL, service type (GitHub/GitLab), access credentials, webhook configuration status, and last sync timestamp.

- **AI Provider Configuration**: Represents AI provider settings for a project. Key attributes include: provider type (OpenAI, Anthropic, Ollama, etc.), encrypted API tokens/keys (for cloud providers), endpoint URLs (plain text for self-hosted LLMs, encrypted if contains credentials), optional authentication tokens (encrypted), enabled models (multiselect from available models with auto-discovery for self-hosted LLMs), default model selection, and configuration status. Stored per-project in database with encrypted fields for sensitive credentials (API keys, tokens). Endpoint URLs for self-hosted LLMs stored as plain text. Admin-only configuration via Project Settings → Integrations page.

### Technical Constraints

- **TC-001**: System MUST use a single PostgreSQL database with connection pooling for all data persistence. All entities (issues, users, sprints, configuration, repository connections, AI provider configurations) are stored relationally in PostgreSQL. Sensitive credentials (API keys, tokens) stored with encryption at rest.

### Observability Requirements

- **OBS-001**: System MUST emit structured logs in JSON format including: request IDs for tracing, error details with stack traces, user actions (authentication, issue creation, status changes), and external service interactions
- **OBS-002**: System MUST track and expose basic metrics: request counts per endpoint, error rates, and latency percentiles (p50, p95, p99)
- **OBS-003**: System MUST log to stdout/files for containerized deployment compatibility
- **OBS-004**: System MUST provide a simple metrics endpoint or support log aggregation for metrics extraction

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete initial deployment (Docker setup, admin account creation, repository linking) in under 5 minutes from first access to functional dashboard
- **SC-002**: Users can create a new issue using the command palette in under 10 seconds from opening the palette to issue appearing on the board
- **SC-003**: Configuration changes (adding status, custom field) are reflected in the UI within 2 seconds of saving, without requiring page refresh or application restart
- **SC-004**: Git webhook processing (branch creation to issue status update) completes within 5 seconds of webhook receipt
- **SC-005**: Kanban board drag-and-drop operations complete status updates in under 500ms with visual feedback
- **SC-006**: Mermaid diagrams render inline within issue descriptions in under 1 second after page load
- **SC-007**: Contextual link previews (Notion, Drive, Confluence) load and display within 3 seconds of issue view access
- **SC-008**: System supports teams of up to 50 users working concurrently without performance degradation
- **SC-009**: Burndown charts and cycle time metrics calculate and display accurately for sprints containing up to 100 issues
- **SC-010**: Error webhook processing (error event to issue creation with diagnostic data) completes within 10 seconds
- **SC-011**: AI triage requests return analysis results within 30 seconds for issues with standard context (description, 1-2 error traces, 5-10 comments)
- **SC-012**: 95% of configuration file edits pass validation on first save attempt when following documented schema
- **SC-013**: System maintains 99.9% uptime for core issue management operations (create, read, update, status change) during normal operation
- **SC-014**: Users can successfully complete the primary workflow (create issue → add context → assign to sprint → update status → view metrics) without encountering blocking errors in 98% of attempts

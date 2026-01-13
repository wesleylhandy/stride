# Feature Specification: Project Import from Git Providers

**Feature Branch**: `008-project-import`  
**Created**: 2026-01-23  
**Status**: Draft  
**Input**: User description: "Project ingestion: manual process and automated import via git providers"

## User Scenarios & Testing

### User Story 1 - Manual Project Creation (Priority: P1)

A user wants to create a new project manually by entering project details, with the option to provide a repository URL during creation (URL is stored; repository connection happens separately via project settings or import flow when OAuth is available).

**Why this priority**: Manual project creation is the foundation workflow. Users need a reliable way to create projects even when they don't want to import from git providers or when git provider integration isn't configured. This ensures the system works independently of external integrations.

**Independent Test**: Can be fully tested by having a user navigate to project creation, enter project key, name, and description, optionally provide a repository URL, and successfully create a project. Success when project appears in the projects list with correct information, and repository URL is stored if provided (connection can be established later via project settings or import flow).

**Acceptance Scenarios**:

1. **Given** a user wants to create a project manually, **When** they enter project key, name, and description, **Then** the project is created successfully with a default configuration
2. **Given** a user wants to create a project with a repository URL, **When** they provide a repository URL and type during creation, **Then** the project is created with the repository URL stored (repository connection is not automatically established; user can connect later via project settings)
3. **Given** a user provides an invalid repository URL, **When** they attempt to create the project, **Then** validation errors are shown before project creation
4. **Given** a user creates a project without a repository, **When** they view the project, **Then** they can connect a repository later through project settings or import flow

---

### User Story 2 - List Repositories from Git Providers (Priority: P1)

A user wants to see their available repositories from GitHub or GitLab so they can select one to import as a project.

**Why this priority**: Users need to discover which repositories are available for import. Without repository listing, users must manually enter repository URLs, which is error-prone and doesn't show which repositories they have access to. This is essential for the automated import workflow.

**Independent Test**: Can be fully tested by having a user authenticate with a git provider (GitHub/GitLab), view their repositories in a list, and see repository details like name, description, and URL. Success when users can see their repositories and identify which ones they want to import.

**Acceptance Scenarios**:

1. **Given** a user wants to import a project from GitHub, **When** they authenticate with GitHub, **Then** they see a list of repositories they have access to
2. **Given** a user wants to import a project from GitLab, **When** they authenticate with GitLab, **Then** they see a list of projects they have access to
3. **Given** a user has many repositories, **When** they view the repository list, **Then** repositories are paginated or searchable to find the desired repository
4. **Given** a repository is already connected to an existing project, **When** the user views the repository list, **Then** the repository is marked as already connected (optional enhancement)

---

### User Story 3 - Import Project from Repository (Priority: P1)

A user wants to create a project by importing from a git repository, automatically setting up the project with repository information and configuration.

**Why this priority**: Automated import streamlines project setup by using repository metadata (name, description) and configuration files. This reduces manual data entry and ensures consistency between the repository and the project. This is the core value proposition for git provider integration.

**Independent Test**: Can be fully tested by having a user select a repository from the list, confirm import settings (project key, name), and successfully create a project with the repository automatically connected. Success when the project is created with correct information, repository connection is established, configuration is synced if present, and webhooks are registered.

**Acceptance Scenarios**:

1. **Given** a user selects a repository to import, **When** they confirm the import, **Then** a project is created with repository URL, name, and description automatically populated
2. **Given** a repository contains a `stride.config.yaml` file, **When** the project is imported, **Then** the configuration is synced from the repository
3. **Given** a repository does not contain a `stride.config.yaml` file, **When** the project is imported, **Then** a default configuration is generated using repository metadata
4. **Given** a user imports a project from a repository, **When** the import completes, **Then** the repository connection is established with webhooks registered for branch and PR events
5. **Given** a user attempts to import a repository that is already connected to another project, **When** they confirm the import, **Then** an appropriate warning or error message is shown

---

### Edge Cases

- What happens when a user tries to import a repository they don't have access to?
- How does the system handle repository import when git provider OAuth credentials are not configured?
- What happens if repository metadata (name, description) cannot be fetched during import?
- How does the system handle duplicate project keys when importing multiple repositories with similar names?
- What happens if repository configuration file (`stride.config.yaml`) exists but is invalid or malformed?
- How does the system handle repositories that are private vs public during listing?
- What happens if webhook registration fails during project import? → Import fails and transaction is rolled back (project is not created)
- How does the system handle network timeouts when fetching repository information?

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to create projects manually by entering project key, name, and description
- **FR-002**: System MUST allow users to optionally provide repository URL and type during manual project creation (URL is stored on project entity; repository connection is NOT automatically established and must be done separately via project settings or import flow)
- **FR-003**: System MUST validate repository URLs before creating projects
- **FR-004**: System MUST allow users to list repositories from GitHub using OAuth authentication
- **FR-005**: System MUST allow users to list repositories from GitLab using OAuth authentication
- **FR-006**: System MUST display repository name, description, and URL in the repository list
- **FR-007**: System MUST support pagination or search for repository lists when users have many repositories
- **FR-008**: System MUST allow users to import/create a project by selecting a repository from the list
- **FR-009**: System MUST automatically populate project name and description from repository metadata during import
- **FR-010**: System MUST automatically connect the repository to the imported project
- **FR-011**: System MUST sync configuration from repository if `stride.config.yaml` file exists
- **FR-012**: System MUST generate default configuration if repository does not contain `stride.config.yaml`
- **FR-013**: System MUST register webhooks for branch and pull request events during repository import
- **FR-014**: System MUST validate project key uniqueness before creating imported projects
- **FR-015**: System MUST generate project keys from repository names when not explicitly provided
- **FR-016**: System MUST handle errors gracefully when repository information cannot be fetched
- **FR-017**: System MUST prevent importing repositories that are already connected to existing projects
- **FR-018**: System MUST fail the entire import transaction if webhook registration fails (rollback project creation to ensure data consistency)

### Key Entities

- **Project**: Represents a project with key, name, description, configuration, and optional repository connection
- **Repository Connection**: Links a project to a git repository with authentication credentials and webhook configuration
- **Repository Metadata**: Information about a git repository including name, description, URL, and visibility status

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a project manually in under 2 minutes from start to completion
- **SC-002**: Users can import a project from a git repository in under 3 minutes from repository selection to project creation
- **SC-003**: Repository listing displays available repositories within 5 seconds of authentication
- **SC-004**: 95% of repository imports complete successfully without manual intervention
- **SC-005**: Project key conflicts are detected and resolved before project creation (100% validation rate)
- **SC-006**: Configuration sync from repository completes successfully when `stride.config.yaml` exists (95% success rate)
- **SC-007**: Users can successfully list and import repositories from both GitHub and GitLab
- **SC-008**: Repository webhooks are registered successfully during import (95% success rate)

## Dependencies

- Existing project creation API (`POST /api/projects`)
- Existing repository connection API (`POST /api/projects/[projectId]/repositories`)
- Git provider OAuth integration (GitHub, GitLab)
- Configuration sync functionality (existing `syncConfigFromRepository`)
- Webhook registration functionality (existing `registerWebhook`)

## Clarifications

### Session 2026-01-23

- Q: When webhook registration fails during project import, should the entire import operation fail or proceed without webhooks? → A: Fail entire import and rollback transaction (project creation fails)
- Q: What happens when a user provides repository URL and type during manual project creation? → A: Repository URL is stored on the project entity only; repository connection is NOT automatically established. Connection requires OAuth authentication and must be done separately via project settings (existing flow) or import flow (User Story 3). Manual creation with repository URL stores metadata only. If OAuth is configured, users should use the import flow (User Story 3) to list repositories and create connections.

## Assumptions

- Users have access to git provider accounts (GitHub, GitLab) for automated import
- Git provider OAuth applications are configured at the infrastructure level (not required for manual creation)
- Repository listing is scoped to repositories the authenticated user has access to (user's own repos and organization repos they can access)
- Project keys are auto-generated from repository names if not explicitly provided during import
- Manual project creation remains available even when git provider integration is not configured
- Manual project creation with repository URL only stores the URL on the project entity; repository connection (which requires OAuth) happens separately via project settings or import flow
- Repository import creates a new project; existing projects cannot be "re-imported" from repositories (they can have repositories connected via existing repository connection flow)
- Private repositories are included in repository listings when user has appropriate access
- Webhook registration failures cause the entire import transaction to fail and rollback (ensures data consistency)
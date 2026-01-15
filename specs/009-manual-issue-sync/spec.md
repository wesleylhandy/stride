# Feature Specification: Manual Issue Sync for Inactive Webhooks

**Feature Branch**: `009-manual-issue-sync`  
**Created**: 2026-01-27  
**Status**: Draft  
**Input**: User description: "For git webhooks, if they are inactive , can we add the ability to manually pull down existing issues or security/dependabot issues for the repo?"

## Clarifications

### Session 2026-01-27

- Q: Who should be able to trigger manual issue sync? → A: Project administrators and members (but not viewers) can trigger manual sync
- Q: Should manual sync be available when webhooks are active? → A: Show informational message when webhooks are active, but still allow manual sync after confirmation
- Q: How should the system match repository issues to existing local issues to prevent duplicates? → A: Store external identifier in issue metadata, prioritize exact match on external ID, then fallback to title + repository URL match. System must also support manually linking issues when automatic matching fails.
- Q: How should users trigger security advisory sync? → A: Combined with regular sync by default, with optional separate security-only sync action
- Q: How should users request syncing closed/archived issues? → A: Checkbox in sync UI to include closed/archived issues (opt-in), with verification confirmation to prevent accidental selection

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Sync of Repository Issues (Priority: P1)

A project administrator needs to manually synchronize issues from a repository when webhooks are inactive. They navigate to the repository connection settings, see that the webhook is inactive, and trigger a manual sync to pull down all open issues from the Git provider.

**Why this priority**: This is the core functionality that addresses the primary user need - being able to sync issues when webhooks cannot automatically do so.

**Independent Test**: Can be fully tested by navigating to project settings, identifying an inactive repository connection, and triggering a manual issue sync. The test verifies that open issues are retrieved from the Git provider API and created as issues in the project, delivering immediate value of populating the project with existing repository issues.

**Acceptance Scenarios**:

1. **Given** a project has a repository connection with an inactive webhook (isActive = false), **When** a project administrator or member triggers a manual issue sync, **Then** the system retrieves all open issues and security advisories from the Git provider API and creates corresponding issues in the project (unless security-only sync is selected)
2. **Given** a repository connection with an active webhook (isActive = true), **When** a user attempts to trigger a manual issue sync, **Then** the system either allows the sync (as a one-time operation) or displays an informational message suggesting that automatic sync is enabled
3. **Given** a manual issue sync is in progress, **When** a user attempts to trigger another sync for the same repository, **Then** the system prevents duplicate sync operations and shows appropriate feedback
4. **Given** issues already exist in the project that match repository issues by external identifier or title+repository URL, **When** a manual sync runs, **Then** the system updates existing issues rather than creating duplicates
5. **Given** a repository issue cannot be automatically matched to an existing local issue, **When** a manual sync creates a new issue, **Then** users can manually link the new issue to an existing local issue if they represent the same work item
6. **Given** a repository has more issues than can be retrieved in a single API call, **When** a manual sync runs, **Then** the system handles pagination and retrieves all available issues
7. **Given** a user wants to sync closed or archived issues, **When** they check the option to include closed/archived issues in the sync UI, **Then** the system requires explicit verification (confirmation dialog or secondary confirmation) before proceeding with sync of closed/archived issues

---

### User Story 2 - Manual Sync of Security Advisories (Priority: P2)

A security-conscious project administrator needs to manually synchronize security advisories and Dependabot alerts from a repository when webhooks are inactive. They trigger a manual sync that specifically targets security-related issues.

**Why this priority**: Security advisories are critical for maintaining secure codebases, but are secondary to general issue sync since they are a subset of issues that require special handling.

**Independent Test**: Can be fully tested by triggering a manual security sync for a repository with known security advisories or Dependabot alerts. The test verifies that security-related issues are retrieved and created with appropriate metadata (priority, type, security labels), delivering value of ensuring security vulnerabilities are tracked even when webhooks are inactive.

**Acceptance Scenarios**:

1. **Given** a repository has security advisories or Dependabot alerts, **When** a user triggers a regular manual sync (default behavior), **Then** the system retrieves both regular issues and security-related issues from the Git provider API and creates them as issues with appropriate metadata
2. **Given** a repository has security advisories or Dependabot alerts, **When** a user triggers an optional security-only sync action, **Then** the system retrieves only security-related issues from the Git provider API and creates them as issues with appropriate security indicators
2. **Given** a Git provider does not support security advisories (e.g., Bitbucket), **When** a user attempts to sync security issues, **Then** the system gracefully handles the limitation and only syncs available issue types
3. **Given** security issues are synced, **When** they are created in the project, **Then** they are assigned appropriate priority levels (typically High or Critical) and marked with security-related metadata

---

### User Story 3 - Sync Progress and Feedback (Priority: P3)

A user needs visibility into the progress of manual sync operations to understand how many issues are being processed and when the sync completes.

**Why this priority**: User feedback is important for long-running operations, but the core functionality (syncing issues) must work first before optimizing the user experience with progress indicators.

**Independent Test**: Can be fully tested by triggering a manual sync on a repository with a known number of issues and observing the UI feedback. The test verifies that progress indicators show sync status, completion messages display the number of issues synced, and errors are clearly communicated, delivering value of transparency and confidence in the sync operation.

**Acceptance Scenarios**:

1. **Given** a manual sync is triggered, **When** the sync operation begins, **Then** the system displays a progress indicator showing that sync is in progress
2. **Given** a manual sync completes successfully, **When** the operation finishes, **Then** the system displays a success message indicating how many issues were synced (created, updated, skipped)
3. **Given** a manual sync encounters an API error (e.g., rate limiting, authentication failure), **When** the error occurs, **Then** the system displays a clear error message explaining what went wrong and suggests potential solutions
4. **Given** a manual sync takes longer than expected (e.g., large repository), **When** the operation exceeds a threshold time, **Then** the system provides periodic updates or allows the operation to run asynchronously with notification on completion

---

### Edge Cases

- What happens when the Git provider API is unavailable or returns errors during sync?
- How does the system handle rate limiting from Git provider APIs (e.g., GitHub's 5,000 requests per hour)?
- What happens when the access token for the repository connection has expired or lacks necessary permissions?
- How are duplicate issues detected and prevented when syncing the same repository multiple times?
- What happens when automatic matching cannot determine if a repository issue corresponds to an existing local issue - should users be able to manually link them?
- What happens when synced issues exceed project limits or storage quotas?
- How does the system handle repositories with thousands of issues (performance considerations)?
- What happens if a manual sync is interrupted (e.g., server restart, network failure)?
- How are closed/archived issues handled - should they be synced or only open issues? (Resolved: Opt-in via checkbox with verification confirmation required)
- What happens when repository issues have been deleted on the Git provider but exist locally?
- How does the system handle repositories that have been moved, renamed, or deleted on the Git provider?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a mechanism for project administrators and members (not viewers) to manually trigger issue synchronization for repository connections, regardless of webhook status
- **FR-018**: System MUST display an informational message when manual sync is triggered for a repository connection with active webhooks, informing users that automatic sync is enabled, but still allow manual sync to proceed after user confirmation
- **FR-002**: System MUST retrieve issues from Git provider APIs (GitHub, GitLab, Bitbucket) when manual sync is triggered
- **FR-003**: System MUST support syncing regular repository issues (GitHub Issues, GitLab Issues, Bitbucket Issues)
- **FR-004**: System MUST support syncing security advisories and Dependabot alerts from supported Git providers (GitHub, GitLab)
- **FR-021**: System MUST include security advisories and Dependabot alerts in regular manual sync operations by default
- **FR-022**: System MUST provide an optional separate security-only sync action that syncs only security advisories and Dependabot alerts (excluding regular issues)
- **FR-005**: System MUST handle API pagination to retrieve all available issues, regardless of repository size
- **FR-006**: System MUST prevent duplicate issue creation by matching existing issues using the following priority: (1) exact match on external identifier stored in issue metadata, (2) exact match on title + repository URL combination
- **FR-007**: System MUST update existing issues when a match is found during sync, rather than creating duplicates
- **FR-019**: System MUST store external identifiers from Git providers in issue metadata to enable future duplicate detection and updates
- **FR-020**: System MUST provide a mechanism for users to manually link synced repository issues to existing local issues when automatic matching fails or produces incorrect matches
- **FR-008**: System MUST respect Git provider API rate limits and handle rate limit errors gracefully with appropriate user feedback
- **FR-009**: System MUST validate that repository connection access tokens are valid and have necessary permissions before attempting sync
- **FR-017**: System MUST verify user permissions before allowing manual sync (project administrators and members allowed, viewers denied)
- **FR-010**: System MUST display sync progress feedback to users, including status indicators and completion notifications
- **FR-011**: System MUST provide error messages when sync operations fail, explaining the failure reason and suggesting remediation steps
- **FR-012**: System MUST prevent concurrent sync operations for the same repository connection
- **FR-013**: System MUST sync only open/active issues by default, excluding closed and archived issues unless explicitly requested
- **FR-014**: System MUST assign appropriate issue types and priorities to synced security advisories (typically Bug type with High/Critical priority)
- **FR-015**: System MUST preserve issue metadata from Git providers (labels, assignees, descriptions, creation dates) when creating issues in the project
- **FR-016**: System MUST update the repository connection's lastSyncAt timestamp after successful sync completion

### Key Entities

- **RepositoryConnection**: Represents the Git repository integration with webhook status (isActive), access tokens, and last sync timestamp
- **Issue**: Represents synced issues from Git providers, including title, description, status, type, priority, external metadata, and external identifier (stored in customFields or dedicated field for linking to Git provider issues)
- **SyncOperation**: Tracks manual sync operations in progress, including status, progress, and result metrics (created, updated, failed counts)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully sync up to 1,000 repository issues in a single manual sync operation within 5 minutes for typical repositories
- **SC-002**: System successfully handles pagination for repositories with more than 100 issues, retrieving all available issues without missing data
- **SC-003**: Duplicate detection accuracy of at least 95% - correctly matching existing issues during sync operations without creating unnecessary duplicates
- **SC-004**: Sync operations complete without errors for 90% of repository connections with valid access tokens and inactive webhooks
- **SC-005**: Users receive clear feedback (progress indicators, success/error messages) within 2 seconds of triggering a sync operation
- **SC-006**: Security advisories and Dependabot alerts are correctly identified and synced with appropriate priority levels for 100% of supported Git providers (GitHub, GitLab)
- **SC-007**: System gracefully handles API rate limiting with automatic retry or user notification for 100% of rate limit scenarios
- **SC-008**: Manual sync reduces time-to-populate issues from days (waiting for webhook activation) to minutes (immediate sync) for users with inactive webhooks

## Assumptions

- Git provider APIs (GitHub, GitLab, Bitbucket) provide endpoints for listing repository issues and security advisories
- Access tokens stored in repository connections have sufficient permissions to read issues and security advisories
- Security advisories and Dependabot alerts are available via API for GitHub and GitLab (Bitbucket support may be limited)
- Manual sync is primarily needed when webhooks are inactive, but may also be useful as a one-time sync even when webhooks are active
- Users want to sync open/active issues by default, not historical closed issues
- Large repositories may have thousands of issues, requiring efficient pagination and processing
- Duplicate detection should prioritize external identifiers when available, falling back to title + repository URL matching when identifiers are not present
- When automatic matching cannot definitively link a repository issue to a local issue, the system should create a new issue and allow users to manually link it to an existing issue if needed

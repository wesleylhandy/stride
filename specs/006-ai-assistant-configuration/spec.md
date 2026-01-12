# Feature Specification: AI Assistant for Project Configuration

**Feature Branch**: `006-ai-assistant-configuration`  
**Created**: 2026-01-23  
**Status**: Draft  
**Input**: User description: "We need a new feature to add an AI assistant for configuring projects based on our complex set of features. It should use global ai provider setup and have a thorough understanding of the entire configuration system, from global config, to project config, to infrastructure config, to oauth. We will probably need a system prompt that can access documentation markdown and compare to db settings globally for admins or particularly for projects."

## Clarifications

### Session 2026-01-23

- Q: What are the access control requirements for the AI assistant? Who can use it? → A: Role-based permissions configurable per project. Default: only project admins can use project assistant; only system admins can use infrastructure assistant. Projects can opt-in to allow members/viewers access (configurable per project). Infrastructure assistant always requires system admin role.
- Q: What rate limiting strategy should be implemented to prevent abuse? → A: Per-user rate limits (e.g., 20 messages per minute) with separate limits for AI Gateway calls to protect the service.
- Q: How should the system handle concurrent configuration changes (e.g., user edits config while assistant suggests changes)? → A: Detect conflicts and prompt user to resolve. Show both versions (current database state vs assistant suggestion), let user choose which to keep or merge manually.
- Q: How should session lifecycle and conversation history be managed? → A: Sessions persist indefinitely, but UI shows only recent sessions (last 30 days) with option to archive/delete older ones. System MUST implement creative context management strategy to prevent context window overload when sending conversation history to AI (e.g., summarization, sliding window, or selective message inclusion based on relevance).
- Q: What are the performance targets for assistant response time? → A: Up to 30 seconds acceptable for assistant responses. Allows time for complex analysis, documentation retrieval, and thorough configuration validation while maintaining good user experience.

## User Scenarios & Testing

### User Story 1 - Admin Configures Project with AI Assistance (Priority: P1)

An admin wants to configure a new project but is overwhelmed by the complexity of the configuration system. They use the AI assistant to guide them through setting up workflow statuses, custom fields, and automation rules based on their team's needs.

**Why this priority**: This is the core value proposition - making complex configuration accessible through AI guidance. Without this, the feature has no purpose.

**Independent Test**: Admin can open project settings, start a conversation with the AI assistant, ask "How do I set up a Kanban workflow with priority fields?", receive step-by-step guidance, and apply the suggested configuration. The assistant understands the current project state and suggests appropriate configurations.

**Acceptance Scenarios**:

1. **Given** an admin is on the project settings page, **When** they click "Ask AI Assistant", **Then** a chat interface opens with the assistant ready to help
2. **Given** the assistant is active, **When** admin asks "What custom fields should I add for a software development project?", **Then** the assistant suggests relevant fields (priority, story points, component) with explanations
3. **Given** admin asks about workflow configuration, **When** they describe their process, **Then** the assistant suggests appropriate statuses and transitions
4. **Given** admin asks to apply a suggested configuration, **When** they confirm, **Then** the configuration is applied to the project

---

### User Story 2 - AI Assistant Validates Configuration Against Best Practices (Priority: P1)

An admin has configured a project but wants to ensure it follows best practices and is complete. The AI assistant analyzes the current configuration and suggests improvements.

**Why this priority**: Validation and improvement suggestions are critical for ensuring quality configurations. This prevents misconfigurations that could cause issues later.

**Independent Test**: Admin opens AI assistant, asks "Review my project configuration", assistant analyzes current config against documentation and best practices, provides specific recommendations with explanations.

**Acceptance Scenarios**:

1. **Given** a project has existing configuration, **When** admin asks "Is my configuration correct?", **Then** the assistant analyzes the config and identifies any issues or missing elements
2. **Given** the assistant finds configuration issues, **When** it reports findings, **Then** it provides specific recommendations with references to documentation
3. **Given** admin asks about a specific configuration element, **When** they reference it, **Then** the assistant explains what it does and whether it's configured correctly

---

### User Story 3 - AI Assistant Compares Configuration to Database Settings (Priority: P2)

An admin wants to understand discrepancies between their YAML configuration file and what's actually stored in the database. The AI assistant can compare both and explain differences.

**Why this priority**: Helps admins understand configuration drift and ensures consistency between source of truth (YAML) and runtime state (database).

**Independent Test**: Admin asks "Compare my YAML config to the database", assistant fetches both, compares them, and explains any differences with recommendations.

**Acceptance Scenarios**:

1. **Given** a project has both YAML config and database config, **When** admin asks to compare them, **Then** the assistant shows differences with explanations
2. **Given** there are discrepancies, **When** assistant identifies them, **Then** it suggests which source is authoritative and how to reconcile
3. **Given** admin asks about a specific setting, **When** they reference it, **Then** assistant shows both YAML and database values with context

---

### User Story 4 - AI Assistant Helps with Infrastructure Configuration (Priority: P2)

A system admin needs to configure global infrastructure settings (AI Gateway, OAuth) but isn't sure about the requirements. The AI assistant guides them through the setup.

**Why this priority**: Infrastructure configuration is complex and critical. AI assistance reduces setup errors and improves onboarding.

**Independent Test**: System admin opens infrastructure settings, asks AI assistant "How do I configure GitHub OAuth?", receives step-by-step guidance including OAuth app creation steps and environment variable setup.

**Acceptance Scenarios**:

1. **Given** an admin is on infrastructure settings page, **When** they ask about OAuth setup, **Then** the assistant provides step-by-step guidance
2. **Given** admin asks about AI provider configuration, **When** they specify a provider, **Then** the assistant explains requirements and setup steps
3. **Given** admin asks about configuration precedence (env vars vs UI), **When** they ask, **Then** the assistant explains the precedence order with examples

---

### User Story 5 - AI Assistant References Documentation (Priority: P2)

When providing guidance, the AI assistant references relevant documentation sections and can explain configuration options based on official documentation.

**Why this priority**: Ensures accuracy and provides users with authoritative sources. Builds trust in the assistant's recommendations.

**Independent Test**: Admin asks "What are all the workflow status types?", assistant responds with accurate information from documentation and provides links/references to relevant docs.

**Acceptance Scenarios**:

1. **Given** admin asks about a configuration option, **When** assistant responds, **Then** it references relevant documentation sections
2. **Given** assistant provides a recommendation, **When** it explains why, **Then** it can cite documentation that supports the recommendation
3. **Given** admin wants more details, **When** they ask, **Then** assistant can provide deeper explanations based on documentation

---

### Edge Cases

- What happens when AI provider is not configured? (Assistant should gracefully degrade or show setup instructions)
- How does system handle when documentation is missing or outdated? (Assistant should indicate uncertainty, fall back to schema knowledge)
- What if database and YAML config are both missing? (Assistant should guide through initial setup)
- How does assistant handle conflicting recommendations? (Should explain trade-offs, not just pick one)
- What if user asks about features not yet implemented? (Assistant should acknowledge limitations)
- How does assistant handle malformed YAML or invalid configurations? (Should identify errors and suggest fixes)
- What if user asks in a language other than English? (Should handle gracefully, may need clarification)
- What happens when user exceeds rate limits? (Should return 429 Too Many Requests with retry-after header, show user-friendly message)
- What if configuration changes between when assistant reads it and when user applies suggestion? (System detects conflict, shows both versions, prompts user to resolve)
- How does system prevent context window overflow for long conversations? (Context management: summarization, sliding window, or selective message inclusion - implementation strategy to be determined in planning phase)

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide an AI-powered chat interface for project configuration assistance
- **FR-002**: AI assistant MUST use the global AI provider configuration (same as AI triage feature)
- **FR-003**: AI assistant MUST have access to project configuration (YAML and database state)
- **FR-004**: AI assistant MUST have access to global infrastructure configuration (for admins)
- **FR-005**: AI assistant MUST have access to relevant documentation markdown files
- **FR-006**: AI assistant MUST be able to compare YAML configuration to database state
- **FR-007**: AI assistant MUST provide step-by-step guidance for configuration tasks
- **FR-008**: AI assistant MUST validate configurations against schema and best practices
- **FR-009**: AI assistant MUST reference documentation when providing recommendations
- **FR-010**: AI assistant MUST understand workflow, custom fields, automation rules, and OAuth configuration
- **FR-011**: System MUST allow admins to apply AI-suggested configurations (with confirmation)
- **FR-012**: AI assistant MUST work in project settings context (project-specific) and infrastructure settings context (global)
- **FR-013**: System MUST handle cases where AI provider is not configured (graceful degradation)
- **FR-014**: AI assistant MUST be able to explain configuration options and their implications
- **FR-015**: System MUST store conversation history per user/session (for context continuity)
- **FR-016**: System MUST enforce role-based access control: default to admin-only access, with opt-in configuration per project to allow members/viewers
- **FR-017**: Infrastructure assistant MUST require system admin role (non-configurable)
- **FR-018**: System MUST implement per-user rate limiting (e.g., 20 messages per minute) to prevent abuse
- **FR-019**: System MUST enforce separate rate limits for AI Gateway API calls to protect the service
- **FR-020**: System MUST detect configuration conflicts when applying assistant suggestions (compare current database state to suggestion)
- **FR-021**: System MUST prompt user to resolve conflicts by showing both versions (current vs suggested) and allowing user to choose or merge
- **FR-022**: System MUST implement context management strategy to prevent AI context window overload (e.g., conversation summarization, sliding window of recent messages, or selective message inclusion based on relevance)
- **FR-023**: UI MUST show only recent sessions (last 30 days) by default, with option to access/archive/delete older sessions

### Key Entities

- **ConfigurationAssistant**: Represents an AI assistant session for configuration help
  - Session ID, user ID, context type (project vs infrastructure), conversation history
- **AssistantMessage**: Individual message in a conversation
  - Message ID, session ID, role (user/assistant), content, timestamp, metadata (config references, documentation links)
- **ConfigurationSuggestion**: AI-generated configuration recommendation
  - Suggestion ID, session ID, configuration type (workflow, custom fields, etc.), suggested config (YAML/JSON), explanation, confidence score

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admins can successfully configure a project using only AI assistant guidance (90% success rate on first attempt)
- **SC-002**: AI assistant provides accurate configuration recommendations (validates against schema, 95% accuracy)
- **SC-003**: AI assistant correctly identifies configuration issues (matches manual review 90% of the time)
- **SC-004**: Users can complete configuration tasks 50% faster with AI assistance vs. manual configuration
- **SC-005**: AI assistant references documentation in 80% of responses that require it
- **SC-006**: Configuration suggestions applied by users are valid (100% schema validation pass rate)
- **SC-007**: AI assistant correctly compares YAML and database configs (identifies all discrepancies)
- **SC-008**: Assistant responses appear within 30 seconds for 95% of queries (allows time for complex analysis and documentation retrieval)

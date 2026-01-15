# Tasks: AI Assistant for Project Configuration

**Input**: Design documents from `/specs/006-ai-assistant-configuration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `apps/web/`, `packages/ai-gateway/`, `packages/database/`
- **Next.js App Router**: `apps/web/app/api/`, `apps/web/app/projects/[projectId]/settings/`
- **Components**: `packages/ui/src/` or `apps/web/src/components/`
- **Database**: `packages/database/prisma/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database schema setup

- [x] T001 [P] Add ConfigurationAssistantSession and AssistantMessage models to packages/database/prisma/schema.prisma
- [x] T002 Create Prisma migration for ConfigurationAssistantSession and AssistantMessage models (run `pnpm db:migrate --name add_assistant_models`) in packages/database/prisma/migrations/
- [x] T003 [P] Create system prompt file for configuration assistant in packages/ai-gateway/prompts/configuration-assistant-prompt.md
- [x] T004 [P] Implement system prompt loader for configuration assistant in packages/ai-gateway/src/lib/load-config-assistant-prompt.ts
- [x] T005 [P] Create documentation index mapping topics to markdown file paths and sections in apps/web/src/lib/assistant/doc-index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Create repository/service layer for assistant sessions with methods (findOrCreate, findById, update, findByUser) in apps/web/src/lib/assistant/session-repository.ts
- [x] T007 [P] Create repository/service layer for assistant messages with methods (create, findBySession, paginate) in apps/web/src/lib/assistant/message-repository.ts
- [x] T008 Implement sliding window context management strategy (include most recent N messages, default: last 20 messages, plus system prompt; exclude older messages to prevent context window overflow) in apps/web/src/lib/assistant/context-manager.ts
- [x] T009 [P] Create prompt builder utility for constructing assistant prompts with context in apps/web/src/lib/assistant/prompt-builder.ts
  - _Note: Enhanced with best practices - static system prompt, optimal context ordering, token budgeting ready_
- [x] T010 [P] Create documentation retrieval service in apps/web/src/lib/assistant/doc-retrieval.ts (load relevant docs based on query, uses doc-index.ts from T005)
  - _Note: Enhanced with markdown formatting improvements (no code fences, frontmatter stripping)_
- [x] T011 Create rate limiting middleware for assistant endpoints (per-user message limits, default: 20 messages per minute, configurable via constants following existing codebase pattern) in apps/web/src/lib/assistant/rate-limit.ts
- [x] T011A [P] Create AI Gateway rate limiting utility (separate limits for AI Gateway API calls, default: 60 requests per minute, configurable via constants to protect service) in apps/web/src/lib/assistant/ai-gateway-rate-limit.ts
- [x] T012 Create access control utility for checking assistant permissions (role-based, project opt-in) in apps/web/src/lib/assistant/access-control.ts
- [x] T013 [P] Create configuration comparison utility (YAML vs database) in apps/web/src/lib/assistant/config-comparison.ts
- [x] T014 Create configuration suggestion application service (with conflict detection) in apps/web/src/lib/assistant/suggestion-applier.ts

**Additional Quality Improvements** (not in original plan, added for production readiness):

- Token budgeting utility (`token-budget.ts`) - Prevents context window overflow, ready for integration in Phase 3
- Implementation review and best practices fixes applied to T009/T010

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Configures Project with AI Assistance (Priority: P1) 🎯 MVP

**Goal**: Admin can use AI assistant to get step-by-step guidance for configuring projects (workflow, custom fields, automation rules) and apply suggested configurations.

**Independent Test**: Admin opens project settings, clicks "Ask AI Assistant", asks "How do I set up a Kanban workflow with priority fields?", receives guidance, and can apply the suggested configuration. The assistant understands current project state and suggests appropriate configurations.

### Implementation for User Story 1

- [x] T015 [US1] Create API route handler for POST /api/projects/[projectId]/assistant/chat in apps/web/app/api/projects/[projectId]/assistant/chat/route.ts
- [x] T016 [US1] Implement chat message processing (create/get session using T006, build prompt with context management from T008, call AI Gateway using T004) in apps/web/app/api/projects/[projectId]/assistant/chat/route.ts
- [x] T017 [US1] Create API route handler for GET /api/projects/[projectId]/assistant/history in apps/web/app/api/projects/[projectId]/assistant/history/route.ts
- [x] T018 [US1] Create API route handler for POST /api/projects/[projectId]/assistant/apply-suggestion in apps/web/app/api/projects/[projectId]/assistant/apply-suggestion/route.ts
- [x] T019 [US1] Implement configuration suggestion application logic (validate, detect conflicts, apply) in apps/web/app/api/projects/[projectId]/assistant/apply-suggestion/route.ts
- [x] T020 [P] [US1] Create ConfigurationAssistant server component (fetches session, renders initial messages) in apps/web/src/components/features/projects/ConfigurationAssistant.tsx
- [x] T021 [P] [US1] Create ConfigurationAssistantClient client component (handles input, sends messages, real-time updates) in apps/web/src/components/features/projects/ConfigurationAssistantClient.tsx
- [x] T022 [P] [US1] Create AssistantMessage component for displaying messages in apps/web/src/components/features/projects/AssistantMessage.tsx
- [x] T023 [P] [US1] Create AssistantInput component for message input in apps/web/src/components/features/projects/AssistantInput.tsx
- [x] T024 [US1] Create ConfigurationSuggestion component with apply button in apps/web/src/components/features/projects/ConfigurationSuggestion.tsx
- [x] T025 [US1] Integrate ConfigurationAssistant component into project settings page in apps/web/app/projects/[projectId]/settings/page.tsx
- [x] T026 [US1] Add "Ask AI Assistant" button/trigger in project settings UI
- [x] T027 [US1] Implement error handling for AI Gateway failures (503, timeout, invalid response) in chat route
- [x] T028 [US1] Implement graceful degradation when AI provider not configured (show setup instructions) and handle non-English queries (indicate English is required or attempt to understand and respond in English) in ConfigurationAssistantClient.tsx
- [x] T029 [US1] Add rate limiting to chat endpoint (20 messages per minute per user) using rate-limit.ts from T011
- [x] T029A [US1] Integrate AI Gateway rate limiting (separate limits for AI Gateway calls) in chat route using ai-gateway-rate-limit.ts from T011A
- [x] T030 [US1] Implement access control check (admin-only by default, project opt-in config) in chat route

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Admin can chat with assistant, get configuration guidance, and apply suggestions.

---

## Phase 4: User Story 2 - AI Assistant Validates Configuration Against Best Practices (Priority: P1)

**Goal**: AI assistant analyzes existing project configuration and provides validation feedback with specific recommendations based on best practices and documentation.

**Independent Test**: Admin opens AI assistant, asks "Review my project configuration", assistant analyzes current config against documentation and best practices, provides specific recommendations with explanations and references.

### Implementation for User Story 2

- [x] T031 [US2] Enhance prompt builder to include configuration validation context in apps/web/src/lib/assistant/prompt-builder.ts
- [x] T032 [US2] Create configuration validation service (analyze config against schema and best practices) in apps/web/src/lib/assistant/config-validator.ts
- [x] T033 [US2] Enhance chat route to detect validation requests and include current project config in prompt context
- [x] T034 [US2] Update system prompt to include validation guidelines and best practices reference
- [x] T035 [US2] Enhance assistant response parsing to extract validation findings and recommendations
- [x] T036 [US2] Update AssistantMessage component to display validation findings with structured formatting
- [x] T037 [US2] Add documentation reference links to validation responses (metadata.documentationLinks)
- [x] T038 [US2] Implement configuration schema validation (Zod schema check) in config-validator.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Assistant can provide guidance and validate existing configurations.

---

## Phase 5: User Story 3 - AI Assistant Compares Configuration to Database Settings (Priority: P2) ⏸️ DEFERRED

**Status**: ⏸️ **DEFERRED** - Deferred due to limited value. YAML-first architecture ensures configurations stay in sync automatically. User Story 2 (validation) already covers most use cases. Comparison utility exists but is not needed at this time.

**Goal**: AI assistant can compare YAML configuration file to database state and explain differences, helping admins understand configuration drift.

**Independent Test**: Admin asks "Compare my YAML config to the database", assistant fetches both, compares them, and explains any differences with recommendations for reconciliation.

### Implementation for User Story 3 (DEFERRED)

- [ ] T039 [US3] [DEFERRED] Enhance config-comparison.ts to perform deep comparison of YAML and database configs
- [ ] T040 [US3] [DEFERRED] Create comparison result formatter (differences, explanations, recommendations) in apps/web/src/lib/assistant/config-comparison.ts
- [ ] T041 [US3] [DEFERRED] Enhance chat route to detect comparison requests and trigger comparison logic
- [ ] T042 [US3] [DEFERRED] Update prompt builder to include comparison results in context when user asks for comparison
- [ ] T043 [US3] [DEFERRED] Enhance assistant response to explain differences and suggest reconciliation approach
- [ ] T044 [US3] [DEFERRED] Create ComparisonResults component to display differences in structured format in apps/web/src/components/features/projects/ComparisonResults.tsx
- [ ] T045 [US3] [DEFERRED] Add comparison results to message metadata (metadata.comparisonResults)
- [ ] T046 [US3] [DEFERRED] Implement caching for comparison results (per request lifecycle) to avoid redundant comparisons

**Note**: Comparison utility (`config-comparison.ts`) already exists but is not integrated. Can be implemented later if drift detection becomes a real need.

**Checkpoint**: User Stories 1, 2, AND 4 should work independently. Assistant can guide, validate configurations, and help with infrastructure setup.

---

## Phase 6: User Story 4 - AI Assistant Helps with Infrastructure Configuration (Priority: P2)

**Goal**: System admin can use AI assistant for infrastructure configuration guidance (AI Gateway, OAuth setup, environment variables).

**Independent Test**: System admin opens infrastructure settings, asks AI assistant "How do I configure GitHub OAuth?", receives step-by-step guidance including OAuth app creation steps and environment variable setup.

### Implementation for User Story 4

- [x] T047 [P] [US4] Create API route handler for POST /api/settings/infrastructure/assistant/chat in apps/web/app/api/settings/infrastructure/assistant/chat/route.ts
- [x] T048 [P] [US4] Create API route handler for GET /api/settings/infrastructure/assistant/history in apps/web/app/api/settings/infrastructure/assistant/history/route.ts
- [x] T049 [US4] Enhance session repository to support infrastructure context (contextType: "infrastructure", projectId: null)
- [x] T050 [US4] Enhance access control to require system admin role for infrastructure assistant
- [x] T051 [US4] Enhance prompt builder to include infrastructure configuration context (global settings, OAuth config, AI Gateway config)
- [x] T052 [US4] Create infrastructure assistant UI component (reuse ConfigurationAssistant with infrastructure context) in apps/web/src/components/features/settings/InfrastructureAssistant.tsx
- [x] T053 [US4] Integrate InfrastructureAssistant component into infrastructure settings page in apps/web/app/settings/infrastructure/page.tsx
- [x] T054 [US4] Add "Ask AI Assistant" button/trigger in infrastructure settings UI
- [x] T055 [US4] Update documentation retrieval to include infrastructure docs (deployment, OAuth setup guides)
- [x] T056 [US4] Enhance system prompt with infrastructure configuration knowledge (OAuth setup, AI Gateway, precedence rules)

**Checkpoint**: At this point, User Stories 1-4 should all work independently. Assistant works in both project and infrastructure contexts.

---

## Phase 7: User Story 5 - AI Assistant References Documentation (Priority: P2)

**Goal**: AI assistant references relevant documentation sections when providing recommendations, ensuring accuracy and providing authoritative sources.

**Independent Test**: Admin asks "What are all the workflow status types?", assistant responds with accurate information from documentation and provides links/references to relevant docs.

### Implementation for User Story 5

- [x] T057 [US5] Enhance documentation retrieval to match query keywords to relevant doc sections in apps/web/src/lib/assistant/doc-retrieval.ts
- [x] T058 [US5] Enhance documentation index (from T005) with additional topic mappings and section anchors in apps/web/src/lib/assistant/doc-index.ts
- [x] T059 [US5] Enhance prompt builder to include relevant documentation sections in context
- [x] T060 [US5] Update assistant response parsing to extract and store documentation references in message metadata
- [x] T061 [US5] Create DocumentationLinks component to display doc references with links in apps/web/src/components/features/projects/DocumentationLinks.tsx
- [x] T062 [US5] Enhance AssistantMessage component to render documentation links from metadata
- [x] T063 [US5] Update system prompt to emphasize referencing documentation in responses
- [x] T064 [US5] Implement documentation reference tracking (which docs were used in which responses) for analytics

**Checkpoint**: At this point, all user stories should be independently functional. Assistant provides accurate, well-documented guidance.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T065 [P] Add session list UI (show recent sessions, last 30 days) in apps/web/src/components/features/projects/SessionList.tsx
- [x] T066 [P] Create API route for session archive/delete in apps/web/app/api/projects/[projectId]/assistant/sessions/[sessionId]/route.ts and apps/web/app/api/settings/infrastructure/assistant/sessions/[sessionId]/route.ts
- [x] T066A [P] Add session archive/delete UI actions (buttons, confirmation dialogs) in SessionList.tsx
- [x] T067 [P] Add conversation pagination UI (load more messages) in ConfigurationAssistantClient.tsx
- [x] T068 [P] Enhance error messages for better user experience (rate limit exceeded, AI Gateway unavailable, etc.)
- [x] T069 [P] Add loading states and typing indicators in chat interface
- [x] T070 [P] Implement conflict resolution UI (show both versions side-by-side with diff view, provide options to: keep current version, use suggested version, or manually edit/merge both versions) in ConfigurationSuggestion.tsx
- [x] T071 [P] Add accessibility features (keyboard navigation, screen reader support, focus management) to chat components
- [x] T072 [P] Add logging and observability (log assistant usage, response times, errors) in chat routes
- [x] T072A [P] Implement response time monitoring and validation against SC-008 target (30 seconds for 95% of queries) in apps/web/src/lib/assistant/performance-monitor.ts
- [x] T073 [P] Update documentation with AI assistant feature in docs/user/ai-assistant.md
- [ ] T074 [P] Add unit tests for prompt builder, config comparison, doc retrieval in apps/web/src/lib/assistant/**tests**/
- [ ] T075 [P] Add integration tests for chat flow in apps/web/**tests**/integration/assistant/
- [ ] T076 Run quickstart.md validation to ensure all examples work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US4/US5)
  - Note: US3 is deferred
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP**
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Enhances US1 but independently testable
- **User Story 3 (P2)**: ⏸️ **DEFERRED** - Limited value, YAML-first architecture prevents drift
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Reuses chat infrastructure from US1 but different context
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Enhances all previous stories with documentation references

### Within Each User Story

- Database models/repositories before API routes
- API routes before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- Models/repositories within a story marked [P] can run in parallel
- UI components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all UI components for User Story 1 together:
Task: "Create ConfigurationAssistant server component in apps/web/src/components/features/projects/ConfigurationAssistant.tsx"
Task: "Create ConfigurationAssistantClient client component in apps/web/src/components/features/projects/ConfigurationAssistantClient.tsx"
Task: "Create AssistantMessage component in apps/web/src/components/features/projects/AssistantMessage.tsx"
Task: "Create AssistantInput component in apps/web/src/components/features/projects/AssistantInput.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (database schema, prompt file)
2. Complete Phase 2: Foundational (repositories, utilities, access control) - **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (chat interface, apply suggestions)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (validation)
4. Add User Story 4 → Test independently → Deploy/Demo (infrastructure assistance)
5. Add User Story 5 → Test independently → Deploy/Demo (documentation references)
6. Add Polish phase → Final improvements
7. Each story adds value without breaking previous stories

**Note**: User Story 3 (configuration comparison) is deferred - can be added later if needed.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP)
   - Developer B: User Story 2 (validation)
   - Developer C: User Stories 3-5 (comparison, infrastructure, docs)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Reuse existing AI Gateway infrastructure (selectProviderForProject, callAIGateway)
- Follow existing patterns from AI triage feature for consistency
- Context management is critical - implement strategy to prevent context window overflow (T008 in Phase 2)
- Rate limiting must be enforced at API route level (both per-user limits and AI Gateway limits - T011, T011A)
- Access control must check role-based permissions (admin default, opt-in for members)
- Configuration application must validate against schema and detect conflicts
- All tasks include exact file paths for clarity

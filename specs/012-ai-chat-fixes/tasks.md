# Tasks: AI Chat Documentation Accuracy and Streaming

**Input**: Design documents from `/specs/012-ai-chat-fixes/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/, research.md

**Tests**: Tests are not explicitly requested in the specification, so test tasks are not included. Focus on implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `apps/web/app/` for routes, `apps/web/src/` for components and lib
- **Shared Packages**: `packages/` for shared code
- **AI Gateway**: `packages/ai-gateway/` for provider abstractions
- Paths shown below follow the monorepo structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and utility functions needed across user stories

- [ ] T001 Create documentation validation cache utility in apps/web/src/lib/assistant/doc-validation-cache.ts
- [ ] T002 [P] Add DocValidationResult and ValidatedDocumentation types in apps/web/src/lib/assistant/doc-validation.ts
- [ ] T003 [P] Add StreamingChunk and StreamingMetadata types in apps/web/src/lib/assistant/streaming-types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create documentation validation service with file system checks in apps/web/src/lib/assistant/doc-validation.ts
- [ ] T005 [P] Implement validation cache with 5-minute TTL in apps/web/src/lib/assistant/doc-validation-cache.ts
- [ ] T006 Create streaming response formatter utility for SSE format in apps/web/src/lib/assistant/streaming-formatter.ts
- [ ] T007 Create streaming connection pool manager in apps/web/src/lib/assistant/streaming-pool.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Accurate Documentation Links (Priority: P1) 🎯 MVP

**Goal**: Ensure all documentation links in AI responses point to actual, accessible documentation files in the repository. Users can click any documentation link and successfully navigate to the referenced documentation without encountering broken links or non-existent files.

**Independent Test**: Send queries to the AI assistant that should trigger documentation references, then verify all links in responses point to existing files. All documentation links use GitHub repository URLs or valid file paths that match existing files in the `docs/` directory.

### Implementation for User Story 1

- [ ] T008 [US1] Update retrieveDocumentation to validate file paths before loading content in apps/web/src/lib/assistant/doc-retrieval.ts
- [ ] T009 [US1] Add validateDocumentationReferences function that filters invalid paths in apps/web/src/lib/assistant/doc-validation.ts
- [ ] T010 [US1] Update formatDocumentationForPrompt to only include validated documentation in apps/web/src/lib/assistant/doc-retrieval.ts
- [ ] T011 [US1] Integrate validation into buildPromptWithDocumentation function in apps/web/src/lib/assistant/prompt-builder.ts
- [ ] T012 [US1] Add path traversal prevention in validation (reject paths with `..`) in apps/web/src/lib/assistant/doc-validation.ts
- [ ] T013 [US1] Add file extension validation (must be `.md`) in apps/web/src/lib/assistant/doc-validation.ts
- [ ] T014 [US1] Update system prompt to emphasize using only validated documentation paths in packages/ai-gateway/prompts/configuration-assistant-prompt.md
- [ ] T015 [US1] Add error logging for validation failures (invalid paths filtered out) in apps/web/src/lib/assistant/doc-validation.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. All documentation links in AI responses will point to existing files, with invalid paths filtered out during prompt construction.

---

## Phase 4: User Story 2 - Server Event Streaming for AI Responses (Priority: P2)

**Goal**: Stream AI responses incrementally as they are generated, rather than waiting for the complete response. Enable progressive response generation and support for tool calling in the future.

**Independent Test**: Send a query to the AI assistant and verify that response content arrives incrementally via server-sent events. First chunk arrives within 2 seconds, and content updates progressively as generation continues.

### Implementation for User Story 2

- [ ] T016 [US2] Add streaming support to OpenAI provider client in apps/web/src/lib/assistant/ai-chat.ts
- [ ] T017 [P] [US2] Add streaming support to Anthropic provider client in apps/web/src/lib/assistant/ai-chat.ts
- [ ] T018 [P] [US2] Add streaming support to Google Gemini provider client in apps/web/src/lib/assistant/ai-chat.ts
- [ ] T019 [P] [US2] Add streaming support to Ollama provider client in apps/web/src/lib/assistant/ai-chat.ts
- [ ] T020 [US2] Create provider-agnostic streaming adapter that normalizes all provider formats to SSE in apps/web/src/lib/assistant/streaming-adapter.ts
- [ ] T021 [US2] Update callAIChat to support streaming parameter in apps/web/src/lib/assistant/ai-chat.ts
- [ ] T022 [US2] Create streaming response handler for project chat endpoint in apps/web/app/api/projects/[projectId]/assistant/chat/route.ts
- [ ] T023 [US2] Create streaming response handler for infrastructure chat endpoint in apps/web/app/api/settings/infrastructure/assistant/chat/route.ts
- [ ] T024 [US2] Add Accept header detection for streaming (text/event-stream) in chat route handlers
- [ ] T025 [US2] Implement SSE event formatting (chunk/done/error events) in apps/web/src/lib/assistant/streaming-formatter.ts
- [ ] T026 [US2] Add connection limit checking (max 50 concurrent) in apps/web/src/lib/assistant/streaming-pool.ts
- [ ] T027 [US2] Add per-project connection limit (max 10 per project) in apps/web/src/lib/assistant/streaming-pool.ts
- [ ] T028 [US2] Implement connection timeout handling (5 minutes) in apps/web/src/lib/assistant/streaming-pool.ts
- [ ] T029 [US2] Add error handling for streaming failures (send error event, cleanup) in apps/web/src/lib/assistant/streaming-adapter.ts
- [ ] T030 [US2] Add client disconnect detection and provider request cancellation in apps/web/src/lib/assistant/streaming-adapter.ts
- [ ] T031 [US2] Update chat route handlers to maintain backward compatibility (non-streaming still works) in apps/web/app/api/projects/[projectId]/assistant/chat/route.ts
- [ ] T032 [US2] Store completed streaming response in database after stream ends in apps/web/app/api/projects/[projectId]/assistant/chat/route.ts

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently. AI responses stream incrementally to clients via SSE, with proper error handling and connection management.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, error handling improvements, and cross-cutting concerns

- [ ] T033 Add comprehensive error handling for file system access errors in apps/web/src/lib/assistant/doc-validation.ts
- [ ] T034 Add metrics/logging for validation performance (track < 100ms requirement) in apps/web/src/lib/assistant/doc-validation.ts
- [ ] T035 Add metrics/logging for streaming performance (track first chunk < 2s requirement) in apps/web/src/lib/assistant/streaming-adapter.ts
- [ ] T036 Add monitoring for concurrent streaming connection count in apps/web/src/lib/assistant/streaming-pool.ts
- [ ] T037 Add graceful degradation when GitHub URL not configured (fallback to file paths) in apps/web/src/lib/assistant/doc-url-mapper.ts
- [ ] T038 Add validation for section anchors in documentation references in apps/web/src/lib/assistant/doc-validation.ts
- [ ] T039 Add cache invalidation on file system changes (dev mode only) in apps/web/src/lib/assistant/doc-validation-cache.ts
- [ ] T040 Update client-side chat components to consume SSE streams (if needed) in apps/web/src/components/features/projects/ConfigurationAssistantClient.tsx

---

## Dependencies

### Story Completion Order

1. **Phase 1 (Setup)** → Must complete before all other phases
2. **Phase 2 (Foundational)** → Must complete before user stories
3. **Phase 3 (User Story 1 - P1)** → Can start after Phase 2, independent of US2
4. **Phase 4 (User Story 2 - P2)** → Can start after Phase 2, independent of US1 (but benefits from US1 validation)
5. **Phase 5 (Polish)** → Must complete after all user stories

### Parallel Execution Opportunities

**Within User Story 1**:
- T009, T012, T013 can run in parallel (different validation checks)
- T014, T015 can run in parallel (prompt update and error logging)

**Within User Story 2**:
- T017, T018, T019 can run in parallel (different provider implementations)
- T022, T023 can run in parallel (different route handlers)
- T026, T027, T028 can run in parallel (different connection management features)

**Cross-Phase**:
- Phase 1 tasks (T001, T002, T003) can run in parallel
- Phase 2 tasks (T005, T006, T007) can run in parallel after T004

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**MVP includes only User Story 1 (P1)**: Accurate Documentation Links
- Phase 1: Setup
- Phase 2: Foundational (validation service)
- Phase 3: User Story 1 (documentation validation)
- **Total MVP Tasks**: T001-T015 (15 tasks)

**MVP delivers**: 100% accurate documentation links in AI responses, with invalid paths filtered out during prompt construction.

### Incremental Delivery

1. **Increment 1 (MVP)**: Documentation validation (User Story 1)
   - Delivers accurate documentation links
   - Solves the primary user problem (broken/hallucinated links)

2. **Increment 2**: Streaming support (User Story 2)
   - Adds progressive response generation
   - Improves perceived performance
   - Enables future tool calling capabilities

3. **Increment 3**: Polish and optimization
   - Performance monitoring
   - Error handling improvements
   - Cache optimizations

### Success Criteria Validation

- **SC-001**: 100% link accuracy → Validated by User Story 1 implementation
- **SC-002**: 95% correct format → Validated by URL mapper and prompt instructions
- **SC-003**: First chunk < 2s → Validated by streaming implementation (User Story 2)
- **SC-004**: 99% streaming success → Validated by error handling and connection management
- **SC-005**: Broken link reports decrease by 90% → Measured via user reports/support tickets post-deployment
- **SC-006**: Validation < 100ms → Validated by caching implementation
- **SC-007**: 50 concurrent streams → Validated by connection pool limits

---

## Task Summary

- **Total Tasks**: 40
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (User Story 1 - P1)**: 8 tasks
- **Phase 4 (User Story 2 - P2)**: 17 tasks
- **Phase 5 (Polish)**: 8 tasks

### Task Count per User Story

- **User Story 1 (P1)**: 8 implementation tasks
- **User Story 2 (P2)**: 17 implementation tasks

### Parallel Opportunities

- **Phase 1**: 2 parallel tasks (T002, T003)
- **Phase 2**: 2 parallel tasks (T005, T006, T007 after T004)
- **User Story 1**: 4 parallel opportunities
- **User Story 2**: 6 parallel opportunities

### Independent Test Criteria

- **User Story 1**: Send queries that trigger documentation references, verify all links point to existing files
- **User Story 2**: Send query and verify incremental content delivery via SSE, first chunk within 2 seconds

### Suggested MVP Scope

**MVP = User Story 1 only** (Phases 1-3)
- Solves primary problem: inaccurate documentation links
- Delivers measurable value: 100% link accuracy
- Can be deployed independently
- User Story 2 can follow as enhancement

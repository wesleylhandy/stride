# Implementation Tasks: AI Autotask and Automated Response Improvements

**Feature**: `011-ai-autotask-improvements`  
**Created**: 2026-01-27  
**Feature Spec**: `specs/011-ai-autotask-improvements/spec.md`  
**Implementation Plan**: `specs/011-ai-autotask-improvements/impl-plan.md`

## Overview

This feature enhances existing AI triage functionality with improved accuracy, automated responses, learning patterns, and better context extraction. Tasks are organized by user story to enable independent implementation and testing.

**Total Tasks**: 92  
**MVP Scope**: Phase 1-3 (Setup, Foundational, US1) - Enhanced categorization and prioritization

## Dependencies & Story Completion Order

### Story Dependencies
- **US1** (P1): No dependencies - can start after foundational tasks
- **US2** (P1): Depends on US1 for enhanced analysis output
- **US4** (P2): Depends on US1 for context extraction foundation
- **US3** (P2): Can run parallel with US4, depends on US1 for analysis data
- **US5** (P3): Depends on US1 and US4 for edge case handling

### Parallel Execution Opportunities
- **Phase 3 (US1)**: Prompt enhancement, response parser, confidence utilities can run in parallel
- **Phase 5 (US3)**: Repository, service, pattern matching can run in parallel  
- **Phase 6 (US4)**: Context extraction, action suggestions can run in parallel

## Implementation Strategy

**MVP First**: Implement Phase 1-3 to deliver enhanced categorization/prioritization (US1), then incrementally add automated responses (US2), learning (US3), context (US4), and edge cases (US5).

**Incremental Delivery**: Each user story is independently testable and deliverable value.

---

## Phase 1: Setup

### Database & Schema

- [ ] T001 Create Prisma migration for LearningPattern table in `packages/database/prisma/migrations/`
- [ ] T002 Create Prisma migration to extend Comment table (isAutomatedResponse, includeInDescription, aiAnalysisId) in `packages/database/prisma/migrations/`
- [ ] T003 Create Prisma migration for IssueAnalysisResult table in `packages/database/prisma/migrations/`
- [ ] T004 Add LearningPattern enum (PRIORITY_ADJUSTMENT, ASSIGNMENT_PREFERENCE, CATEGORIZATION_CORRECTION, ROUTING_PATTERN) to `packages/database/prisma/schema.prisma`
- [ ] T005 Add AnalysisType enum (INITIAL, RE_ANALYSIS) to `packages/database/prisma/schema.prisma`
- [ ] T006 Update Prisma schema with LearningPattern model definition in `packages/database/prisma/schema.prisma`
- [ ] T007 Update Prisma schema with IssueAnalysisResult model definition in `packages/database/prisma/schema.prisma`
- [ ] T008 Generate Prisma client after schema updates: `cd packages/database && pnpm db:generate`

### Type Definitions

- [ ] T009 Create enhanced AI analysis types in `packages/ai-gateway/src/types/index.ts` (IssueAnalysisResult, ExtractedContext, SuggestedAction, CategoryConfidenceBreakdown)
- [ ] T010 Create learning pattern types in `packages/types/src/learning-pattern.ts` (LearningPattern, PatternType, TriggerConditions, SuggestedBehavior)
- [ ] T011 Create feedback types in `packages/types/src/feedback.ts` (FeedbackRequest, FeedbackType, FeedbackResponse)
- [ ] T012 Update AIGatewayResponse type to include enhanced fields in `packages/ai-gateway/src/types/index.ts`

---

## Phase 2: Foundational

### Enhanced Prompt Engineering

- [ ] T013 [P] Enhance autotask prompt with improved context extraction requirements in `packages/ai-gateway/prompts/autotask-prompt.md`
- [ ] T014 [P] Add confidence scoring guidelines to autotask prompt in `packages/ai-gateway/prompts/autotask-prompt.md`
- [ ] T015 [P] Add reasoning explanation requirements to autotask prompt in `packages/ai-gateway/prompts/autotask-prompt.md`
- [ ] T016 [P] Update autotask prompt JSON output schema to include extractedContext, suggestedActions, categoryConfidenceBreakdown in `packages/ai-gateway/prompts/autotask-prompt.md`

### Context Extraction Utilities

- [ ] T017 [P] Create error trace extraction utility in `packages/ai-gateway/src/lib/extract-context.ts`
- [ ] T018 [P] Create stack trace extraction utility in `packages/ai-gateway/src/lib/extract-context.ts`
- [ ] T019 [P] Create affected component detection utility in `packages/ai-gateway/src/lib/extract-context.ts`
- [ ] T020 [P] Create related issue detection utility (parse issue keys from description) in `packages/ai-gateway/src/lib/extract-context.ts`

### Sensitive Information Detection

- [ ] T021 [P] Create sensitive information detection utility (regex patterns for API keys, tokens) in `packages/ai-gateway/src/lib/detect-sensitive.ts`
- [ ] T022 [P] Implement credential pattern matching in `packages/ai-gateway/src/lib/detect-sensitive.ts`

### Confidence Threshold Utilities

- [ ] T023 [P] Create confidence threshold evaluation utility (<0.6 clarification, 0.6-0.75 defaults, >0.75 proceed) in `packages/ai-gateway/src/lib/confidence-thresholds.ts`

---

## Phase 3: User Story 1 - AI Accurately Categorizes and Prioritizes Issues (P1)

**Goal**: Enhance AI accuracy for issue categorization and priority assignment through improved prompt engineering and context analysis.

**Independent Test**: Create test issues from different sources (Sentry webhook, GitHub sync, manual entry). Verify AI correctly identifies bug vs feature vs task, assigns priority matching severity, suggests appropriate technical expertise. 90% accuracy target.

### AI Gateway Enhancements

- [ ] T024 [US1] [P] Enhance response parser to handle new fields (extractedContext, suggestedActions, categoryConfidenceBreakdown, clarificationRequested) in `packages/ai-gateway/src/lib/response-parser.ts`
- [ ] T025 [US1] [P] Update response parser to validate confidence scores (0.1-1.0 range) in `packages/ai-gateway/src/lib/response-parser.ts`
- [ ] T026 [US1] Update analyze-issue function to use enhanced prompt in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T027 [US1] Add context extraction integration to analyze-issue function in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T028 [US1] Add confidence threshold evaluation to analyze-issue function in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T029 [US1] Add sensitive information detection to analyze-issue function in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T088 [US1] [P] Implement duplicate issue detection logic (text similarity + context matching) in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T089 [US1] [P] Implement related issue detection logic (extract and match related issue keys) in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T090 [US1] Implement multiple unrelated issues detection and splitting suggestion logic in `packages/ai-gateway/src/lib/analyze-issue.ts`

### API Enhancements

- [ ] T030 [US1] Update AI triage API route to return enhanced analysis response in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts`
- [ ] T031 [US1] Add confidence score handling to AI triage API route in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts`
- [ ] T032 [US1] Add clarification request handling to AI triage API route in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts`

### Client Library Updates

- [ ] T033 [US1] Update AIGatewayRequest type to include enhanced options in `apps/web/src/lib/ai/triage.ts`
- [ ] T034 [US1] Update AIGatewayResponse type to include enhanced fields in `apps/web/src/lib/ai/triage.ts`
- [ ] T035 [US1] Update callAIGateway function to handle enhanced response in `apps/web/src/lib/ai/triage.ts`

---

## Phase 4: User Story 2 - AI Generates Context-Aware Automated Responses (P1)

**Goal**: Generate automated responses as comments for issues created from monitoring webhooks and Git syncs, with optional description field inclusion.

**Independent Test**: Create issues from different sources (Sentry webhook, GitHub sync). Verify AI generates contextual automated response comments explaining source, extracted error details, initial assessment.

### Automated Response Generation

- [ ] T036 [US2] Create automated response generator service in `apps/web/src/lib/ai/automated-response.ts`
- [ ] T037 [US2] Implement response content generation based on issue source (webhook, Git sync, manual) in `apps/web/src/lib/ai/automated-response.ts`
- [ ] T038 [US2] Implement response content for monitoring webhook issues in `apps/web/src/lib/ai/automated-response.ts`
- [ ] T039 [US2] Implement response content for Git sync issues in `apps/web/src/lib/ai/automated-response.ts`
- [ ] T040 [US2] Create automated response API endpoint (internal) in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/automated-response/route.ts`

### Comment Integration

- [ ] T041 [US2] Update comment repository to support automated response fields in `packages/database/src/repositories/comment-repository.ts`
- [ ] T042 [US2] Create service method to create automated response comment in `apps/web/src/lib/services/comment-service.ts`
- [ ] T043 [US2] Integrate automated response generation into issue creation flow (webhook/Git sync) in `apps/web/app/api/projects/[projectId]/issues/route.ts`
- [ ] T044 [US2] Integrate automated response generation into manual AI analysis trigger in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts`
- [ ] T045 [US2] Implement optional description field inclusion logic in `apps/web/src/lib/ai/automated-response.ts`
- [ ] T091 [US2] Implement sensitive information flagging and issue visibility control (hide from public view, admin-only) in `apps/web/app/api/projects/[projectId]/issues/route.ts`

### Issue Analysis Result Storage

- [ ] T046 [US2] Create IssueAnalysisResult repository in `packages/database/src/repositories/issue-analysis-repository.ts`
- [ ] T047 [US2] Store analysis results after AI analysis completes in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts`
- [ ] T048 [US2] Link automated response comments to analysis results via aiAnalysisId in `apps/web/src/lib/services/comment-service.ts`

---

## Phase 5: User Story 3 - AI Learns from Team Feedback and Patterns (P2)

**Goal**: Learn from team feedback via "Learn from this" button, store patterns per project, apply learned patterns to future issue analysis.

**Independent Test**: Provide feedback on 20-30 issues. Verify patterns are created, AI starts applying learned patterns automatically, improvement measurable within 1-2 sprints.

### Learning Pattern Repository

- [ ] T049 [US3] [P] Create LearningPattern repository in `packages/database/src/repositories/learning-pattern-repository.ts`
- [ ] T050 [US3] [P] Implement pattern matching query (by project, trigger conditions) in `packages/database/src/repositories/learning-pattern-repository.ts`
- [ ] T051 [US3] [P] Implement pattern creation/update logic in `packages/database/src/repositories/learning-pattern-repository.ts`

### Pattern Matching Service

- [ ] T052 [US3] Create learning pattern matching service in `apps/web/src/lib/ai/pattern-matcher.ts`
- [ ] T053 [US3] Implement trigger condition matching logic (issue attributes vs pattern triggers) in `apps/web/src/lib/ai/pattern-matcher.ts`
- [ ] T054 [US3] Implement pattern application logic (apply suggested behavior to analysis) in `apps/web/src/lib/ai/pattern-matcher.ts`

### Feedback Service

- [ ] T055 [US3] Create feedback service in `apps/web/src/lib/ai/feedback-service.ts`
- [ ] T056 [US3] Implement feedback collection logic (extract pattern from AI suggestion vs user correction) in `apps/web/src/lib/ai/feedback-service.ts`
- [ ] T057 [US3] Implement pattern creation/update from feedback in `apps/web/src/lib/ai/feedback-service.ts`
- [ ] T058 [US3] Implement confidence level calculation based on feedback count in `apps/web/src/lib/ai/feedback-service.ts`

### Feedback API

- [ ] T059 [US3] Create feedback API endpoint in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/feedback/route.ts`
- [ ] T060 [US3] Implement feedback request validation (Zod schema) in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/feedback/route.ts`

### Integration with Analysis

- [ ] T061 [US3] Integrate pattern matching into AI analysis flow (check patterns before sending to AI Gateway) in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T062 [US3] Apply learned patterns to analysis suggestions in `apps/web/src/lib/ai/pattern-matcher.ts`

### Frontend Feedback UI

- [ ] T063 [US3] Add "Learn from this" button component to issue detail page in `packages/ui/src/organisms/IssueDetail.tsx`
- [ ] T064 [US3] Implement feedback submission handler in issue detail component in `apps/web/app/projects/[projectId]/issues/[issueKey]/page.tsx`

---

## Phase 6: User Story 4 - AI Provides Rich Context and Suggested Actions (P2)

**Goal**: Extract and present relevant context (error traces, related issues, affected components) and suggest specific next actions.

**Independent Test**: Create issues with various complexity levels. Verify AI extracts key information, identifies relationships, suggests 1-3 specific next actions. 90% accuracy target.

### Enhanced Context Extraction

- [ ] T065 [US4] [P] Integrate context extraction utilities into analysis flow in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T066 [US4] [P] Implement extracted context structuring (errorTraces, stackTraces, affectedComponents, relatedIssueKeys) in `packages/ai-gateway/src/lib/extract-context.ts`
- [ ] T067 [US4] [P] Add extracted context to analysis result response in `packages/ai-gateway/src/lib/analyze-issue.ts`

### Action Suggestion

- [ ] T068 [US4] Create action suggestion generator based on issue type and context in `packages/ai-gateway/src/lib/suggest-actions.ts`
- [ ] T069 [US4] Implement action suggestion logic (1-3 actions based on issue characteristics) in `packages/ai-gateway/src/lib/suggest-actions.ts`
- [ ] T070 [US4] Add suggested actions to analysis result response in `packages/ai-gateway/src/lib/analyze-issue.ts`

---

## Phase 7: User Story 5 - AI Handles Edge Cases and Ambiguous Issues Gracefully (P3)

**Goal**: Handle ambiguous/incomplete issues gracefully with clarification requests or conservative defaults based on confidence thresholds.

**Independent Test**: Create ambiguous/incomplete issues. Verify AI requests clarification (<0.6), applies defaults (0.6-0.75), or proceeds (>0.75) appropriately.

### Edge Case Handling

- [ ] T071 [US5] Implement empty description detection and handling in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T072 [US5] Implement contradictory signal detection (priority indicators conflict) in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T073 [US5] Implement multiple category suggestion logic (when confidence is ambiguous) in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T074 [US5] Implement non-English language detection and handling in `packages/ai-gateway/src/lib/analyze-issue.ts`
- [ ] T075 [US5] Add clarification request message generation when confidence < 0.6 in `packages/ai-gateway/src/lib/confidence-thresholds.ts`

---

## Phase 8: Polish & Cross-Cutting Concerns

### Error Handling & Resilience

- [ ] T076 [P] Enhance AI Gateway error handling for unavailable provider (queue requests, retry logic) in `apps/web/src/lib/ai/triage.ts`
- [ ] T077 [P] Implement rate limiting for AI Gateway API calls in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts`
- [ ] T078 [P] Add queue management for high-volume issue creation periods in `apps/web/src/lib/ai/queue-manager.ts`

### Performance Optimization

- [ ] T079 [P] Add caching for learning patterns per project to reduce database queries in `apps/web/src/lib/ai/pattern-matcher.ts`
- [ ] T080 [P] Optimize pattern matching queries with proper indexes (verify GIN index on triggerConditions) in `packages/database/prisma/schema.prisma`

### Testing

- [ ] T081 [P] Create unit tests for context extraction utilities in `packages/ai-gateway/src/lib/__tests__/extract-context.test.ts`
- [ ] T082 [P] Create unit tests for confidence threshold evaluation in `packages/ai-gateway/src/lib/__tests__/confidence-thresholds.test.ts`
- [ ] T083 [P] Create unit tests for learning pattern matching logic in `apps/web/src/lib/ai/__tests__/pattern-matcher.test.ts`
- [ ] T084 [P] Create integration tests for enhanced AI triage API in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/__tests__/route.test.ts`
- [ ] T085 [P] Create integration tests for feedback API in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/feedback/__tests__/route.test.ts`
- [ ] T092 [P] Create integration test for duplicate detection accuracy (verify 80% accuracy target per SC-010) in `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/__tests__/duplicate-detection.test.ts`

### Documentation

- [ ] T086 [P] Update AI triage documentation with enhanced features in `docs/user/ai-triage.md`
- [ ] T087 [P] Add learning patterns documentation in `docs/user/ai-learning.md`

---

## Task Summary

### By User Story

- **Setup (Phase 1)**: 12 tasks
- **Foundational (Phase 2)**: 11 tasks  
- **US1 - Categorization/Prioritization (Phase 3)**: 15 tasks (added duplicate detection T088-T089, multiple issues handling T090)
- **US2 - Automated Responses (Phase 4)**: 14 tasks (added sensitive info visibility control T091)
- **US3 - Learning Patterns (Phase 5)**: 16 tasks
- **US4 - Rich Context/Actions (Phase 6)**: 6 tasks
- **US5 - Edge Cases (Phase 7)**: 5 tasks
- **Polish (Phase 8)**: 13 tasks (added duplicate detection test T092)

### Parallel Opportunities

- **Phase 2**: T013-T022 can run in parallel (different files, no dependencies)
- **Phase 3**: T024-T025 can run in parallel, T027-T029 can run in parallel after T026, T088-T089 can run in parallel (duplicate/related issue detection)
- **Phase 5**: T049-T051 can run in parallel (repository), T052-T054 can run in parallel (service)
- **Phase 6**: T065-T067 can run in parallel, T068-T069 can run in parallel
- **Phase 8**: T076-T087, T092 can mostly run in parallel (error handling, performance, testing, documentation)

### Independent Test Criteria

- **US1**: Create issues from different sources, verify 90% categorization accuracy, verify priority matching severity
- **US2**: Create webhook/Git sync issues, verify automated response comments generated with correct context
- **US3**: Provide 20-30 feedback instances, verify patterns created and applied automatically
- **US4**: Create issues with various complexity, verify context extraction (90% accuracy), verify 1-3 action suggestions
- **US5**: Create ambiguous issues, verify clarification requests or defaults based on confidence thresholds

### MVP Scope Recommendation

**Phase 1-3 (US1)**: Enhanced categorization and prioritization delivers core value and is independently testable. Automated responses (US2) and learning (US3) can be added incrementally.

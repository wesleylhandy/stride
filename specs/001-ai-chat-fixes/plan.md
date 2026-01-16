# Implementation Plan: AI Chat Documentation Accuracy and Streaming

**Feature Branch**: `001-ai-chat-fixes`  
**Created**: 2025-01-27  
**Status**: Planning Complete (Phase 0-1)  
**Feature Spec**: `specs/012-ai-chat-fixes/spec.md`

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM (existing)
- **State Management**: TanStack Query for server state, React state for local UI
- **Styling**: Tailwind CSS with custom design tokens (existing)
- **AI Providers**: OpenAI, Anthropic, Google Gemini, Ollama (existing)

### Dependencies
- **Existing AI Chat**: `apps/web/src/lib/assistant/ai-chat.ts` - Non-streaming chat completion
- **Existing Prompt Builder**: `apps/web/src/lib/assistant/prompt-builder.ts` - Builds prompts with documentation
- **Existing Doc Retrieval**: `apps/web/src/lib/assistant/doc-retrieval.ts` - Loads documentation files
- **Existing Doc URL Mapper**: `apps/web/src/lib/assistant/doc-url-mapper.ts` - Maps file paths to URLs
- **Existing Doc Index**: `apps/web/src/lib/assistant/doc-index.ts` - Documentation index structure
- **Existing API Routes**: 
  - `apps/web/app/api/projects/[projectId]/assistant/chat/route.ts`
  - `apps/web/app/api/settings/infrastructure/assistant/chat/route.ts`
- **Existing AI Gateway**: `packages/ai-gateway/` - Provider abstraction layer
- **Existing Types**: `ChatRequest`, `ChatResponse` from assistant types

### Integrations
- **OpenAI API**: Chat completions endpoint (supports streaming via `stream: true`)
- **Anthropic API**: Messages endpoint (supports streaming via `stream: true`)
- **Google Gemini API**: Generate content endpoint (supports streaming)
- **Ollama API**: Chat endpoint (supports streaming via `stream: true`)
- **File System**: Read documentation files from `docs/` directory for validation

### Architecture Decisions
- **Pre-validation Approach**: Validate documentation paths before including in AI prompt context (per clarification)
- **Streaming Protocol**: Server-Sent Events (SSE) for one-way streaming from server to client
- **Backward Compatibility**: Support both streaming and non-streaming requests during transition
- **Validation Timing**: Validate documentation files during prompt construction (before AI call)
- **Error Handling**: Graceful degradation - if validation fails, filter out invalid paths and continue
- **Streaming Implementation**: Use Next.js Response with ReadableStream for provider streaming, convert to SSE format for client

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Provider streaming API support - All providers support streaming, normalize to SSE format (see research.md)
- ✅ **RESOLVED**: SSE event format - Standard SSE format with chunk/done/error events (see research.md)
- ✅ **RESOLVED**: Tool calling with streaming - Deferred to Phase 2, focus on content streaming first (see research.md)
- ✅ **RESOLVED**: Validation caching - In-memory cache with 5-minute TTL to meet 100ms requirement (see research.md)
- ✅ **RESOLVED**: Concurrent streaming handling - Limit to 50 connections with proper resource management (see research.md)

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied - Service layer for validation, repository pattern for documentation access
- [x] DRY, YAGNI, KISS followed - Reuse existing doc-retrieval patterns, validate at prompt construction time
- [x] Type safety enforced - TypeScript strict mode, Zod validation for API inputs
- [x] Security best practices - Validate file paths, prevent path traversal, sanitize inputs
- [x] Accessibility requirements met - Streaming UI updates should maintain accessibility (live regions)

### Code Quality Gates
- [x] No `any` types - Use proper TypeScript types for streaming responses
- [x] Proper error handling - Try/catch with meaningful error messages, graceful degradation
- [x] Input validation - Zod schemas for all API inputs, validate documentation paths
- [x] Test coverage planned - Unit tests for validation logic, integration tests for streaming endpoints

## Phase 0: Outline & Research

### Research Tasks
- [ ] Resolve streaming API support for all providers (OpenAI, Anthropic, Gemini, Ollama)
- [ ] Research SSE event format for AI response streaming
- [ ] Research tool calling with streaming responses
- [ ] Design validation caching strategy for 100ms requirement
- [ ] Research concurrent streaming request handling patterns

### Research Output
- [x] `research.md` generated with all clarifications resolved

## Phase 1: Design & Contracts

### Data Model
- [x] `data-model.md` generated
- [x] Streaming response types defined
- [x] Validation result types defined

### API Contracts
- [x] Streaming endpoint contracts defined
- [x] SSE event schema documented
- [x] Request/response schemas for validation endpoints
- [x] Contracts saved to `/contracts/`

### Quickstart
- [x] `quickstart.md` generated
- [x] Validation setup instructions documented
- [x] Streaming endpoint setup instructions documented

### Agent Context
- [x] Check if new technologies introduced (SSE, streaming patterns)
- [x] No new technologies requiring agent context update (SSE is standard web API)

## Phase 2: Implementation Planning

### Component Structure
- [ ] Components identified
- [ ] Component responsibilities defined
- [ ] Component dependencies mapped

### API Routes
- [ ] Streaming route handlers designed
- [ ] Validation middleware designed
- [ ] Error handling patterns defined

### Utilities & Services
- [ ] Documentation validation service designed
- [ ] Streaming response formatter designed
- [ ] Provider streaming adapter designed

### Testing Strategy
- [ ] Unit test plan for validation logic
- [ ] Integration test plan for streaming endpoints
- [ ] E2E test plan for streaming chat flow

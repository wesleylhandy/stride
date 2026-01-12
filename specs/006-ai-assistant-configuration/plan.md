# Implementation Plan: AI Assistant for Project Configuration

**Feature Branch**: `006-ai-assistant-configuration`  
**Created**: 2026-01-23  
**Status**: Planning  
**Feature Spec**: `specs/006-ai-assistant-configuration/spec.md`

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: HTTP-only cookies with JWT tokens (existing auth system)
- **State Management**: Jotai for global state, TanStack Query for server state
- **Styling**: Tailwind CSS with custom design tokens
- **Monorepo**: Turborepo with pnpm
- **AI Integration**: Existing AI Gateway service (packages/ai-gateway)

### Dependencies
- **Existing Infrastructure**:
  - AI Gateway service (packages/ai-gateway) - already handles LLM provider abstraction
  - Global AI provider configuration (from Phase 9 of 001-stride-application)
  - Project configuration system (YAML + database storage)
  - Infrastructure configuration system (global settings)
  - Documentation markdown files in `docs/` directory
- **New Requirements**:
  - Chat interface component (React-based, likely using existing UI components)
  - Conversation history storage (database)
  - System prompt for configuration assistant (markdown file, similar to AI triage prompt)
  - Documentation indexing/retrieval system (for referencing docs in prompts)
  - Configuration comparison logic (YAML vs database)
  - Configuration suggestion/application system

### Integrations
- **AI Gateway**: Reuse existing AI Gateway service and provider selection logic
- **Documentation System**: Access to markdown files in `docs/` directory (configuration reference, examples, guides)
- **Configuration System**: Access to project YAML configs, database configs, infrastructure configs
- **Database**: Store conversation history, assistant sessions, configuration suggestions

### Architecture Decisions

**RESOLVED**: All architectural decisions resolved. See `research.md` for detailed decisions and rationale.

1. **Chat Interface Architecture**: ✅ **RESOLVED** - Hybrid approach (Server + Client Components, API routes)
2. **Conversation History Storage**: ✅ **RESOLVED** - Full database storage with pagination
3. **Documentation Access Strategy**: ✅ **RESOLVED** - Simple file-based retrieval with section indexing
4. **System Prompt Structure**: ✅ **RESOLVED** - Single comprehensive prompt with dynamic context injection
5. **Configuration Comparison**: ✅ **RESOLVED** - On-demand comparison with brief caching
6. **Configuration Application**: ✅ **RESOLVED** - YAML-first with schema validation
7. **Context Scope**: ✅ **RESOLVED** - Unified assistant, context-aware based on invocation location
8. **Error Handling for Missing AI Provider**: ✅ **RESOLVED** - Show setup instructions in chat interface

All clarifications resolved. See `research.md` for detailed decisions and rationale.

## Constitution Check

### Principles Compliance
- [ ] SOLID principles applied
  - Single Responsibility: Separate chat UI, prompt management, config comparison, doc retrieval
  - Open/Closed: Extendable prompt system, pluggable documentation sources
  - Liskov Substitution: Interface-based design for AI providers (already exists)
  - Interface Segregation: Specific interfaces for chat, config access, doc retrieval
  - Dependency Inversion: Depend on abstractions for AI Gateway, config access, doc access
- [ ] DRY, YAGNI, KISS followed
  - Reuse existing AI Gateway infrastructure
  - Don't over-engineer documentation retrieval (start simple)
  - Keep prompt structure simple initially
- [ ] Type safety enforced
  - TypeScript strict mode
  - Zod schemas for conversation messages, config suggestions
  - Prisma for type-safe database access
- [ ] Security best practices
  - Validate all user inputs (chat messages)
  - Auth at every boundary (project access, infrastructure access)
  - Rate limiting on chat endpoints
  - Sanitize AI responses before displaying
  - Never expose sensitive config values in responses
- [ ] Accessibility requirements met
  - WCAG 2.1 AA compliance for chat interface
  - Keyboard navigation for chat
  - Screen reader support for messages
  - Focus management in chat UI

### Code Quality Gates
- [ ] No `any` types
- [ ] Proper error handling (AI Gateway failures, config access errors)
- [ ] Input validation (chat messages, config suggestions)
- [ ] Test coverage planned (unit tests for prompt building, integration tests for chat flow)

## Phase 0: Outline & Research

### Research Tasks
- [x] Resolve chat interface architecture decision
- [x] Resolve conversation history storage strategy
- [x] Research documentation retrieval patterns (semantic search, embedding, simple text search)
- [x] Research best practices for AI assistant system prompts (configuration domain)
- [x] Resolve configuration comparison implementation details
- [x] Resolve configuration application workflow
- [x] Research streaming responses for chat (Server-Sent Events vs WebSockets vs polling)

### Research Output
- [x] `research.md` generated with all clarifications resolved

## Phase 1: Design & Contracts

### Data Model
- [x] `data-model.md` generated
- [x] Entities defined:
  - ConfigurationAssistantSession (session management)
  - AssistantMessage (conversation history)
  - ConfigurationSuggestion (stored in message metadata)
- [x] Relationships documented
- [x] Validation rules documented

### API Contracts
- [x] REST endpoints defined:
  - `POST /api/projects/[projectId]/assistant/chat` - Send message, get response
  - `GET /api/projects/[projectId]/assistant/history` - Get conversation history
  - `POST /api/projects/[projectId]/assistant/apply-suggestion` - Apply config suggestion
  - `POST /api/settings/infrastructure/assistant/chat` - Infrastructure context chat
  - `GET /api/settings/infrastructure/assistant/history` - Infrastructure history
- [x] Request/response schemas documented
- [x] Contracts saved to `/contracts/api.yaml`

### Quickstart
- [x] `quickstart.md` generated
- [x] Setup instructions documented
- [x] Example conversations documented

### Agent Context
- [x] Agent context review: No new technologies introduced (uses existing AI Gateway, Next.js patterns)

## Phase 2: Implementation Planning

### Component Structure
- [ ] Components identified:
  - `ConfigurationAssistant` - Main chat interface component
  - `AssistantMessage` - Individual message display
  - `ConfigurationSuggestion` - Suggestion display with apply button
  - `AssistantInput` - Message input component
- [ ] Component hierarchy defined
- [ ] Props/interfaces designed

### State Management
- [ ] State requirements identified:
  - Conversation messages (server state via TanStack Query)
  - Input state (local useState)
  - Loading states (local useState)
  - Suggestion application state (optimistic updates)
- [ ] State management strategy chosen
- [ ] State flow documented

### Testing Strategy
- [ ] Unit test plan:
  - Prompt building functions
  - Config comparison logic
  - Documentation retrieval
- [ ] Integration test plan:
  - Chat flow end-to-end
  - Config suggestion application
- [ ] E2E test scenarios:
  - Admin configures project with assistant
  - Assistant validates configuration
  - Assistant compares YAML to database

## Phase 3: Implementation

### Tasks
- [ ] Implementation tasks created
- [ ] Dependencies identified
- [ ] Estimated effort

## Notes

- This feature builds on existing AI infrastructure (AI Gateway, provider configuration)
- Should reuse existing AI triage prompt patterns for consistency
- Documentation access is critical - need efficient retrieval strategy
- Configuration application must maintain YAML as source of truth
- Consider rate limiting to prevent abuse of AI features

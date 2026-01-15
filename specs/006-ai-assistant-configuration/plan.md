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
- [x] Components identified:
  - `ConfigurationAssistant` - Main chat interface component (Server Component)
  - `ConfigurationAssistantClient` - Client wrapper for interactivity (Client Component)
  - `AssistantMessage` - Individual message display component
  - `ConfigurationSuggestion` - Suggestion display with apply button
  - `AssistantInput` - Message input component
  - `SessionList` - Session list UI (recent sessions, archive/delete)
  - `ComparisonResults` - Display configuration comparison differences
  - `DocumentationLinks` - Display documentation references
- [x] Component hierarchy defined
- [x] Props/interfaces designed

**Component Hierarchy**:
```
ProjectSettingsPage (Server)
  └── ConfigurationAssistant (Server Component)
        ├── Fetches initial session and messages
        └── Renders ConfigurationAssistantClient (Client Component)
              ├── AssistantMessage[] (renders messages)
              │     ├── ConfigurationSuggestion (if suggestion in metadata)
              │     ├── ComparisonResults (if comparison in metadata)
              │     └── DocumentationLinks (if docs in metadata)
              ├── AssistantInput (message input)
              └── SessionList (session management UI)
```

**Component Interfaces**:

```typescript
// Server Component
interface ConfigurationAssistantProps {
  projectId: string;
  contextType: 'project' | 'infrastructure';
  initialSession?: ConfigurationAssistantSession;
  initialMessages?: AssistantMessage[];
}

// Client Component
interface ConfigurationAssistantClientProps {
  projectId: string;
  contextType: 'project' | 'infrastructure';
  initialSessionId?: string;
  initialMessages: AssistantMessage[];
}

// Message Component
interface AssistantMessageProps {
  message: AssistantMessage;
  onApplySuggestion?: (suggestion: ConfigurationSuggestion) => void;
}

// Suggestion Component
interface ConfigurationSuggestionProps {
  suggestion: ConfigurationSuggestion;
  onApply: () => Promise<void>;
  onCancel?: () => void;
  conflictResolution?: {
    current: unknown;
    suggested: unknown;
    onResolve: (choice: 'keep' | 'use' | 'merge') => Promise<void>;
  };
}

// Input Component
interface AssistantInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}
```

### State Management
- [x] State requirements identified:
  - Conversation messages (server state via TanStack Query)
  - Input state (local useState)
  - Loading states (local useState)
  - Suggestion application state (optimistic updates)
  - Session selection state (local useState)
- [x] State management strategy chosen
- [x] State flow documented

**State Management Strategy**:

1. **Server State (TanStack Query)**:
   - `useQuery` for fetching conversation history
   - `useMutation` for sending messages
   - `useMutation` for applying suggestions
   - Automatic refetch on window focus
   - Optimistic updates for message sending

2. **Local State (useState)**:
   - Input field value
   - Loading indicators (sending, applying suggestion)
   - Selected session ID
   - Error messages
   - UI state (modal open/closed, etc.)

3. **State Flow**:
   ```
   User types message
     ↓
   Update input state (useState)
     ↓
   User clicks send
     ↓
   Optimistic update: Add user message to UI immediately
     ↓
   Call API mutation (TanStack Query)
     ↓
   On success: Add assistant response to query cache
     ↓
   On error: Revert optimistic update, show error
   ```

4. **Optimistic Updates**:
   - Message sending: Add user message immediately, show loading indicator
   - Suggestion application: Show "Applying..." state, update UI optimistically
   - On error: Revert optimistic state, show error message

### Testing Strategy
- [x] Unit test plan:
  - Prompt building functions
  - Config comparison logic
  - Documentation retrieval
  - Context management (sliding window)
  - Rate limiting utilities
  - Access control utilities
- [x] Integration test plan:
  - Chat flow end-to-end
  - Config suggestion application
  - Conflict detection and resolution
  - Rate limiting enforcement
  - Access control enforcement
- [x] E2E test scenarios:
  - Admin configures project with assistant
  - Assistant validates configuration
  - Assistant compares YAML to database
  - Infrastructure assistant (admin-only)
  - Session management (list, archive, delete)

**Unit Test Coverage**:

1. **Prompt Builder** (`apps/web/src/lib/assistant/__tests__/prompt-builder.test.ts`):
   - Builds prompt with system prompt
   - Includes conversation history (sliding window)
   - Includes current project config
   - Includes documentation sections
   - Handles empty conversation
   - Handles long conversation (window truncation)

2. **Config Comparison** (`apps/web/src/lib/assistant/__tests__/config-comparison.test.ts`):
   - Compares YAML to database config
   - Identifies missing fields
   - Identifies value mismatches
   - Handles nested structures
   - Formats comparison results

3. **Documentation Retrieval** (`apps/web/src/lib/assistant/__tests__/doc-retrieval.test.ts`):
   - Retrieves relevant docs by keyword
   - Returns correct file paths
   - Handles missing docs gracefully
   - Indexes documentation correctly

4. **Context Manager** (`apps/web/src/lib/assistant/__tests__/context-manager.test.ts`):
   - Applies sliding window (last N messages)
   - Includes system prompt
   - Excludes older messages
   - Handles empty conversation

5. **Rate Limiting** (`apps/web/src/lib/assistant/__tests__/rate-limit.test.ts`):
   - Enforces per-user limits
   - Enforces AI Gateway limits
   - Returns correct retry-after headers
   - Handles concurrent requests

**Integration Test Coverage**:

1. **Chat Flow** (`apps/web/__tests__/integration/assistant/chat-flow.test.ts`):
   - POST /api/projects/[projectId]/assistant/chat
   - Creates session on first message
   - Returns assistant response
   - Stores messages in database
   - Applies rate limiting
   - Enforces access control

2. **Suggestion Application** (`apps/web/__tests__/integration/assistant/apply-suggestion.test.ts`):
   - POST /api/projects/[projectId]/assistant/apply-suggestion
   - Validates suggestion schema
   - Detects conflicts
   - Applies configuration
   - Returns conflict resolution UI data

3. **History Retrieval** (`apps/web/__tests__/integration/assistant/history.test.ts`):
   - GET /api/projects/[projectId]/assistant/history
   - Returns paginated messages
   - Filters by session
   - Enforces access control

**E2E Test Scenarios** (Playwright/Cypress):

1. **Project Configuration Flow**:
   - Admin navigates to project settings
   - Opens AI assistant
   - Asks configuration question
   - Receives guidance
   - Applies suggested configuration
   - Verifies configuration applied

2. **Configuration Validation**:
   - Admin asks assistant to review configuration
   - Assistant identifies issues
   - Assistant provides recommendations
   - Admin applies fixes

3. **YAML vs Database Comparison**:
   - Admin asks to compare YAML to database
   - Assistant shows differences
   - Admin reconciles differences

4. **Infrastructure Assistant**:
   - System admin navigates to infrastructure settings
   - Opens AI assistant
   - Asks OAuth setup question
   - Receives step-by-step guidance

5. **Session Management**:
   - Admin views recent sessions
   - Archives old session
   - Deletes session
   - Creates new session

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

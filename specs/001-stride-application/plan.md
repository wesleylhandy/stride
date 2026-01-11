# Implementation Plan: Stride Core Application

**Feature Branch**: `001-stride-application`  
**Created**: 2024-12-19  
**Status**: Planning Complete (Phase 0-3)  
**Feature Spec**: `specs/001-stride-application/spec.md`

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: HTTP-only cookies with JWT tokens, OAuth for GitHub/GitLab
- **State Management**: Jotai for global state, TanStack Query for server state
- **Styling**: Tailwind CSS with custom design tokens
- **Monorepo**: Turborepo with pnpm
- **Deployment**: Docker Compose, Kubernetes support

### Dependencies
- **Frontend Libraries**:
  - `@uiw/react-codemirror` for YAML editor
  - `dnd-kit` for drag-and-drop
  - `react-markdown` with `remark-gfm` for Markdown rendering
  - `mermaid` for diagram rendering
  - `js-yaml` for YAML parsing
  - `zod` for runtime validation
- **Backend Libraries**:
  - `@prisma/client` for database access
  - `bcrypt` or `argon2` for password hashing
  - `jsonwebtoken` for JWT handling
- **Infrastructure**:
  - Docker for containerization
  - PostgreSQL database
  - Stride AI Gateway (separate service)

### Integrations
- **Git Services**: GitHub, GitLab, Bitbucket (webhook endpoints)
- **Monitoring Services**: Sentry, Datadog, New Relic (webhook endpoints)
- **External Links**: Notion, Google Drive, Confluence (link preview API)
- **AI Gateway**: Self-hosted LLM (Ollama) or commercial API (OpenAI, Anthropic). AI provider configuration stored in database with encrypted credentials. Supports multiple providers per project with model selection.

### Architecture Decisions
- **Monorepo Structure**:
  - `apps/web`: Main Next.js application
  - `apps/site`: Marketing website (MDX)
  - `packages/ui`: Shared component library
  - `packages/database`: Prisma schema and client
  - `packages/yaml-config`: YAML parsing and validation
  - `packages/ai-gateway`: AI integration logic
  - `packages/types`: Shared TypeScript types
- **Data Access**: Repository pattern with Prisma
- **API Design**: RESTful routes in Next.js App Router
- **Configuration**: Version-controlled `stride.config.yaml` file
- **Error Handling**: Structured JSON logging with request IDs
- **Observability**: JSON logs to stdout, basic metrics endpoint

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Prisma JSONB schema design - See `research.md` section 1
- ✅ **RESOLVED**: Webhook signature verification - See `research.md` section 2
- ✅ **RESOLVED**: Link preview API - See `research.md` section 3
- ✅ **RESOLVED**: Mermaid rendering - See `research.md` section 4
- ✅ **RESOLVED**: Configuration storage - See `research.md` section 5
- ✅ **RESOLVED**: Session management - See `research.md` section 6
- ✅ **RESOLVED**: Rate limiting - See `research.md` section 7
- ✅ **RESOLVED**: Docker Compose - See `research.md` section 8

All clarifications resolved. See `research.md` for detailed decisions and rationale.

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied
  - Single Responsibility: Separate packages for UI, database, config, AI
  - Open/Closed: Repository pattern allows extension
  - Liskov Substitution: Interfaces for repositories and services
  - Interface Segregation: Specific interfaces per domain
  - Dependency Inversion: Depend on abstractions (interfaces)
- [x] DRY, YAGNI, KISS followed
  - Shared packages prevent duplication
  - MVP focus (YAGNI)
  - Simple solutions first (KISS)
- [x] Type safety enforced
  - TypeScript strict mode
  - Zod for runtime validation
  - Prisma for type-safe database access
- [x] Security best practices
  - Input validation (Zod)
  - Auth at every boundary
  - Parameterized queries (Prisma)
  - HTTP-only cookies
  - Rate limiting planned
- [x] Accessibility requirements met
  - WCAG 2.1 AA compliance
  - Keyboard navigation
  - Screen reader support
  - Semantic HTML

### Code Quality Gates
- [x] No `any` types
  - TypeScript strict mode enforced
  - Use `unknown` for uncertain types
- [x] Proper error handling
  - Try/catch for async operations
  - Error boundaries for React
  - Structured error responses
- [x] Input validation
  - Zod schemas for all inputs
  - Server-side validation required
- [x] Test coverage planned
  - Unit tests for utilities
  - Integration tests for API routes
  - E2E tests for critical flows

## Phase 0: Outline & Research

### Research Tasks
- [x] Resolve Prisma JSONB schema design for custom fields
- [x] Research webhook signature verification patterns
- [x] Research link preview API implementation approaches
- [x] Research Mermaid rendering strategies
- [x] Determine configuration storage approach
- [x] Research session management options
- [x] Research rate limiting implementations
- [x] Research Docker Compose best practices

### Research Output
- [x] `research.md` generated with all clarifications resolved

## Phase 1: Design & Contracts

### Data Model
- [x] `data-model.md` generated
- [x] Entities defined with relationships
- [x] Validation rules documented

### API Contracts
- [x] REST endpoints defined
- [x] Request/response schemas documented
- [x] Contracts saved to `/contracts/`

### Quickstart
- [x] `quickstart.md` generated
- [x] Setup instructions documented

### Agent Context
- [x] Agent context updated with new technologies

## Phase 2: Implementation Planning

### Component Structure
- [x] Components identified
- [x] Component hierarchy defined
- [x] Props/interfaces designed

**Output**: `component-structure.md` - Complete component architecture with atoms, molecules, organisms, and templates

### State Management
- [x] State requirements identified
- [x] State management strategy chosen
- [x] State flow documented

**Output**: `state-management.md` - Jotai atoms, TanStack Query hooks, state flow patterns

### Testing Strategy
- [x] Unit test plan
- [x] Integration test plan
- [x] E2E test scenarios

**Output**: `testing-strategy.md` - Comprehensive testing approach covering unit, integration, and E2E tests

## Phase 3: Implementation

### Tasks
- [x] Implementation tasks created
- [x] Dependencies identified
- [x] Estimated effort

**Output**: `implementation-tasks.md` - Comprehensive task breakdown with 80+ tasks organized by priority, feature area, dependencies, and effort estimates. Includes implementation phases and risk mitigation strategies.

## Phase 9: AI-Powered Triage Planning (P3)

### Technical Decisions (Based on Clarifications)

#### Issue Context Payload Structure
**Decision**: Send core fields (title, description, status, custom fields, error traces if available, recent comments - last 5-10) to AI gateway.

**Rationale**: 
- Balances context richness with payload size
- Allows for future customization via configuration
- Ensures comprehensive context without overwhelming the LLM

**Implementation**:
- Payload structure defined in `apps/web/src/lib/ai/triage.ts`
- Include: `title`, `description`, `status`, `customFields` (JSON), `errorTraces` (if available from Root Cause Dashboard), `recentComments` (last 5-10 ordered by timestamp)
- Exclude: Full comment history, linked branches/PRs (summary only if needed), assignee history

#### UI Component Architecture
**Decision**: Dedicated expandable "AI Triage Analysis" section within IssueDetail component.

**Rationale**:
- Keeps context visible without cluttering default view
- Allows users to collapse/expand as needed
- Positioned after issue details but before comments maintains logical flow

**Implementation**:
- Component: `packages/ui/src/organisms/AITriageAnalysis.tsx`
- Integration: Embedded in `packages/ui/src/organisms/IssueDetail.tsx`
- Position: After issue details section, before comments section
- State: Expandable/collapsible, expanded by default when suggestions available
- Styling: Match existing design tokens, use accordion pattern for expand/collapse

#### Priority Suggestion Format
**Decision**: Match existing project priority system, fallback to standard format (low/medium/high).

**Rationale**:
- Ensures suggestions are consistent with project's workflow configuration
- Avoids confusion from mismatched priority systems
- Provides sensible defaults when no custom priorities defined

**Implementation**:
- Read priority values from project configuration (`stride.config.yaml`)
- If custom priorities exist: AI gateway returns one of those values
- If no custom priorities: AI gateway returns standard (low/medium/high)
- Map AI response to project's priority enum for display

#### Assignee Suggestion Format
**Decision**: Free-form natural language description with manual user selection.

**Rationale**:
- Provides flexibility for AI to suggest based on expertise/skills
- Allows users to interpret and select appropriate assignee
- Avoids hard-coded user IDs that may become stale

**Implementation**:
- AI gateway returns: `{ suggestedAssignee: "frontend developer with React experience" }`
- UI displays: Description text + "Select Assignee" button/selector
- User action: Click selector, choose from project members list
- Optional enhancement: Fuzzy matching to suggest relevant users based on description (future work)

#### Permission Model
**Decision**: Default Admin only, configurable via project configuration (`ai_triage_permissions` setting).

**Rationale**:
- Provides flexibility while maintaining security and cost control defaults
- Allows projects to customize based on team structure
- Prevents unauthorized usage by default

**Implementation**:
- Default: Check user role === 'Admin' at API route level
- Configuration: Add `ai_triage_permissions: ['admin', 'member']` or `['admin']` to `stride.config.yaml`
- API route: `apps/web/app/api/projects/[projectId]/issues/[issueKey]/ai-triage/route.ts`
- Permission check: Read config, verify user role in allowed list
- UI: Hide/disable "Triage with AI" button if user lacks permission

#### AI Provider Configuration Management
**Decision**: Database storage with encryption for sensitive credentials, UI-based configuration at Project Settings → Integrations page.

**Rationale**:
- Enables dynamic configuration without redeployment
- Provides secure storage for API keys/tokens
- Allows per-project AI provider configuration
- Supports multiple providers simultaneously

**Implementation**:
- **Storage**: PostgreSQL database with encrypted fields for API keys/tokens
  - Endpoint URLs for self-hosted LLMs stored as plain text (not sensitive)
  - API keys and tokens encrypted at rest
  - Model selections stored as JSON array
- **Location**: Project Settings → Integrations page (`/projects/[projectId]/settings/integrations`)
  - Similar pattern to repository connection management
  - Admin-only access (enforced at route level)
- **Form Fields**:
  - Cloud providers (OpenAI, Anthropic): API key field (password-type, masked)
  - Self-hosted LLMs (Ollama): Endpoint URL field (required) + optional authentication token field (password-type)
  - All providers: Model multiselect interface
- **Model Selection**:
  - Cloud providers: Static list of available models (e.g., gpt-4, gpt-3.5-turbo, claude-3-opus)
  - Self-hosted LLMs: Auto-discovery via API (queries Ollama `/api/tags` endpoint when endpoint URL provided)
  - If auto-discovery fails: Show error message, allow manual model entry
  - Admin selects which models from each provider are available to users
  - System assigns default model automatically when triage triggered
- **Validation**:
  - Optional "Test Connection" button for self-hosted LLMs (non-blocking)
  - Form submission not blocked if test fails (allows offline configuration)
- **Multiple Providers**:
  - Admin can configure multiple providers simultaneously (OpenAI, Anthropic, Ollama, etc.)
  - Each provider configuration stored separately
  - Admin explicitly selects which models from each provider are available
  - System uses default model assignment or allows selection from configured allowed models

**Database Schema** (new model):
```prisma
model AiProviderConfig {
  id              String   @id @default(uuid())
  projectId       String
  providerType    String   // "openai", "anthropic", "ollama", etc.
  apiKey          String?  // Encrypted (for cloud providers)
  endpointUrl     String?  // Plain text (for self-hosted LLMs)
  authToken       String?  // Encrypted (optional, for self-hosted with auth)
  enabledModels   Json     // Array of model names selected by admin
  defaultModel    String?  // Default model to use if multiple enabled
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, providerType])
  @@index([projectId])
  @@map("ai_provider_configs")
}
```

**API Routes**:
- `GET /api/projects/[projectId]/ai-providers`: List configured providers
- `POST /api/projects/[projectId]/ai-providers`: Create/update provider configuration
- `DELETE /api/projects/[projectId]/ai-providers/[providerId]`: Remove provider
- `POST /api/projects/[projectId]/ai-providers/[providerId]/test`: Test connection (self-hosted only)
- `GET /api/projects/[projectId]/ai-providers/[providerId]/models`: Discover available models (self-hosted only)

**UI Components**:
- `apps/web/src/components/features/projects/AiProviderSettings.tsx`: Main configuration component
- `apps/web/src/components/features/projects/AiProviderForm.tsx`: Form for adding/editing provider
- `apps/web/src/components/features/projects/ModelSelector.tsx`: Multiselect for model selection
- `apps/web/src/components/features/projects/EndpointTester.tsx`: Test connection button component

### Component Structure

#### New Components
- `packages/ui/src/organisms/AITriageAnalysis.tsx`: Main expandable section component
  - Props: `issueId`, `projectId`, `analysis` (from API), `onAccept`, `onDismiss`
  - Sub-components: `AIPrioritySuggestion`, `AIAssigneeSuggestion`, `AISummary`
- `packages/ui/src/molecules/AIPrioritySuggestion.tsx`: Priority suggestion display with accept/modify
- `packages/ui/src/molecules/AIAssigneeSuggestion.tsx`: Assignee description + member selector
- `packages/ui/src/molecules/AISummary.tsx`: Plain-language summary display

#### Modified Components
- `packages/ui/src/organisms/IssueDetail.tsx`: Add AITriageAnalysis section after issue details, before comments
- Add "Triage with AI" button to IssueDetail header (permission-checked)

### API Integration

#### AI Gateway Request Format
```typescript
POST /analyze-issue
{
  issue: {
    title: string;
    description: string;
    status: string;
    customFields: Record<string, unknown>;
    errorTraces?: Array<{ message: string; stack: string }>;
    recentComments: Array<{ author: string; content: string; timestamp: Date }>;
  },
  projectConfig: {
    priorityValues?: string[]; // If custom priorities exist
  }
}
```

#### AI Gateway Response Format
```typescript
{
  summary: string; // Plain-language root cause summary
  priority: string; // Priority value (matches project config or standard)
  suggestedAssignee: string; // Natural language description
}
```

#### Main App API Route
- Endpoint: `POST /api/projects/[projectId]/issues/[issueKey]/ai-triage`
- Permission check: Admin by default, or roles from `ai_triage_permissions` config
- Request: Issue context payload (as defined above)
- Response: `{ summary, priority, suggestedAssignee }` or error
- Error handling: Graceful degradation, log errors, return user-friendly message

### Configuration Schema Updates

Add to `packages/yaml-config/src/schema.ts`:
```typescript
aiTriageConfig: z.object({
  permissions: z.array(z.enum(['admin', 'member', 'viewer'])).default(['admin']),
  enabled: z.boolean().default(true),
}).optional(),
```

Update `packages/yaml-config/src/default-config.ts` to include default AI triage settings.

### Error Handling & Edge Cases

1. **AI Gateway Unavailable**: Display error message in AITriageAnalysis section, allow retry, issue remains functional
2. **Malformed Response**: Log error, display "Unable to analyze issue", allow retry
3. **Permission Denied**: Hide/disable button in UI, return 403 from API
4. **No Project Priority Config**: Use standard low/medium/high mapping
5. **Assignee Description No Match**: User manually selects from member list

### Integration Points

- **Issue Detail View**: Display AITriageAnalysis component
- **Project Configuration**: Read `ai_triage_permissions` setting
- **AI Gateway Service**: HTTP client in `apps/web/src/lib/ai/triage.ts`
- **Permission Middleware**: Check at API route level before processing
- **Root Cause Dashboard**: Include error traces in context if available
- **AI Provider Configuration**: Read from database, pass provider/model selection to AI Gateway
- **Project Settings**: Integrations page for managing AI provider configurations

### Testing Considerations

- Unit tests: AITriageAnalysis component rendering, permission checks
- Integration tests: API route permission validation, AI gateway integration
- E2E tests: Full triage flow (click button → receive suggestions → accept/modify)
- Mock AI Gateway: Development mode with predictable responses
- Error scenarios: Gateway unavailable, malformed response, permission denied

### Documentation Updates (Based on Phase 9 Clarifications - Session 2026-01-23)

Phase 9 requires comprehensive documentation updates to reflect the new AI triage feature and UI-based AI provider configuration. All documentation updates follow the clarifications from spec.md Session 2026-01-23 (Phase 9 Documentation Updates Clarifications).

#### AI Providers Integration Documentation Updates

**Location**: `docs/integrations/ai-providers.md` (created in Phase 8.9)

**Approach**: Hybrid approach - keep infrastructure-level documentation, add project-level UI configuration.

**Updates Required**:
1. **Retain Infrastructure Setup Sections**:
   - Keep existing environment variable configuration for AI Gateway service (infrastructure-level)
   - Maintain Docker Compose configuration examples
   - Keep bare-metal setup instructions for AI Gateway service
   - Preserve troubleshooting for infrastructure-level issues

2. **Add Project-Level Configuration Sections**:
   - New section: "Project-Level AI Provider Configuration"
   - Navigation instructions to Project Settings → Integrations page
   - UI form field descriptions (API key, endpoint URL, model selection)
   - Model selection workflow (auto-discovery for self-hosted LLMs, manual selection for cloud providers)
   - Test connection functionality documentation
   - Database storage details (encrypted credentials, plain text endpoint URLs)
   - Clear distinction between infrastructure (system-wide, environment variables) vs project-level (per-project, UI-based) configuration

3. **Update Examples**:
   - Add UI-based configuration examples alongside environment variable examples
   - Show Project Settings → Integrations UI workflow
   - Include screenshots or descriptions of UI forms (if applicable)

#### Projects Documentation Updates

**Location**: `docs/user/` or existing project documentation structure

**Approach**: Comprehensive project features documentation with dedicated AI Triage section.

**New Content Required**:
1. **AI Triage Feature Documentation** (`docs/user/ai-triage.md` or similar):
   - Feature overview: What is AI triage and when to use it
   - How to trigger AI triage on an issue (button location, permissions)
   - Interpreting AI triage results (summary, priority, assignee suggestions)
   - Accepting/modifying AI suggestions (priority updates, assignee selection)
   - Troubleshooting AI triage errors (gateway unavailable, permission denied, timeout)
   - Links to Project Settings → Integrations for provider setup
   - Links to configuration documentation for `ai_triage_permissions`

2. **Configuration Documentation Updates**:
   - Add `aiTriageConfig` section to configuration reference documentation
   - Document `ai_triage_permissions` field (YAML snake_case) with examples:
     ```yaml
     ai_triage_permissions:
       - admin
       - member  # Optional: allow Members to use AI triage
     ```
   - Document default behavior (Admin only if not configured)
   - Include examples of permission configuration scenarios

3. **Cross-References**:
   - Link from AI triage feature docs to provider configuration docs
   - Link from configuration reference to AI triage feature docs
   - Link from troubleshooting to relevant error resolution guides

#### Documentation Structure

**Location Strategy**: Within existing project documentation structure.
- AI triage feature docs: `docs/user/ai-triage.md` (or add as section in main project docs)
- Configuration updates: Update existing `docs/configuration/reference.md` or similar
- Integration docs: Update existing `docs/integrations/ai-providers.md`

**Rationale**: AI triage is a project-level feature users interact with directly, so it belongs in user/project documentation alongside other features. Keeps feature documentation co-located with other project features for better discoverability.

#### Documentation Tasks Structure

**Location**: Phase 9 tasks.md - new "Documentation Updates" section

**Tasks Required** (to be added to tasks.md):
1. Update `docs/integrations/ai-providers.md` with UI-based configuration sections
2. Create `docs/user/ai-triage.md` with comprehensive feature documentation
3. Update configuration reference documentation to include `aiTriageConfig` schema
4. Add troubleshooting section for AI triage errors
5. Verify all documentation links work correctly (cross-references between docs)
6. Update navigation/sidebar to include AI triage documentation (if applicable)

**Pattern**: Follow Phase 8.9 pattern of tracking documentation updates as explicit tasks within the phase to ensure nothing is missed.

#### Documentation Content Requirements

**Infrastructure vs Project-Level Distinction**:
- Clearly separate infrastructure setup (one-time, system-wide AI Gateway service) from project configuration (per-project, UI-based provider selection)
- Use section headers and callout boxes to distinguish: "Infrastructure Setup" vs "Project Configuration"
- Provide migration guidance for users who already have infrastructure setup (environment variables) and now want to use project-level configuration

**Completeness Criteria**:
- Users can understand difference between infrastructure and project-level configuration
- Users can configure AI providers via UI without referencing infrastructure docs
- Users can use AI triage feature without consulting multiple documentation files
- Configuration examples are complete and tested
- Troubleshooting covers common scenarios (permissions, connectivity, errors)

## Notes

- This is a comprehensive MVP implementation
- Focus on P1 user stories first (deployment, issue management)
- P2 features (configuration, Git integration, sprints) follow
- P3 features (diagnostics, AI) can be implemented after core is stable
- All external integrations must gracefully degrade when services unavailable
- **Phase 9 (AI Triage)**: Implement after Phase 4 (Issues) is complete and stable. All clarifications resolved in spec.md Session 2024-12-19 (Phase 9 Clarifications), Session 2026-01-10 (Phase 9 AI Provider Configuration & Self-Hosted LLM Configuration Clarifications), and Session 2026-01-23 (Phase 9 Documentation Updates Clarifications).
- **Documentation Updates**: Phase 9 requires comprehensive documentation updates following hybrid approach (infrastructure + project-level), comprehensive feature docs, and dedicated documentation tasks section in tasks.md. All updates must be completed as part of Phase 9 implementation.


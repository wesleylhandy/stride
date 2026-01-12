# Research & Technical Decisions: AI Assistant for Project Configuration

**Created**: 2026-01-23  
**Purpose**: Resolve all NEEDS CLARIFICATION items from implementation plan

## 1. Chat Interface Architecture

### Decision
Hybrid approach: Server Components for initial render and data fetching, Client Components for interactivity, API routes for message handling.

### Rationale
- Aligns with Next.js 16 App Router patterns (Server Components by default)
- Server Components provide secure, direct database access for conversation history
- Client Components enable real-time interactivity (typing indicators, message sending)
- API routes handle AI Gateway calls (similar to existing AI triage implementation)
- Progressive enhancement: Works without JavaScript for basic functionality

### Implementation
- **Server Component**: `ConfigurationAssistant.tsx` (server) - Fetches conversation history, renders initial messages
- **Client Component**: `ConfigurationAssistantClient.tsx` - Handles user input, message sending, real-time updates
- **API Route**: `POST /api/projects/[projectId]/assistant/chat` - Processes messages, calls AI Gateway, stores responses
- **Server Action**: Optional for optimistic updates (can use API route instead)

### Alternatives Considered
- **Server-side only**: Cannot provide real-time interactivity, poor UX
- **Client-side only**: Requires API routes anyway, loses Server Component benefits
- **WebSockets**: Overkill for chat, adds complexity, not needed for request-response pattern

### Pattern Alignment
Matches existing AI triage implementation pattern: API route calls AI Gateway, returns response. Chat interface is similar UX pattern.

---

## 2. Conversation History Storage

### Decision
Store full conversation in database with pagination support. Messages table with session relationship.

### Rationale
- Full context needed for AI assistant to understand conversation flow
- Database storage enables persistence across sessions
- Pagination prevents loading entire conversation history at once
- Enables conversation analytics and improvement
- Supports multi-device access (conversation available from any device)

### Implementation
```prisma
model ConfigurationAssistantSession {
  id          String   @id @default(uuid())
  userId      String
  projectId   String?  // Null for infrastructure context
  contextType String   // "project" or "infrastructure"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  messages    AssistantMessage[]
  
  @@index([userId, projectId])
  @@index([updatedAt])
}

model AssistantMessage {
  id        String   @id @default(uuid())
  sessionId String
  role      String   // "user" or "assistant"
  content   String   @db.Text
  metadata  Json?    // Config references, doc links, suggestions
  createdAt DateTime @default(now())
  
  session   ConfigurationAssistantSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId, createdAt])
}
```

### Alternatives Considered
- **In-memory only**: Loses context on refresh, poor UX
- **Summary + recent messages**: Complex to maintain summaries, may lose important context
- **External service (Redis)**: Adds dependency, still need database for persistence

### Performance
- Index on `(sessionId, createdAt)` for efficient message retrieval
- Pagination: Load last N messages (e.g., 50) initially, load more on scroll
- Consider archiving old conversations (>30 days) to separate table

---

## 3. Documentation Access Strategy

### Decision
Simple file-based retrieval with section indexing. Load relevant documentation sections into prompt context on-demand.

### Rationale
- Documentation is in markdown files in `docs/` directory (version controlled)
- Simple file reading is sufficient for MVP (YAGNI principle)
- Can evolve to semantic search later if needed
- Documentation is relatively static, doesn't need real-time indexing
- Keeps system simple and maintainable

### Implementation
- **Documentation Index**: Create index file mapping topics to markdown file paths and sections
- **Retrieval Function**: `getRelevantDocs(query: string): Promise<string[]>` - Returns relevant doc sections
- **Prompt Injection**: Include relevant docs in system prompt or user message context
- **Caching**: Cache parsed markdown content in memory (per request lifecycle)

### Documentation Structure
```
docs/
  configuration/
    reference.md      # Schema reference
    examples.md       # Configuration examples
  deployment/
    infrastructure-configuration.md
  integrations/
    ai-providers.md
    git-oauth.md
```

### Retrieval Logic
1. Parse user query for keywords (e.g., "workflow", "custom fields", "OAuth")
2. Match keywords to documentation index
3. Load relevant markdown sections
4. Include in prompt context (with source references)

### Alternatives Considered
- **Full documentation in prompt**: Too large, exceeds token limits, expensive
- **Semantic search with embeddings**: Overkill for MVP, adds complexity (vector DB, embedding generation)
- **External documentation service**: Adds dependency, documentation is already in repo

### Future Evolution
Can add semantic search later if simple keyword matching proves insufficient. Start simple (KISS).

---

## 4. System Prompt Structure

### Decision
Single comprehensive prompt (similar to AI triage) with dynamic context injection based on query type and user context.

### Rationale
- Consistent with existing AI triage prompt pattern
- Single prompt is easier to maintain and version control
- Dynamic context injection provides flexibility without complexity
- Markdown file storage enables easy editing and external testing
- Project-specific context injected via user message (not prompt modification)

### Implementation
- **Prompt File**: `packages/ai-gateway/prompts/configuration-assistant-prompt.md`
- **Structure**:
  1. Role definition ("You are a configuration assistant for Stride...")
  2. Capabilities (understand configs, compare YAML/DB, suggest improvements)
  3. Output format (natural language responses, structured suggestions)
  4. Guidelines (reference docs, explain trade-offs, validate suggestions)
- **Context Injection**: Include in user message:
  - Current project/infrastructure config
  - Relevant documentation sections
  - Query type (project config, infrastructure, comparison)

### Prompt Template
```markdown
# Configuration Assistant - System Prompt

You are a configuration assistant for Stride, a project management and issue tracking system.

## Your Role
Help administrators configure projects and infrastructure settings by:
- Understanding their requirements and suggesting appropriate configurations
- Validating existing configurations against best practices
- Comparing YAML configuration files to database state
- Explaining configuration options and their implications
- Referencing official documentation when providing recommendations

## Available Context
- Project configuration (YAML and database state)
- Infrastructure configuration (global settings)
- Documentation (configuration reference, examples, guides)
- OAuth configuration (GitHub, GitLab)

## Guidelines
- Always reference documentation when making recommendations
- Explain the "why" behind suggestions, not just the "what"
- Validate suggestions against schema before recommending
- Identify discrepancies between YAML and database configs
- Provide step-by-step guidance for complex configurations
- Acknowledge limitations when asked about unimplemented features

## Output Format
- Natural language responses to user questions
- Structured configuration suggestions when applicable
- References to documentation sections
- Clear explanations of configuration options
```

### Alternatives Considered
- **Modular prompts**: More complex to maintain, harder to ensure consistency
- **Dynamic prompt construction**: Adds complexity, single prompt with context injection is sufficient

### Context Injection Pattern
Similar to AI triage: System prompt defines role, user message includes:
- User query
- Current configuration state
- Relevant documentation
- Query context (project vs infrastructure)

---

## 5. Configuration Comparison

### Decision
On-demand comparison when user explicitly asks. Cache results briefly (per request) to avoid redundant comparisons.

### Rationale
- Comparison is expensive (requires loading both YAML and database configs)
- Most queries don't need comparison
- Only compare when user asks (e.g., "compare my config", "check for differences")
- Brief caching prevents redundant work within same request

### Implementation
- **Trigger**: User asks explicitly ("compare", "differences", "YAML vs database")
- **Process**:
  1. Load YAML config from project repository or database
  2. Load database config (parsed JSONB)
  3. Deep comparison of structures
  4. Identify differences (missing fields, value mismatches, extra fields)
  5. Format differences for user explanation
- **Caching**: Cache comparison result in memory for request lifecycle (not persisted)

### Comparison Logic
```typescript
interface ConfigDifference {
  path: string;        // e.g., "workflow.statuses[0].name"
  yamlValue: unknown;
  dbValue: unknown;
  type: 'missing_in_db' | 'missing_in_yaml' | 'value_mismatch' | 'extra_in_db' | 'extra_in_yaml';
}

function compareConfigs(yaml: ProjectConfig, db: ProjectConfig): ConfigDifference[] {
  // Deep comparison logic
  // Return array of differences
}
```

### Alternatives Considered
- **Real-time on every request**: Too expensive, unnecessary for most queries
- **Cached in database**: Adds complexity, configs change infrequently, on-demand is sufficient
- **Background job**: Overkill, user wants immediate feedback

### Performance
- Comparison is O(n) where n is config size (typically small, <100 fields)
- Cache per request to avoid redundant comparisons
- Consider async comparison for very large configs (future optimization)

---

## 6. Configuration Application

### Decision
Generate YAML, validate against schema, then apply to database. Maintain YAML as source of truth.

### Rationale
- YAML is version-controlled source of truth (per existing architecture)
- Schema validation ensures configuration correctness
- Database update follows YAML update (consistent with existing patterns)
- Prevents invalid configurations from being applied
- Maintains audit trail (YAML changes are tracked in Git)

### Implementation
1. **Generate YAML**: Convert AI suggestion to YAML format
2. **Validate**: Use existing Zod schema validation (`ProjectConfigSchema`)
3. **Apply**: Update database `config` JSONB field
4. **Optional**: If project has Git repository, commit YAML file (future enhancement)

### Workflow
```typescript
async function applyConfigurationSuggestion(
  projectId: string,
  suggestion: ConfigurationSuggestion
): Promise<void> {
  // 1. Generate YAML from suggestion
  const yaml = generateYamlFromSuggestion(suggestion);
  
  // 2. Validate against schema
  const validated = ProjectConfigSchema.parse(yaml);
  
  // 3. Update database
  await db.project.update({
    where: { id: projectId },
    data: {
      config: validated,
      configYaml: yaml,
    },
  });
  
  // 4. Return success
}
```

### Alternatives Considered
- **Direct database update**: Bypasses validation, loses YAML source of truth
- **Both (DB + YAML)**: More complex, YAML-first is sufficient

### Error Handling
- Validation errors: Return to user with specific field errors
- Database errors: Log and return generic error
- Partial updates: Not supported, all-or-nothing (maintains consistency)

---

## 7. Context Scope (Project vs Infrastructure)

### Decision
Unified assistant that understands both contexts. Context determined by where assistant is invoked (project settings vs infrastructure settings).

### Rationale
- Single assistant is simpler to maintain
- Context switching is natural (user knows where they are)
- Shared knowledge base (both contexts use similar configuration concepts)
- Reduces code duplication
- Better UX (consistent assistant behavior)

### Implementation
- **Context Detection**: Based on route/component location
  - `/projects/[projectId]/settings/*` → Project context
  - `/settings/infrastructure` → Infrastructure context
- **Context Injection**: Include in user message
  - Project context: Include project config, project-specific docs
  - Infrastructure context: Include global config, infrastructure docs
- **Prompt Awareness**: System prompt explains both contexts

### Context Payload
```typescript
interface AssistantContext {
  type: 'project' | 'infrastructure';
  projectId?: string;           // For project context
  currentConfig?: ProjectConfig | InfrastructureConfig;
  availableDocs: string[];     // Relevant documentation sections
}
```

### Alternatives Considered
- **Separate assistants**: Code duplication, harder to maintain
- **Context switching in UI**: Adds complexity, unified is simpler

### User Experience
- Assistant automatically knows context based on page
- User can explicitly mention context if needed ("check infrastructure settings")
- Clear indication of current context in UI

---

## 8. Error Handling for Missing AI Provider

### Decision
Show helpful setup instructions in chat interface. Don't hide the assistant feature entirely.

### Rationale
- Better UX: User sees what they need to do, not just "feature unavailable"
- Educational: Helps users understand AI provider setup
- Progressive enhancement: Feature exists, just needs configuration
- Consistent with existing patterns (other features show setup instructions)

### Implementation
- **Check AI Provider**: On assistant load, check if AI provider is configured
- **Show Setup UI**: If not configured, show setup instructions in chat interface
  - Link to infrastructure settings
  - Step-by-step guide
  - Provider-specific instructions (Ollama, OpenAI, etc.)
- **Enable After Setup**: Once configured, assistant becomes functional

### Setup Instructions UI
```typescript
<AssistantSetupPrompt>
  <Heading>AI Assistant requires AI provider configuration</Heading>
  <Steps>
    <Step>Navigate to Infrastructure Settings</Step>
    <Step>Configure at least one AI provider</Step>
    <Step>Return here to use the assistant</Step>
  </Steps>
  <Link href="/settings/infrastructure">Go to Infrastructure Settings</Link>
</AssistantSetupPrompt>
```

### Alternatives Considered
- **Hide feature entirely**: Poor UX, user doesn't know feature exists
- **Generic error**: Not helpful, doesn't guide user to solution

### Error Messages
- Clear, actionable error messages
- Link to relevant documentation
- Provider-specific guidance

---

## 9. Streaming Responses (Future Consideration)

### Decision
**Not implemented in MVP**. Use standard request-response pattern. Can add streaming later if needed.

### Rationale
- Current AI Gateway doesn't support streaming (returns complete response)
- Standard request-response is simpler to implement
- Streaming adds complexity (Server-Sent Events, WebSockets, or polling)
- Not critical for configuration assistant (responses are typically short)
- Can add later if user feedback indicates need

### Future Implementation Options
- **Server-Sent Events (SSE)**: Simple, one-way, good for streaming
- **WebSockets**: Bidirectional, overkill for chat
- **Polling**: Simple but inefficient

### Alternatives Considered
- **Implement streaming now**: Adds complexity, not needed for MVP (YAGNI)
- **WebSockets**: Overkill, adds infrastructure complexity

---

## Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chat Architecture | Hybrid (Server + Client Components) | Aligns with Next.js patterns, enables interactivity |
| Conversation Storage | Full database storage with pagination | Persistence, context, multi-device support |
| Documentation Access | Simple file-based retrieval | KISS, sufficient for MVP, can evolve |
| System Prompt | Single comprehensive prompt | Consistent with existing patterns, easier maintenance |
| Config Comparison | On-demand with brief caching | Efficient, only when needed |
| Config Application | YAML-first with validation | Maintains source of truth, ensures correctness |
| Context Scope | Unified assistant, context-aware | Simpler, better UX |
| Missing AI Provider | Show setup instructions | Better UX, educational |
| Streaming | Not in MVP | YAGNI, can add later if needed |

All clarifications resolved. Ready for Phase 1 (Design & Contracts).

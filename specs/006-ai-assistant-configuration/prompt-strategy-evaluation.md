# System Prompt Strategy Evaluation

**Date**: 2026-01-15  
**Purpose**: Evaluate best practices for system prompt design, context injection, and tool usage

## Current Approach (Per Research)

Based on `research.md`, the current strategy is:
- **Static system prompt** (no variables)
- **Context injection via user message** (similar to AI triage pattern)
- **Documentation included in user message context** (on-demand, relevant sections only)
- **No function calling/tools** (simple approach for MVP)

## Evaluation Questions

### 1. Should the system prompt have variables?

**Current**: Static prompt, context in user message  
**Alternative**: Template variables in system prompt

**Evaluation**:
- ✅ **Current approach is better**: Variables in system prompt would require rebuilding the prompt for each request, losing caching benefits
- ✅ **User message context is more flexible**: Can include different context types (project vs infrastructure) without prompt modification
- ✅ **Follows existing pattern**: AI triage uses the same pattern (static prompt + context in user message)
- ❌ **Variables would add complexity**: Need to manage template rendering, caching becomes harder

**Recommendation**: **Keep static prompt, inject context via user message** ✅

### 2. Should documentation be sent along with the prompt?

**Current**: Documentation included in user message context (relevant sections only)  
**Alternatives**:
- Full documentation in system prompt
- Full documentation in user message
- Documentation via function calling

**Evaluation**:

#### Option A: Full Documentation in System Prompt
- ❌ **Token bloat**: Would make system prompt huge (100K+ tokens)
- ❌ **Cost**: Every request pays for full documentation
- ❌ **Context window limits**: May exceed model limits
- ❌ **Maintenance**: Hard to update documentation without prompt changes

#### Option B: Full Documentation in User Message
- ❌ **Token bloat**: Same issues as system prompt
- ❌ **Irrelevant content**: Most docs won't be relevant to each query
- ✅ **Easier to update**: Can change without prompt modification

#### Option C: Relevant Documentation in User Message (Current)
- ✅ **Efficient**: Only relevant sections included
- ✅ **Cost-effective**: Minimal token usage
- ✅ **Flexible**: Can adjust based on query
- ✅ **Maintainable**: Documentation changes don't require prompt updates
- ⚠️ **Requires good retrieval**: Need accurate keyword matching (current doc-index.ts)

#### Option D: Documentation via Function Calling
- ✅ **On-demand**: Only retrieve what model needs
- ✅ **Most efficient**: Model decides what to fetch
- ✅ **Scalable**: Can handle large documentation sets
- ⚠️ **Complexity**: Requires function calling support
- ⚠️ **Latency**: Multiple round trips (query → function call → response)
- ⚠️ **Not in MVP scope**: Research decided on simple approach

**Recommendation**: **Keep current approach (Option C) for MVP, consider Option D for future** ✅

### 3. What is best practice for giving the prompt context?

**Best Practices** (based on industry standards):

1. **System Prompt**: Define role, capabilities, guidelines (static, cached)
2. **User Message**: Include dynamic context (current state, query, relevant docs)
3. **Conversation History**: Include in user message (sliding window)
4. **Structured Context**: Use clear sections/separators

**Current Implementation Pattern** (from AI triage):
```typescript
// System prompt: Static, defines role
const systemPrompt = await loadSystemPrompt();

// User message: Dynamic context
const userMessage = buildUserMessage(context, projectConfig);
// Includes:
// - User query
// - Current configuration
// - Relevant documentation
// - Project-specific context
```

**Recommendation**: **Follow current pattern, enhance with structured sections** ✅

### 4. Do we need to create tools (function calling)?

**Current**: No tools, context injection only  
**Alternative**: Function calling for on-demand data retrieval

**Evaluation**:

#### Benefits of Function Calling:
1. **Efficiency**: Model only requests what it needs
2. **Scalability**: Can handle large documentation sets without token bloat
3. **Accuracy**: Model can request specific sections based on understanding
4. **Flexibility**: Can add tools for:
   - `get_documentation(section: string)` - Retrieve specific doc section
   - `get_current_config(project_id: string)` - Get current project config
   - `compare_configs(project_id: string)` - Compare YAML vs DB
   - `validate_config(config: object)` - Validate against schema

#### Drawbacks:
1. **Complexity**: Requires function calling support in AI Gateway
2. **Latency**: Multiple round trips (query → function call → response)
3. **Provider Support**: Need to verify all providers support function calling
4. **Not in MVP**: Research decided on simple approach (YAGNI)

#### When to Use Tools:
- ✅ Large documentation sets (>100K tokens)
- ✅ Frequently changing data (real-time configs)
- ✅ Complex queries requiring multiple data sources
- ✅ Need for model to decide what to fetch

#### When Context Injection is Better:
- ✅ Small to medium documentation sets (<50K tokens)
- ✅ Static or slowly changing data
- ✅ Simple queries with predictable context needs
- ✅ MVP/early development (simpler to implement)

**Current Situation**:
- Documentation: ~20-30 markdown files, ~50K tokens total
- Configs: Small JSON objects (<5K tokens)
- Queries: Typically need 1-3 doc sections

**Recommendation**: **Stick with context injection for MVP, plan tools for Phase 2+** ✅

## Recommended Strategy

### Phase 1 (MVP) - Current Approach ✅
1. **Static system prompt** (no variables)
2. **Context injection via user message**:
   - User query
   - Current project/infrastructure config
   - Relevant documentation sections (keyword-matched)
   - Conversation history (sliding window, last 20 messages)
3. **Prompt builder** (T009) handles context assembly

### Phase 2+ (Future Enhancement) - Consider Tools
If we encounter:
- Token limit issues (context too large)
- Poor retrieval accuracy (keyword matching insufficient)
- Need for real-time data (configs change frequently)
- Complex multi-step queries

Then implement function calling with tools:
- `get_documentation(topic: string, section?: string)`
- `get_project_config(project_id: string)`
- `compare_yaml_db(project_id: string)`
- `validate_config_schema(config: object)`

## Implementation Recommendations

### Enhance Current Approach (MVP)

1. **Structured Context Sections** in user message:
```typescript
// Clear separators for different context types
const userMessage = `
## User Query
${userQuery}

## Current Configuration
${JSON.stringify(currentConfig, null, 2)}

## Relevant Documentation
${relevantDocs.map(doc => `### ${doc.title}\n${doc.content}`).join('\n\n')}

## Conversation History
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
`;
```

2. **Improve Documentation Retrieval**:
   - Enhance keyword matching (fuzzy matching, synonyms)
   - Add section-level retrieval (not just file-level)
   - Cache parsed documentation in memory

3. **Context Window Management**:
   - Implement sliding window for conversation (last 20 messages)
   - Prioritize recent messages and system prompt
   - Truncate documentation if needed (keep most relevant)

### Future: Function Calling Implementation

If we move to tools, structure would be:

```typescript
// Tool definitions
const tools = [
  {
    type: "function",
    function: {
      name: "get_documentation",
      description: "Retrieve documentation section by topic",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Documentation topic" },
          section: { type: "string", description: "Optional section name" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_project_config",
      description: "Get current project configuration",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string" }
        }
      }
    }
  }
];

// Model can call these functions as needed
```

## Conclusion

**For MVP**: Current approach (static prompt + context injection) is optimal ✅
- Simple to implement
- Sufficient for current needs
- Follows existing patterns
- Cost-effective

**For Future**: Consider function calling if we hit limitations
- Better for large documentation sets
- More efficient for complex queries
- Enables real-time data access
- Requires more implementation complexity

**Action Items**:
1. ✅ Keep current static prompt approach
2. ✅ Enhance prompt builder (T009) with structured context sections
3. ✅ Improve documentation retrieval accuracy
4. 📋 Document function calling as future enhancement option
5. 📋 Monitor token usage and retrieval accuracy in production

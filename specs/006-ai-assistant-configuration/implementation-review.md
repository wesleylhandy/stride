# Implementation Review: T009-T010 vs Best Practices

**Date**: 2026-01-23  
**Reviewer**: AI Engineering Best Practices Evaluation  
**Scope**: Prompt Builder (T009) and Documentation Retrieval (T010)

## Executive Summary

**Overall Assessment**: ⚠️ **Needs Improvement**

The current implementation follows the basic pattern recommended in `prompt-strategy-evaluation.md`, but has **critical deviations** from AI/Context Engineering best practices that should be addressed before Phase 3 implementation.

**Critical Issues**: 3  
**Important Issues**: 4  
**Minor Improvements**: 3

---

## Critical Issues (Must Fix)

### 1. ❌ **Config Data in System Prompt** (Line 60-78 in prompt-builder.ts)

**Problem**:
```typescript
function buildSystemPrompt(baseSystemPrompt: string, context: PromptContext): string {
  let enhancedPrompt = baseSystemPrompt;
  
  // BAD: Adding dynamic config to system prompt
  if (context.projectConfigYaml) {
    enhancedPrompt += `\n\n## Current Project Configuration (YAML)\n\n...`;
  }
  // ... more dynamic content
}
```

**Why This Is Wrong**:
- **Violates best practice**: System prompt should be **static** and **cacheable**
- **Breaks caching**: System prompt changes per request, cannot cache
- **Inconsistent with AI triage pattern**: AI triage puts all dynamic context in user message
- **Evaluation recommendation**: "System Prompt: Define role, capabilities, guidelines (static, cached)"

**Impact**: 
- Performance degradation (no prompt caching)
- Increased token costs (system prompt recalculated every time)
- Inconsistent with established patterns

**Fix**: Move all config data to user message context.

---

### 2. ❌ **No Token Budget Management**

**Problem**: No tracking or limiting of total context size.

**Why This Is Critical**:
- Risk of exceeding model context limits (e.g., GPT-4: 128K, but many models: 32K)
- No prioritization when context is too large
- Can cause silent truncation or API errors
- Documentation files can be large (some markdown files 10K+ tokens)

**Best Practice**:
- Implement token counting/budgeting
- Prioritize: system prompt < conversation history < current query < docs
- Truncate intelligently (oldest messages, least relevant docs first)

**Impact**: Production failures, unpredictable behavior

---

### 3. ❌ **Documentation Formatting in Code Blocks**

**Problem** (Line 144-151 in doc-retrieval.ts):
```typescript
return `## Documentation Reference ${index + 1}: ${doc.reference.file}

**Content**:
\`\`\`markdown
${doc.content}
\`\`\`
`;
```

**Why This Is Wrong**:
- **Double encoding**: Markdown inside markdown code blocks loses formatting benefits
- **Token waste**: Code fences add unnecessary tokens
- **LLM confusion**: Model sees "this is code" not "this is documentation content"

**Best Practice**: Include markdown content directly (no code fences), strip frontmatter if present.

**Impact**: Reduced accuracy, wasted tokens, worse model understanding

---

## Important Issues (Should Fix)

### 4. ⚠️ **Context Ordering Not Optimal**

**Current Order** (Line 87-119 in prompt-builder.ts):
1. Conversation history
2. Documentation
3. User query

**Recommended Order** (per evaluation doc):
1. **User query** (most important - should be first)
2. Current configuration (YAML + DB)
3. Relevant documentation
4. Conversation history (contextual background)

**Why**: LLM attention focuses on early content. User's question should be prominent.

**Impact**: Reduced relevance/accuracy of responses

---

### 5. ⚠️ **No Section-Level Documentation Retrieval**

**Problem**: Retrieves entire files, not specific sections (even though doc-index.ts supports sections).

**Current** (doc-retrieval.ts line 81-82):
```typescript
const content = loadDocumentationFile(ref.file);  // Gets entire file
```

**Best Practice**:
- Parse markdown and extract specific sections (doc.reference.section)
- Only include relevant sections to reduce token usage
- More precise context = better accuracy

**Impact**: Token bloat, less relevant context

---

### 6. ⚠️ **No Documentation Caching**

**Problem**: Files read from disk on every request.

**Why This Matters**:
- Disk I/O on every request (slow)
- No deduplication if same docs retrieved multiple times
- No memory optimization

**Best Practice**: 
- Cache parsed documentation in memory with TTL
- Cache key: file path + modification time
- Clear cache on file changes (or TTL-based refresh)

**Impact**: Performance degradation, unnecessary I/O

---

### 7. ⚠️ **No Documentation Length Limits**

**Problem**: Large documentation files included in full (could be 10K+ tokens each).

**Best Practice**:
- Implement max length per doc (e.g., 2000 tokens)
- Truncate intelligently (keep beginning + relevant sections)
- Prioritize shorter, more relevant docs

**Impact**: Token budget violations, context overflow

---

## Minor Improvements

### 8. 💡 **Conversation History Format Could Be Clearer**

**Current** (Line 95-97):
```typescript
const roleLabel = message.role === "user" ? "User" : "Assistant";
parts.push(`**${roleLabel}**: ${message.content}\n`);
```

**Better**:
```typescript
// Use clearer separators, maybe timestamps for long conversations
parts.push(`[${message.role.toUpperCase()}]: ${message.content}\n`);
```

---

### 9. 💡 **Missing Context Metadata**

**Best Practice**: Add metadata about context sources:
```typescript
// At end of user message:
// ---
// Context: 5 docs retrieved, 12 messages in history, config from project ABC
```

Helps with debugging and token tracking.

---

### 10. 💡 **No Relevance Scoring for Documentation**

**Current**: Simple keyword matching (basic but works).

**Future Enhancement**: Score docs by relevance, prioritize highest-scoring.

---

## Alignment with Evaluation Document

| Evaluation Recommendation | Current Implementation | Status |
|---------------------------|------------------------|--------|
| Static system prompt | ❌ Dynamic config added to system prompt | **FAIL** |
| Context in user message | ✅ Config in user message (but also in system) | **PARTIAL** |
| Structured sections | ✅ Clear markdown sections | **PASS** |
| Sliding window (last 20) | ✅ Implemented in context-manager.ts | **PASS** |
| Relevant docs only | ✅ Keyword matching filters | **PASS** |
| Clear separators | ✅ Markdown headers used | **PASS** |
| Token management | ❌ No token counting/budgeting | **FAIL** |
| Doc caching | ❌ Not implemented | **FAIL** |
| Section-level retrieval | ❌ Entire files retrieved | **FAIL** |

**Score: 5/9 passing** (55%)

---

## Recommended Fixes (Priority Order)

### P0: Critical (Do Before Phase 3)

1. **Move config from system prompt to user message**
   - Keep system prompt completely static
   - Add config sections to user message context
   - Test caching works (system prompt should cache)

2. **Implement token budgeting**
   - Add token counting utility (approximate: ~4 chars = 1 token)
   - Set budget limits (e.g., system: 2K, docs: 10K, history: 8K, query: 1K)
   - Implement truncation when over budget

3. **Fix documentation formatting**
   - Remove markdown code fences
   - Include markdown content directly
   - Strip YAML frontmatter if present

### P1: Important (Do Soon)

4. **Re-order context sections** (query first)
5. **Add documentation caching** (in-memory with TTL)
6. **Implement section-level retrieval** (parse markdown sections)
7. **Add documentation length limits** (truncate long docs)

### P2: Nice to Have (Future)

8. Improve conversation history formatting
9. Add context metadata
10. Implement relevance scoring for docs

---

## Code Changes Required

### Fix 1: Move Config to User Message

**Before** (prompt-builder.ts):
```typescript
function buildSystemPrompt(baseSystemPrompt: string, context: PromptContext): string {
  let enhancedPrompt = baseSystemPrompt;
  if (context.projectConfigYaml) {
    enhancedPrompt += `\n\n## Current Project Configuration...`;
  }
  return enhancedPrompt;
}
```

**After**:
```typescript
function buildSystemPrompt(baseSystemPrompt: string): string {
  // System prompt is ALWAYS static
  return baseSystemPrompt;
}

function buildUserMessage(context: PromptContext): string {
  const parts: string[] = [];
  
  // 1. User query FIRST (most important)
  parts.push("## User Query\n\n");
  parts.push(context.userQuery);
  parts.push("\n");
  
  // 2. Current configuration
  if (context.projectConfigYaml) {
    parts.push("## Current Project Configuration (YAML)\n\n");
    parts.push("```yaml\n");
    parts.push(context.projectConfigYaml);
    parts.push("\n```\n\n");
  }
  
  if (context.projectConfigDatabase) {
    parts.push("## Current Project Configuration (Database)\n\n");
    parts.push("```json\n");
    parts.push(JSON.stringify(context.projectConfigDatabase, null, 2));
    parts.push("\n```\n\n");
  }
  
  // 3. Relevant documentation
  if (context.documentation && context.documentation.length > 0) {
    parts.push(formatDocumentationForPrompt(context.documentation));
    parts.push("\n");
  }
  
  // 4. Conversation history (background context)
  if (context.conversationContext.messages.length > 0) {
    parts.push("## Conversation History\n");
    // ... format messages
  }
  
  return parts.join("\n");
}
```

### Fix 2: Token Budgeting

Add new file: `apps/web/src/lib/assistant/token-budget.ts`:
```typescript
// Token estimation and budgeting
const TOKEN_BUDGET = {
  system: 2000,
  userQuery: 1000,
  conversationHistory: 8000,
  documentation: 10000,
  configuration: 5000,
  total: 25000, // Conservative limit for 32K context models
};

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export function checkTokenBudget(sections: Record<string, string>): {
  withinBudget: boolean;
  total: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};
  let total = 0;
  
  for (const [key, content] of Object.entries(sections)) {
    const tokens = estimateTokens(content);
    breakdown[key] = tokens;
    total += tokens;
  }
  
  return {
    withinBudget: total <= TOKEN_BUDGET.total,
    total,
    breakdown,
  };
}
```

### Fix 3: Documentation Formatting

**Before** (doc-retrieval.ts):
```typescript
return `## Documentation Reference ${index + 1}: ${doc.reference.file}

**Content**:
\`\`\`markdown
${doc.content}
\`\`\`
`;
```

**After**:
```typescript
// Strip YAML frontmatter if present
function stripFrontmatter(content: string): string {
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('\n---\n', 3);
    if (endIndex !== -1) {
      return content.slice(endIndex + 5);
    }
  }
  return content;
}

return `## Documentation Reference ${index + 1}: ${doc.reference.file}${sectionAnchor}

**Description**: ${doc.reference.description}

${stripFrontmatter(doc.content)}
`;
```

---

## Conclusion

**Recommendation**: **Implement P0 fixes before proceeding to Phase 3**.

The current implementation is **functional but not optimal**. Critical issues around system prompt caching and token management could cause production problems. The fixes are straightforward and align with established best practices.

**Estimated Effort**:
- P0 fixes: 2-3 hours
- P1 fixes: 4-6 hours
- P2 improvements: Future enhancement

**Risk of Not Fixing**: Medium-High
- System prompt caching failure = performance degradation
- Token overflow = API errors in production
- Documentation formatting = reduced accuracy

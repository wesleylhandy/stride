# Research & Technical Decisions: AI Chat Documentation Accuracy and Streaming

**Created**: 2025-01-27  
**Purpose**: Resolve all NEEDS CLARIFICATION items from implementation plan

## 1. Provider Streaming API Support

### Decision
All supported providers (OpenAI, Anthropic, Google Gemini, Ollama) support streaming via their APIs, but implementation details differ.

### Rationale
- **OpenAI**: Supports streaming via `stream: true` parameter in chat completions endpoint. Returns Server-Sent Events (SSE) format with `data:` prefixed JSON chunks.
- **Anthropic**: Supports streaming via `stream: true` parameter in messages endpoint. Returns SSE format with event types (`message_start`, `content_block_delta`, `message_delta`, etc.).
- **Google Gemini**: Supports streaming via `streamGenerateContent` API or `stream` parameter. Returns incremental response chunks.
- **Ollama**: Supports streaming via `stream: true` parameter in chat endpoint. Returns JSON lines format (one JSON object per line).

### Implementation
- **Unified Streaming Interface**: Create provider-agnostic streaming adapter that normalizes all provider streaming formats to a common SSE format
- **Provider-Specific Handlers**: Each provider handler converts native streaming format to standardized format
- **Fallback Support**: If provider doesn't support streaming, fall back to non-streaming request (backward compatibility)

### Format Normalization
All providers' streaming responses will be normalized to SSE format:
```
event: chunk
data: {"content": "partial response text", "done": false}

event: done
data: {"content": "", "done": true}

event: error
data: {"error": "error message"}
```

### Alternatives Considered
- **Provider-specific client handling**: Too complex, harder to maintain
- **WebSocket instead of SSE**: Overkill, bidirectional not needed, adds complexity

---

## 2. Tool Calling with Streaming Responses

### Decision
Tool calling with streaming is supported by OpenAI and Anthropic, but not required for initial implementation. Focus on content streaming first, tool calling can be added later.

### Rationale
- **OpenAI**: Supports function calling with streaming via `function_call` in streaming chunks
- **Anthropic**: Supports tool use with streaming via `tool_use` blocks in streaming responses
- **Google Gemini**: Tool calling support varies by model, not all models support it
- **Ollama**: Tool calling support depends on model, not guaranteed

### Implementation
- **Phase 1**: Implement content streaming only (text chunks)
- **Phase 2**: Add tool calling support after content streaming is stable
- **Event Types**: Define separate SSE event types for tool calls (`event: tool_call`, `event: tool_result`) for future extensibility

### Tool Call Event Format (Future)
```
event: tool_call
data: {"id": "call_123", "name": "get_documentation", "arguments": {...}}

event: tool_result
data: {"id": "call_123", "result": {...}}
```

### Alternatives Considered
- **Implement tool calling immediately**: Adds complexity, delays core feature (YAGNI)
- **Skip tool calling entirely**: Limits future capabilities, but acceptable for MVP

---

## 3. SSE Event Format for AI Response Streaming

### Decision
Use Server-Sent Events (SSE) format with JSON payloads for streaming AI responses.

### Rationale
- **Standard Protocol**: SSE is a standard web API, well-supported in browsers and Next.js
- **One-Way Communication**: Perfect for server-to-client streaming (AI responses)
- **Automatic Reconnection**: Browsers handle reconnection automatically
- **Simple Implementation**: Easier than WebSockets, sufficient for this use case
- **Next.js Support**: Next.js 16 supports streaming via ReadableStream, can convert to SSE

### Event Types
1. **`chunk`**: Incremental content updates
   ```
   event: chunk
   data: {"content": "partial text", "done": false}
   ```
2. **`done`**: Stream completion
   ```
   event: done
   data: {"done": true}
   ```
3. **`error`**: Error during streaming
   ```
   event: error
   data: {"error": "error message"}
   ```
4. **`tool_call`**: Tool calling event (future)
   ```
   event: tool_call
   data: {"id": "...", "name": "...", "arguments": {...}}
   ```

### Implementation
- **Server**: Use `ReadableStream` from provider APIs, convert to SSE format
- **Client**: Use `EventSource` API or fetch with streaming to consume SSE
- **Error Handling**: Send error events for provider errors, network failures

### Alternatives Considered
- **WebSockets**: Overkill, bidirectional not needed, adds infrastructure complexity
- **Long Polling**: Inefficient, not real-time, adds latency
- **Chunked HTTP**: Works but SSE provides better error handling and reconnection

---

## 4. Documentation Validation Caching Strategy

### Decision
Use in-memory cache with file system stat checks for documentation validation to meet 100ms requirement.

### Rationale
- **Performance Requirement**: SC-006 requires validation within 100ms
- **File System Checks**: `fs.existsSync()` and `fs.statSync()` are fast (< 10ms per file)
- **Caching Strategy**: Cache file existence checks with 5-minute TTL (files rarely change during request)
- **Cache Invalidation**: Clear cache on file system changes (watch for doc changes in dev, clear on deploy)

### Implementation
- **Cache Structure**: `Map<string, { exists: boolean, lastChecked: number }>`
- **Cache Key**: Normalized file path (e.g., `docs/configuration/reference.md`)
- **TTL**: 5 minutes (300000ms) - balance between performance and freshness
- **Validation**: For each doc reference, check cache; if expired or missing, check file system and update cache

### Cache Strategy
```typescript
interface DocCacheEntry {
  exists: boolean;
  lastChecked: number;
}

const DOC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const docCache = new Map<string, DocCacheEntry>();

function validateDocPath(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  const cached = docCache.get(normalized);
  const now = Date.now();
  
  if (cached && (now - cached.lastChecked) < DOC_CACHE_TTL) {
    return cached.exists;
  }
  
  const exists = existsSync(filePath);
  docCache.set(normalized, { exists, lastChecked: now });
  return exists;
}
```

### Performance Estimates
- **Cache Hit**: < 1ms (Map lookup)
- **Cache Miss**: ~5-10ms (fs.existsSync + Map set)
- **Batch Validation**: For 5 docs, ~25-50ms (well under 100ms requirement)

### Alternatives Considered
- **No Caching**: Too slow for batch validation (could exceed 100ms with multiple files)
- **Persistent Cache**: Unnecessary complexity, in-memory sufficient for request duration
- **Event-Based Invalidation**: Complex, file watching overhead not worth it for this use case

---

## 5. Concurrent Streaming Request Handling

### Decision
Use Node.js ReadableStream with proper resource management. Limit concurrent streaming connections to prevent resource exhaustion.

### Rationale
- **Resource Limits**: Each streaming connection holds a provider API connection and memory buffer
- **Provider Limits**: AI providers may have rate limits on concurrent connections
- **Memory Management**: Streaming responses buffer content, too many concurrent streams can exhaust memory
- **Connection Limits**: Next.js/Node.js has limits on concurrent connections

### Implementation
- **Connection Pooling**: Track active streaming connections per project/user
- **Rate Limiting**: Limit to 50 concurrent streaming requests (per SC-007 requirement)
- **Resource Cleanup**: Properly close streams on error, timeout, or completion
- **Timeout Handling**: Set 5-minute timeout for streaming responses (prevent hung connections)

### Connection Management
```typescript
interface StreamingConnection {
  id: string;
  projectId: string;
  startedAt: number;
  stream: ReadableStream;
}

const activeStreams = new Map<string, StreamingConnection>();
const MAX_CONCURRENT_STREAMS = 50;

function canStartStream(projectId: string): boolean {
  const active = Array.from(activeStreams.values())
    .filter(s => s.projectId === projectId).length;
  return active < MAX_CONCURRENT_STREAMS;
}
```

### Error Handling
- **Connection Limit Exceeded**: Return 429 (Too Many Requests) with retry-after header
- **Stream Timeout**: Close stream after 5 minutes, send error event to client
- **Provider Error**: Forward error event to client, close stream gracefully
- **Client Disconnect**: Detect client disconnect, cancel provider request, clean up resources

### Alternatives Considered
- **No Limits**: Risk of resource exhaustion, poor user experience under load
- **Per-User Limits**: Too complex, not needed for current scale
- **Queue System**: Overkill, adds latency, complicates implementation

---

## Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Streaming Protocol | Server-Sent Events (SSE) | Standard, one-way, simple, well-supported |
| Provider Streaming | Normalize to SSE format | Unified interface, provider-agnostic |
| Tool Calling | Deferred to Phase 2 | YAGNI, focus on content streaming first |
| Validation Caching | In-memory cache (5min TTL) | Meets 100ms requirement, simple |
| Concurrent Streaming | Limit to 50 connections | Prevents resource exhaustion, per SC-007 |
| Error Handling | SSE error events + graceful cleanup | User-friendly, prevents resource leaks |

---

## Next Steps

1. **Phase 1**: Implement documentation validation with caching
2. **Phase 1**: Implement provider streaming adapters (OpenAI, Anthropic first)
3. **Phase 1**: Implement SSE endpoint conversion
4. **Phase 1**: Add client-side SSE consumption
5. **Phase 2**: Add tool calling support (future enhancement)

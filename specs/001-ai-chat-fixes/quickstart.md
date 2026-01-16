# Quickstart: AI Chat Documentation Accuracy and Streaming

**Feature**: AI Chat Documentation Accuracy and Streaming  
**Created**: 2025-01-27

## Overview

This feature implements two improvements to the AI Chat integration:

1. **Documentation Link Accuracy**: Pre-validate documentation paths before including them in AI prompts to prevent hallucinated or broken links
2. **Server Event Streaming**: Enable streaming AI responses via Server-Sent Events (SSE) for better perceived performance

## Prerequisites

- Next.js 16+ application with App Router
- Existing AI chat integration (`apps/web/src/lib/assistant/ai-chat.ts`)
- Documentation files in `docs/` directory at repository root
- AI provider configured (OpenAI, Anthropic, Gemini, or Ollama)

## Setup

### 1. Documentation Validation

The validation system automatically validates documentation paths before including them in AI prompts.

**File Paths**:
- `apps/web/src/lib/assistant/doc-validation.ts` - Documentation validation service
- `apps/web/src/lib/assistant/prompt-builder.ts` - Updated to use validated docs

**Configuration**:
- Set `NEXT_PUBLIC_GITHUB_REPOSITORY_URL` environment variable for GitHub URL generation
- Set `GITHUB_DEFAULT_BRANCH` environment variable (defaults to "main")

**Validation Caching**:
- Validation results are cached in-memory for 5 minutes
- Cache automatically refreshes on next validation
- No manual cache management required

### 2. Streaming Support

Streaming is enabled via `Accept: text/event-stream` header or `stream: true` parameter.

**Server-Side Implementation**:
- `apps/web/app/api/projects/[projectId]/assistant/chat/route.ts` - Updated for streaming
- `apps/web/app/api/settings/infrastructure/assistant/chat/route.ts` - Updated for streaming
- `apps/web/src/lib/assistant/streaming.ts` - Streaming utilities

**Client-Side Consumption**:
```typescript
// Using EventSource API
const eventSource = new EventSource('/api/projects/proj123/assistant/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello', sessionId: 'sess_123' })
});

eventSource.addEventListener('chunk', (event) => {
  const data = JSON.parse(event.data);
  console.log('Chunk:', data.content);
});

eventSource.addEventListener('done', () => {
  eventSource.close();
});
```

**Or using fetch with streaming**:
```typescript
const response = await fetch('/api/projects/proj123/assistant/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({ message: 'Hello', sessionId: 'sess_123' })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE format and handle chunks
}
```

## Usage Examples

### Documentation Validation

Validation happens automatically during prompt construction:

```typescript
import { buildPromptWithDocumentation } from '@/lib/assistant/prompt-builder';

// Documentation paths are validated before inclusion
const prompt = await buildPromptWithDocumentation({
  conversationContext,
  userQuery: 'How do I configure custom fields?',
  projectConfigYaml,
});

// Invalid documentation paths are filtered out
// Only valid paths are included in system prompt
```

### Streaming Chat

Enable streaming by setting the `Accept` header:

```typescript
// Client-side
const response = await fetch('/api/projects/proj123/assistant/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream' // Enables streaming
  },
  body: JSON.stringify({
    message: 'How do I configure workflows?',
    sessionId: 'sess_123'
  })
});
```

### Non-Streaming Chat (Backward Compatible)

Non-streaming still works as before:

```typescript
// Client-side
const response = await fetch('/api/projects/proj123/assistant/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json' // Non-streaming
  },
  body: JSON.stringify({
    message: 'How do I configure workflows?',
    sessionId: 'sess_123'
  })
});

const data = await response.json();
console.log(data.assistantMessage.content);
```

## Testing

### Documentation Validation

Test validation by checking documentation paths:

```typescript
import { validateDocumentationPath } from '@/lib/assistant/doc-validation';

// Valid path
const valid = validateDocumentationPath('configuration/reference.md');
// Returns: { isValid: true, filePath: 'docs/configuration/reference.md' }

// Invalid path
const invalid = validateDocumentationPath('nonexistent/file.md');
// Returns: { isValid: false, error: 'File not found' }
```

### Streaming

Test streaming with curl:

```bash
curl -X POST http://localhost:3000/api/projects/proj123/assistant/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Hello", "sessionId": "sess_123"}' \
  --no-buffer

# Expected output:
# event: chunk
# data: {"content": "Hello", "done": false}
#
# event: chunk
# data: {"content": " there", "done": false}
#
# event: done
# data: {"done": true}
```

## Troubleshooting

### Documentation Links Still Broken

1. **Check file existence**: Verify files exist in `docs/` directory
2. **Check GitHub URL**: Ensure `NEXT_PUBLIC_GITHUB_REPOSITORY_URL` is set
3. **Clear cache**: Restart server to clear validation cache
4. **Check path format**: Paths must be relative to `docs/` directory

### Streaming Not Working

1. **Check Accept header**: Must be `text/event-stream` for streaming
2. **Check provider support**: Verify provider supports streaming (all providers do)
3. **Check connection limits**: Ensure under 50 concurrent streaming connections
4. **Check network**: Verify client supports SSE (EventSource or fetch streaming)

### Validation Performance Issues

1. **Check cache**: Validation should be cached for 5 minutes
2. **Check file system**: File system checks should be fast (< 10ms)
3. **Check batch size**: Reduce number of docs validated per request
4. **Check server load**: High load can impact file system access

## Performance Targets

- **Validation**: < 100ms per validation (SC-006)
- **First Chunk**: < 2 seconds from request to first chunk (SC-003)
- **Streaming Success**: 99% of streaming responses complete without errors (SC-004)
- **Concurrent Requests**: Support 50 concurrent streaming requests (SC-007)

## Next Steps

1. **Phase 1**: Implement documentation validation with caching
2. **Phase 1**: Implement provider streaming adapters
3. **Phase 1**: Implement SSE endpoint conversion
4. **Phase 1**: Add client-side SSE consumption
5. **Phase 2**: Add tool calling support (future)

## Related Documentation

- **Specification**: `specs/012-ai-chat-fixes/spec.md`
- **Research**: `specs/012-ai-chat-fixes/research.md`
- **Data Model**: `specs/012-ai-chat-fixes/data-model.md`
- **API Contracts**: `specs/012-ai-chat-fixes/contracts/api.yaml`

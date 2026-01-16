# Data Model: AI Chat Documentation Accuracy and Streaming

**Feature**: AI Chat Documentation Accuracy and Streaming  
**Created**: 2025-01-27

## Overview

This document defines the data structures and types for documentation validation and streaming AI responses.

## Core Entities

### Documentation Reference

Represents a link to a documentation file with validation information.

```typescript
interface DocumentationReference {
  /** Relative file path from docs/ directory (e.g., "configuration/reference.md") */
  file: string;
  
  /** Optional section anchor (e.g., "getting-started") */
  section?: string;
  
  /** Topics/keywords for this documentation */
  topics: string[];
  
  /** Human-readable description */
  description: string;
}
```

### Validation Result

Result of validating a documentation reference against the file system.

```typescript
interface DocValidationResult {
  /** The documentation reference being validated */
  reference: DocumentationReference;
  
  /** Whether the file exists */
  isValid: boolean;
  
  /** Validated file path (absolute or relative) */
  filePath: string;
  
  /** Error message if validation failed */
  error?: string;
  
  /** Timestamp when validation occurred */
  validatedAt: Date;
}
```

### Validated Documentation

Documentation reference with content and validation metadata.

```typescript
interface ValidatedDocumentation {
  /** The documentation reference */
  reference: DocumentationReference;
  
  /** File content (markdown) */
  content: string;
  
  /** Absolute file path */
  filePath: string;
  
  /** Whether this reference passed validation */
  isValid: boolean;
  
  /** GitHub repository URL (if configured) */
  githubUrl?: string;
}
```

### Streaming Response Chunk

Incremental content update in a streaming response.

```typescript
interface StreamingChunk {
  /** Partial content text */
  content: string;
  
  /** Whether this is the final chunk */
  done: boolean;
  
  /** Optional tool call information (future) */
  toolCall?: ToolCall;
  
  /** Optional error information */
  error?: string;
}
```

### Tool Call (Future)

Tool calling information in streaming response.

```typescript
interface ToolCall {
  /** Unique identifier for this tool call */
  id: string;
  
  /** Tool/function name */
  name: string;
  
  /** Tool arguments (JSON) */
  arguments: Record<string, unknown>;
  
  /** Optional result if tool call completed */
  result?: unknown;
}
```

### Streaming Response Metadata

Metadata about a streaming response.

```typescript
interface StreamingMetadata {
  /** Session ID */
  sessionId: string;
  
  /** User message ID */
  userMessageId: string;
  
  /** Assistant message ID (created on completion) */
  assistantMessageId?: string;
  
  /** Whether streaming completed successfully */
  completed: boolean;
  
  /** Error if streaming failed */
  error?: string;
  
  /** Total content length (on completion) */
  totalLength?: number;
  
  /** Number of chunks received */
  chunkCount: number;
  
  /** Timestamp when streaming started */
  startedAt: Date;
  
  /** Timestamp when streaming completed */
  completedAt?: Date;
}
```

### Cache Entry

Documentation validation cache entry.

```typescript
interface DocCacheEntry {
  /** Whether the file exists */
  exists: boolean;
  
  /** Timestamp when cache entry was created */
  lastChecked: number;
}
```

### Connection Pool Entry

Active streaming connection tracking entry.

```typescript
interface StreamingConnection {
  /** Unique connection ID */
  id: string;
  
  /** Project ID or "infrastructure" */
  projectId: string;
  
  /** User ID */
  userId: string;
  
  /** Session ID */
  sessionId: string;
  
  /** Timestamp when connection started */
  startedAt: number;
  
  /** Underlying ReadableStream */
  stream: ReadableStream;
  
  /** AbortController for cleanup */
  abortController: AbortController;
}
```

## Validation Rules

### Documentation Reference Validation

1. **File Path Validation**:
   - Must be relative to `docs/` directory
   - Must not contain `..` (path traversal prevention)
   - Must have `.md` extension
   - Path must exist in file system

2. **Section Anchor Validation**:
   - If provided, must be valid markdown heading anchor
   - Converted to lowercase, spaces to hyphens
   - Must not contain special characters

3. **GitHub URL Construction**:
   - Requires `NEXT_PUBLIC_GITHUB_REPOSITORY_URL` environment variable
   - Format: `{repoUrl}/tree/{branch}/docs/{filePath}#{section}`
   - Branch defaults to "main" if not configured

### Streaming Response Validation

1. **Chunk Content**:
   - Must be non-empty string (unless `done: true`)
   - Maximum chunk size: 10KB (to prevent memory issues)
   - Must be valid UTF-8

2. **Connection Limits**:
   - Maximum 50 concurrent streaming connections (per SC-007)
   - Per-project limit: 10 concurrent connections
   - Connection timeout: 5 minutes

3. **Error Handling**:
   - Provider errors must be forwarded to client
   - Network errors must trigger reconnection logic
   - Client disconnect must cancel provider request

## State Transitions

### Documentation Validation Flow

```
DocumentationReference
  → DocValidationResult (validated against file system)
  → ValidatedDocumentation (if valid, includes content)
  → Included in prompt context (pre-validated paths only)
```

### Streaming Response Flow

```
User Query
  → StreamingMetadata (created)
  → StreamingConnection (established)
  → StreamingChunk[] (incremental updates)
  → StreamingMetadata.completed = true (finalized)
  → AssistantMessage (stored in database)
```

### Cache Entry Lifecycle

```
DocCacheEntry
  → Created on first validation
  → Cached for 5 minutes (TTL)
  → Expired and refreshed on next validation
  → Cleared on file system changes (dev mode)
```

## Database Schema

### No New Tables Required

This feature reuses existing database tables:
- **AssistantMessage**: Stores conversation messages (existing)
- **AssistantSession**: Stores conversation sessions (existing)

No new tables needed - streaming responses are stored as regular messages after completion.

## Type Definitions

### Request/Response Types

```typescript
// Chat request (enhanced for streaming)
interface ChatRequest {
  systemPrompt: string;
  userMessage: string;
  /** Whether to enable streaming */
  stream?: boolean;
}

// Chat response (non-streaming)
interface ChatResponse {
  content: string;
}

// SSE event types
type SSEEventType = 'chunk' | 'done' | 'error' | 'tool_call' | 'tool_result';

// SSE event data
interface SSEEvent {
  type: SSEEventType;
  data: StreamingChunk | ToolCall | { error: string };
}
```

## Relationships

### Documentation Reference → Validation Result
- **One-to-One**: Each reference has one validation result
- **Validation**: Validation result determines if reference is included in prompt

### Streaming Connection → Streaming Metadata
- **One-to-One**: Each connection has one metadata record
- **Tracking**: Metadata tracks connection lifecycle

### Session → Streaming Connections
- **One-to-Many**: One session can have multiple streaming connections (reconnects)
- **Cleanup**: Old connections are cleaned up on completion or error

## Performance Considerations

### Validation Performance
- **Target**: < 100ms per validation (SC-006)
- **Strategy**: In-memory cache with 5-minute TTL
- **Optimization**: Batch validation of multiple references

### Streaming Performance
- **Target**: First chunk within 2 seconds (SC-003)
- **Strategy**: Immediate streaming from provider, no buffering
- **Optimization**: Connection pooling, resource cleanup

### Cache Performance
- **Target**: < 1ms cache lookup
- **Strategy**: In-memory Map with normalized paths as keys
- **Optimization**: Lazy cache population, automatic expiration

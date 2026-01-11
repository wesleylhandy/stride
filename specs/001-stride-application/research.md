# Research & Technical Decisions: Stride Core Application

**Created**: 2024-12-19  
**Purpose**: Resolve all NEEDS CLARIFICATION items from implementation plan

## 1. Prisma JSONB Schema Design for Custom Fields

### Decision
Store custom fields as JSONB column in Issue table with typed accessors.

### Rationale
- Custom fields are defined dynamically via `stride.config.yaml`
- JSONB provides flexibility for varying field structures per project
- PostgreSQL JSONB supports indexing and querying
- Prisma supports JSONB with type-safe accessors

### Implementation
```prisma
model Issue {
  id            String   @id @default(uuid())
  key           String   // e.g., "APP-123"
  title         String
  description   String?  @db.Text
  status        String
  customFields  Json?    @default("{}") // JSONB column
  // ... other fields
}
```

### Alternatives Considered
- Separate `CustomFieldValue` table: More normalized but complex joins and slower queries
- EAV (Entity-Attribute-Value) pattern: Too complex for this use case
- Multiple nullable columns: Doesn't scale with dynamic configuration

### Validation
- Validate custom field values against `stride.config.yaml` schema on create/update
- Use Zod schemas generated from configuration
- Type-safe access via Prisma's JSON types

---

## 2. Webhook Signature Verification

### Decision
Implement HMAC-SHA256 signature verification for all webhook endpoints.

### Rationale
- Industry standard for webhook security
- Prevents unauthorized webhook processing
- Supported by GitHub, GitLab, Bitbucket
- Simple to implement and verify

### Implementation
- GitHub: `X-Hub-Signature-256` header with HMAC-SHA256
- GitLab: `X-Gitlab-Token` header (configurable secret)
- Bitbucket: `X-Hook-UUID` + request body signature
- Store webhook secrets per repository connection
- Verify signature before processing webhook payload

### Alternatives Considered
- IP allowlisting: Less secure, harder to maintain
- Basic auth: Not supported by all providers
- No verification: Security risk

### Security
- Store secrets encrypted in database
- Rotate secrets periodically
- Log failed verification attempts

---

## 3. Link Preview API Implementation

### Decision
Server-side link preview fetching with client-side rendering.

### Rationale
- Prevents CORS issues
- Better security (no client-side API keys)
- Can cache previews server-side
- Works with authentication-required links

### Implementation
- Create API route: `/api/preview-link`
- Use `oembed` or `og:meta` tag parsing
- Cache previews in database or Redis
- Return structured preview data (title, description, thumbnail, URL)
- Client renders preview cards from API response

### Alternatives Considered
- Client-side fetching: CORS issues, exposes API keys
- Third-party service (iframely, linkpreview.net): Additional dependency, cost
- No previews: Poor UX, doesn't meet requirement

### Error Handling
- Timeout after 5 seconds
- Graceful degradation: Show link without preview
- Cache failures to avoid repeated attempts

---

## 4. Mermaid Rendering Strategy

### Decision
Client-side rendering with SSR hydration for initial render.

### Rationale
- Mermaid.js requires browser APIs
- Can pre-render SVG on server for SEO
- Client-side provides interactivity
- Better performance than pure client-side

### Implementation
- Use `mermaid` package in client component
- Server renders placeholder/loading state
- Client hydrates and renders diagram
- Lazy load Mermaid library (code splitting)
- Error boundary for rendering failures

### Alternatives Considered
- Pure server-side: Mermaid doesn't support SSR well
- Pure client-side: Slower initial render, no SEO
- External service: Additional dependency, cost

### Performance
- Lazy load Mermaid only when diagrams present
- Cache rendered SVGs
- Show loading state during render

---

## 5. Configuration File Storage

### Decision
Store configuration in database with Git repository as source of truth.

### Rationale
- Database provides fast access and versioning
- Git repository maintains configuration as code
- Can sync from Git on repository connection
- Supports manual edits through UI
- Version history in database for audit

### Implementation
- Store `stride.config.yaml` content in `Project.configYaml` (text field)
- Store parsed configuration in `Project.config` (JSONB) for fast access
- Sync from Git repository on connection/update
- Validate before saving to database
- Track configuration version/hash

### Alternatives Considered
- Filesystem only: Doesn't work in containerized deployments
- Database only: Loses "configuration as code" benefit
- Git only: Slow access, requires Git operations for every read

### Sync Strategy
- Initial sync: Clone config from repository on connection
- Periodic sync: Check for updates (webhook or polling)
- Manual sync: Admin can trigger sync from UI
- Conflict resolution: Last write wins with admin notification

---

## 6. Session Management

### Decision
Database-backed sessions with HTTP-only cookies.

### Rationale
- Simple to implement and maintain
- Works with any deployment (no Redis dependency)
- Sufficient for MVP scale (50 concurrent users)
- Can migrate to Redis later if needed

### Implementation
- Store sessions in `Session` table (userId, token, expiresAt, createdAt)
- Generate JWT tokens for API authentication
- HTTP-only cookies for web authentication
- Session refresh mechanism
- Cleanup expired sessions via cron job

### Alternatives Considered
- Redis: Better performance but additional dependency
- JWT-only (stateless): Harder to revoke, no session tracking
- Database + Redis: Overkill for MVP

### Migration Path
- Design session interface to allow Redis swap later
- Use repository pattern for session access
- Can add Redis caching layer without changing API

---

## 7. Rate Limiting Strategy

### Decision
Token bucket algorithm with per-user and per-endpoint limits.

### Rationale
- Prevents abuse without blocking legitimate users
- Configurable per endpoint type
- Simple to implement
- Works with database or in-memory store

### Implementation
- Use `@upstash/ratelimit` or similar library
- Per-user limits: 100 requests/minute for authenticated users
- Per-endpoint limits: Stricter for write operations
- Webhook endpoints: Higher limits (1000/hour)
- Return 429 status with Retry-After header

### Alternatives Considered
- Fixed window: Simpler but allows bursts
- Sliding window: More accurate but complex
- No rate limiting: Security risk

### Configuration
- Environment variables for limits
- Different limits per environment (dev/staging/prod)
- Admin override capability for testing

---

## 8. Docker Compose Service Configuration

### Decision
Multi-service Docker Compose with PostgreSQL, Next.js app, and AI Gateway.

### Rationale
- Single command deployment (`docker compose up`)
- Isolated services for scalability
- Easy local development
- Production-ready structure

### Implementation
```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: stride
      POSTGRES_USER: stride
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  
  web:
    build: .
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://stride:${DB_PASSWORD}@postgres:5432/stride
    ports:
      - "3000:3000"
  
  ai-gateway:
    build: ./packages/ai-gateway
    environment:
      LLM_ENDPOINT: ${LLM_ENDPOINT}
    ports:
      - "3001:3001"
```

### Alternatives Considered
- Single container: Less isolation, harder to scale
- Kubernetes only: Too complex for initial deployment
- External database: Additional setup complexity

### Volumes
- PostgreSQL data: Persistent volume
- Configuration cache: Optional volume
- Logs: Optional volume for log aggregation

---

## 9. AI Gateway Integration and Triage Patterns (Phase 9)

### Decision
Separate AI Gateway service with standardized request/response format. Issue context payload includes core fields (title, description, status, custom fields, error traces if available, recent comments - last 5-10). UI displays analysis in dedicated expandable section. Permission model: default Admin only, configurable via project configuration.

### Rationale
- Separation of concerns: AI Gateway as separate service allows independent scaling and deployment
- Balanced context: Core fields provide sufficient context without overwhelming payload size
- Flexible permissions: Default Admin-only provides security/cost control while allowing customization
- Expandable UI: Dedicated section keeps context visible without cluttering default view
- Natural language assignee suggestions: More flexible than hard-coded user IDs

### Implementation

#### Issue Context Payload Structure
```typescript
{
  issue: {
    title: string;
    description: string;
    status: string;
    customFields: Record<string, unknown>;
    errorTraces?: Array<{ message: string; stack: string }>;
    recentComments: Array<{ author: string; content: string; timestamp: Date }>; // Last 5-10
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
  priority: string; // Priority value (matches project config or standard low/medium/high)
  suggestedAssignee: string; // Natural language description (e.g., "frontend developer with React experience")
}
```

#### Permission Model
- Default: Admin role only
- Configuration: `ai_triage_permissions: ['admin', 'member']` in `stride.config.yaml`
- API route: Check user role against config at route level
- UI: Hide/disable "Triage with AI" button if user lacks permission

#### UI Component Structure
- Component: `packages/ui/src/organisms/AITriageAnalysis.tsx`
- Position: After issue details, before comments in IssueDetail view
- Behavior: Expandable/collapsible accordion, expanded by default when suggestions available
- Sections: Summary, Priority Suggestion (with accept/modify), Assignee Suggestion (description + manual selection)

### Alternatives Considered
- **Full issue history**: Too large payload, unnecessary context
- **User ID for assignee**: Less flexible, requires user profiles with expertise data
- **Modal overlay**: Breaks context, requires navigation back to issue
- **All authenticated users**: Too permissive, higher cost/security risk
- **Admin only (no override)**: Too restrictive, doesn't allow team customization

### Integration Points
- Main app → AI Gateway: HTTP client in `apps/web/src/lib/ai/triage.ts`
- AI Gateway endpoint: `POST /analyze-issue` (documented in `packages/ai-gateway/README.md`)
- Permission check: API route middleware before processing request
- Configuration: Read `ai_triage_permissions` from project config
- Error handling: Graceful degradation - log errors, display user-friendly message, issue remains functional

### Error Handling Patterns
1. **AI Gateway Unavailable**: Display error in AITriageAnalysis section, allow retry, issue fully functional
2. **Malformed Response**: Log error server-side, display "Unable to analyze issue", allow retry
3. **Timeout (30s)**: Display timeout message, allow retry
4. **Permission Denied**: Hide button in UI, return 403 from API with clear message
5. **No Project Priority Config**: Use standard low/medium/high mapping

### Future Enhancements
- Fuzzy matching for assignee descriptions to suggest relevant users
- Caching of AI analysis results to avoid redundant requests
- Batch triage for multiple issues
- Learning from user accept/reject patterns to improve suggestions

---

## Summary

All NEEDS CLARIFICATION items have been resolved with specific implementation decisions. Each decision includes:
- Clear choice with rationale
- Implementation approach
- Alternatives considered
- Migration/evolution path where applicable

These decisions align with the project's principles:
- **KISS**: Simple solutions first (database sessions, basic rate limiting)
- **YAGNI**: MVP-focused (can add Redis, advanced features later)
- **Security**: Proper webhook verification, rate limiting, input validation
- **Scalability**: Design allows evolution (session interface, configuration sync)


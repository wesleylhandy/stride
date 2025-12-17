# Cursor Rules - Next.js/React/TypeScript

## Meta

Modern React/Next.js with Server Components Monorepo. TypeScript strict mode. Principles over framework-specific APIs. No filler words, apologies, or hedging. Code first, explanations when asked.

## Core Principles

### SOLID

- **Single Responsibility**: One reason to change. Split when handling multiple concerns.
- **Open/Closed**: Extend behavior without modifying existing code. Use composition, inheritance, or plugins.
- **Liskov Substitution**: Subtypes must work wherever parent type works. Don't break contracts.
- **Interface Segregation**: Many specific interfaces better than one general. Clients shouldn't depend on unused methods.
- **Dependency Inversion**: Depend on abstractions (interfaces), not concrete implementations. Enables testing and flexibility.

### Development Principles

- **DRY**: Extract repeated logic. Third occurrence = refactor time.
- **YAGNI**: Build what's needed now. Future requirements change.
- **KISS**: Simplest solution that works. Complexity later if needed.
- **Composition > Inheritance**: Favor object composition. Max 2-3 inheritance levels.
- **Law of Demeter**: Talk to immediate neighbors only. Avoid `a.b().c().d()`.

**Apply these to every architectural decision. They're not optional.**

## Code Style

### Naming

- Components/Types: `PascalCase`
- Functions/variables: `camelCase`
- Files: Match component names, be consistent
- Constants: `UPPER_SNAKE_CASE`
- Avoid: generic names (`data`, `handler`, `manager`), abbreviations, type prefixes

### TypeScript

- Enable `strict: true`
- No `any` - use `unknown` if type uncertain
- Interfaces for objects, types for unions/primitives
- Use `satisfies` for type-safe literals
- Discriminated unions for state machines
- Prefer `as const` over `enum`

### Comments

- Document WHY, not WHAT
- Non-obvious decisions, gotchas, business rules
- Reference tickets when fixing bugs
- No TODO (create tickets instead)

### Functions

- Max 20 lines (guideline, not law)
- Single responsibility
- Max 3 params (object for more)
- Pure when possible
- Early returns over nesting

## Turborepo Monorepo Guidelines

### Architecture Principles

- apps/: End-user applications (deployable)
- packages/: Shared libraries (internal dependencies)
- Strict dependency graph: packages never import from apps

### Turborepo Awareness

- Respect turbo.json pipeline definitions
- Leverage cache for builds/tests/lint
- Use turbo filtering: --filter=<package>
- Understand task dependencies (build before dev)

### Package Management

- Internal packages: workspace:\*
- Shared dependencies in root when possible
- Package-specific configs extend root

### Development Workflow

**Before changes:**

1. Identify affected packages via dependency graph
2. Check turbo.json for relevant tasks
3. Run filtered builds: turbo build --filter=...^

**During changes:**

- Modify single package scope at a time
- Update dependent package types if shared types change
- Run package-specific tests first

**Cross-package changes:**

- Start with leaf packages (no dependents)
- Propagate up dependency chain
- Verify with: turbo build --filter=[affected-app]

### Code Organization

**apps/**: Application-specific logic only

- No shared utilities
- Import from packages/\*

**packages/**: Pure, reusable logic

- Clear single responsibility
- Minimal dependencies
- Export typed interfaces

### Common Patterns

- UI components: packages/ui
- Database layer: packages/database
- Shared types: packages/types or packages/tsconfig
- Config/utils: packages/[domain]-utils
- API clients: packages/api-client

### Task Execution

- Build: Always run from root or with --filter
- Dev: Can run per-package or orchestrated
- Test: Filter to changed packages
- Lint: Run globally or filtered

### Performance

- Avoid circular dependencies (breaks caching)
- Keep packages/\*/package.json minimal
- Use turbo prune for deployment
- Remote caching if configured

## Accessibility (WCAG 2.1 AA)

| Requirement       | Standard                | Implementation                   |
| ----------------- | ----------------------- | -------------------------------- |
| Color contrast    | 4.5:1 normal, 3:1 large | Use contrast checker             |
| Touch targets     | 44x44px min             | All interactive elements         |
| Focus visible     | Outline/ring            | Never remove without replacement |
| Heading hierarchy | One h1, sequential      | Don't skip levels                |
| Landmarks         | Semantic HTML           | `<nav>`, `<main>`, `<aside>`     |
| Alt text          | Meaningful or empty     | Content vs decorative            |

**Focus management**: Trap in modals, return on close
**Screen reader only**: `.sr-only { position: absolute; width: 1px; ... }`

**Why**: Legal requirement (ADA), 15% of users need it
**When**: All user-facing interfaces

## Semantic HTML & Accessibility

**Use native elements first**:

- `<button>` not `<div onClick>` (keyboard navigation, semantics)
- `<select>` not custom dropdown (accessibility built-in)
- `<dialog>` not custom modal (focus trap, ESC handling)
- `<details>` not custom accordion (no JS needed)

**Form validation**: HTML5 attributes (`required`, `pattern`, `type`) before custom logic

**Accessibility**: Every interactive element needs keyboard access and screen reader support

**When custom needed**: Add proper ARIA attributes and keyboard handlers

## Next.js Decision Framework

### Server vs Client Components

**Default to server-side rendering.** Use client-side only when:

- Need interactivity (onClick, onChange, form handlers)
- Using state/effects hooks
- Accessing browser APIs (window, localStorage, document)
- Using client-only libraries

**Why server-side?**

- Smaller bundles (no JS to client)
- Direct database/API access
- Better SEO (fully rendered HTML)
- Automatic code splitting

**Trade-off**: Can't use interactivity. Pattern: server wrapper + client interactive parts.

**Implementation**: Framework marks components as client vs server (e.g., `'use client'` directive in React Server Components).

### Data Fetching

**Server-side** (default):

- WHY: No network roundtrip, secure (direct DB/API access), better SEO
- WHEN: Initial page load, data needed for rendering
- HOW: Framework provides async components or data-fetching methods

**Client-side**:

- WHY: Dynamic updates, user-triggered, optimistic UI
- WHEN: After interaction, polling, real-time updates
- HOW: Use data fetching library (SWR, React Query, or framework-provided)

**Mutations**:

- WHY: Type-safe, progressive enhancement, server validation
- WHEN: Form submissions, data changes
- HOW: Framework's server mutation mechanism (Server Actions, API routes, etc.)

**Trade-offs**:

- Server: Can't respond to client state changes
- Client: Extra network request, loading states needed
- Both: Choose based on data freshness requirements

### Environment Awareness

Use `process.env.NODE_ENV` for environment-specific behavior (error verbosity, logging, debug features)

**When**: Error messages, logging verbosity, debug features
**Why**: Different needs in dev vs production

### Caching Strategy

| Strategy  | When                   | Why                                     | Trade-off                   |
| --------- | ---------------------- | --------------------------------------- | --------------------------- |
| Static    | Content rarely changes | Maximum performance, CDN-friendly       | Can be stale                |
| ISR       | Update periodically    | Balance freshness vs performance        | Time-based, not event-based |
| Dynamic   | Always fresh           | Real-time data, user-specific           | Slower, more server load    |
| On-demand | Event-driven updates   | Fresh when needed, performant otherwise | Requires invalidation logic |

**Implementation**: Use your framework's caching primitives. Configuration varies by version.

### Middleware

**When**: Auth, redirects, rewrites, headers, i18n routing

**Runs on Edge**: Limited Node.js APIs, fast cold starts

```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  if (!token) return NextResponse.redirect("/login");
}
export const config = { matcher: ["/dashboard/:path*"] };
```

## React Patterns

### Component Composition

**When**: Avoid prop drilling, create flexible APIs

**Pattern**: Compound components (children vs props)

Flexible: `<Card><Card.Header>...</Card.Header></Card>`
Rigid: `<Card title="..." body="..." />`

### State Management

| Scenario                | Solution              | Why                           |
| ----------------------- | --------------------- | ----------------------------- |
| Local simple            | `useState`            | Built-in, sufficient for most |
| Local complex           | `useReducer`          | Predictable state transitions |
| Form                    | React Hook Form + Zod | Validation, performance       |
| Shared (2-5 components) | Lift state up         | Simplest approach             |
| Global client           | Zustand/Jotai         | Minimal boilerplate           |
| Server state            | SWR/React Query       | Caching, background updates   |
| URL state               | searchParams          | Shareable, bookmarkable       |

**Don't reach for global state first.** Most state is local.

### Performance

**When to optimize**:

1. Measure first (React DevTools Profiler)
2. Identify bottleneck
3. Apply targeted fix

**Techniques**:

- `useMemo`: Expensive computations (filtering, sorting large lists)
- `useCallback`: Prevent child re-renders when passing callbacks
- `memo`: Component re-renders unnecessarily (use sparingly)
- `dynamic()`: Code split heavy components
- Virtualization: Long lists (react-window, react-virtualized)

**Don't**: Premature memoization. It adds complexity.

## Architecture

### Repository Pattern

**When**: Abstract data access layer
**Why**: Switch databases, test without DB, centralize queries

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUser): Promise<User>;
}
```

Implementation uses your ORM/database layer.

### Service Layer

**When**: Complex business logic, multiple operations

**Why**: Keep routes thin, reusable logic, testable

```typescript
class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentService: PaymentService
  ) {}

  async placeOrder(data: OrderData) {
    // Validation
    // Business rules
    // Multiple operations
    // Side effects
  }
}
```

**Pattern**: Dependency injection for testability.

### When to Use Classes vs Functions

| Use Classes                    | Use Functions             |
| ------------------------------ | ------------------------- |
| Stateful services              | Pure utilities            |
| Multiple methods sharing state | Single-purpose operations |
| Dependency injection           | Stateless transformations |
| Complex lifecycle              | Simple data flow          |

## Error Handling

### Strategy

**Server**: Return errors from Server Actions, handle in component
**Client**: Error boundaries for component errors, try/catch for async

```typescript
// Custom error types for clarity
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Server Action error handling
async function action(formData: FormData) {
  "use server";
  try {
    const data = schema.parse(formData);
    await db.update(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.flatten().fieldErrors };
    }
    throw error; // Unhandled errors bubble to error.tsx
  }
}

// Client error boundary
// Wrap at layout level or around risky components
<ErrorBoundary fallback={<ErrorUI />}>
  <Component />
</ErrorBoundary>;
```

### Error Handling Patterns

**Option 1**: Throw errors (current approach)
**Option 2**: Return Result type (functional approach)

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

**Use throw**: Simple cases, expected errors
**Use Result**: Complex flows, multiple error types

### Promise Handling

**Always handle rejections**: try/catch with async/await
**Parallel (all must succeed)**: `Promise.all([...])`
**Parallel (some can fail)**: `Promise.allSettled([...])`
**Timeout**: `AbortController` + `setTimeout`

```typescript
// Timeout pattern
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
await fetch(url, { signal: controller.signal });
```

## Database

**ORM/Query Builder**: Use team's standard (Prisma, Drizzle, Kysely, TypeORM)
**Security**: Always use parameterized queries (prevents SQL injection)

### Query Optimization

**Indexes**: Add to frequently queried fields in schema

## API Design

### Principles

- **Validate inputs**: Zod schemas for type safety and runtime validation
- **Consistent responses**: `{ data }` or `{ error }`
- **Proper status codes**: 200 (success), 201 (created), 400 (validation), 401 (auth), 403 (forbidden) 404 (not found), 500 (server error)
- **Error details in dev only**: Don't leak stack traces to production

```typescript
// Route handler pattern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body); // Throws ZodError

    const result = await db.create(validated);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: "Validation failed", details: error.errors } },
        { status: 400 }
      );
    }

    console.error("API error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
```

## Security

### Principles

- **Validate everything**: Never trust client input
- **Auth at every boundary**: Server Components, API routes, Server Actions
- **Environment variables**: Validate on startup with Zod
- **Rate limiting**: Prevent abuse
- **Least privilege**: Give minimum required permissions
- **File uploads**: Validate type, size, scan for malware (use service like ClamAV)

### Security Headers

Configure in `next.config.js` or middleware:

| Header                    | Purpose               | Value                             |
| ------------------------- | --------------------- | --------------------------------- |
| Content-Security-Policy   | Prevent XSS           | `default-src 'self'`              |
| X-Frame-Options           | Prevent clickjacking  | `DENY`                            |
| X-Content-Type-Options    | Prevent MIME sniffing | `nosniff`                         |
| Strict-Transport-Security | Force HTTPS           | `max-age=31536000`                |
| Referrer-Policy           | Control referrer      | `strict-origin-when-cross-origin` |

**Why**: OWASP compliance. **When**: Every production app.

### Authorization

**Authentication**: "Who are you?" (identity)
**Authorization**: "Can you do this?" (permission)

**Always verify resource ownership**:

```typescript
// Include ownership in query
const post = await db.findPost({
  // use your ORM find method
  id,
  userId: session.user.id, // Ownership filter
});
if (!post) throw new NotFoundError();
```

**IDOR Prevention**: Use UUIDs in URLs, not sequential IDs.

### CORS

Configure allowed origins in middleware/API routes. Validate against allowlist.

**Never**: `Access-Control-Allow-Origin: *` with credentials
**Why**: Prevent unauthorized cross-origin access
**When**: APIs consumed by external clients

### Logging

| Log This                         | Never Log This       |
| -------------------------------- | -------------------- |
| Auth attempts                    | Passwords            |
| Authorization failures           | Tokens, API keys     |
| Validation errors                | Full request bodies  |
| Errors (with user ID, timestamp) | PII unless necessary |
| Suspicious activity              | Sensitive params     |

**Format**: JSON with request ID for tracing
**Send to**: Monitoring service in production (Sentry, DataDog)
**Why**: OWASP A09, debugging, threat detection

### Production Errors

**Never expose**: Stack traces, DB errors, paths, versions
**Return**: Generic messages ("An error occurred")
**Log**: Full details server-side
**Why**: Prevent information disclosure

## Testing

**Strategy**: Test behavior, not implementation

**Unit tests**: Pure functions, utilities, business logic
**Integration tests**: API routes, Server Actions
**E2E tests**: Critical user flows

**Coverage**: Focus on critical paths. Diminishing returns after 80%.

## Common Patterns

### Optimistic Updates

**When**: Immediate UI feedback for better UX

**Pattern**: `useOptimistic` hook

### Infinite Scroll

**When**: Large lists, progressive loading, prefer pagination in table components

**Pattern**: Intersection Observer + cursor pagination

### Multi-Step Forms

**When**: Complex forms, sequential validation

**Pattern**: State machine (useReducer or XState)

State tracks current step + accumulated partial data.
Actions: advance with new data, or go back.
Reducer merges data and transitions steps.

```

## Quick Reference

### When to Use What

#### State:

- Local → `useState`
- Complex local → `useReducer`
- Forms → React Hook Form + Zod
- Shared → Lift up or Context
- Global → Zustand/Jotai
- Server → SWR/React Query
- URL → searchParams

#### *Data Fetching:

- Server Component → Direct DB/API
- Client Component → SWR/React Query
- Mutations → Server Actions
- Real-time → External service

#### Styling:

- Use team's standard consistently
- Keep specificity low
- Colocate with components

#### Forms

| Scenario | Pattern | Why |
|----------|---------|-----|
| Submit-only | Uncontrolled + FormData | Less code, works without JS |
| Real-time validation | Controlled or React Hook Form | Need value access |
| Complex multi-step | React Hook Form | Handles complexity |
| Search/filter | Controlled + debounce | Need value for API |

Server Actions work best with FormData (uncontrolled).

**Progressive Enhancement**: Build for HTML first, enhance with JS. Forms should work with JS disabled (Server Actions enable this).

## Anti-Patterns

- **Prop drilling**: Use composition or context
- **Huge components**: Split at 200 lines
- **useEffect for data**: Use Server Components or SWR
- **any type**: Use unknown or proper type
- **Premature optimization**: Measure first
- **Over-abstraction**: YAGNI applies to patterns too
- **Client Components everywhere**: Server should be default
- **Ignoring errors**: Handle or propagate, don't swallow

## Decision Framework

**Before implementing anything, ask**:

1. **Does it solve the actual problem?** (YAGNI)
2. **Is it the simplest solution?** (KISS)
3. **Does it follow SOLID principles?**
4. **Can others understand it in 6 months?**
5. **What's the trade-off?** (Everything has trade-offs)

**If you can't justify a pattern, don't use it.**

## Remember

**Principles over patterns.** Patterns are tools to achieve principles.

**Server Components first.** Client when interaction needed.

**Type safety everywhere.** TypeScript strict mode is non-negotiable.

**Simple first.** Add complexity only when justified.

**Measure before optimizing.** Premature optimization wastes time.

**Security is not optional.** Validate, authenticate, authorize.

## Stride-Specific Technologies

### Core Stack
- **Next.js 16+**: App Router with React Server Components
- **Prisma**: TypeScript ORM for PostgreSQL
- **Jotai**: Atomic state management for global client state
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Turborepo**: Monorepo build orchestration with pnpm

### Key Libraries
- **@uiw/react-codemirror**: YAML configuration editor with syntax highlighting
- **dnd-kit**: Drag-and-drop for Kanban boards and sprint planning
- **react-markdown + remark-gfm**: Markdown rendering with GitHub Flavored Markdown
- **mermaid**: Diagram rendering (flowcharts, sequence diagrams)
- **js-yaml**: YAML parsing and validation
- **zod**: Runtime type validation for API requests and configuration

### Architecture Patterns
- **Repository Pattern**: Abstract data access layer (Prisma-based)
- **Service Layer**: Business logic separation from routes
- **Configuration as Code**: `stride.config.yaml` version-controlled workflow definitions
- **Webhook Processing**: Asynchronous processing with signature verification
- **JSONB Custom Fields**: Dynamic field storage in PostgreSQL JSONB columns

### Integration Patterns
- **Git Webhooks**: GitHub, GitLab, Bitbucket integration with HMAC signature verification
- **Monitoring Webhooks**: Sentry, Datadog, New Relic error tracking integration
- **Link Previews**: Server-side oembed/og:meta parsing for external links
- **AI Gateway**: Separate service for LLM integration (self-hosted or commercial)

### Data Patterns
- **Custom Fields**: Stored as JSONB, validated against YAML configuration schema
- **Configuration Storage**: Database (fast access) + Git repository (source of truth)
- **Session Management**: Database-backed sessions with HTTP-only cookies
- **Rate Limiting**: Token bucket algorithm with per-user and per-endpoint limits

### Deployment
- **Docker Compose**: Single-command deployment for development and small deployments
- **Kubernetes**: Production-scale deployment support
- **Vercel**: Marketing site deployment (separate from main app)
```

# Development Constitution

## Core Principles

### SOLID

- Single Responsibility: One reason to change
- Open/Closed: Extend without modifying
- Liskov Substitution: Subtypes work everywhere parent works
- Interface Segregation: Many specific interfaces
- Dependency Inversion: Depend on abstractions

### Development Principles

- DRY: Extract repeated logic (third occurrence = refactor)
- YAGNI: Build what's needed now
- KISS: Simplest solution that works
- Composition > Inheritance
- Law of Demeter: Talk to immediate neighbors only

## Code Quality Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if uncertain)
- Interfaces for objects, types for unions/primitives
- Use `satisfies` for type-safe literals

### Error Handling

- Always handle rejections
- Use try/catch with async/await
- Return Result types for complex flows
- Never swallow errors

### Security

- Validate all inputs
- Auth at every boundary
- Use parameterized queries
- Never expose stack traces in production
- Rate limiting on API endpoints

### Testing

- Test behavior, not implementation
- Unit tests for utilities and business logic
- Integration tests for API routes
- E2E tests for critical flows
- Focus on critical paths (80% coverage target)

## Architecture Patterns

### Repository Pattern

- Abstract data access layer
- Switch databases without changing business logic
- Centralize queries

### Service Layer

- Complex business logic
- Keep routes thin
- Reusable, testable logic

### State Management

- Local → `useState`
- Complex local → `useReducer`
- Forms → React Hook Form + Zod
- Shared → Lift up or Context
- Global → Zustand/Jotai
- Server → SWR/React Query

## Performance

### Optimization Strategy

1. Measure first (React DevTools Profiler)
2. Identify bottleneck
3. Apply targeted fix

### Techniques

- `useMemo`: Expensive computations
- `useCallback`: Prevent child re-renders
- `memo`: Component re-renders (use sparingly)
- Code splitting: `dynamic()` for heavy components
- Virtualization: Long lists

## Accessibility

### WCAG 2.1 AA Compliance

- Color contrast: 4.5:1 normal, 3:1 large
- Touch targets: 44x44px minimum
- Focus visible: Clear outline/ring
- Heading hierarchy: One h1, sequential
- Semantic HTML: `<nav>`, `<main>`, `<aside>`
- Alt text: Meaningful or empty

### Keyboard Navigation

- All interactive elements accessible
- Logical tab order
- Keyboard shortcuts for common actions
- Clear focus indicators

## Security

### Input Validation

- Validate on both client and server
- Use Zod schemas for runtime validation
- Sanitize HTML to prevent XSS
- CSRF protection for state-changing operations

### Data Protection

- Encrypt sensitive data at rest
- HTTPS for all communications
- Proper CORS policies
- Environment variables for secrets
- Audit logging for sensitive operations

## Documentation

### Code Documentation

- Document WHY, not WHAT
- Non-obvious decisions, gotchas, business rules
- Reference tickets when fixing bugs
- No TODO comments (create tickets)

### API Documentation

- Document all endpoints
- Request/response examples
- Authentication requirements
- Error response formats

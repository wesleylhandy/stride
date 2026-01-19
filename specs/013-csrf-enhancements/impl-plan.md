# Implementation Plan: CSRF Protection Security Enhancements

**Feature Branch**: `013-csrf-enhancements`  
**Created**: 2026-01-19  
**Status**: Planning Complete (Phase 0-2)  
**Feature Spec**: `specs/013-csrf-enhancements/spec.md`

## Technical Context

### Technology Stack
- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM (existing)
- **Authentication**: HTTP-only cookies with JWT tokens, database-backed sessions (existing)
- **Middleware**: Next.js Edge Runtime middleware for CSRF protection (existing)
- **Cryptography**: Web Crypto API for token generation (existing)
- **Cookie Management**: Next.js cookies() API (existing)

### Dependencies
- **Existing CSRF Middleware**: `apps/web/src/middleware/csrf.ts` - Double-Submit Cookie pattern implementation
- **Existing Session Management**: `apps/web/src/lib/auth/session.ts` - Session creation, verification, deletion
- **Existing Session Database Model**: Prisma `Session` model with `id` (UUID), `userId`, `token`, `expiresAt`
- **Existing Client Utilities**: `apps/web/src/lib/utils/csrf.ts` - Client-side token retrieval
- **Existing Middleware Pipeline**: `apps/web/middleware.ts` - Request ID, rate limiting, CSRF protection
- **Existing Login/Logout Routes**: `/api/auth/login` and `/api/auth/logout` for authentication events

### Integrations
- **Session Lifecycle Events**: Login and logout routes must trigger CSRF token rotation
- **Middleware Validation**: CSRF middleware must validate token binding to active session
- **Client-Side Cookie Parsing**: Improved error handling for cookie retrieval
- **Logging System**: Request ID tracking for CSRF validation failures

### Architecture Decisions
- **Token Binding Strategy**: ✅ RESOLVED - Embedded session ID with HMAC signature: `base64(sessionId:randomBytes:hmac)`
- **Token Storage**: CSRF tokens remain in cookies (non-httpOnly for Double-Submit pattern), no database storage needed
- **Token Rotation Trigger**: ✅ RESOLVED - Route handler integration with helper function `rotateCsrfToken()`
- **Session ID Source**: Use Session database record `id` (UUID) as the binding identifier, stored in JWT payload
- **Validation Timing**: Validate token binding during CSRF middleware execution before request processing
- **Backward Compatibility**: Maintain existing cookie format and client-side API, add binding validation transparently
- **Edge Runtime Constraints**: ✅ RESOLVED - Store sessionId in JWT payload, decode in middleware without database access

### Unknowns / Needs Clarification
- ✅ **RESOLVED**: Token Binding Implementation - Embedded session ID with HMAC signature
- ✅ **RESOLVED**: Session ID Retrieval in Middleware - Store sessionId in JWT payload, decode in middleware
- ✅ **RESOLVED**: Token Rotation Mechanism - Route handler integration with helper function
- ✅ **RESOLVED**: Concurrent Request Handling - Last-write-wins approach, minimal race condition window
- ✅ **RESOLVED**: Token Invalidation Strategy - Session-based validation, tokens invalid when session deleted/expired

## Constitution Check

### Principles Compliance
- [x] SOLID principles applied - Single responsibility for CSRF middleware, session management, token generation
- [x] DRY, YAGNI, KISS followed - Reuse existing patterns, avoid over-engineering token binding
- [x] Type safety enforced - TypeScript strict mode, proper types for tokens and sessions
- [x] Security best practices - Constant-time comparison, cryptographically secure tokens, secure cookies
- [x] Accessibility requirements met - N/A (backend security feature, no UI impact)

### Code Quality Gates
- [x] No `any` types - Use proper TypeScript types for tokens and sessions
- [x] Proper error handling - Graceful handling of token parsing errors, validation failures
- [x] Input validation - Validate token format, session IDs, cookie values
- [x] Test coverage planned - Unit tests for token binding, integration tests for rotation, E2E tests for full flow

## Phase 0: Outline & Research

### Research Tasks
- [x] Resolve token binding implementation approach (hash-based vs. embedded vs. separate storage)
- [x] Resolve session ID retrieval in Edge Runtime middleware constraints
- [x] Research best practices for CSRF token rotation on authentication events
- [x] Research concurrent request handling patterns for token rotation
- [x] Identify token invalidation strategies that work with Double-Submit Cookie pattern

### Research Output
- [x] `research.md` generated with all clarifications resolved

## Phase 1: Design & Contracts

### Data Model
- [x] `data-model.md` generated
- [x] CSRF token entity defined with session binding relationship
- [x] Token validation rules documented
- [x] Session-to-token binding constraints defined

### API Contracts
- [x] No new API endpoints required (enhancements to existing middleware)
- [x] Internal function contracts documented (token generation, binding, validation)
- [x] Client-side utility function contracts documented

### Quickstart
- [x] `quickstart.md` generated
- [x] Token binding setup instructions
- [x] Token rotation integration points documented

### Agent Context
- [x] No new technologies introduced - reuses existing stack (Web Crypto API, JWT, cookies)
- [x] Agent context update not required (no new technologies)

## Phase 2: Implementation Planning

### Component Structure
- [x] CSRF middleware enhancements identified
- [x] Token binding function structure defined
- [x] Token rotation hook points identified
- [x] Client-side cookie parsing improvements structured

**Components to Modify**:

1. **`apps/web/src/middleware/csrf.ts`** (Core CSRF Middleware)
   - Enhance `generateCsrfToken()` to accept `sessionId: string | null` parameter
   - Add `parseCsrfToken()` function to extract sessionId, randomBytes, hmac from token
   - Add `computeHmac()` function for HMAC-SHA256 signature generation/validation
   - Add `validateTokenBinding()` function to check session binding
   - Enhance `verifyCsrfToken()` to include session binding validation
   - Add `getSessionIdFromRequest()` helper to extract sessionId from JWT
   - Add `rotateCsrfToken()` export function for use in route handlers
   - Update `csrfMiddleware()` to validate session binding for unsafe methods
   - Update error response format to structured object with error code, message, request ID

2. **`apps/web/src/lib/auth/session.ts`** (Session Management)
   - Update `SessionPayload` interface to include `sessionId: string`
   - Modify `createSession()` to include session database ID in JWT payload
   - Modify `verifySession()` to extract and return sessionId from JWT

3. **`apps/web/app/api/auth/login/route.ts`** (Login Route)
   - Add call to `rotateCsrfToken()` after successful session creation
   - Pass sessionId to rotation function

4. **`apps/web/app/api/auth/logout/route.ts`** (Logout Route)
   - Add call to `rotateCsrfToken()` with null sessionId after logout
   - Ensure token rotation happens before response is sent

5. **`apps/web/src/lib/utils/csrf.ts`** (Client Utilities)
   - Improve `getCsrfToken()` with robust cookie parsing (regex-based, error handling)
   - Add try-catch around `decodeURIComponent()` to handle malformed values
   - Maintain backward compatibility with existing API

**New Functions to Create**:

- `generateCsrfToken(sessionId: string | null): string` - Enhanced with session binding
- `parseCsrfToken(token: string): { sessionId: string; randomBytes: string; hmac: string } | null`
- `computeHmac(data: string): Promise<string>` - HMAC-SHA256 using Web Crypto API
- `validateTokenBinding(token: string, currentSessionId: string | null): Promise<boolean>`
- `getSessionIdFromRequest(request: NextRequest): Promise<string | null>`
- `rotateCsrfToken(response: NextResponse, sessionId: string | null, request: NextRequest): Promise<void>`

### State Management
- [x] Token state requirements identified (cookie-based, no global state)
- [x] Session binding state flow documented
- [x] Token rotation state transitions defined

**Token State Flow**:

1. **Initial State (Unauthenticated)**:
   - No CSRF token exists
   - First GET request generates token with `sessionId: "anonymous"`
   - Token stored in cookie, expires in 24 hours

2. **After Login**:
   - Session created with database ID
   - Session ID included in JWT payload
   - CSRF token rotated with new session ID binding
   - Old token (if any) becomes invalid (different session binding)

3. **During Active Session**:
   - CSRF token bound to session ID
   - Token validated on each unsafe request
   - Validation checks: token format, HMAC, session binding match

4. **After Logout**:
   - Session deleted from database
   - CSRF token rotated with `sessionId: "anonymous"`
   - Old token becomes invalid (session no longer exists)

5. **Session Expiration**:
   - Session expires in database
   - CSRF token validation fails (session doesn't exist)
   - Next request generates new token with `sessionId: "anonymous"`

**State Transitions**:

```
Unauthenticated (no token)
  → GET request → Token generated (anonymous)
  → Login → Token rotated (bound to session)
  → Active session → Token validated (session binding checked)
  → Logout → Token rotated (anonymous)
  → Session expires → Token invalidated (validation fails)
```

**No Global State Required**:
- All state stored in cookies (CSRF token) and JWT (session ID)
- No server-side token storage needed
- Stateless validation (HMAC verification, session ID comparison)

### Testing Strategy
- [x] Unit test plan for token binding/validation
- [x] Integration test plan for login/logout token rotation
- [x] E2E test scenarios for full CSRF protection flow
- [x] Edge case test scenarios (concurrent requests, expired sessions)

**Unit Tests** (`apps/web/src/middleware/__tests__/csrf.test.ts`):

1. **Token Generation**:
   - Generate token with session ID
   - Generate token with null session ID (anonymous)
   - Token structure validation (base64, 3 parts)
   - Token entropy validation (256 bits)

2. **Token Parsing**:
   - Parse valid token structure
   - Handle invalid base64 encoding
   - Handle malformed token structure (wrong number of parts)
   - Handle missing token

3. **HMAC Validation**:
   - Valid HMAC signature passes
   - Invalid HMAC signature fails
   - Tampered token fails validation
   - Constant-time comparison (timing attack prevention)

4. **Session Binding Validation**:
   - Token bound to matching session ID passes
   - Token bound to different session ID fails
   - Anonymous token with no session passes
   - Anonymous token with active session fails

5. **Client-Side Cookie Parsing**:
   - Extract token from valid cookie
   - Handle URL-encoded cookie values
   - Handle malformed cookie values (graceful error)
   - Handle missing cookie (returns null)
   - Handle multiple cookies (extracts correct one)

**Integration Tests** (`apps/web/app/api/auth/__tests__/csrf-rotation.test.ts`):

1. **Login Token Rotation**:
   - Login generates new CSRF token
   - New token bound to new session ID
   - Old token (if exists) becomes invalid
   - Token rotation completes within 1 second

2. **Logout Token Rotation**:
   - Logout generates new CSRF token
   - New token bound to "anonymous"
   - Old token becomes invalid
   - Session deletion invalidates old token binding

3. **Token Validation in Middleware**:
   - Valid token with matching session passes
   - Invalid token format fails
   - Token with mismatched session fails
   - Missing token fails

4. **Error Response Format**:
   - 403 status code returned
   - Structured error object with error code, message, request ID
   - Error logged with comprehensive details

**E2E Tests** (`e2e/csrf-protection.spec.ts`):

1. **Full Authentication Flow**:
   - Unauthenticated user gets anonymous token
   - Login rotates token to session-bound
   - State-changing requests succeed with valid token
   - Logout rotates token back to anonymous
   - Old tokens rejected after rotation

2. **Session Expiration**:
   - Active session with valid token
   - Session expires
   - Next request with old token fails
   - New token generated automatically

3. **Concurrent Requests**:
   - Multiple tabs open
   - Login in one tab
   - All tabs receive new token on next request
   - No race conditions

4. **Edge Cases**:
   - Cookie manually deleted (token regenerated)
   - Rapid login/logout (token rotation works)
   - Session deleted from another device (token invalidated)
   - API client without cookies (request rejected)

**Test Coverage Targets**:
- Unit tests: 90%+ coverage for CSRF middleware functions
- Integration tests: All authentication flows covered
- E2E tests: Critical user journeys covered
- Edge cases: All listed edge cases have test scenarios

## Phase 3: Implementation

### Tasks
- [ ] Implementation tasks created
- [ ] Dependencies identified
- [ ] Estimated effort

## Notes

- Edge Runtime constraints are a key consideration - middleware cannot directly access Prisma
- Token binding must not break existing Double-Submit Cookie pattern
- Backward compatibility is critical - existing client code should continue working
- Security is paramount - token binding must be cryptographically sound

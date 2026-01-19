# Research: CSRF Protection Security Enhancements

**Feature**: CSRF Protection Security Enhancements  
**Date**: 2026-01-19  
**Status**: Complete

## Research Questions & Decisions

### 1. Token Binding Implementation Strategy

**Question**: How to cryptographically bind CSRF token to session ID?

**Options Evaluated**:

1. **Hash-based binding**: `HMAC(sessionId, randomBytes)` or `hash(sessionId + randomBytes)`
   - Pros: Cryptographically secure, can validate without database
   - Cons: Cannot extract session ID from token (one-way hash)

2. **Embedded session ID**: `base64(sessionId + separator + randomBytes)`
   - Pros: Can extract session ID for validation, simple structure
   - Cons: Session ID is visible in token (but not sensitive)

3. **Separate cookie storage**: Store binding in separate cookie
   - Pros: Keeps token structure unchanged
   - Cons: Additional cookie, more complex validation

**Decision**: **Embedded session ID with HMAC signature**

**Rationale**:
- Edge Runtime constraints require validation without database access
- Session ID (UUID) is not sensitive information (already in JWT)
- Structure: `base64(sessionId + ":" + randomBytes + ":" + HMAC(sessionId + randomBytes, secret))`
- Allows extraction of session ID for validation
- HMAC signature prevents tampering
- Maintains 256-bit entropy from randomBytes

**Implementation**:
```typescript
// Token structure: base64(sessionId:randomBytes:hmac)
// sessionId: UUID (36 chars)
// randomBytes: 32 bytes hex (64 chars)  
// hmac: HMAC-SHA256 signature (64 chars hex)
// Total: ~164 chars base64 encoded
```

**Alternatives Considered**:
- Pure hash-based: Rejected - cannot extract session ID for validation
- Separate cookie: Rejected - adds complexity, more cookies to manage

---

### 2. Session ID Retrieval in Edge Runtime Middleware

**Question**: How to get session database ID from request in Edge Runtime middleware?

**Options Evaluated**:

1. **Store session ID in JWT payload**: Add `sessionId` field to JWT when creating session
   - Pros: Available in middleware via JWT decode, no database access needed
   - Cons: Requires JWT payload modification

2. **Hash of session token as identifier**: Use hash of JWT token as session identifier
   - Pros: No JWT modification needed
   - Cons: Cannot validate against database session record

3. **Query session via API call**: Make internal API call to get session
   - Pros: No JWT modification
   - Cons: Adds latency, complexity, potential circular dependencies

**Decision**: **Store session database ID in JWT payload**

**Rationale**:
- JWT already contains userId, email, role - adding sessionId is natural extension
- Session ID (UUID) is not sensitive (already in database)
- Allows middleware to extract session ID without database access
- Minimal change to existing JWT structure
- Enables token binding validation in Edge Runtime

**Implementation**:
- Modify `SessionPayload` interface to include `sessionId: string`
- Update `createSession()` to include session database ID in JWT payload
- Update `verifySession()` to extract and return sessionId
- Middleware can decode JWT to get sessionId for token binding validation

**Alternatives Considered**:
- Hash-based identifier: Rejected - cannot validate against actual session
- API call approach: Rejected - adds latency and complexity

---

### 3. Token Rotation Mechanism

**Question**: Where and how to trigger CSRF token rotation on login/logout?

**Options Evaluated**:

1. **In route handlers**: Call rotation function in `/api/auth/login` and `/api/auth/logout`
   - Pros: Explicit control, clear integration points
   - Cons: Requires changes to multiple route handlers

2. **In session functions**: Hook into `createSession()` and `deleteSession()`
   - Pros: Centralized, automatic rotation
   - Cons: Session functions become aware of CSRF concerns (violates separation)

3. **Middleware-based detection**: Detect session changes in middleware
   - Pros: Automatic, no route handler changes
   - Cons: Complex detection logic, potential race conditions

**Decision**: **Route handler integration with helper function**

**Rationale**:
- Clear separation of concerns - CSRF rotation is explicit in auth routes
- Reusable helper function: `rotateCsrfToken(response, sessionId, request)`
- Easy to test and maintain
- Follows existing pattern of setting cookies in route handlers
- Can be called after session creation/deletion completes

**Implementation**:
- Create `rotateCsrfToken()` helper function in CSRF middleware module
- Call in `/api/auth/login` after `createSession()` succeeds
- Call in `/api/auth/logout` after `deleteSession()` completes
- Function generates new token bound to new/current session and sets cookie

**Alternatives Considered**:
- Session function hooks: Rejected - violates separation of concerns
- Middleware detection: Rejected - too complex, race condition risks

---

### 4. Concurrent Request Handling

**Question**: How to handle race conditions when multiple tabs trigger token rotation?

**Options Evaluated**:

1. **Last-write-wins**: Accept any valid token, last rotation wins
   - Pros: Simple, no locking needed
   - Cons: Brief window where old tokens might be rejected

2. **Token versioning**: Include version number, accept N and N-1
   - Pros: Handles concurrent rotations gracefully
   - Cons: More complex validation logic

3. **Atomic rotation with validation window**: Accept tokens from current and previous session
   - Pros: Handles tab switching gracefully
   - Cons: Slightly weaker security (brief window)

**Decision**: **Last-write-wins with session binding validation**

**Rationale**:
- Token rotation is fast (<1ms), race condition window is minimal
- Tokens are bound to sessions - if session changes, old token is invalid anyway
- Multiple tabs will all get new tokens on their next request (GET requests generate tokens)
- Simpler implementation, no versioning complexity
- Security maintained - tokens still bound to active sessions

**Implementation**:
- Token rotation is atomic (single cookie set operation)
- If multiple tabs rotate simultaneously, last cookie set wins
- All tabs will receive new token on their next GET request
- Token validation checks session binding - if session doesn't match, token is invalid

**Alternatives Considered**:
- Token versioning: Rejected - adds complexity without significant benefit
- Validation window: Rejected - weakens security unnecessarily

---

### 5. Token Invalidation Strategy

**Question**: How to invalidate old CSRF tokens when new ones are generated?

**Options Evaluated**:

1. **Session-based invalidation**: Tokens invalid when session is deleted/expired
   - Pros: Automatic, no explicit invalidation needed
   - Cons: Tokens from previous session might briefly be valid

2. **Time-based expiration**: Tokens expire after fixed time
   - Pros: Automatic cleanup
   - Cons: Doesn't handle session changes immediately

3. **Token versioning with blacklist**: Track token versions, blacklist old ones
   - Pros: Explicit invalidation
   - Cons: Requires storage, cleanup logic

**Decision**: **Session-based invalidation with immediate binding check**

**Rationale**:
- Tokens are cryptographically bound to session IDs
- When session is deleted, token binding validation fails immediately
- When new session is created, old token has different session ID binding
- No storage needed - validation is stateless
- Simpler implementation - validation logic handles invalidation

**Implementation**:
- Token contains embedded session ID
- Validation extracts session ID from token
- Validation checks if session ID matches current active session
- If session deleted/expired/changed, validation fails
- No explicit invalidation storage needed

**Alternatives Considered**:
- Time-based expiration: Rejected - doesn't handle session changes
- Token blacklist: Rejected - adds storage complexity unnecessarily

---

## Technical Decisions Summary

| Decision Area | Chosen Approach | Rationale |
|--------------|----------------|-----------|
| Token Binding | Embedded session ID with HMAC | Allows Edge Runtime validation, cryptographically secure |
| Session ID Retrieval | Store in JWT payload | Enables middleware access without database |
| Token Rotation | Route handler integration | Clear separation, explicit control |
| Concurrent Handling | Last-write-wins | Simple, race window minimal |
| Token Invalidation | Session-based binding check | Stateless, automatic, secure |

## Implementation Constraints

1. **Edge Runtime**: Middleware runs in Edge Runtime - no Prisma/database access
2. **Double-Submit Cookie**: Must maintain pattern - token in cookie + header
3. **Backward Compatibility**: Existing client code must continue working
4. **Performance**: Token validation must be fast (<10ms overhead)
5. **Security**: Token binding must be cryptographically sound

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Next.js Edge Runtime Documentation](https://nextjs.org/docs/app/api-reference/edge)
- [Web Crypto API - HMAC](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

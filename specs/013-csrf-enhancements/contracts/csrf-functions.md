# CSRF Protection Function Contracts

**Feature**: CSRF Protection Security Enhancements  
**Date**: 2026-01-19  
**Type**: Internal Function Contracts

## Overview

This document defines the internal function contracts for CSRF token binding, rotation, and validation. These are internal implementation details, not public API endpoints.

## Token Generation Functions

### `generateCsrfToken(sessionId: string | null): string`

**Purpose**: Generate a cryptographically secure CSRF token bound to a session ID.

**Parameters**:
- `sessionId` (string | null): UUID of the session to bind token to, or null for unauthenticated users

**Returns**: 
- `string`: Base64-encoded token containing `sessionId:randomBytes:hmac`

**Token Structure**:
```
base64(sessionId + ":" + randomBytes + ":" + HMAC(sessionId + randomBytes, CSRF_SECRET))
```

**Preconditions**:
- `sessionId` must be valid UUID format if provided, or null
- CSRF_SECRET environment variable must be set

**Postconditions**:
- Token contains 256 bits of entropy from randomBytes
- Token is cryptographically bound to sessionId (if provided)
- Token includes HMAC signature for tamper detection

**Side Effects**: None (pure function)

**Errors**:
- Throws if CSRF_SECRET is not set
- Throws if sessionId format is invalid (when provided)

---

### `parseCsrfToken(token: string): { sessionId: string; randomBytes: string; hmac: string } | null`

**Purpose**: Parse and validate CSRF token structure.

**Parameters**:
- `token` (string): Base64-encoded CSRF token

**Returns**:
- Object with `sessionId`, `randomBytes`, `hmac` if token is valid
- `null` if token format is invalid

**Preconditions**:
- `token` must be non-empty string

**Postconditions**:
- Returns parsed components if token format is valid
- Returns null if token cannot be parsed

**Side Effects**: None (pure function)

**Errors**: None (returns null on invalid format)

---

## Token Validation Functions

### `validateCsrfTokenBinding(token: string, currentSessionId: string | null): boolean`

**Purpose**: Validate that CSRF token is bound to the current active session.

**Parameters**:
- `token` (string): CSRF token from cookie
- `currentSessionId` (string | null): Current active session ID from JWT, or null if unauthenticated

**Returns**:
- `boolean`: true if token binding is valid, false otherwise

**Validation Steps**:
1. Parse token structure
2. Validate HMAC signature
3. Compare token sessionId with currentSessionId
4. Return true only if all checks pass

**Preconditions**:
- `token` must be non-empty string
- `currentSessionId` must be valid UUID if provided, or null

**Postconditions**:
- Returns true only if token is bound to current session
- Returns false if token format invalid, HMAC invalid, or session mismatch

**Side Effects**: None (pure function)

**Errors**: None (returns false on validation failure)

---

### `verifyCsrfToken(cookieToken: string | null, headerToken: string | null, currentSessionId: string | null): boolean`

**Purpose**: Complete CSRF token verification (Double-Submit Cookie pattern + session binding).

**Parameters**:
- `cookieToken` (string | null): Token from cookie
- `headerToken` (string | null): Token from x-csrf-token header
- `currentSessionId` (string | null): Current active session ID

**Returns**:
- `boolean`: true if token verification passes, false otherwise

**Validation Steps**:
1. Check both tokens exist
2. Constant-time comparison of cookie token with header token
3. Validate token binding to current session
4. Return true only if all checks pass

**Preconditions**:
- Tokens must be strings if provided
- `currentSessionId` must be valid UUID if provided

**Postconditions**:
- Returns true only if tokens match and binding is valid
- Uses constant-time comparison to prevent timing attacks

**Side Effects**: None (pure function)

**Errors**: None (returns false on validation failure)

---

## Token Rotation Functions

### `rotateCsrfToken(response: NextResponse, sessionId: string | null, request: NextRequest): void`

**Purpose**: Generate and set a new CSRF token bound to the specified session.

**Parameters**:
- `response` (NextResponse): Response object to set cookie on
- `sessionId` (string | null): Session ID to bind token to, or null for unauthenticated
- `request` (NextRequest): Request object for cookie security settings

**Returns**: void

**Preconditions**:
- `response` must be valid NextResponse object
- `request` must be valid NextRequest object
- `sessionId` must be valid UUID if provided, or null

**Postconditions**:
- New CSRF token generated and bound to sessionId
- Token set in response cookie with appropriate security settings
- Cookie expires in 24 hours

**Side Effects**:
- Sets `csrf-token` cookie in response
- Overwrites any existing CSRF token cookie

**Errors**:
- Throws if CSRF_SECRET is not set
- Throws if sessionId format is invalid (when provided)

---

## Session Integration Functions

### `getSessionIdFromRequest(request: NextRequest): Promise<string | null>`

**Purpose**: Extract session ID from request (JWT token).

**Parameters**:
- `request` (NextRequest): Request object

**Returns**:
- `Promise<string | null>`: Session ID from JWT payload, or null if not authenticated

**Preconditions**:
- Request may or may not have session cookie

**Postconditions**:
- Returns sessionId if valid session exists
- Returns null if no session or session invalid

**Side Effects**: None

**Errors**:
- Returns null (does not throw) on invalid/missing session

---

## Client-Side Functions

### `getCsrfToken(): string | null`

**Purpose**: Retrieve CSRF token from cookie (client-side).

**Returns**:
- `string | null`: CSRF token value, or null if not found

**Preconditions**:
- Must be called in browser environment (document.cookie available)

**Postconditions**:
- Returns token if cookie exists and is valid
- Returns null if cookie missing or parsing fails
- Never throws exceptions (graceful error handling)

**Side Effects**: None (reads from document.cookie)

**Errors**: None (returns null on any error)

---

### `getCsrfHeaders(): Record<string, string>`

**Purpose**: Get headers object with CSRF token for fetch requests.

**Returns**:
- `Record<string, string>`: Headers object with `x-csrf-token` header, or empty object if no token

**Preconditions**:
- Must be called in browser environment

**Postconditions**:
- Returns headers object with CSRF token if available
- Returns empty object if token not available

**Side Effects**: None

**Errors**: None (returns empty object if token unavailable)

---

## Environment Variables

### `CSRF_SECRET`

**Purpose**: Secret key for HMAC signature generation and validation.

**Type**: string

**Required**: Yes

**Format**: Cryptographically secure random string (minimum 32 characters, recommended 64+)

**Usage**: Used in HMAC-SHA256 for token binding signature

**Security**: Must be kept secret, never exposed to client

---

## Error Handling

All functions follow these error handling patterns:

1. **Validation Failures**: Return `false` or `null` (never throw)
2. **Configuration Errors**: Throw descriptive errors (missing secrets, invalid config)
3. **Client-Side Errors**: Never throw, return `null` or empty object
4. **Server-Side Errors**: Log and return appropriate error responses

## Performance Requirements

- Token generation: < 5ms
- Token parsing: < 1ms
- Token validation: < 10ms (including session lookup if needed)
- Constant-time comparison: O(n) where n is token length

## Security Requirements

- All token operations use constant-time algorithms where applicable
- HMAC signatures prevent token tampering
- Session binding prevents token reuse across sessions
- Token generation uses cryptographically secure random number generator
- Secrets never exposed to client-side code

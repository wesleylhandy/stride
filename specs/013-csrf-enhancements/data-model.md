# Data Model: CSRF Protection Security Enhancements

**Feature**: CSRF Protection Security Enhancements  
**Date**: 2026-01-19

## Overview

This feature enhances the existing CSRF protection system by binding tokens to user sessions and implementing token rotation. No new database entities are required - enhancements work with existing Session model and cookie-based token storage.

## Entities

### CSRF Token (Enhanced)

**Purpose**: Cryptographically secure token bound to user session for CSRF protection.

**Storage**: Cookie-based (non-httpOnly for Double-Submit Cookie pattern), no database storage.

**Attributes**:
- `token` (String, Required) - Base64-encoded token containing: `sessionId:randomBytes:hmac`
  - Format: `base64(sessionId + ":" + randomBytes + ":" + HMAC(sessionId + randomBytes, secret))`
  - Length: ~164 characters (base64 encoded)
  - Entropy: 256 bits from randomBytes
- `sessionId` (String, Embedded) - UUID of associated Session record (extracted from token)
- `randomBytes` (String, Embedded) - 32 bytes hex-encoded random data (64 characters)
- `hmac` (String, Embedded) - HMAC-SHA256 signature for tamper detection (64 characters hex)
- `expiresAt` (DateTime, Implicit) - Inherited from cookie maxAge (24 hours)

**Relationships**:
- **Bound To**: Session (via embedded sessionId in token structure)
  - One CSRF token per active session
  - Token becomes invalid when session is deleted/expired

**Validation Rules**:
- Token must be valid base64 encoding
- Token must contain exactly 3 parts separated by ":"
- Session ID must be valid UUID format
- Random bytes must be 64 hex characters
- HMAC must be 64 hex characters
- HMAC must match computed signature for (sessionId + randomBytes)
- Session ID must match current active session

**State Transitions**:
1. **Generated**: Token created with session binding on first request or after rotation
2. **Active**: Token valid and bound to active session
3. **Invalid**: Token invalidated when:
   - Session is deleted
   - Session expires
   - Session ID changes (new login)
   - HMAC validation fails
   - Token format is invalid

---

### Session (Enhanced)

**Purpose**: User authentication session (existing entity, enhanced with sessionId in JWT).

**Storage**: Database (Prisma Session model).

**Attributes** (existing, with enhancement):
- `id` (UUID, Primary Key) - **Now included in JWT payload for CSRF binding**
- `userId` (UUID, Foreign Key → User, Required)
- `token` (String, Required, Unique) - JWT token containing sessionId in payload
- `expiresAt` (DateTime, Required)
- `ipAddress` (String, Optional)
- `userAgent` (String, Optional)
- `createdAt` (DateTime, Required)

**Enhancement**: JWT payload now includes `sessionId` field:
```typescript
interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string; // NEW: Database session ID for CSRF binding
}
```

**Relationships**:
- Many-to-One: `Session.userId` → User (existing)
- One-to-Many: Session → CSRF Tokens (via sessionId binding, logical relationship)

**Validation Rules**:
- `sessionId` in JWT must match database `Session.id`
- Session must exist and not be expired for CSRF token validation

**State Transitions** (existing, with CSRF implications):
1. **Created**: New session created → CSRF token should be rotated
2. **Active**: Session valid → CSRF tokens bound to this session are valid
3. **Deleted**: Session deleted → All CSRF tokens bound to this session become invalid
4. **Expired**: Session expired → All CSRF tokens bound to this session become invalid

---

### CSRF Validation Result

**Purpose**: Outcome of CSRF token validation (logical entity, not stored).

**Attributes**:
- `valid` (Boolean, Required) - Whether token validation passed
- `sessionId` (String, Optional) - Extracted session ID from token (if valid format)
- `currentSessionId` (String, Optional) - Current active session ID (if authenticated)
- `reason` (String, Optional) - Reason for validation failure (if invalid)
- `timestamp` (DateTime, Required) - When validation occurred
- `requestId` (String, Optional) - Request ID for logging/tracking

**Validation Failure Reasons**:
- `missing_token` - No CSRF token in cookie or header
- `token_mismatch` - Cookie token doesn't match header token
- `invalid_format` - Token format is invalid (cannot parse)
- `invalid_hmac` - HMAC signature validation failed
- `session_mismatch` - Token session ID doesn't match current session
- `session_expired` - Session associated with token has expired
- `session_deleted` - Session associated with token has been deleted

---

## Relationships Summary

```
Session (Database)
  ├──→ JWT Token (contains sessionId in payload)
  └──→ CSRF Token (bound via embedded sessionId)
        ├──→ Cookie Storage (csrf-token cookie)
        └──→ Header Validation (x-csrf-token header)
```

## Data Flow

### Token Generation Flow
1. User makes request (GET for unauthenticated, or login completes)
2. System generates 32 random bytes
3. System gets current session ID (from JWT or null for unauthenticated)
4. System computes HMAC(sessionId + randomBytes, secret)
5. System encodes: `base64(sessionId + ":" + randomBytes + ":" + hmac)`
6. System sets token in cookie

### Token Validation Flow
1. Request arrives with CSRF token in cookie and header
2. System extracts token from cookie
3. System decodes base64 token
4. System parses: `sessionId:randomBytes:hmac`
5. System validates HMAC signature
6. System extracts current session ID from JWT (if authenticated)
7. System compares token sessionId with current sessionId
8. System validates session exists and not expired
9. System compares cookie token with header token (constant-time)
10. Validation passes if all checks succeed

### Token Rotation Flow
1. User logs in or logs out
2. System creates or deletes session
3. System gets new/current session ID
4. System generates new CSRF token bound to session ID
5. System sets new token in response cookie
6. Old token becomes invalid (different session ID binding)

## Constraints

### Unique Constraints
- One active CSRF token per session (enforced by cookie, not database)
- Session ID in JWT must match Session.id in database

### Referential Integrity
- CSRF token sessionId must reference valid Session.id
- When Session is deleted, all CSRF tokens bound to that session become invalid

### Validation Constraints
- Token format must be: `base64(sessionId:randomBytes:hmac)`
- Session ID must be valid UUID
- Random bytes must be exactly 64 hex characters
- HMAC must be exactly 64 hex characters
- HMAC must validate against (sessionId + randomBytes)

## Indexes

No new database indexes required - CSRF tokens are cookie-based, not database-stored.

Existing Session indexes support CSRF validation:
- `Session.id` (primary key) - Fast session lookup
- `Session.token` (unique index) - Fast session verification
- `Session.expiresAt` (index) - Fast expiration checks

## Migration Requirements

**No database migration required** - enhancements work with existing Session model.

**Code changes required**:
1. Update `SessionPayload` interface to include `sessionId`
2. Update `createSession()` to include sessionId in JWT payload
3. Update `verifySession()` to extract and return sessionId
4. Enhance CSRF token generation to include session binding
5. Enhance CSRF token validation to check session binding

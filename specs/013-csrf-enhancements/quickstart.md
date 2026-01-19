# Quickstart: CSRF Protection Security Enhancements

**Feature**: CSRF Protection Security Enhancements  
**Date**: 2026-01-19

## Overview

This guide provides setup instructions for implementing CSRF token binding and rotation enhancements. The enhancements add session binding to CSRF tokens and automatic token rotation on authentication events.

## Prerequisites

- Existing CSRF middleware implementation (`apps/web/src/middleware/csrf.ts`)
- Existing session management system (`apps/web/src/lib/auth/session.ts`)
- Next.js 16+ with Edge Runtime support
- PostgreSQL database with Session model

## Setup Steps

### 1. Environment Configuration

Add CSRF secret to environment variables:

```bash
# Generate secure secret (64 characters recommended)
openssl rand -hex 32

# Add to .env
CSRF_SECRET=<generated-secret>
```

**Security Note**: CSRF_SECRET must be:
- Minimum 32 characters
- Cryptographically secure random value
- Never exposed to client-side code
- Different from JWT_SECRET

### 2. Update Session Payload Interface

Modify `apps/web/src/lib/auth/session.ts`:

```typescript
export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string; // NEW: Add session database ID
}
```

### 3. Update Session Creation

Modify `createSession()` to include sessionId in JWT:

```typescript
export async function createSession(...): Promise<string> {
  // ... existing code ...
  
  // Create session in database first
  const session = await prisma.session.create({
    data: { userId, token, expiresAt, ipAddress, userAgent },
  });

  // Include sessionId in JWT payload
  const payload: SessionPayload = {
    userId,
    email,
    role,
    sessionId: session.id, // NEW: Include database session ID
  };

  // ... rest of JWT creation ...
}
```

### 4. Update Session Verification

Modify `verifySession()` to extract and return sessionId:

```typescript
export async function verifySession(token: string): Promise<SessionPayload | null> {
  // ... existing verification ...
  
  return {
    userId: session.userId,
    email: session.user.email,
    role: session.user.role as UserRole,
    sessionId: session.id, // NEW: Return session ID
  };
}
```

### 5. Enhance CSRF Token Generation

Update `generateCsrfToken()` in `apps/web/src/middleware/csrf.ts`:

```typescript
function generateCsrfToken(sessionId: string | null): string {
  // Generate 32 random bytes
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');

  // Use null for unauthenticated users
  const sessionIdStr = sessionId || 'anonymous';
  
  // Compute HMAC signature
  const hmac = await computeHmac(sessionIdStr + randomHex);
  
  // Encode: sessionId:randomBytes:hmac
  const tokenData = `${sessionIdStr}:${randomHex}:${hmac}`;
  return btoa(tokenData);
}
```

### 6. Add Token Binding Validation

Add validation function to check session binding:

```typescript
async function validateTokenBinding(
  token: string,
  currentSessionId: string | null
): Promise<boolean> {
  try {
    const decoded = atob(token);
    const [sessionId, randomBytes, hmac] = decoded.split(':');
    
    // Validate HMAC
    const expectedHmac = await computeHmac(sessionId + randomBytes);
    if (hmac !== expectedHmac) return false;
    
    // Validate session binding
    if (currentSessionId === null) {
      return sessionId === 'anonymous';
    }
    return sessionId === currentSessionId;
  } catch {
    return false;
  }
}
```

### 7. Update CSRF Middleware

Enhance `csrfMiddleware()` to validate session binding:

```typescript
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // ... existing path and method checks ...
  
  // Get current session ID from JWT
  const sessionId = await getSessionIdFromRequest(request);
  
  // For unsafe methods, verify CSRF token with session binding
  if (UNSAFE_METHODS.includes(request.method)) {
    const cookieToken = getCsrfTokenFromCookie(request);
    const headerToken = getCsrfTokenFromHeader(request);
    
    // Verify token match (existing)
    if (!verifyCsrfToken(cookieToken, headerToken)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    
    // NEW: Verify session binding
    if (!await validateTokenBinding(cookieToken, sessionId)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
  }
  
  // ... rest of middleware ...
}
```

### 8. Add Token Rotation Function

Create `rotateCsrfToken()` helper:

```typescript
export async function rotateCsrfToken(
  response: NextResponse,
  sessionId: string | null,
  request: NextRequest
): Promise<void> {
  const newToken = generateCsrfToken(sessionId);
  setCsrfTokenCookie(response, newToken, request);
}
```

### 9. Integrate Token Rotation in Login

Update `/api/auth/login` route:

```typescript
export async function POST(request: Request) {
  // ... existing login logic ...
  
  // After successful login and session creation
  const session = await verifySession(token);
  const response = NextResponse.json({ user: userWithoutPassword, token });
  
  // Rotate CSRF token bound to new session
  await rotateCsrfToken(response, session?.sessionId || null, request);
  
  return response;
}
```

### 10. Integrate Token Rotation in Logout

Update `/api/auth/logout` route:

```typescript
export async function POST(request: Request) {
  // ... existing logout logic ...
  
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  // Rotate CSRF token (null sessionId for unauthenticated)
  await rotateCsrfToken(response, null, request);
  
  return response;
}
```

### 11. Improve Client-Side Cookie Parsing

Update `apps/web/src/lib/utils/csrf.ts`:

```typescript
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const match = document.cookie.match(/csrf-token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch (error) {
    // Gracefully handle parsing errors
    console.error('Failed to parse CSRF token:', error);
  }
  
  return null;
}
```

## Verification

### Test Token Binding

1. Log in as a user
2. Check CSRF token cookie contains session ID
3. Verify token validation succeeds for authenticated requests
4. Log out
5. Verify old token is invalid (different session binding)

### Test Token Rotation

1. Log in and capture CSRF token
2. Perform logout
3. Verify new CSRF token is generated
4. Verify old token is rejected

### Test Concurrent Requests

1. Open multiple tabs
2. Log in from one tab
3. Verify all tabs receive new token on next request
4. Verify no race conditions occur

## Troubleshooting

### Token Validation Fails After Login

**Issue**: CSRF token validation fails immediately after login.

**Solution**: Ensure token rotation happens AFTER session creation and cookie is set in same response.

### Session ID Not Found in Middleware

**Issue**: Cannot extract sessionId from request in middleware.

**Solution**: Verify JWT payload includes sessionId field and middleware can decode JWT.

### HMAC Validation Fails

**Issue**: Token HMAC validation always fails.

**Solution**: Ensure CSRF_SECRET is set and same value used for generation and validation.

## Next Steps

- Review security audit findings
- Monitor CSRF validation failure logs
- Consider adding token rotation on privilege escalation (future enhancement)

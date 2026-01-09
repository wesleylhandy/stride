# API Contracts: Login/Signup Authentication

**Created**: 2025-01-XX  
**Purpose**: Define API endpoints, request/response formats, and error handling for authentication

## Endpoints Overview

1. `POST /api/auth/login` - User login (existing, enhanced)
2. `POST /api/auth/register` - User registration (existing, used for first admin)
3. `POST /api/auth/logout` - User logout (existing)
4. `GET /api/auth/me` - Get current user session (existing)
5. `GET /api/setup/status` - Check if admin exists (existing, first-run check)

---

## Endpoint 1: User Login

**Endpoint**: `POST /api/auth/login`

**Purpose**: Authenticate user with email and password, create session, set HTTP-only cookie

**Authentication**: Not required (public endpoint)

**Request Body**:
```typescript
{
  email: string;        // Required, valid email format
  password: string;     // Required, min 1 character
  rememberMe?: boolean; // Optional, extend session duration (future enhancement)
}
```

**Example Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```typescript
{
  user: {
    id: string;           // UUID
    email: string;
    username: string;
    name: string | null;
    role: "Admin" | "Member" | "Viewer";
    avatarUrl: string | null;
    emailVerified: boolean;
    createdAt: string;    // ISO 8601 datetime
    updatedAt: string;    // ISO 8601 datetime
  },
  token: string;          // JWT token (also set as HTTP-only cookie)
}
```

**Example Response**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "role": "Member",
    "avatarUrl": null,
    "emailVerified": false,
    "createdAt": "2025-01-XXT12:00:00Z",
    "updatedAt": "2025-01-XXT12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**HTTP-Only Cookie Set**:
```
Set-Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

**Cookie Details**:
- Name: `session`
- Value: JWT token
- HttpOnly: `true` (prevents XSS)
- Secure: `true` in production (HTTPS only)
- SameSite: `lax` (prevents CSRF)
- Path: `/`
- Max-Age: 604800 (7 days in seconds)

**Error Responses**:

**400 Bad Request** - Validation error:
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address"
      }
    ]
  }
}
```

**401 Unauthorized** - Invalid credentials:
```json
{
  "error": "Invalid email or password"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error"
}
```

**Security Considerations**:
- Don't reveal if email exists (prevent enumeration)
- Use generic error message: "Invalid email or password"
- Rate limiting should be implemented (prevent brute force)
- Password never exposed in response

---

## Endpoint 2: User Registration

**Endpoint**: `POST /api/auth/register`

**Purpose**: Create new user account (currently used for first admin setup, future: invitation-based)

**Authentication**: Not required (public endpoint, but should be restricted in future)

**Request Body**:
```typescript
{
  email: string;        // Required, valid email format
  username: string;     // Required, 3-30 chars, alphanumeric + underscore + hyphen
  password: string;     // Required, min 8 characters
  name?: string;        // Optional, display name
}
```

**Example Request**:
```json
{
  "email": "admin@example.com",
  "username": "admin",
  "password": "SecurePassword123!",
  "name": "Admin User"
}
```

**Response** (201 Created):
```typescript
{
  user: {
    id: string;           // UUID
    email: string;
    username: string;
    name: string | null;
    role: "Admin" | "Member" | "Viewer";
    avatarUrl: string | null;
    emailVerified: boolean;
    createdAt: string;    // ISO 8601 datetime
    updatedAt: string;    // ISO 8601 datetime
  },
  message: string;        // Success message
}
```

**Example Response**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "username": "admin",
    "name": "Admin User",
    "role": "Admin",
    "avatarUrl": null,
    "emailVerified": false,
    "createdAt": "2025-01-XXT12:00:00Z",
    "updatedAt": "2025-01-XXT12:00:00Z"
  },
  "message": "Admin account created successfully"
}
```

**Note**: Currently used for first admin setup. Future implementation should be invitation-based (see user-management-plan.md).

**Error Responses**:

**400 Bad Request** - Validation error:
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

**409 Conflict** - Email or username already exists:
```json
{
  "error": "Email or username already exists"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error"
}
```

**Security Considerations**:
- Password strength validation (min 8 chars, recommend complexity)
- Password hashed with bcrypt before storage
- Password never exposed in response
- Rate limiting should be implemented (prevent abuse)

---

## Endpoint 3: User Logout

**Endpoint**: `POST /api/auth/logout`

**Purpose**: Invalidate session and clear HTTP-only cookie

**Authentication**: Required (session token in cookie)

**Request Body**: None (optional empty body)

**Response** (200 OK):
```typescript
{
  message: string;  // Success message
}
```

**Example Response**:
```json
{
  "message": "Logged out successfully"
}
```

**HTTP-Only Cookie Cleared**:
```
Set-Cookie: session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0
```

**Error Responses**:

**401 Unauthorized** - Not authenticated:
```json
{
  "error": "Authentication required"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error"
}
```

**Security Considerations**:
- Delete session from database
- Clear HTTP-only cookie
- No sensitive data in response

---

## Endpoint 4: Get Current User

**Endpoint**: `GET /api/auth/me`

**Purpose**: Get current authenticated user information

**Authentication**: Required (session token in cookie)

**Request Body**: None

**Response** (200 OK):
```typescript
{
  user: {
    id: string;           // UUID
    email: string;
    username: string;
    name: string | null;
    role: "Admin" | "Member" | "Viewer";
    avatarUrl: string | null;
    emailVerified: boolean;
    createdAt: string;    // ISO 8601 datetime
    updatedAt: string;    // ISO 8601 datetime
  }
}
```

**Example Response**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "role": "Member",
    "avatarUrl": null,
    "emailVerified": false,
    "createdAt": "2025-01-XXT12:00:00Z",
    "updatedAt": "2025-01-XXT12:00:00Z"
  }
}
```

**Error Responses**:

**401 Unauthorized** - Not authenticated or invalid session:
```json
{
  "error": "Authentication required"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error"
}
```

**Security Considerations**:
- Verify session token from cookie
- Return user data only if session is valid
- Don't expose password hash or sensitive data

---

## Endpoint 5: Check Setup Status

**Endpoint**: `GET /api/setup/status`

**Purpose**: Check if admin user exists (first-run detection)

**Authentication**: Not required (public endpoint)

**Request Body**: None

**Response** (200 OK):
```typescript
{
  adminExists: boolean;  // True if admin user exists, false if first run
}
```

**Example Response**:
```json
{
  "adminExists": true
}
```

**Use Case**: 
- First run: `adminExists: false` → redirect to `/setup`
- Admin exists: `adminExists: true` → redirect to `/login`

**Error Responses**:

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error"
}
```

---

## Endpoint 6: List Projects (Onboarding Completion Check)

**Endpoint**: `GET /api/projects`

**Purpose**: List user's projects (used for onboarding completion check)

**Authentication**: Required (session token in cookie)

**Request Body**: None

**Query Parameters**: Optional pagination parameters

**Response** (200 OK):
```typescript
{
  items: Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    // ... other project fields
  }>;
  total: number;
  page?: number;
  pageSize?: number;
}
```

**Example Response**:
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "key": "APP",
      "name": "My Project",
      "description": "Project description",
      "createdAt": "2025-01-XXT12:00:00Z",
      "updatedAt": "2025-01-XXT12:00:00Z"
    }
  ],
  "total": 1
}
```

**Onboarding Completion Logic**:
- Onboarding is **complete** when `items.length > 0` (user has at least one project)
- Onboarding is **incomplete** when `items.length === 0` (user has no projects)

**Use Case**:
- After login: Check `items.length` to determine redirect destination
  - If `items.length > 0` → Redirect to `/dashboard` or `/projects`
  - If `items.length === 0` → Redirect to `/onboarding`
- Root page redirect: Check onboarding status before redirecting
- Onboarding page: Check onboarding status, redirect to dashboard if already complete

**Error Responses**:

**401 Unauthorized** - Not authenticated:
```json
{
  "error": "Authentication required"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error"
}
```

**Note**: This endpoint is used for onboarding completion detection. The actual projects listing page implementation may have additional features (pagination, filtering, etc.).

---

## Future Endpoints (Out of Scope)

### Password Reset Flow

**POST /api/auth/forgot-password** - Request password reset
- Body: `{ email: string }`
- Response: `{ message: string }` (always success, don't reveal if email exists)

**GET /api/auth/reset-password** - Verify reset token
- Query: `?token=...`
- Response: `{ valid: boolean, email?: string }`

**POST /api/auth/reset-password** - Reset password with token
- Body: `{ token: string, password: string, confirmPassword: string }`
- Response: `{ message: string }`

### Email Verification

**POST /api/auth/resend-verification** - Resend verification email
- Body: `{ email: string }`
- Response: `{ message: string }`

**GET /api/auth/verify-email** - Verify email with token
- Query: `?token=...`
- Response: `{ message: string }`

### OAuth Login

**GET /api/auth/oauth/[provider]** - Initiate OAuth flow
- Providers: `github`, `google`
- Response: Redirect to OAuth provider

**GET /api/auth/oauth/[provider]/callback** - OAuth callback
- Query: `?code=...&state=...`
- Response: Redirect to app with session cookie set

---

## Error Response Standardization

### Error Response Format

All errors should follow this format:

```typescript
{
  error: string | {
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  }
}
```

### HTTP Status Codes

- **200 OK**: Success (login, logout, get user)
- **201 Created**: Resource created (registration)
- **400 Bad Request**: Validation error, malformed request
- **401 Unauthorized**: Authentication required or invalid credentials
- **403 Forbidden**: Authenticated but not authorized (not used in auth endpoints)
- **404 Not Found**: Resource not found (not used in auth endpoints)
- **409 Conflict**: Resource conflict (email/username exists)
- **500 Internal Server Error**: Server error

### Error Messages

**Security-Conscious Messages**:
- Don't reveal if email exists: "Invalid email or password" (not "Email not found")
- Don't reveal username availability: "Email or username already exists" (not "Username taken")
- Don't expose internal errors: "Internal server error" (not stack traces)

**Helpful Messages**:
- Validation errors should be specific: "Password must be at least 8 characters"
- Field-level errors should identify field: `{ field: "email", message: "Invalid email format" }`

---

## Request/Response Validation

### Client-Side Validation

**Email**: HTML5 `type="email"` input validation
**Password**: Minimum length check, strength indicator (optional)
**Username**: Pattern validation (`^[a-zA-Z0-9_-]+$`), length check (3-30)

### Server-Side Validation

**Zod Schemas** (already implemented):

```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});
```

---

## Rate Limiting

**Recommendation**: Implement rate limiting for authentication endpoints

**Endpoints to Rate Limit**:
- `POST /api/auth/login` - 5 attempts per 15 minutes per IP
- `POST /api/auth/register` - 3 attempts per hour per IP
- `POST /api/auth/forgot-password` - 3 attempts per hour per IP (future)

**Rate Limit Headers**:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1633024800
```

**Rate Limit Response** (429 Too Many Requests):
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900  // seconds until retry allowed
}
```

---

## CORS Configuration

**Current**: Not applicable (same-origin requests)

**Future** (if API becomes public):
- Allow specific origins only
- Credentials: `include` (for cookie-based auth)
- Methods: `POST, GET, OPTIONS`
- Headers: `Content-Type, Authorization`

---

## Security Headers

**Recommended Headers** (set in middleware or API routes):

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains (HTTPS only)
Content-Security-Policy: default-src 'self' (adjust as needed)
```

---

## Testing Considerations

### Test Cases

1. **Login**:
   - Valid credentials → 200 OK, session cookie set
   - Invalid email → 401 Unauthorized
   - Invalid password → 401 Unauthorized
   - Missing fields → 400 Bad Request
   - Invalid email format → 400 Bad Request

2. **Registration**:
   - Valid data → 201 Created, user created
   - Duplicate email → 409 Conflict
   - Duplicate username → 409 Conflict
   - Invalid password → 400 Bad Request
   - Invalid username → 400 Bad Request

3. **Logout**:
   - Authenticated → 200 OK, cookie cleared
   - Not authenticated → 401 Unauthorized

4. **Get Current User**:
   - Authenticated → 200 OK, user data
   - Not authenticated → 401 Unauthorized
   - Expired session → 401 Unauthorized

5. **Setup Status**:
   - Admin exists → 200 OK, `adminExists: true`
   - First run → 200 OK, `adminExists: false`

# Data Model: Login/Signup Authentication

**Created**: 2025-01-XX  
**Purpose**: Document data model for login/signup authentication system

## Existing Models

### User Model

**Location**: `packages/database/prisma/schema.prisma`

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String
  name          String?
  role          UserRole  @default(Member)
  avatarUrl     String?
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  projects      Project[]
  issues        Issue[]
  
  @@index([email])
  @@index([username])
  @@map("users")
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `email`: User email address (unique, used for login)
- `username`: Username (unique, used for display)
- `passwordHash`: Bcrypt-hashed password
- `name`: Optional display name
- `role`: User role (Admin, Member, Viewer)
- `avatarUrl`: Optional avatar URL
- `emailVerified`: Email verification status (default: false)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

**Relationships**:
- `sessions`: One-to-many with Session model
- `projects`: One-to-many with Project model (if user owns projects)
- `issues`: One-to-many with Issue model (if user assigned to issues)

**Indexes**:
- Primary key on `id`
- Unique index on `email`
- Unique index on `username`
- Non-unique index on `email` (already unique, but explicit for queries)
- Non-unique index on `username` (already unique, but explicit for queries)

### Session Model

**Location**: `packages/database/prisma/schema.prisma`

```prisma
model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("sessions")
}
```

**Fields**:
- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User model
- `token`: JWT token (unique, stored for validation)
- `expiresAt`: Token expiration timestamp
- `ipAddress`: Optional IP address where session was created
- `userAgent`: Optional user agent string
- `createdAt`: Session creation timestamp

**Relationships**:
- `user`: Many-to-one with User model (Cascade delete)

**Indexes**:
- Primary key on `id`
- Unique index on `token`
- Non-unique index on `userId` (for session lookup by user)
- Non-unique index on `token` (already unique, but explicit for queries)
- Non-unique index on `expiresAt` (for cleanup of expired sessions)

## Schema Changes

### No Schema Changes Required

The existing User and Session models support all required functionality for login/signup:

1. **Login**: Uses email + password → creates session
2. **Registration**: Creates user with email, username, password → creates session
3. **Session Management**: JWT tokens stored in Session model
4. **Email Verification**: `emailVerified` field exists (currently not enforced)
5. **Password Reset**: Can be implemented without schema changes (temporary tokens stored in separate table if needed)
6. **Remember Me**: Can extend session expiration without schema changes

### Future Schema Enhancements (Out of Scope)

If implementing future features, these fields/tables would be needed:

**Password Reset Tokens** (for password reset flow):
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}
```

**Email Verification Tokens** (for email verification flow):
```prisma
model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

**OAuth Accounts** (for OAuth login):
```prisma
model OAuthAccount {
  id            String   @id @default(uuid())
  userId        String
  provider      String   // 'github', 'google', etc.
  providerId    String   // Provider's user ID
  accessToken   String?  // Encrypted
  refreshToken  String?  // Encrypted
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerId])
  @@index([userId])
  @@index([provider, providerId])
  @@map("oauth_accounts")
}
```

## Validation Rules

### Email Validation

**Format**: Valid email address format
**Uniqueness**: Must be unique across all users
**Required**: Yes, for all user accounts

**Implementation**: 
- Client-side: HTML5 `type="email"` input validation
- Server-side: Zod schema validation (`z.string().email()`)

### Username Validation

**Format**: 3-30 characters, alphanumeric + underscore + hyphen (`^[a-zA-Z0-9_-]+$`)
**Uniqueness**: Must be unique across all users
**Required**: Yes, for all user accounts

**Implementation**:
- Client-side: Pattern validation + length check
- Server-side: Zod schema validation

### Password Validation

**Strength Requirements**:
- Minimum 8 characters
- Recommended: Mix of uppercase, lowercase, numbers, symbols

**Storage**: Bcrypt hash (never store plaintext)

**Implementation**:
- Client-side: Length check + strength indicator (optional)
- Server-side: Zod schema validation + password strength check

### Role Validation

**Valid Values**: `Admin`, `Member`, `Viewer`
**Default**: `Member`
**First User**: Becomes `Admin` (during first-run setup)

**Implementation**:
- Server-side: Enum validation via Prisma UserRole type

## State Transitions

### User Registration Flow

1. **Form Submission**: User submits registration form
2. **Validation**: Client-side + server-side validation
3. **User Creation**: Create User record in database
4. **Session Creation**: Create Session record with JWT token
5. **Cookie Setting**: Set HTTP-only cookie with session token
6. **Redirect**: Redirect to onboarding or dashboard

**Error States**:
- Email already exists → 409 Conflict
- Username already exists → 409 Conflict
- Validation error → 400 Bad Request
- Server error → 500 Internal Server Error

### User Login Flow

1. **Form Submission**: User submits login form
2. **Validation**: Client-side + server-side validation
3. **User Lookup**: Find user by email
4. **Password Verification**: Verify password against hash
5. **Session Creation**: Create Session record with JWT token
6. **Cookie Setting**: Set HTTP-only cookie with session token
7. **Redirect**: Redirect to onboarding (if not completed) or dashboard

**Error States**:
- User not found → 401 Unauthorized (generic message)
- Invalid password → 401 Unauthorized (generic message)
- Validation error → 400 Bad Request
- Server error → 500 Internal Server Error

### Session Management Flow

1. **Session Creation**: On login/registration, create Session record
2. **Token Generation**: Generate JWT token with user payload
3. **Token Storage**: Store token in Session table + HTTP-only cookie
4. **Token Verification**: On protected routes, verify token in database
5. **Session Expiration**: Check `expiresAt` timestamp
6. **Session Cleanup**: Delete expired sessions (background job)

**Session Expiration**:
- Default: 7 days (from `SESSION_EXPIRES_IN_DAYS` environment variable)
- Future: Extended sessions with "Remember me" (30-90 days)

## Data Access Patterns

### User Lookup

**By Email** (for login):
```typescript
const user = await prisma.user.findUnique({
  where: { email },
});
```

**By Username** (for display):
```typescript
const user = await prisma.user.findUnique({
  where: { username },
});
```

**By ID** (for session verification):
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

### Session Management

**Create Session**:
```typescript
const session = await prisma.session.create({
  data: {
    userId,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  },
});
```

**Verify Session**:
```typescript
const session = await prisma.session.findUnique({
  where: { token },
  include: { user: true },
});

if (!session || session.expiresAt < new Date()) {
  return null; // Invalid or expired
}
```

**Delete Session** (logout):
```typescript
await prisma.session.delete({
  where: { token },
});
```

**Cleanup Expired Sessions** (background job):
```typescript
await prisma.session.deleteMany({
  where: {
    expiresAt: {
      lt: new Date(),
    },
  },
});
```

## Security Considerations

### Password Security

1. **Hashing**: All passwords hashed with bcrypt (never store plaintext)
2. **Salt Rounds**: Use bcrypt default (10 rounds minimum)
3. **Password Strength**: Enforce minimum 8 characters, recommend complexity
4. **Password Reset**: Use secure, single-use tokens (if implemented)

### Session Security

1. **HTTP-Only Cookies**: Prevents XSS attacks (JavaScript cannot access)
2. **Secure Flag**: Set in production (HTTPS only)
3. **SameSite**: Set to `lax` (prevents CSRF)
4. **Token Storage**: Store tokens in database for validation
5. **Token Expiration**: Short-lived tokens (7 days default)
6. **IP Address Logging**: Optional, for security auditing

### Data Privacy

1. **Email Visibility**: Only expose to authenticated users (self or admin)
2. **Username Visibility**: Public (used for display)
3. **Password Hash**: Never exposed in API responses
4. **Session Tokens**: Never exposed in client-side JavaScript

## Indexes and Performance

### Existing Indexes

1. **User.email**: Unique index (fast lookup for login)
2. **User.username**: Unique index (fast lookup for display)
3. **Session.token**: Unique index (fast session verification)
4. **Session.userId**: Non-unique index (fast user session lookup)
5. **Session.expiresAt**: Non-unique index (fast expired session cleanup)

### Query Performance

- **Login Lookup**: O(1) with email index
- **Session Verification**: O(1) with token index
- **User Session List**: O(log n) with userId index
- **Expired Session Cleanup**: O(log n) with expiresAt index

### Optimization Opportunities

1. **Session Cleanup**: Background job to delete expired sessions (reduce table size)
2. **User Session Limit**: Enforce maximum active sessions per user (prevent abuse)
3. **Rate Limiting**: Add rate limiting for login attempts (prevent brute force)

## Migration Notes

### No Migrations Required

The existing schema supports all required functionality for login/signup enhancement. No database migrations needed.

### Future Migrations (Out of Scope)

If implementing future features, these migrations would be needed:

1. **Password Reset Tokens**: Create `password_reset_tokens` table
2. **Email Verification Tokens**: Create `email_verification_tokens` table
3. **OAuth Accounts**: Create `oauth_accounts` table
4. **Remember Me**: Add `rememberMe` boolean to Session model (optional)
5. **Session IP Logging**: Add `ipAddress` to Session model (already exists)
6. **Session User Agent**: Add `userAgent` to Session model (already exists)

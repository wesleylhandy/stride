# API Contracts: Admin User Management

**Created**: 2025-01-XX  
**Purpose**: Define API endpoints, request/response formats, and error handling for user management

## Endpoints Overview

1. `POST /api/users` - Create user directly (Admin only)
2. `POST /api/users/invite` - Send invitation (Admin only)
3. `GET /api/users/invite/[token]` - Get invitation details (Public)
4. `POST /api/users/invite/[token]` - Accept invitation (Public)
5. `GET /api/users` - List users (Admin only) - May already exist, needs admin check

---

## Endpoint 1: Create User (Direct)

**Endpoint**: `POST /api/users`

**Purpose**: Allow admin to create a user account directly with a password set by admin

**Authentication**: Required (Admin role only)

**Request Body**:
```typescript
{
  email: string;           // Required, valid email format
  username: string;        // Required, 3-50 chars, alphanumeric + underscore
  password: string;        // Required, min 8 characters
  name?: string;          // Optional, display name
  role: "Member" | "Viewer"; // Required, Admin not allowed
}
```

**Example Request**:
```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "SecurePassword123!",
  "name": "New User",
  "role": "Member"
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
    "username": "newuser",
    "name": "New User",
    "role": "Member",
    "emailVerified": false,
    "createdAt": "2025-01-XXT12:00:00Z",
    "updatedAt": "2025-01-XXT12:00:00Z"
  }
}
```

**Error Responses**:

- **400 Bad Request**: Validation error
```json
{
  "error": {
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email format"],
      "username": ["Username must be 3-50 characters"],
      "password": ["Password must be at least 8 characters"],
      "role": ["Role must be Member or Viewer"]
    }
  }
}
```

- **401 Unauthorized**: Not authenticated
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden**: Not admin
```json
{
  "error": "Forbidden: Admin access required"
}
```

- **409 Conflict**: Email or username already exists
```json
{
  "error": "Email or username already exists"
}
```

- **500 Internal Server Error**: Server error
```json
{
  "error": "Internal server error"
}
```

---

## Endpoint 2: Send Invitation

**Endpoint**: `POST /api/users/invite`

**Purpose**: Allow admin to send email invitation to a user

**Authentication**: Required (Admin role only)

**Request Body**:
```typescript
{
  email: string;           // Required, valid email format
  role: "Member" | "Viewer"; // Required, Admin not allowed
}
```

**Example Request**:
```json
{
  "email": "invited@example.com",
  "role": "Member"
}
```

**Response** (201 Created):
```typescript
{
  invitation: {
    id: string;           // UUID
    email: string;
    role: "Member" | "Viewer";
    expiresAt: string;    // ISO 8601 datetime (7 days from now)
    // token NOT included in response (security)
  },
  message: "Invitation sent successfully",
  // If email unavailable, include token for manual sharing:
  token?: string;         // Only included if email service unavailable
  inviteUrl?: string;     // Only included if email service unavailable
}
```

**Example Response** (email sent):
```json
{
  "invitation": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "invited@example.com",
    "role": "Member",
    "expiresAt": "2025-01-XXT12:00:00Z"
  },
  "message": "Invitation sent successfully"
}
```

**Example Response** (email unavailable - manual sharing):
```json
{
  "invitation": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "invited@example.com",
    "role": "Member",
    "expiresAt": "2025-01-XXT12:00:00Z"
  },
  "message": "Invitation created but email service unavailable. Share invitation link manually:",
  "token": "abc123def456...",
  "inviteUrl": "https://stride.example.com/invite/abc123def456..."
}
```

**Error Responses**:

- **400 Bad Request**: Validation error
```json
{
  "error": {
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email format"],
      "email": ["Email already belongs to existing user"],
      "role": ["Role must be Member or Viewer"]
    }
  }
}
```

- **401 Unauthorized**: Not authenticated
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden**: Not admin
```json
{
  "error": "Forbidden: Admin access required"
}
```

- **409 Conflict**: Pending invitation already exists for email
```json
{
  "error": "Pending invitation already exists for this email"
}
```

- **503 Service Unavailable**: Email service not configured (optional - could return 201 with token instead)
```json
{
  "error": "Email service not configured",
  "message": "Invitation created but email could not be sent. Share invitation link manually."
}
```

- **500 Internal Server Error**: Server error
```json
{
  "error": "Internal server error"
}
```

---

## Endpoint 3: Get Invitation Details

**Endpoint**: `GET /api/users/invite/[token]`

**Purpose**: Allow user to view invitation details before accepting

**Authentication**: Not required (public endpoint, but token is secret)

**Path Parameters**:
- `token` (string, required) - Invitation token (64 hex characters)

**Response** (200 OK):
```typescript
{
  invitation: {
    email: string;
    role: "Member" | "Viewer";
    invitedByName: string | null; // Name of admin who sent invitation
    expiresAt: string;             // ISO 8601 datetime
  }
}
```

**Example Response**:
```json
{
  "invitation": {
    "email": "invited@example.com",
    "role": "Member",
    "invitedByName": "Admin User",
    "expiresAt": "2025-01-XXT12:00:00Z"
  }
}
```

**Error Responses**:

- **400 Bad Request**: Invalid token format
```json
{
  "error": "Invalid invitation token format"
}
```

- **404 Not Found**: Invitation not found or expired
```json
{
  "error": "Invitation not found or expired"
}
```

- **410 Gone**: Invitation already accepted
```json
{
  "error": "This invitation has already been accepted"
}
```

- **500 Internal Server Error**: Server error
```json
{
  "error": "Internal server error"
}
```

---

## Endpoint 4: Accept Invitation

**Endpoint**: `POST /api/users/invite/[token]`

**Purpose**: Allow user to accept invitation and create account

**Authentication**: Not required (public endpoint, but token is secret)

**Path Parameters**:
- `token` (string, required) - Invitation token (64 hex characters)

**Request Body**:
```typescript
{
  username: string;       // Required, 3-50 chars, alphanumeric + underscore
  password: string;       // Required, min 8 characters
  name?: string;         // Optional, display name
}
```

**Example Request**:
```json
{
  "username": "inviteduser",
  "password": "SecurePassword123!",
  "name": "Invited User"
}
```

**Response** (201 Created):
```typescript
{
  user: {
    id: string;           // UUID
    email: string;        // From invitation
    username: string;
    name: string | null;
    role: "Member" | "Viewer"; // From invitation
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  },
  session: {
    token: string;        // Session token for auto-login
    expiresAt: string;    // ISO 8601 datetime
  }
}
```

**Example Response**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "invited@example.com",
    "username": "inviteduser",
    "name": "Invited User",
    "role": "Member",
    "emailVerified": false,
    "createdAt": "2025-01-XXT12:00:00Z",
    "updatedAt": "2025-01-XXT12:00:00Z"
  },
  "session": {
    "token": "session_token_here",
    "expiresAt": "2025-01-XXT20:00:00Z"
  }
}
```

**Error Responses**:

- **400 Bad Request**: Validation error
```json
{
  "error": {
    "message": "Validation failed",
    "details": {
      "username": ["Username must be 3-50 characters"],
      "username": ["Username already exists"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

- **404 Not Found**: Invitation not found or expired
```json
{
  "error": "Invitation not found or expired"
}
```

- **409 Conflict**: Username already exists
```json
{
  "error": "Username already exists"
}
```

- **410 Gone**: Invitation already accepted
```json
{
  "error": "This invitation has already been accepted"
}
```

- **500 Internal Server Error**: Server error
```json
{
  "error": "Internal server error"
}
```

---

## Endpoint 5: List Users (Admin Only)

**Endpoint**: `GET /api/users`

**Purpose**: Allow admin to view all users in system

**Authentication**: Required (Admin role only)

**Query Parameters**: None (initially - can add pagination/search later)

**Response** (200 OK):
```typescript
{
  users: Array<{
    id: string;           // UUID
    email: string;
    username: string;
    name: string | null;
    role: "Admin" | "Member" | "Viewer";
    emailVerified: boolean;
    createdAt: string;    // ISO 8601 datetime
    updatedAt: string;    // ISO 8601 datetime
  }>
}
```

**Example Response**:
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@example.com",
      "username": "admin",
      "name": "Admin User",
      "role": "Admin",
      "emailVerified": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "member@example.com",
      "username": "member",
      "name": "Member User",
      "role": "Member",
      "emailVerified": false,
      "createdAt": "2025-01-02T00:00:00Z",
      "updatedAt": "2025-01-02T00:00:00Z"
    }
  ]
}
```

**Error Responses**:

- **401 Unauthorized**: Not authenticated
```json
{
  "error": "Unauthorized"
}
```

- **403 Forbidden**: Not admin
```json
{
  "error": "Forbidden: Admin access required"
}
```

- **500 Internal Server Error**: Server error
```json
{
  "error": "Internal server error"
}
```

---

## OpenAPI Specification Extensions

### Schemas

**CreateUserInput**:
```yaml
CreateUserInput:
  type: object
  required:
    - email
    - username
    - password
    - role
  properties:
    email:
      type: string
      format: email
    username:
      type: string
      minLength: 3
      maxLength: 50
      pattern: '^[a-zA-Z0-9_]+$'
    password:
      type: string
      minLength: 8
    name:
      type: string
      nullable: true
    role:
      type: string
      enum: [Member, Viewer]
```

**InviteUserInput**:
```yaml
InviteUserInput:
  type: object
  required:
    - email
    - role
  properties:
    email:
      type: string
      format: email
    role:
      type: string
      enum: [Member, Viewer]
```

**AcceptInvitationInput**:
```yaml
AcceptInvitationInput:
  type: object
  required:
    - username
    - password
  properties:
    username:
      type: string
      minLength: 3
      maxLength: 50
      pattern: '^[a-zA-Z0-9_]+$'
    password:
      type: string
      minLength: 8
    name:
      type: string
      nullable: true
```

**Invitation**:
```yaml
Invitation:
  type: object
  properties:
    id:
      type: string
      format: uuid
    email:
      type: string
      format: email
    role:
      type: string
      enum: [Member, Viewer]
    expiresAt:
      type: string
      format: date-time
```

**InvitationDetails**:
```yaml
InvitationDetails:
  type: object
  properties:
    email:
      type: string
      format: email
    role:
      type: string
      enum: [Member, Viewer]
    invitedByName:
      type: string
      nullable: true
    expiresAt:
      type: string
      format: date-time
```

---

## Security Considerations

### Authentication & Authorization

- **Admin-only endpoints**: `POST /api/users`, `POST /api/users/invite`, `GET /api/users`
  - Check admin role at API route level
  - Return 403 Forbidden if not admin

- **Public endpoints**: `GET /api/users/invite/[token]`, `POST /api/users/invite/[token]`
  - No authentication required
  - Token serves as authentication (secret)
  - Validate token before processing

### Token Security

- **Token generation**: Cryptographically secure (256 bits entropy)
- **Token storage**: Database-stored, unique constraint
- **Token expiration**: 7 days (enforced at application level)
- **Token reuse**: Prevented (check `acceptedAt` before acceptance)

### Input Validation

- **Email**: Format validation, uniqueness check
- **Username**: Format validation (3-50 chars, alphanumeric + underscore), uniqueness check
- **Password**: Minimum 8 characters (existing validation)
- **Role**: Enum validation (Member or Viewer only, Admin not allowed)

### Error Handling

- **Security**: Don't reveal existence of expired invitations (return 404, not specific error)
- **Rate limiting**: Consider rate limiting on invitation endpoint (prevent spam)
- **Logging**: Log user creation and invitation actions (audit trail)

---

## Future Enhancements

- **Pagination**: Add `page` and `pageSize` query params to `GET /api/users`
- **Search**: Add `search` query param to filter users by email/username
- **Role updates**: `PATCH /api/users/[userId]` to update user role
- **User deactivation**: `DELETE /api/users/[userId]` to deactivate user
- **Invitation resend**: `POST /api/users/invite/[invitationId]/resend` to resend invitation
- **Invitation revocation**: `DELETE /api/users/invite/[invitationId]` to revoke invitation


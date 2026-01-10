# Stride API Documentation

This document provides comprehensive API documentation for the Stride flow tracker application.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#user-endpoints)
  - [Projects](#project-endpoints)
  - [Issues](#issue-endpoints)
  - [Cycles](#cycle-endpoints)
  - [Webhooks](#webhook-endpoints)
  - [Integrations](#integration-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Overview

Stride provides a RESTful API for managing projects, issues, cycles, and integrations. All API endpoints are prefixed with `/api` and return JSON responses.

**Base URLs:**
- Local development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

**Content Type:** `application/json`

## Authentication

Most endpoints require authentication using HTTP-only cookies. After successful login, a session cookie is set automatically.

### Cookie-Based Authentication

The API uses HTTP-only cookies for session management. After calling `/api/auth/login`, the session cookie is automatically included in subsequent requests.

**Cookie Name:** `session`
**Attributes:**
- `HttpOnly`: true (prevents JavaScript access)
- `Secure`: true (in production, requires HTTPS)
- `SameSite`: Lax
- `Max-Age`: 7 days

### Example: Authenticated Request

```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt

# Use cookie in subsequent requests
curl http://localhost:3000/api/projects \
  -b cookies.txt
```

## Endpoints

### Authentication Endpoints

#### POST /api/auth/login

Authenticate a user and create a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
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
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid email or password
- `400 Bad Request`: Validation error

#### POST /api/auth/logout

Logout the current user and invalidate the session.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me

Get the current authenticated user.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "johndoe",
  "name": "John Doe",
  "role": "Member",
  "avatarUrl": null,
  "emailVerified": false,
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

#### POST /api/auth/register

Register a new user (only available when no admin exists in the system).

**Request Body:**
```json
{
  "email": "admin@example.com",
  "username": "admin",
  "password": "securepassword",
  "name": "Admin User"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "username": "admin",
    "name": "Admin User",
    "role": "Admin",
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  }
}
```

### User Endpoints

#### GET /api/users

List all users in the system.

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "name": "John Doe",
      "role": "Member",
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `403 Forbidden`: Not an admin user

#### POST /api/users

Create a new user account directly.

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "securepassword",
  "name": "New User",
  "role": "Member"
}
```

**Valid Roles:** `Member`, `Viewer`

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "username": "newuser",
    "name": "New User",
    "role": "Member",
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  },
  "message": "User created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `403 Forbidden`: Not an admin user
- `409 Conflict`: Email or username already exists

#### POST /api/users/invite

Create and send a user invitation.

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "email": "invitee@example.com",
  "role": "Member"
}
```

**Valid Roles:** `Member`, `Viewer`

**Response (201 Created):**
```json
{
  "invitation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "invitee@example.com",
    "role": "Member",
    "expiresAt": "2025-01-08T12:00:00Z",
    "invitedBy": "admin-user-id"
  },
  "inviteUrl": "http://localhost:3000/invite/abc123...",
  "emailSent": true,
  "message": "Invitation sent successfully"
}
```

#### GET /api/users/invite/[token]

Get invitation details by token.

**Authentication:** Not required (Public)

**Response (200 OK):**
```json
{
  "invitation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "invitee@example.com",
    "role": "Member",
    "expiresAt": "2025-01-08T12:00:00Z",
    "invitedBy": "admin-user-id"
  }
}
```

**Error Responses:**
- `404 Not Found`: Invitation not found
- `410 Gone`: Invitation expired or already accepted

#### POST /api/users/invite/[token]

Accept invitation and create account.

**Authentication:** Not required (Public)

**Request Body:**
```json
{
  "username": "newuser",
  "password": "securepassword",
  "name": "New User"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "invitee@example.com",
    "username": "newuser",
    "name": "New User",
    "role": "Member",
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  },
  "message": "Account created successfully"
}
```

### Project Endpoints

#### GET /api/projects

List all projects (paginated).

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `search` (optional): Search by project name

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "key": "PROJ",
      "name": "My Project",
      "description": "Project description",
      "repositoryUrl": "https://github.com/owner/repo",
      "createdAt": "2025-01-01T12:00:00Z",
      "updatedAt": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### POST /api/projects

Create a new project.

**Authentication:** Required

**Request Body:**
```json
{
  "key": "PROJ",
  "name": "My Project",
  "description": "Project description",
  "repositoryUrl": "https://github.com/owner/repo",
  "repositoryType": "GitHub"
}
```

**Project Key Requirements:**
- 2-10 characters
- Uppercase letters and numbers only
- Must be unique

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "PROJ",
  "name": "My Project",
  "description": "Project description",
  "repositoryUrl": "https://github.com/owner/repo",
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or duplicate key
- `409 Conflict`: Project key already exists

#### GET /api/projects/[projectId]

Get project details.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "PROJ",
  "name": "My Project",
  "description": "Project description",
  "repositoryUrl": "https://github.com/owner/repo",
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Project not found

#### PATCH /api/projects/[projectId]

Update project details.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "PROJ",
  "name": "Updated Project Name",
  "description": "Updated description",
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-02T12:00:00Z"
}
```

#### GET /api/projects/[projectId]/config

Get project configuration (YAML).

**Authentication:** Required

**Response (200 OK):**
Content-Type: `text/yaml`

```yaml
project:
  key: PROJ
  name: My Project
workflow:
  # ... configuration
```

#### PUT /api/projects/[projectId]/config

Update project configuration.

**Authentication:** Required

**Request Body:**
Content-Type: `text/yaml`

```yaml
project:
  key: PROJ
  name: My Project
workflow:
  # ... configuration
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "key": "PROJ",
    "name": "My Project"
  },
  "validation": {
    "valid": true,
    "errors": []
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid YAML or validation errors

### Issue Endpoints

#### GET /api/projects/[projectId]/issues

List issues for a project.

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status
- `assigneeId` (optional): Filter by assignee UUID
- `cycleId` (optional): Filter by cycle UUID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "key": "PROJ-1",
      "title": "Fix bug",
      "description": "Issue description",
      "status": "In Progress",
      "type": "Bug",
      "priority": "High",
      "storyPoints": 5,
      "createdAt": "2025-01-01T12:00:00Z",
      "updatedAt": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

#### POST /api/projects/[projectId]/issues

Create a new issue.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Fix bug",
  "description": "Issue description",
  "status": "Todo",
  "type": "Bug",
  "priority": "High",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440000",
  "cycleId": "550e8400-e29b-41d4-a716-446655440000",
  "storyPoints": 5,
  "customFields": {
    "field1": "value1"
  }
}
```

**Valid Types:** `Bug`, `Feature`, `Task`, `Epic`
**Valid Priorities:** `Low`, `Medium`, `High`, `Critical`

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "PROJ-1",
  "title": "Fix bug",
  "description": "Issue description",
  "status": "Todo",
  "type": "Bug",
  "priority": "High",
  "storyPoints": 5,
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

#### GET /api/projects/[projectId]/issues/[issueKey]

Get issue details.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "PROJ-1",
  "title": "Fix bug",
  "description": "Issue description",
  "status": "In Progress",
  "type": "Bug",
  "priority": "High",
  "assignee": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "name": "John Doe"
  },
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Issue not found

#### PATCH /api/projects/[projectId]/issues/[issueKey]

Update an issue.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Updated title",
  "status": "Done",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "PROJ-1",
  "title": "Updated title",
  "status": "Done",
  "updatedAt": "2025-01-02T12:00:00Z"
}
```

#### PATCH /api/projects/[projectId]/issues/[issueKey]/status

Update issue status only.

**Authentication:** Required

**Request Body:**
```json
{
  "status": "Done"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "PROJ-1",
  "status": "Done",
  "updatedAt": "2025-01-02T12:00:00Z"
}
```

### Cycle Endpoints

#### GET /api/projects/[projectId]/cycles

List all cycles (sprints) for a project.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sprint 1",
      "description": "First sprint",
      "startDate": "2025-01-01",
      "endDate": "2025-01-14",
      "goal": "Deliver MVP",
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

#### POST /api/projects/[projectId]/cycles

Create a new cycle (sprint).

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Sprint 1",
  "description": "First sprint",
  "startDate": "2025-01-01",
  "endDate": "2025-01-14",
  "goal": "Deliver MVP"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Sprint 1",
  "description": "First sprint",
  "startDate": "2025-01-01",
  "endDate": "2025-01-14",
  "goal": "Deliver MVP",
  "createdAt": "2025-01-01T12:00:00Z"
}
```

#### GET /api/projects/[projectId]/cycles/[cycleId]

Get cycle details with metrics.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Sprint 1",
    "startDate": "2025-01-01",
    "endDate": "2025-01-14",
    "goal": "Deliver MVP"
  },
  "metrics": {
    "totalStoryPoints": 20,
    "completedStoryPoints": 15,
    "remainingStoryPoints": 5,
    "averageCycleTime": 2.5,
    "burndownData": [
      {
        "date": "2025-01-01",
        "remaining": 20
      }
    ]
  }
}
```

### Webhook Endpoints

Webhook endpoints receive events from external services (GitHub, GitLab, Bitbucket, Sentry, Datadog, New Relic).

#### POST /api/webhooks/github

GitHub webhook endpoint.

**Headers:**
- `X-Hub-Signature-256`: SHA-256 HMAC signature (required)

**Request Body:** GitHub webhook payload

**Response (200 OK):**
```json
{
  "message": "Webhook processed"
}
```

#### POST /api/webhooks/gitlab

GitLab webhook endpoint.

**Headers:**
- `X-Gitlab-Token`: Webhook token (required)

**Request Body:** GitLab webhook payload

**Response (200 OK):**
```json
{
  "message": "Webhook processed"
}
```

#### POST /api/webhooks/bitbucket

Bitbucket webhook endpoint.

**Headers:**
- `X-Hook-UUID`: Webhook UUID
- `X-Event-Key`: Event type

**Request Body:** Bitbucket webhook payload

**Response (200 OK):**
```json
{
  "message": "Webhook processed"
}
```

#### POST /api/webhooks/sentry

Sentry webhook endpoint.

**Request Body:** Sentry webhook payload

**Response (200 OK):**
```json
{
  "message": "Webhook processed"
}
```

#### POST /api/webhooks/datadog

Datadog webhook endpoint.

**Request Body:** Datadog webhook payload

**Response (200 OK):**
```json
{
  "message": "Webhook processed"
}
```

#### POST /api/webhooks/newrelic

New Relic webhook endpoint.

**Request Body:** New Relic webhook payload

**Response (200 OK):**
```json
{
  "message": "Webhook processed"
}
```

### Integration Endpoints

#### POST /api/preview-link

Get preview metadata for an external link.

**Authentication:** Required

**Request Body:**
```json
{
  "url": "https://example.com/page"
}
```

**Response (200 OK):**
```json
{
  "url": "https://example.com/page",
  "title": "Page Title",
  "description": "Page description",
  "thumbnail": "https://example.com/thumbnail.jpg",
  "siteName": "Example Site"
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Error description",
    "details": [
      {
        "path": ["field"],
        "message": "Validation error"
      }
    ]
  }
}
```

### HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or invalid input
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate key)
- `410 Gone`: Resource no longer available (e.g., expired invitation)
- `500 Internal Server Error`: Server error

## Rate Limiting

Rate limiting is applied to prevent abuse. Standard limits:

- **Authentication endpoints:** 5 requests per minute per IP
- **Other endpoints:** 100 requests per minute per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

When rate limit is exceeded:
- HTTP Status: `429 Too Many Requests`
- Response includes `Retry-After` header with seconds to wait

## OpenAPI Specification

A complete OpenAPI 3.0 specification is available at:
- `specs/001-stride-application/contracts/api.yaml`

This can be imported into API documentation tools like Swagger UI or Postman.

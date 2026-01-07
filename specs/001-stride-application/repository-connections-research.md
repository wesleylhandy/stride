# Research & Technical Decisions: Repository Connection Management

**Created**: 2024-12-19  
**Purpose**: Resolve decisions for post-onboarding repository connection management feature

## 1. Disconnect Repository Functionality

### Decision
**Defer disconnect functionality to future enhancement (not in MVP)**

### Rationale
- MVP focus: Users need to connect and update connections, not necessarily disconnect
- Disconnect requires additional complexity:
  - DELETE endpoint implementation
  - Webhook removal from Git service (GitHub/GitLab API calls)
  - Handling of existing linked issues/branches (should they remain linked?)
  - Potential data cleanup decisions
- Existing upsert behavior allows reconnection (effectively replaces connection)
- Users can manually remove webhook from Git service if needed
- Follows YAGNI principle: Build what's needed now

### Implementation (Future)
If disconnect is needed later:
```typescript
// DELETE /api/projects/[projectId]/repositories
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 1. Fetch connection
  // 2. Remove webhook from Git service (if webhookId exists)
  // 3. Delete connection from database
  // 4. Optionally: Mark linked issues/branches as disconnected
}
```

### Alternatives Considered
- **Include in MVP**: Adds 2-3 hours of work, not critical for initial release
- **Soft delete (isActive=false)**: Keeps data but marks inactive, but doesn't remove webhook

---

## 2. Connection Health Indicators

### Decision
**Start with basic indicators (last sync timestamp), defer advanced health checks**

### Rationale
- Last sync timestamp already available in `RepositoryConnection.lastSyncAt`
- Advanced health checks require:
  - Periodic token validation (API calls to GitHub/GitLab)
  - Webhook delivery status tracking (requires webhook event logging)
  - Connection test endpoints
- Basic timestamp provides sufficient value for MVP
- Advanced monitoring can be added incrementally

### MVP Implementation
Display in UI:
- Last sync timestamp (if available)
- Connection status: "Connected" or "Never synced"
- Service type badge (GitHub/GitLab)

### Future Enhancements
- Token validity indicator (test API call on demand)
- Webhook delivery status (requires webhook event logging)
- Connection test button
- Automatic health checks with alerts

---

## 3. Reconnection Flow

### Decision
**Support both same repository and different repository reconnection via existing upsert logic**

### Rationale
- Existing `POST /api/projects/[projectId]/repositories` endpoint uses `upsert`:
  - If `repositoryUrl` matches existing connection → Updates credentials
  - If `repositoryUrl` is different → Creates new connection (replaces old one)
- This behavior is acceptable:
  - Same repository: User wants to refresh/update credentials
  - Different repository: User wants to switch to different repo
- No additional logic needed

### Implementation
No changes needed. Existing endpoint handles:
```typescript
const connection = await prisma.repositoryConnection.upsert({
  where: { repositoryUrl: validated.repositoryUrl },
  update: { /* update credentials */ },
  create: { /* create new connection */ },
});
```

### Edge Cases Handled
- Reconnecting with same URL → Updates credentials (expected)
- Reconnecting with different URL → Creates new connection, old one remains (may need cleanup)
  - **Note**: This is acceptable for MVP. Future enhancement could delete old connection.

---

## 4. Component Extraction Strategy

### Decision
**Extract reusable components from onboarding flow, create shared component library**

### Rationale
- Onboarding repository page (`apps/web/app/onboarding/repository/page.tsx`) contains:
  - OAuth connection buttons
  - Manual token form
  - Repository type selection
  - URL input
  - Token input with show/hide
- These can be reused in settings page
- Follows DRY principle
- Maintains consistent UI/UX

### Implementation Pattern
```typescript
// Extract to: apps/web/src/components/features/projects/RepositoryConnectionForm.tsx
export function RepositoryConnectionForm({
  projectId,
  existingConnection,
  onSuccess,
}: RepositoryConnectionFormProps) {
  // OAuth buttons
  // Manual form
  // Error handling
}

// Use in onboarding:
<RepositoryConnectionForm 
  projectId={projectId}
  onSuccess={() => router.push('/onboarding/complete')}
/>

// Use in settings:
<RepositoryConnectionForm
  projectId={projectId}
  existingConnection={connection}
  onSuccess={() => refetch()}
/>
```

---

## 5. Permission Model

### Decision
**Admin-only access for repository connection management (matches configuration settings)**

### Rationale
- Repository connections affect:
  - Webhook configuration (security-sensitive)
  - Configuration sync (can overwrite project config)
  - Access token storage (requires encryption)
- Configuration settings are Admin-only (FR-003a, FR-003b)
- Repository connections are closely related to configuration
- Consistent permission model across settings

### Implementation
- Use existing `requireAuth` middleware
- Check user role is Admin
- Return 403 if non-admin tries to access
- UI: Hide Integrations link for non-admins (or show disabled state)

---

## 6. OAuth Callback Handling

### Decision
**Reuse existing OAuth callback endpoint, works for both onboarding and settings**

### Rationale
- Existing callback: `/api/projects/[projectId]/repositories/callback`
- Callback doesn't depend on onboarding context
- Can redirect back to settings page after OAuth
- No changes needed to callback handler

### Implementation
```typescript
// In settings page OAuth flow:
const redirectUri = `/api/projects/${projectId}/repositories/callback?returnTo=/projects/${projectId}/settings/integrations`;

// In callback handler:
const returnTo = searchParams.get('returnTo') || '/onboarding/complete';
router.push(returnTo);
```

---

## Summary of Decisions

| Decision | Outcome | Rationale |
|----------|---------|-----------|
| Disconnect functionality | Defer to future | Not critical for MVP, adds complexity |
| Health indicators | Basic (timestamp only) | Advanced checks can be added later |
| Reconnection flow | Support via existing upsert | No additional logic needed |
| Component extraction | Extract from onboarding | DRY principle, consistent UX |
| Permission model | Admin-only | Matches configuration settings |
| OAuth callback | Reuse existing | Works for both contexts |

All decisions align with:
- YAGNI: Build MVP first
- KISS: Simple solutions
- DRY: Reuse existing code
- Security: Admin-only access
- Consistency: Follow existing patterns


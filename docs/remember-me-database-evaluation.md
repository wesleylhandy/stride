# Remember Me Database Schema Evaluation

## Question
Do we need new database structure for the "Remember me" checkbox with 90-day opt-in sessions?

## Answer: **No schema change required**

The existing `Session` model already supports variable expiration dates through the `expiresAt` field. We can implement "Remember me" functionality without any database schema changes.

## Current Session Schema

```prisma
model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime  // ← This field supports any expiration date
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([token])
  @@map("sessions")
}
```

## Implementation Approach

### Current Implementation (No Schema Change)

1. **Session Creation**: `createSession()` accepts optional `expirationDays` parameter
   - Default: 7 days (standard session)
   - With "Remember me": 90 days (extended session)

2. **Database Storage**: Same `expiresAt` field, different calculated date
   ```typescript
   // Standard session (7 days)
   expiresAt.setDate(expiresAt.getDate() + 7);
   
   // Remember me session (90 days)
   expiresAt.setDate(expiresAt.getDate() + 90);
   ```

3. **Cookie Expiration**: Matches session expiration
   ```typescript
   maxAge: 60 * 60 * 24 * expirationDays
   ```

### Benefits of Current Approach

✅ **No Migration Required**: Works with existing schema
✅ **Simple Implementation**: Just calculate different expiration dates
✅ **Backward Compatible**: Existing sessions continue to work
✅ **Flexible**: Can easily change expiration periods without schema changes

## Optional Schema Enhancement (Future Consideration)

If we want to **track** which sessions are "Remember me" sessions (for analytics, security auditing, or session management UI), we could add an optional field:

```prisma
model Session {
  // ... existing fields ...
  isPersistent Boolean @default(false)  // ← Optional tracking field
}
```

### When to Add `isPersistent` Field

**Add if you need:**
- Analytics: "How many users use Remember me?"
- Security auditing: "Which sessions are long-lived?"
- Session management UI: "Show persistent sessions separately"
- Compliance reporting: "Track extended session usage"

**Don't add if:**
- You only need different expiration dates (current approach is sufficient)
- You don't need to query/filter by session type
- You want to keep schema minimal

## Recommendation

**For MVP**: ✅ **No schema change needed**

The current implementation using variable `expiresAt` dates is sufficient and follows the principle of YAGNI (You Aren't Gonna Need It). We can always add `isPersistent` later if we need to track or query by session type.

**Future Enhancement**: Consider adding `isPersistent` boolean field if:
- Users request session management UI
- Security team needs to audit long-lived sessions
- Product team wants analytics on "Remember me" usage

## Implementation Status

✅ **Session Detection**: Implemented (server component wrapper)
✅ **Remember Me Checkbox**: Implemented (client component)
✅ **Variable Expiration**: Implemented (`createSession` with `expirationDays` parameter)
✅ **Cookie Matching**: Implemented (cookie `maxAge` matches session expiration)
✅ **Database Schema**: No changes required (uses existing `expiresAt` field)

## Code References

- Session creation: `apps/web/src/lib/auth/session.ts` - `createSession()` function
- Login route: `apps/web/app/api/auth/login/route.ts` - handles `rememberMe` parameter
- Login form: `apps/web/app/login/LoginForm.tsx` - checkbox UI
- Session model: `packages/database/prisma/schema.prisma` - `Session` model

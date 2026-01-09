# Implementation Plan: Login/Signup Page UI/UX Enhancement

**Feature Branch**: `001-stride-application`  
**Created**: 2025-01-XX  
**Status**: Planning (Phase 0-1)  
**Feature Spec**: `specs/001-stride-application/spec.md`  
**Related Feature**: Authentication & User Onboarding (FR-003, FR-003a, FR-003b)

## Technical Context

### Technology Stack

- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: HTTP-only cookies with JWT tokens
- **State Management**: React hooks for form state, TanStack Query for server state (if needed)
- **Styling**: Tailwind CSS with custom design tokens (GitHub-style palette)
- **Monorepo**: Turborepo with pnpm
- **UI Components**: Custom `@stride/ui` package with Button, Input components

### Dependencies

- **Existing API Endpoints**:
  - `POST /api/auth/login` - User login (returns JWT, sets HTTP-only cookie)
  - `POST /api/auth/register` - User registration (used for first admin setup)
  - `POST /api/auth/logout` - User logout (clears session cookie)
  - `GET /api/auth/me` - Get current user session
  - `GET /api/setup/status` - Check if admin exists (first-run check)
  - `GET /api/projects` - List user's projects (used for onboarding completion check)
- **Existing Components**:
  - `apps/web/app/login/page.tsx` - Basic login page (Client Component)
  - `apps/web/app/setup/page.tsx` - First-time admin setup page
  - `apps/web/app/onboarding/admin/page.tsx` - Onboarding admin account creation
  - `@stride/ui` Button and Input components
- **Database Models**:
  - `User` - User accounts with email, username, passwordHash, role
  - `Session` - Active user sessions with JWT tokens
- **Authentication Flow**:
  - First run: `/setup` → creates admin account → auto-login → `/onboarding`
  - Normal login: `/login` → authenticates → redirects to `/onboarding` or `/dashboard`
  - Session: JWT stored in HTTP-only cookie, verified on protected routes

### Integrations

- **Session Management**: Database-backed sessions with JWT tokens
- **Password Security**: Bcrypt password hashing with strength validation
- **OAuth**: None currently (GitHub/GitLab OAuth exists for repository connections, not auth)

### Architecture Decisions

- **Location**: `/login` page for authentication
- **Registration Flow**: Invitation-based via admin management (see user-management-plan.md)
- **First Admin**: Created via `/setup` page (first-run detection)
- **Auto-login**: After first admin creation, auto-login redirects to onboarding
- **Session Storage**: HTTP-only cookies (secure, prevents XSS)
- **Redirect Strategy**: Post-login redirect to `/onboarding` if not completed, otherwise `/dashboard`
- **Onboarding Completion**: Onboarding is complete when user has at least one project created
- **Onboarding Bypass**: If onboarding is complete (projects exist), redirect to `/dashboard` instead of `/onboarding`

### Unknowns / Needs Clarification

- ❓ **UI/UX Best Practices**: What are modern auth page patterns for developer tools (Linear, GitHub, Vercel)?
- ❓ **Form Validation**: Should we use real-time validation or submit-time validation?
- ❓ **Password Strength Indicator**: Should we show password strength meter during signup?
- ❓ **Remember Me**: Should we implement "Remember me" checkbox for extended sessions?
- ❓ **Social Login**: Should we add OAuth login (GitHub, Google) for convenience?
- ❓ **Password Reset**: Should we implement "Forgot password" flow?
- ❓ **Email Verification**: Should we require email verification for new accounts?
- ❓ **Loading States**: What loading indicators provide best UX during auth?
- ❓ **Error Handling**: How should we display auth errors (inline, toast, modal)?
- ❓ **Accessibility**: What WCAG 2.1 AA requirements should we prioritize?
- ❓ **Mobile Experience**: How should login page adapt for mobile/touch devices?
- ❓ **Dark Mode**: Does current design token system support dark mode properly?
- ✅ **Onboarding Bypass**: Onboarding is complete when user has at least one project. Check projects count to determine completion status.

## Constitution Check

### Principles Compliance

- [x] SOLID principles applied
  - Single Responsibility: Separate login/signup components
  - Open/Closed: Extendable auth flow without modifying core logic
  - Liskov Substitution: Follow existing auth patterns
  - Interface Segregation: Specific interfaces for auth operations
  - Dependency Inversion: Depend on API abstractions
- [x] DRY, YAGNI, KISS followed
  - Reuse existing Button/Input components from `@stride/ui`
  - Keep MVP scope: login + setup flows (skip complex features initially)
  - Simple, clean auth UI matching developer tool aesthetics
- [x] Type safety enforced
  - TypeScript strict mode
  - Zod validation for API requests (already implemented)
  - Prisma types for database access
- [x] Security best practices
  - HTTP-only cookies (prevents XSS)
  - Secure flag in production
  - Password hashing with bcrypt
  - Rate limiting should be considered
- [ ] Accessibility requirements met
  - **NEEDS RESEARCH**: WCAG 2.1 AA compliance patterns for auth pages
  - Keyboard navigation support needed
  - Screen reader support needed
  - Focus management during auth flows

### Code Quality Gates

- [x] No `any` types
  - TypeScript strict mode enforced
- [x] Proper error handling
  - Try/catch for async operations
  - Error states in UI (basic implementation exists)
- [x] Input validation
  - Zod schemas for API requests (already implemented)
  - Server-side validation
- [ ] Client-side validation
  - **NEEDS RESEARCH**: Real-time vs submit-time validation UX patterns
- [ ] Test coverage planned
  - Unit tests for auth components
  - Integration tests for auth flows
  - E2E tests for login/signup journeys

## Phase 0: Outline & Research

### Research Tasks

- [x] Research modern auth page UI/UX patterns for developer tools (Linear, GitHub, Vercel, Railway, PlanetScale)
- [x] Research password strength indicators and validation UX patterns
- [x] Research "Remember me" functionality implementation and security implications
- [x] Research OAuth login UX patterns (GitHub, Google, etc.)
- [x] Research password reset flow UX best practices
- [x] Research email verification UX patterns
- [x] Research loading states and optimistic UI patterns for auth
- [x] Research error handling UX patterns (inline errors vs toast notifications)
- [x] Research WCAG 2.1 AA accessibility requirements for auth pages
- [x] Research mobile-first responsive design patterns for auth pages
- [x] Verify dark mode support with current design token system

### Research Output

- [x] `login-signup-research.md` generated with all decisions resolved
- [x] UI/UX patterns documented with examples and rationale
- [x] Accessibility requirements documented with implementation guide
- [x] Mobile design patterns documented
- [x] All unknowns resolved with recommendations

**Research Notes**:

- Current login page is basic but functional
- Setup page has similar structure to login (can share patterns)
- Design tokens support dark mode via `data-theme="dark"` attribute
- Existing Button/Input components need enhancement for better UX
- Research completed: Modern auth patterns, validation strategies, accessibility requirements, mobile design patterns

## Phase 1: Design & Contracts

### Data Model

- [x] `login-signup-data-model.md` generated
- [x] No schema changes expected (User and Session models already exist)
- [x] Verify User model supports all required fields for enhanced UX
- [x] Document any additional fields needed (e.g., rememberToken, emailVerifiedAt)

**Existing Models** (from `packages/database/prisma/schema.prisma`):

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
}

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
}
```

### API Contracts

- [x] `login-signup-contracts.md` generated
- [x] Document existing endpoints with enhanced request/response formats
- [x] Define new endpoints if needed (password reset, email verification)
- [x] Error response format standardization

**Existing Endpoints** (from `apps/web/app/api/auth/login/route.ts`):

**POST /api/auth/login**

- Body: `{ email: string, password: string, rememberMe?: boolean }`
- Returns: `{ user: User, token: string }`
- Sets HTTP-only cookie: `session`
- Status codes: 200 (success), 401 (invalid credentials), 400 (validation error)

**POST /api/auth/register** (used for first admin)

- Body: `{ email: string, username: string, password: string, name?: string }`
- Returns: `{ user: User, message: string }`
- Status codes: 201 (created), 409 (email/username exists), 400 (validation error)

**POST /api/auth/logout**

- Clears session cookie
- Returns: `{ message: string }`
- Status codes: 200 (success)

### Quickstart

- [x] `login-signup-quickstart.md` generated
- [x] Setup instructions documented
- [x] User flow documented (login, signup, password reset if implemented)
- [x] Testing guide included

### Agent Context

- [x] No new technologies expected (uses existing stack)
- [x] May add new UI patterns/components to `@stride/ui` package
- [x] Verify if agent context update needed

## Phase 2: Implementation Planning

### Component Structure

- [ ] **Login Page**: Enhance `apps/web/app/login/page.tsx`
  - Modern UI layout following research findings
  - Form validation and error display
  - Loading states and transitions
  - Accessibility improvements
  - **Onboarding bypass**: Check if onboarding is complete (projects exist) before redirecting
- [ ] **Root Page**: Update `apps/web/app/page.tsx`
  - **Onboarding bypass**: Check if onboarding is complete before redirecting to `/onboarding`
  - Redirect to `/dashboard` or `/projects` if onboarding complete
- [ ] **Onboarding Page**: Update `apps/web/app/onboarding/page.tsx`
  - **Onboarding bypass**: Check if onboarding is complete (projects exist)
  - Redirect to `/dashboard` or `/projects` if already complete
- [ ] **Setup Page**: Enhance `apps/web/app/setup/page.tsx` (if needed)
  - Consistent styling with login page
  - Password strength indicator (if decided)
- [ ] **Shared Auth Components**: Extract reusable components to `@stride/ui`
  - `AuthForm` component for form structure
  - `PasswordInput` component with strength indicator (if decided)
  - `AuthError` component for error display
- [ ] **Onboarding Helper**: Create `apps/web/src/lib/onboarding/status.ts`
  - `isOnboardingComplete()` - Check if user has at least one project
  - Helper function for onboarding completion detection
- [ ] **Layout**: Ensure consistent branding and navigation

**Component Hierarchy**:

```
apps/web/app/login/
  └── page.tsx (Client Component - enhanced UI)

apps/web/app/setup/
  └── page.tsx (Client Component - enhanced UI)

packages/ui/src/components/
  ├── AuthForm.tsx (new - shared form structure)
  ├── PasswordInput.tsx (new - password field with strength indicator)
  └── AuthError.tsx (new - error display component)
```

### State Management

- [ ] **Form State**: React Hook Form for form management (if validation is complex)
- [ ] **Server State**: TanStack Query for auth status (optional, if needed for global auth state)
- [ ] **Loading State**: Component-level state for loading indicators
- [ ] **Error State**: Component-level state for error display

**State Flow**:

1. User enters credentials → Client-side validation
2. Form submit → Loading state → API call
3. Success → Set cookie → Check onboarding status → Redirect (to `/onboarding` if incomplete, `/dashboard` if complete)
4. Error → Display error message → Reset loading state

**Onboarding Completion Check**:

1. After successful login → Fetch user's projects count
2. If projects count > 0 → Onboarding complete → Redirect to `/dashboard` or `/projects`
3. If projects count === 0 → Onboarding incomplete → Redirect to `/onboarding`

### Styling Strategy

- [ ] **Design Tokens**: Use existing Tailwind config and design tokens
- [ ] **Dark Mode**: Ensure proper dark mode support using `data-theme="dark"`
- [ ] **Responsive**: Mobile-first responsive design
- [ ] **Accessibility**: Ensure proper contrast ratios, focus states, touch targets

### Testing Strategy

- [ ] **Unit Tests**: Form validation, error handling, loading states
- [ ] **Integration Tests**: API integration, cookie setting, redirect logic
- [ ] **E2E Tests**: Complete login flow, error scenarios, mobile experience
- [ ] **Accessibility Tests**: Keyboard navigation, screen reader compatibility

## Phase 3: Implementation

### Tasks

- [ ] Research modern auth UI/UX patterns
- [ ] **Create onboarding status helper**: `apps/web/src/lib/onboarding/status.ts`
  - Implement `isOnboardingComplete(userId)` function
  - Check if user has at least one project
- [ ] **Update root page**: `apps/web/app/page.tsx`
  - Add onboarding completion check before redirecting
  - Redirect to `/dashboard` if onboarding complete, `/onboarding` if incomplete
- [ ] **Update login page**: `apps/web/app/login/page.tsx`
  - Add onboarding completion check after successful login
  - Fetch projects count to determine completion status
  - Redirect accordingly (`/dashboard` if complete, `/onboarding` if incomplete)
- [ ] **Update onboarding page**: `apps/web/app/onboarding/page.tsx`
  - Add onboarding completion check at page entry
  - Redirect to `/dashboard` if already complete (prevent re-entering onboarding)
- [ ] Enhance login page UI/UX
- [ ] Add form validation (client-side + server-side)
- [ ] Implement loading states and transitions
- [ ] Implement error handling and display
- [ ] Add accessibility improvements (keyboard nav, screen reader)
- [ ] Ensure mobile responsiveness
- [ ] Verify dark mode support
- [ ] Extract shared auth components to `@stride/ui`
- [ ] Write unit tests (including onboarding status check)
- [ ] Write integration tests (including onboarding bypass flow)
- [ ] Write E2E tests (complete flow: login → check onboarding → redirect)
- [ ] **OPTIONAL**: Add password strength indicator
- [ ] **OPTIONAL**: Add "Remember me" functionality
- [ ] **OPTIONAL**: Add OAuth login (GitHub, Google)
- [ ] **OPTIONAL**: Add password reset flow
- [ ] **OPTIONAL**: Add email verification flow

### Dependencies

- Existing API endpoints (may need enhancement for new features)
  - `GET /api/projects` - Used to check onboarding completion status
- `@stride/ui` package for shared components
- Existing design tokens and Tailwind config
- Prisma database client for project count queries

### Estimated Effort

- **Research Phase**: 2-3 hours
- **Onboarding Bypass Implementation**: 2-3 hours
  - Create onboarding status helper
  - Update root, login, and onboarding pages
  - Add tests for bypass logic
- **MVP Enhancement (UI/UX improvements)**: 4-6 hours
- **Accessibility Improvements**: 2-3 hours
- **Mobile Responsiveness**: 1-2 hours
- **Testing**: 3-4 hours (including onboarding bypass tests)
- **Total MVP**: ~14-21 hours
- **With Optional Features**: +8-12 hours (OAuth, password reset, email verification)

## Notes

### MVP Scope

- **Onboarding bypass**: Check if onboarding is complete (projects exist) and redirect accordingly
- Enhanced login page UI/UX following modern patterns
- Form validation and error handling improvements
- Loading states and smooth transitions
- Accessibility improvements (WCAG 2.1 AA)
- Mobile responsiveness
- Dark mode support

### Future Enhancements (Out of Scope)

- OAuth login (GitHub, Google)
- Password reset flow
- Email verification
- "Remember me" extended sessions
- Two-factor authentication (2FA)
- Single Sign-On (SSO)
- Social login buttons

### Design Decisions

- **Developer-First**: Match aesthetics of tools like Linear, GitHub, Vercel
- **Minimal**: Keep UI clean and focused, no unnecessary elements
- **Fast**: Optimize for perceived performance with loading states
- **Accessible**: WCAG 2.1 AA compliance for all users
- **Consistent**: Use existing design tokens and component library

### Open Questions

1. **OAuth Login**: Should we add GitHub OAuth for convenience? (similar to repository OAuth)
   - **Recommendation**: Defer to later if not critical for MVP

2. **Password Reset**: Should we implement "Forgot password" flow?
   - **Recommendation**: Defer to later if not critical for MVP

3. **Email Verification**: Should we require email verification?
   - **Recommendation**: Defer to later if not critical for MVP

4. **Remember Me**: Should we add "Remember me" checkbox?
   - **Recommendation**: Research security implications first, then decide

5. **Social Login**: Should we add social login buttons?
   - **Recommendation**: Defer to later if not critical for MVP

6. **Onboarding Bypass**: How should we determine if onboarding is complete?
   - **Decision**: Onboarding is complete when user has at least one project
   - **Implementation**: Check project count via `GET /api/projects` or direct database query
   - **Redirect Logic**: 
     - If projects exist → `/dashboard` or `/projects`
     - If no projects → `/onboarding`
   - **Status**: ✅ **RESOLVED** - Will be implemented in MVP

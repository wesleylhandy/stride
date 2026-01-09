# Quickstart: Login/Signup Page Enhancement

**Created**: 2025-01-XX  
**Purpose**: Quick reference guide for implementing enhanced login/signup page UI/UX

## Overview

This guide covers the implementation of enhanced login/signup pages following modern UI/UX best practices for developer tools. The implementation focuses on improving user experience, accessibility, and visual design while maintaining security best practices.

## Prerequisites

- Existing authentication system (login/register endpoints)
- `@stride/ui` component library (Button, Input components)
- Tailwind CSS with custom design tokens
- Next.js 16+ App Router setup

## Setup

### 1. Verify Existing Components

Check that `@stride/ui` components are available:

```bash
# Verify Button component exists
ls packages/ui/src/atoms/Button.tsx

# Verify Input component exists
ls packages/ui/src/atoms/Input.tsx
```

### 2. Review Design Tokens

Verify Tailwind config includes required design tokens:

```typescript
// packages/ui/tailwind.config.ts
// Should include:
// - background colors (background, background-secondary, background-dark)
// - surface colors (surface, surface-dark)
// - foreground colors (foreground, foreground-secondary, foreground-dark)
// - border colors (border, border-dark, border-focus)
// - accent/primary colors (accent, primary)
```

### 3. Check Existing Login Page

Review current login page implementation:

```typescript
// apps/web/app/login/page.tsx
// Current implementation uses:
// - Client Component ("use client")
// - useState for form state
// - fetch for API calls
// - Basic error handling
```

## User Flow

### Onboarding Completion Detection

**Definition**: Onboarding is complete when the user has at least one project created.

**Implementation**:
- Check project count via `GET /api/projects` endpoint
- If `projects.length > 0` → Onboarding complete
- If `projects.length === 0` → Onboarding incomplete

**Helper Function**:
```typescript
// apps/web/src/lib/onboarding/status.ts
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const projects = await prisma.project.findMany({
    where: { /* user's accessible projects */ },
    take: 1,
  });
  return projects.length > 0;
}
```

**Redirect Logic**:
- Root page (`/`): Check onboarding status → redirect accordingly
- Login page: After successful login → check onboarding status → redirect accordingly
- Onboarding page: Check onboarding status → redirect to dashboard if complete

### Login Flow

1. **User visits `/login`**
   - Check if already authenticated (redirect to dashboard/onboarding)
   - Show login form with email and password fields

2. **User enters credentials**
   - Email: Autofocus on email field
   - Password: Show/hide toggle (optional)
   - Real-time validation for email format (on blur)

3. **User submits form**
   - Disable submit button, show loading state
   - Validate form (client-side + server-side)
   - POST to `/api/auth/login`
   - Set session cookie (HTTP-only)
   - Check onboarding status (fetch projects count)
   - Redirect to `/onboarding` (if incomplete) or `/dashboard`/`/projects` (if complete)

4. **Error handling**
   - Invalid credentials: Show error toast or inline message
   - Network error: Show error toast
   - Validation error: Show inline field errors

### Registration Flow (First Admin)

1. **User visits `/setup`** (first run only)
   - Check if admin exists (redirect to `/login` if exists)
   - Show registration form with email, username, password, confirm password, name

2. **User enters information**
   - Email: Real-time format validation (on blur)
   - Username: Real-time pattern validation (3-30 chars, alphanumeric + underscore + hyphen)
   - Password: Show password strength indicator (optional)
   - Confirm Password: Real-time match validation
   - Name: Optional

3. **User submits form**
   - Disable submit button, show loading state
   - Validate form (client-side + server-side)
   - POST to `/api/auth/register`
   - Auto-login after registration
   - Redirect to `/onboarding`

4. **Error handling**
   - Duplicate email/username: Show error message
   - Weak password: Show password strength indicator
   - Validation error: Show inline field errors

## Component Structure

### Onboarding Status Helper

**Location**: `apps/web/src/lib/onboarding/status.ts`

**Purpose**: Check if user has completed onboarding (has at least one project)

```typescript
import { prisma } from "@stride/database";

/**
 * Check if user has completed onboarding
 * Onboarding is complete when user has at least one project
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  // Check if user has any projects
  // Note: This may need to be adjusted based on project ownership/permissions model
  const projectCount = await prisma.project.count({
    // Add appropriate where clause based on project access model
    // For now, checking if any projects exist (may need user-project relationship)
  });
  
  return projectCount > 0;
}

/**
 * Server-side onboarding check for redirect logic
 * Used in Server Components
 */
export async function shouldRedirectToOnboarding(userId: string): Promise<boolean> {
  return !(await isOnboardingComplete(userId));
}
```

**Note**: The exact implementation depends on the project ownership/permissions model. If projects are user-specific, filter by userId. If projects are shared, check if user has access to any project.

### Enhanced Login Page

**Location**: `apps/web/app/login/page.tsx`

**Structure**:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@stride/ui";

export default function LoginPage() {
  // State management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Login request
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Check onboarding status after successful login
      const projectsResponse = await fetch("/api/projects");
      const projectsData = await projectsResponse.json();
      const hasProjects = projectsData.items && projectsData.items.length > 0;
      
      // Redirect based on onboarding status
      if (hasProjects) {
        // Onboarding complete - redirect to dashboard
        router.push("/dashboard"); // or "/projects"
      } else {
        // Onboarding incomplete - redirect to onboarding
        router.push("/onboarding");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };
  
  // Render centered card layout
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary dark:bg-background-dark px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h1>Sign in to Stride</h1>
          <p>Enter your credentials to access your workspace</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="...">
          {/* Error display */}
          {error && <div className="...">{error}</div>}
          
          {/* Email field */}
          <div>
            <label htmlFor="email">Email Address</label>
            <Input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "email-error" : undefined}
            />
            {error && <div id="email-error" role="alert">{error}</div>}
          </div>
          
          {/* Password field */}
          <div>
            <label htmlFor="password">Password</label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
```

### Shared Auth Components (Optional)

**Location**: `packages/ui/src/components/AuthForm.tsx`

**Purpose**: Reusable form structure for auth pages

```typescript
export function AuthForm({
  title,
  subtitle,
  children,
  onSubmit,
  loading,
  error,
}: AuthFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary dark:bg-background-dark px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        
        <form onSubmit={onSubmit} className="...">
          {error && <div role="alert">{error}</div>}
          {children}
        </form>
      </div>
    </div>
  );
}
```

**Location**: `packages/ui/src/components/PasswordInput.tsx`

**Purpose**: Password input with strength indicator (optional)

```typescript
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  showStrength = false,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = usePasswordStrength(value);
  
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {showStrength && value && (
        <PasswordStrengthIndicator strength={strength} />
      )}
    </div>
  );
}
```

## Styling Guidelines

### Layout

**Centered Card**:
```css
/* Container */
flex min-h-screen items-center justify-center
bg-background-secondary dark:bg-background-dark
px-4 py-12

/* Card */
w-full max-w-md
rounded-lg bg-surface dark:bg-surface-dark
px-6 py-8 shadow-md
```

### Typography

**Headings**:
```css
/* H1 */
text-3xl font-bold tracking-tight
text-foreground dark:text-foreground-dark

/* Subtitle */
text-sm
text-foreground-secondary dark:text-foreground-dark-secondary
```

### Form Fields

**Labels**:
```css
block text-sm font-medium
text-foreground dark:text-foreground-dark
```

**Inputs**:
```css
mt-1 w-full
rounded-md border border-border dark:border-border-dark
bg-background dark:bg-background-dark
px-3 py-2
text-foreground dark:text-foreground-dark
focus:ring-2 focus:ring-primary focus:border-primary
```

### Error States

**Error Display**:
```css
rounded-md bg-red-50 dark:bg-red-900/20
p-4
text-sm text-red-800 dark:text-red-200
```

**Error Input**:
```css
border-red-500 dark:border-red-500
focus:ring-red-500 focus:border-red-500
```

### Buttons

**Primary Button**:
```css
w-full
bg-primary hover:bg-primary-hover
text-white
px-4 py-2 rounded-md
focus:ring-2 focus:ring-primary focus:ring-offset-2
disabled:opacity-50 disabled:cursor-not-allowed
```

## Accessibility Checklist

### Required WCAG 2.1 AA Compliance

- [ ] All inputs have associated `<label>` elements
- [ ] Error messages use `aria-describedby` and `aria-invalid`
- [ ] Focus indicators visible (2px outline, high contrast)
- [ ] Tab order logical (top to bottom)
- [ ] Touch targets 44x44px minimum
- [ ] Color contrast verified (4.5:1 normal, 3:1 large)
- [ ] Screen reader tested (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation tested (Tab, Enter, Escape)

### Implementation Examples

**Label Association**:
```typescript
<label htmlFor="email">Email Address</label>
<Input
  id="email"
  type="email"
  aria-invalid={hasError ? "true" : undefined}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <div id="email-error" role="alert" className="...">
    {errorMessage}
  </div>
)}
```

**Focus Management**:
```typescript
// Autofocus first input
<Input autoFocus />

// Focus on error after validation
useEffect(() => {
  if (error) {
    const firstError = document.querySelector('[aria-invalid="true"]');
    if (firstError instanceof HTMLElement) {
      firstError.focus();
    }
  }
}, [error]);
```

## Testing Guide

### Unit Tests

**Test Form Validation**:
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "./page";

test("validates email format", () => {
  render(<LoginPage />);
  const emailInput = screen.getByLabelText("Email Address");
  
  fireEvent.change(emailInput, { target: { value: "invalid-email" } });
  fireEvent.blur(emailInput);
  
  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

**Test Error Handling**:
```typescript
test("displays error on login failure", async () => {
  // Mock fetch to return 401
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Invalid email or password" }),
  });
  
  render(<LoginPage />);
  // ... fill form and submit
  // ... assert error is displayed
});
```

### Integration Tests

**Test Login Flow with Onboarding Bypass**:
```typescript
test("logs in and redirects to dashboard if onboarding complete", async () => {
  // Mock successful login
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: "..." }),
    })
    // Mock projects check (onboarding complete)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ id: "1", name: "Test Project" }] }),
    });
  
  render(<LoginPage />);
  // ... fill form and submit
  // ... assert redirect to /dashboard (not /onboarding)
});

test("logs in and redirects to onboarding if incomplete", async () => {
  // Mock successful login
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: "..." }),
    })
    // Mock projects check (onboarding incomplete - no projects)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });
  
  render(<LoginPage />);
  // ... fill form and submit
  // ... assert redirect to /onboarding (not /dashboard)
});
```

### E2E Tests

**Test Complete Login Journey with Onboarding Bypass**:
```typescript
test("user with completed onboarding logs in and goes to dashboard", async () => {
  // Setup: Create user with projects (onboarding complete)
  await setupUserWithProjects("user@example.com");
  
  await page.goto("/login");
  await page.fill('input[name="email"]', "user@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard, not onboarding
  await page.waitForURL("/dashboard");
  // ... verify user is logged in and sees projects
});

test("user without completed onboarding logs in and goes to onboarding", async () => {
  // Setup: Create user without projects (onboarding incomplete)
  await setupUserWithoutProjects("user@example.com");
  
  await page.goto("/login");
  await page.fill('input[name="email"]', "user@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  
  // Should redirect to onboarding, not dashboard
  await page.waitForURL("/onboarding");
  // ... verify onboarding flow starts
});
```

## Deployment Checklist

- [ ] Verify environment variables (JWT_SECRET, SESSION_EXPIRES_IN_DAYS)
- [ ] Test login flow in staging
- [ ] Test registration flow in staging (first admin)
- [ ] Verify cookie settings (HttpOnly, Secure, SameSite)
- [ ] Test accessibility with screen reader
- [ ] Test mobile responsiveness
- [ ] Test dark mode
- [ ] Verify error handling (network errors, server errors)
- [ ] Test rate limiting (if implemented)
- [ ] Verify security headers (Content-Security-Policy, etc.)

## Troubleshooting

### Common Issues

**Issue**: Form not submitting
- Check if `preventDefault()` is called in form handler
- Verify API endpoint is correct
- Check network tab for API errors

**Issue**: Session cookie not set
- Verify cookie settings (HttpOnly, Secure, SameSite)
- Check if HTTPS is required (Secure flag)
- Verify cookie path matches application path

**Issue**: Redirect not working
- Check if `router.push()` is called after successful login
- Verify redirect URL is correct
- Check if authentication middleware is blocking redirect

**Issue**: Error messages not displaying
- Verify error state is set correctly
- Check if error component is rendered
- Verify error message format matches API response

## Next Steps

1. Implement enhanced login page with research findings
2. Add password visibility toggle (optional)
3. Add password strength indicator for signup (optional)
4. Extract shared auth components to `@stride/ui`
5. Write unit and integration tests
6. Perform accessibility audit
7. Test on mobile devices
8. Deploy to staging and test

## References

- [Research Document](./login-signup-research.md) - UI/UX patterns and decisions
- [Data Model](./login-signup-data-model.md) - Database schema
- [API Contracts](./login-signup-contracts.md) - Endpoint specifications
- [Implementation Plan](./login-signup-plan.md) - Full implementation plan

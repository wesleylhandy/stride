"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, AuthForm, useToast } from "@stride/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCsrfHeaders } from "@/lib/utils/csrf";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login Form Component (Client Component)
 * 
 * Handles user authentication and redirects based on onboarding completion status.
 * 
 * **Onboarding Bypass Logic**:
 * - After successful authentication, checks if user has completed onboarding (has projects)
 * - If onboarding complete (projects exist): redirects to `/dashboard`
 * - If onboarding incomplete (no projects): redirects to `/onboarding`
 * 
 * **Redirect Behavior**:
 * - Projects fetch failure: defaults to `/onboarding` for safety
 * - Network errors: shows toast notification and stays on login page
 * - Validation errors: shows inline field errors, no redirect
 * 
 * **Error Handling**:
 * - Field validation errors: displayed inline below each input
 * - Authentication errors: displayed via toast notification
 * - Network errors: displayed via toast notification with retry guidance
 * - All errors are announced to screen readers via aria-live region
 * 
 * **Accessibility Features**:
 * - Full keyboard navigation (Tab, Enter, Escape)
 * - Screen reader support with ARIA attributes
 * - Focus management (autofocus, error focus return)
 * - High contrast focus indicators
 * - WCAG 2.1 AA compliant color contrast
 * 
 * **Mobile Support**:
 * - Responsive design with 44x44px minimum touch targets
 * - Native input types for proper mobile keyboards
 * - Full viewport coverage without horizontal scroll
 */
export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const errorAnnouncementRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Autofocus first input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Focus on first error field when errors appear
  useEffect(() => {
    if (fieldErrors.email) {
      emailInputRef.current?.focus();
    } else if (fieldErrors.password) {
      passwordInputRef.current?.focus();
    }
  }, [fieldErrors]);

  // Validate email format
  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return "Email is required";
    }
    if (!EMAIL_REGEX.test(email)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  // Validate password
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password is required";
    }
    return undefined;
  };

  // Handle email blur - real-time validation
  const handleEmailBlur = () => {
    const emailError = validateEmail(formData.email);
    setFieldErrors((prev) => ({
      ...prev,
      email: emailError,
    }));
    // Clear general error when user starts correcting
    if (emailError && error) {
      setError(null);
    }
  };

  // Handle password blur - clear errors when user corrects
  const handlePasswordBlur = () => {
    const passwordError = validatePassword(formData.password);
    setFieldErrors((prev) => ({
      ...prev,
      password: passwordError,
    }));
    // Clear general error when user starts correcting
    if (passwordError && error) {
      setError(null);
    }
  };

  // Handle Escape key to clear errors
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setError(null);
      setFieldErrors({});
      // Return focus to first input
      emailInputRef.current?.focus();
    }
  };

  // Handle form submission with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show error toast for authentication errors
        const errorMessage = data.error || "Invalid email or password";
        toast.error(errorMessage, {
          description: "Please check your credentials and try again",
        });
        setLoading(false);
        return;
      }

      // After successful login, check if onboarding is complete by fetching projects
      try {
        const projectsResponse = await fetch("/api/projects?pageSize=1", {
          method: "GET",
          credentials: "include",
        });

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          const hasProjects = projectsData.total > 0;

          if (hasProjects) {
            // Onboarding complete (projects exist) - redirect to dashboard or projects
            router.push("/dashboard");
          } else {
            // Onboarding incomplete (no projects) - redirect to onboarding
            router.push("/onboarding");
          }
        } else {
          // If projects fetch fails, default to onboarding for safety
          router.push("/onboarding");
        }
      } catch (err) {
        // If projects fetch fails, default to onboarding for safety
        console.error("Failed to check projects:", err);
        router.push("/onboarding");
      }
    } catch (err) {
      // Show error toast for network errors
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      toast.error("Login failed", {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Sign in to Stride"
      subtitle="Enter your credentials to access your workspace"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      themeToggle={<ThemeToggle />}
    >
      {/* Screen reader only status announcements */}
      <div
        ref={errorAnnouncementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {fieldErrors.email && `Email error: ${fieldErrors.email}`}
        {fieldErrors.password && `Password error: ${fieldErrors.password}`}
        {error && `Authentication error: ${error}`}
      </div>

      <div className="space-y-6" onKeyDown={handleKeyDown}>
        <div>
          <Input
            ref={emailInputRef}
            id="email"
            type="email"
            label="Email Address"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            onBlur={handleEmailBlur}
            error={fieldErrors.email}
            placeholder="admin@example.com"
            aria-required="true"
            aria-describedby={
              fieldErrors.email ? "email-error" : "email-description"
            }
          />
          {!fieldErrors.email && (
            <p id="email-description" className="sr-only">
              Enter your email address to sign in
            </p>
          )}
        </div>

        <div>
          <Input
            ref={passwordInputRef}
            id="password"
            type="password"
            label="Password"
            required
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            onBlur={handlePasswordBlur}
            error={fieldErrors.password}
            placeholder="••••••••"
            aria-required="true"
            aria-describedby={
              fieldErrors.password
                ? "password-error"
                : "password-description"
            }
          />
          {!fieldErrors.password && (
            <p id="password-description" className="sr-only">
              Enter your password to sign in
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) =>
              setFormData({ ...formData, rememberMe: e.target.checked })
            }
            className="h-4 w-4 rounded border-border dark:border-border-dark bg-background dark:bg-background-dark text-accent focus:ring-accent focus:ring-offset-0"
            aria-describedby="remember-me-description"
          />
          <label
            htmlFor="remember-me"
            className="text-sm font-medium text-foreground dark:text-foreground-dark cursor-pointer"
          >
            Keep me signed in for 90 days
          </label>
          <p id="remember-me-description" className="sr-only">
            Check this box to extend your session to 90 days instead of the default 7 days
          </p>
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full min-h-[44px]"
            aria-busy={loading}
            aria-disabled={loading}
          >
            Sign in
          </Button>
        </div>
      </div>
    </AuthForm>
  );
}

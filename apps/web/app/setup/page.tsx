"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, AuthForm, useToast } from "@stride/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Username validation: 3-30 characters, alphanumeric + underscore
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export default function SetupPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

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

  // Validate username
  const validateUsername = (username: string): string | undefined => {
    if (!username) {
      return "Username is required";
    }
    if (username.length < 3 || username.length > 30) {
      return "Username must be between 3 and 30 characters";
    }
    if (!USERNAME_REGEX.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return undefined;
  };

  // Validate password
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return undefined;
  };

  // Validate password confirmation
  const validatePasswordConfirmation = (
    password: string,
    confirmPassword: string
  ): string | undefined => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
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
  };

  // Handle username blur - real-time validation
  const handleUsernameBlur = () => {
    const usernameError = validateUsername(formData.username);
    setFieldErrors((prev) => ({
      ...prev,
      username: usernameError,
    }));
  };

  // Handle password confirmation change - real-time validation
  const handlePasswordConfirmationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const confirmPassword = e.target.value;
    setFormData({ ...formData, confirmPassword });
    
    // Only validate if password is set
    if (formData.password) {
      const confirmError = validatePasswordConfirmation(
        formData.password,
        confirmPassword
      );
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  // Handle password change - trigger confirmation validation if needed
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    
    // Re-validate confirmation if it's already set
    if (formData.confirmPassword) {
      const confirmError = validatePasswordConfirmation(
        password,
        formData.confirmPassword
      );
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  // Check if admin already exists on mount
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const response = await fetch("/api/setup/status");
        const data = await response.json();

        if (data.adminExists) {
          // Admin already exists, redirect to login
          router.replace("/login");
          return;
        }
      } catch (err) {
        console.error("Failed to check admin status:", err);
      } finally {
        setChecking(false);
      }
    }

    checkAdminStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate all fields
    const emailError = validateEmail(formData.email);
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validatePasswordConfirmation(
      formData.password,
      formData.confirmPassword
    );

    if (emailError || usernameError || passwordError || confirmPasswordError) {
      setFieldErrors({
        email: emailError,
        username: usernameError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          name: formData.name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to create admin account";
        toast.error(errorMessage, {
          description: "Please check your input and try again",
        });
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        // Registration succeeded but login failed - redirect to login
        toast.error("Registration successful", {
          description: "Please log in with your new account",
        });
        router.push("/login");
        return;
      }

      // Redirect to onboarding
      router.push("/onboarding");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      toast.error("Registration failed", {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary dark:bg-background-dark">
        <div className="text-center">
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
            Checking setup status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Create Admin Account"
      subtitle="Create the first admin account to get started with Stride"
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      themeToggle={<ThemeToggle />}
    >
      <div className="space-y-6">
        <div>
          <Input
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
          />
        </div>

        <div>
          <Input
            id="username"
            type="text"
            label="Username"
            required
            autoComplete="username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            onBlur={handleUsernameBlur}
            error={fieldErrors.username}
            placeholder="admin"
            minLength={3}
            maxLength={30}
          />
          <p className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
            3-30 characters, letters, numbers, and underscores only
          </p>
        </div>

        <div>
          <Input
            id="name"
            type="text"
            label="Full Name (Optional)"
            autoComplete="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="Admin User"
          />
        </div>

        <div>
          <Input
            id="password"
            type="password"
            label="Password"
            required
            autoComplete="new-password"
            value={formData.password}
            onChange={handlePasswordChange}
            error={fieldErrors.password}
            placeholder="••••••••"
            minLength={8}
          />
          <p className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
            Must be at least 8 characters long
          </p>
        </div>

        <div>
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            required
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handlePasswordConfirmationChange}
            error={fieldErrors.confirmPassword}
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full min-h-[44px]"
          >
            Create Admin Account
          </Button>
        </div>
      </div>
    </AuthForm>
  );
}


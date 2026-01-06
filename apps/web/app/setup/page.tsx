"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@stride/ui";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

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
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

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
        setError(data.error || "Failed to create admin account");
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
        router.push("/login");
        return;
      }

      // Redirect to onboarding
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary dark:bg-background-dark">
        <div className="text-center">
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary">Checking setup status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary dark:bg-background-dark px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            Create Admin Account
          </h2>
          <p className="mt-2 text-center text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            Create the first admin account to get started with Stride
          </p>
        </div>
        <form className="mt-8 rounded-lg bg-surface dark:bg-surface-dark px-6 py-8 shadow-md space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="mt-1"
                placeholder="admin"
                minLength={3}
                maxLength={30}
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Full Name (Optional)
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1"
                placeholder="Admin User"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="mt-1"
                placeholder="••••••••"
                minLength={8}
              />
              <p className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="mt-1"
                placeholder="••••••••"
                minLength={8}
              />
            </div>
          </div>

          <div>
            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Create Admin Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


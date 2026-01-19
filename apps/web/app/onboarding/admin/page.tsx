"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@stride/ui";

export default function AdminAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
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
          // Admin already exists, skip to project setup step
          router.replace("/onboarding/project-setup");
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
        setError("Account created but login failed. Please try logging in.");
        setLoading(false);
        return;
      }

      // Redirect to next step (project setup)
      router.push("/onboarding/project-setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  // Show loading state while checking admin status
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          </div>
          <p className="text-sm text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">Create Admin Account</h1>
        <p className="mt-2 text-foreground-secondary dark:text-foreground-dark-secondary">
          Create your admin account to get started with Stride. This will be the
          first user and will have full administrative access.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
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

        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}


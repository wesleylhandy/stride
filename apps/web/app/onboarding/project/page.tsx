"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@stride/ui";

export default function ProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: formData.key.toUpperCase(),
          name: formData.name,
          description: formData.description || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create project");
        setLoading(false);
        return;
      }

      // Redirect to repository step with project ID
      router.push(`/onboarding/repository?projectId=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">Create Your First Project</h1>
        <p className="mt-2 text-foreground-secondary dark:text-foreground-dark-secondary">
          Create a project to organize your issues and workflows. You can add
          more projects later.
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
              htmlFor="key"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark"
            >
              Project Key
            </label>
            <Input
              id="key"
              type="text"
              required
              value={formData.key}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                })
              }
              className="mt-1"
              placeholder="APP"
              minLength={2}
              maxLength={10}
              pattern="[A-Z0-9]{2,10}"
            />
            <p className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
              2-10 uppercase letters and numbers. This will be used as a prefix
              for issue keys (e.g., APP-123).
            </p>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark"
            >
              Project Name
            </label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1"
              placeholder="My Awesome Project"
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-accent"
              rows={3}
              placeholder="A brief description of your project"
              maxLength={500}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/onboarding/admin")}
          >
            Back
          </Button>
          <Button type="submit" loading={loading}>
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
}


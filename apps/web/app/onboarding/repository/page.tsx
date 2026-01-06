"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@stride/ui";

export default function RepositoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repositoryType, setRepositoryType] = useState<
    "GitHub" | "GitLab" | null
  >(null);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Get project ID from query params (set after project creation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("projectId");
    if (id) {
      setProjectId(id);
    }
  }, []);

  const handleOAuth = async (type: "GitHub" | "GitLab") => {
    if (!projectId) {
      setError("Please create a project first");
      return;
    }

    setOauthLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/repositories?action=oauth&type=${type}`,
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to initiate OAuth");
        setOauthLoading(false);
        return;
      }

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setOauthLoading(false);
    }
  };

  const handleManualConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError("Please create a project first");
      return;
    }

    if (!repositoryType || !repositoryUrl) {
      setError("Please select a repository type and enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For manual connection, user needs to provide access token
      // This is a simplified version - in production, you might want a token input field
      setError(
        "Manual connection requires an access token. Please use OAuth instead.",
      );
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">Connect Repository</h1>
        <p className="mt-2 text-foreground-secondary dark:text-foreground-dark-secondary">
          Connect your GitHub or GitLab repository to enable automatic issue
          tracking and configuration sync.
        </p>
      </div>

      {!projectId && (
        <div className="mb-6 rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Please create a project first before connecting a repository.
          </p>
          <Button
            onClick={() => router.push("/onboarding/project")}
            className="mt-2"
          >
            Go to Project Setup
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* OAuth Options */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
            Connect via OAuth (Recommended)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleOAuth("GitHub")}
              disabled={!projectId || oauthLoading}
              className="flex items-center justify-center rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-3 text-sm font-medium text-foreground dark:text-foreground-dark shadow-sm hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {oauthLoading ? (
                "Connecting..."
              ) : (
                <>
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Connect GitHub
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("GitLab")}
              disabled={!projectId || oauthLoading}
              className="flex items-center justify-center rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-3 text-sm font-medium text-foreground dark:text-foreground-dark shadow-sm hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {oauthLoading ? (
                "Connecting..."
              ) : (
                <>
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  Connect GitLab
                </>
              )}
            </button>
          </div>
        </div>

        {/* Manual Connection (Optional) */}
        <div className="border-t border-border dark:border-border-dark pt-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
            Or Connect Manually
          </h2>
          <form onSubmit={handleManualConnection} className="space-y-4">
            <div>
              <label
                htmlFor="repositoryType"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Repository Type
              </label>
              <select
                id="repositoryType"
                value={repositoryType || ""}
                onChange={(e) =>
                  setRepositoryType(
                    e.target.value as "GitHub" | "GitLab" | null,
                  )
                }
                className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-accent"
                required
              >
                <option value="">Select a repository type</option>
                <option value="GitHub">GitHub</option>
                <option value="GitLab">GitLab</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="repositoryUrl"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Repository URL
              </label>
              <Input
                id="repositoryUrl"
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                className="mt-1"
                placeholder="https://github.com/owner/repo"
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={loading} disabled={!projectId}>
                Connect Repository
              </Button>
            </div>
          </form>
        </div>

        {/* Skip option */}
        <div className="flex justify-between border-t border-gray-200 pt-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/onboarding/project")}
          >
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/onboarding/complete")}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}


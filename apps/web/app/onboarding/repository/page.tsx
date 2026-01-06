"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@stride/ui";
import { FaGithub, FaGitlab } from "react-icons/fa";
import { FiEye, FiEyeOff, FiExternalLink } from "react-icons/fi";

export default function RepositoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repositoryType, setRepositoryType] = useState<
    "GitHub" | "GitLab" | null
  >(null);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
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

    if (!accessToken.trim()) {
      setError("Please enter a Personal Access Token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/repositories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl,
          repositoryType,
          accessToken: accessToken.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to connect repository");
        setLoading(false);
        return;
      }

      // Clear the token from memory immediately after successful submission
      setAccessToken("");
      
      // Navigate to completion
      router.push("/onboarding/complete");
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
                  <FaGithub className="mr-2 h-5 w-5" />
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
                  <FaGitlab className="mr-2 h-5 w-5" />
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
                className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark focus:border-accent focus:outline-none focus:ring-accent"
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

            <div>
              <label
                htmlFor="accessToken"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Personal Access Token
              </label>
              <div className="relative mt-1">
                <Input
                  id="accessToken"
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="ghp_xxxx or glpat-xxxx"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark"
                  aria-label={showToken ? "Hide token" : "Show token"}
                >
                  {showToken ? (
                    <FiEyeOff className="h-4 w-4" />
                  ) : (
                    <FiEye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                {repositoryType === "GitHub" ? (
                  <>
                    Generate a token with <code className="rounded bg-surface-secondary dark:bg-surface-dark-secondary px-1">repo</code> scope at{" "}
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=Stride"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-accent hover:underline"
                    >
                      GitHub Settings
                      <FiExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </>
                ) : repositoryType === "GitLab" ? (
                  <>
                    Generate a token with <code className="rounded bg-surface-secondary dark:bg-surface-dark-secondary px-1">api</code> scope at{" "}
                    <a
                      href="https://gitlab.com/-/user_settings/personal_access_tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-accent hover:underline"
                    >
                      GitLab Settings
                      <FiExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </>
                ) : (
                  "Select a repository type to see token generation instructions"
                )}
              </p>
              <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                Your token is encrypted and stored securely. It will never be displayed again.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={loading} disabled={!projectId || !accessToken.trim()}>
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


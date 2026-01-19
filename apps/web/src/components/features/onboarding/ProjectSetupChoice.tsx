"use client";

import { useRouter } from "next/navigation";
import { Button } from "@stride/ui";
import { FaGithub, FaGitlab } from "react-icons/fa";
import { RepositoryImportFlow } from "@/components/features/projects/RepositoryImportFlow";
import { CreateProjectForm } from "@/components/features/projects/CreateProjectForm";
import { useState } from "react";
import type { CreateProjectInput } from "@stride/types";

interface ProjectSetupChoiceProps {
  hasOAuthConfig: boolean;
  availableProviders: {
    github: boolean;
    gitlab: boolean;
  };
}

type SetupMode = "choice" | "import" | "create";

/**
 * Project Setup Choice Component
 * 
 * Shows choice between Import and Create, or directly shows the selected option.
 */
export function ProjectSetupChoice({
  hasOAuthConfig,
  availableProviders,
}: ProjectSetupChoiceProps) {
  const router = useRouter();
  const [mode, setMode] = useState<SetupMode>("choice");

  const handleCreateSubmit = async (data: CreateProjectInput) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (response.status === 400 && result.details) {
        const errorMessage = Array.isArray(result.details)
          ? result.details.map((err: { message: string }) => err.message).join(", ")
          : result.error || "Validation failed";
        throw new Error(errorMessage);
      }
      throw new Error(result.error || "Failed to create project");
    }

    // Redirect to completion (skip repository step)
    router.push("/onboarding/complete");
  };

  const handleImportSuccess = () => {
    // Redirect to completion after successful import
    router.push("/onboarding/complete");
  };

  // Show choice screen
  if (mode === "choice") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
            Set Up Your Project
          </h1>
          <p className="mt-2 text-foreground-secondary dark:text-foreground-dark-secondary">
            Choose how you'd like to create your first project. You can import from
            a Git repository or create one manually.
          </p>
        </div>

        <div className="space-y-4">
          {/* Import Option */}
          {hasOAuthConfig ? (
            <button
              onClick={() => setMode("import")}
              className="w-full rounded-lg border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 text-left hover:border-accent hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                      Import from Git Provider
                    </h3>
                    <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-3">
                    Import a project from GitHub or GitLab. This automatically connects
                    your repository, syncs configuration, and sets up webhooks.
                  </p>
                  <div className="flex items-center gap-3 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
                    {availableProviders.github && (
                      <span className="flex items-center gap-1">
                        <FaGithub className="h-4 w-4" />
                        GitHub
                      </span>
                    )}
                    {availableProviders.gitlab && (
                      <span className="flex items-center gap-1">
                        <FaGitlab className="h-4 w-4" />
                        GitLab
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-foreground-secondary dark:text-foreground-dark-secondary flex-shrink-0 ml-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ) : (
            <div className="w-full rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary p-6 opacity-60">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
                    Import from Git Provider
                  </h3>
                  <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                    Git provider OAuth configuration is required to import projects.
                    Please configure GitHub or GitLab OAuth in infrastructure settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create Option */}
          <button
            onClick={() => setMode("create")}
            className="w-full rounded-lg border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 text-left hover:border-accent hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
                  Create Project Manually
                </h3>
                <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                  Create a new project from scratch. You can connect a repository
                  later through project settings.
                </p>
              </div>
              <svg
                className="h-5 w-5 text-foreground-secondary dark:text-foreground-dark-secondary flex-shrink-0 ml-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/onboarding/admin")}
          >
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/projects")}
          >
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  // Show import flow
  if (mode === "import") {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setMode("choice")}
            className="mb-4"
          >
            ← Back to options
          </Button>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
            Import from Git Provider
          </h1>
          <p className="mt-2 text-foreground-secondary dark:text-foreground-dark-secondary">
            Select a repository to import. This will create a project and connect
            the repository automatically.
          </p>
        </div>
        <OnboardingImportFlow
          availableProviders={availableProviders}
          onSuccess={handleImportSuccess}
        />
      </div>
    );
  }

  // Show create form
  return (
    <div className="mx-auto max-w-2xl">
      <CreateProjectForm
        onSubmit={handleCreateSubmit}
        mode="onboarding"
        onCancel={() => setMode("choice")}
      />
    </div>
  );
}

/**
 * Wrapper for RepositoryImportFlow that handles onboarding completion
 */
function OnboardingImportFlow({
  availableProviders,
  onSuccess,
}: {
  availableProviders: { github: boolean; gitlab: boolean };
  onSuccess: () => void;
}) {
  return (
    <RepositoryImportFlow
      availableProviders={availableProviders}
      returnTo="/onboarding/complete"
    />
  );
}

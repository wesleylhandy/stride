"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@stride/ui";
import type { CreateProjectInput } from "@stride/types";
import { RepositoryServiceType } from "@stride/types";

export interface CreateProjectFormProps {
  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  /**
   * Callback when form is cancelled (optional)
   */
  onCancel?: () => void;
  /**
   * Initial form values (optional)
   */
  initialValues?: Partial<CreateProjectInput>;
  /**
   * Whether form is submitting
   */
  isSubmitting?: boolean;
  /**
   * Error message to display (optional)
   */
  error?: string | null;
  /**
   * Form mode: 'onboarding' for full page, 'modal' for modal dialog
   */
  mode?: "onboarding" | "modal";
  /**
   * Callback after successful submission (for onboarding flow redirect)
   */
  onSuccessRedirect?: (projectId: string) => void;
}

/**
 * CreateProjectForm component
 *
 * Reusable project creation form that can be used in both
 * onboarding (full page) and modal contexts.
 */
export function CreateProjectForm({
  onSubmit,
  onCancel,
  initialValues,
  isSubmitting = false,
  error: externalError,
  mode = "onboarding",
  onSuccessRedirect,
}: CreateProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    key: initialValues?.key || "",
    name: initialValues?.name || "",
    description: initialValues?.description || "",
    repositoryUrl: initialValues?.repositoryUrl || "",
    repositoryType: (initialValues?.repositoryType || "") as
      | "GitHub"
      | "GitLab"
      | "Bitbucket"
      | "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setLoading(true);

    try {
      const payload: CreateProjectInput = {
        key: formData.key.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
      };

      // Only include repository fields if URL is provided
      if (formData.repositoryUrl.trim()) {
        payload.repositoryUrl = formData.repositoryUrl.trim();
        if (formData.repositoryType) {
          // Map string literal to RepositoryServiceType enum
          payload.repositoryType = formData.repositoryType as RepositoryServiceType;
        }
      }

      await onSubmit(payload);
      // Reset loading state on success (onSubmit handles redirect/close)
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const displayError = externalError || error;
  const isFormSubmitting = isSubmitting || loading;

  // Onboarding mode: full page layout
  if (mode === "onboarding") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
            Create Project
          </h1>
          <p className="mt-2 text-foreground-secondary dark:text-foreground-dark-secondary">
            Create a project to organize your issues and workflows. You can add
            more projects later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && (
            <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
              <p className="text-sm text-red-800">{displayError}</p>
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
                aria-label="Project key"
                aria-describedby="key-description"
                aria-invalid={validationErrors.key ? 'true' : 'false'}
                aria-required="true"
              />
              <p id="key-description" className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
                2-10 uppercase letters and numbers. This will be used as a
                prefix for issue keys (e.g., APP-123).
              </p>
              {validationErrors.key && (
                <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400" aria-live="polite">
                  {validationErrors.key}
                </p>
              )}
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
                aria-label="Project name"
                aria-required="true"
                aria-invalid={validationErrors.name ? 'true' : 'false'}
              />
              {validationErrors.name && (
                <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400" aria-live="polite">
                  {validationErrors.name}
                </p>
              )}
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
                className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark placeholder:text-foreground-muted dark:placeholder:text-foreground-dark-muted focus:border-accent focus:outline-none focus:ring-accent"
                rows={3}
                placeholder="A brief description of your project"
                maxLength={500}
                aria-label="Project description (optional)"
                aria-describedby="description-hint"
              />
              <p id="description-hint" className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary sr-only">
                Optional description for your project (max 500 characters)
              </p>
            </div>

            {/* Optional Repository URL Section */}
            <div className="border-t border-border dark:border-border-dark pt-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground dark:text-foreground-dark">
                  Repository (Optional)
                </h3>
                <p className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
                  Optionally provide a repository URL. You can connect the
                  repository later via project settings or the import flow.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="repositoryType"
                    className="block text-sm font-medium text-foreground dark:text-foreground-dark"
                  >
                    Repository Type
                  </label>
                  <select
                    id="repositoryType"
                    value={formData.repositoryType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        repositoryType: e.target.value as
                          | "GitHub"
                          | "GitLab"
                          | "Bitbucket"
                          | "",
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark focus:border-accent focus:outline-none focus:ring-accent"
                    aria-label="Repository type (optional)"
                    aria-invalid={validationErrors.repositoryType ? 'true' : 'false'}
                  >
                    <option value="">Select a repository type</option>
                    <option value="GitHub">GitHub</option>
                    <option value="GitLab">GitLab</option>
                    <option value="Bitbucket">Bitbucket</option>
                  </select>
                  {validationErrors.repositoryType && (
                    <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400" aria-live="polite">
                      {validationErrors.repositoryType}
                    </p>
                  )}
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
                    value={formData.repositoryUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        repositoryUrl: e.target.value,
                      })
                    }
                    className="mt-1"
                    placeholder="https://github.com/owner/repo"
                  />
                  {validationErrors.repositoryUrl && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.repositoryUrl}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
                    The repository URL will be stored but not automatically
                    connected. You can connect it later via project settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            {onCancel ? (
              <Button
                variant="ghost"
                onClick={onCancel}
              >
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => router.push("/onboarding/admin")}
              >
                Back
              </Button>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => router.push("/projects")}
                type="button"
              >
                Skip for now
              </Button>
              <Button type="submit" loading={isFormSubmitting}>
                Create Project
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Modal mode: compact layout
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {displayError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4" role="alert" aria-live="assertive">
          <p className="text-sm text-red-800 dark:text-red-200">
            {displayError}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="modal-key"
            className="block text-sm font-medium text-foreground dark:text-foreground-dark"
          >
            Project Key
          </label>
          <Input
            id="modal-key"
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
            aria-label="Project key"
            aria-describedby="modal-key-description"
            aria-invalid={validationErrors.key ? 'true' : 'false'}
            aria-required="true"
          />
          <p id="modal-key-description" className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
            2-10 uppercase letters and numbers
          </p>
          {validationErrors.key && (
            <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400" aria-live="polite">
              {validationErrors.key}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="modal-name"
            className="block text-sm font-medium text-foreground dark:text-foreground-dark"
          >
            Project Name
          </label>
          <Input
            id="modal-name"
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
            htmlFor="modal-description"
            className="block text-sm font-medium text-foreground dark:text-foreground-dark"
          >
            Description (Optional)
          </label>
          <textarea
            id="modal-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark placeholder:text-foreground-muted dark:placeholder:text-foreground-dark-muted focus:border-accent focus:outline-none focus:ring-accent"
            rows={3}
            placeholder="A brief description of your project"
            maxLength={500}
          />
        </div>

        {/* Optional Repository URL Section */}
        <div className="border-t border-border dark:border-border-dark pt-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-foreground dark:text-foreground-dark">
              Repository (Optional)
            </h3>
            <p className="mt-1 text-xs text-foreground-tertiary dark:text-foreground-dark-tertiary">
              Optionally provide a repository URL. You can connect the
              repository later via project settings or the import flow.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="modal-repositoryType"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Repository Type
              </label>
              <select
                id="modal-repositoryType"
                value={formData.repositoryType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    repositoryType: e.target.value as
                      | "GitHub"
                      | "GitLab"
                      | "Bitbucket"
                      | "",
                  })
                }
                className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark focus:border-accent focus:outline-none focus:ring-accent"
              >
                <option value="">Select a repository type</option>
                <option value="GitHub">GitHub</option>
                <option value="GitLab">GitLab</option>
                <option value="Bitbucket">Bitbucket</option>
              </select>
              {validationErrors.repositoryType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.repositoryType}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="modal-repositoryUrl"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark"
              >
                Repository URL
              </label>
              <Input
                id="modal-repositoryUrl"
                type="url"
                value={formData.repositoryUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    repositoryUrl: e.target.value,
                  })
                }
                className="mt-1"
                placeholder="https://github.com/owner/repo"
              />
              {validationErrors.repositoryUrl && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.repositoryUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} type="button" aria-label="Cancel project creation">
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isFormSubmitting} aria-label={isFormSubmitting ? 'Creating project...' : 'Create project'}>
          Create Project
        </Button>
      </div>
    </form>
  );
}

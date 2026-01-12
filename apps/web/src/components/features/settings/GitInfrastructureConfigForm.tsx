"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, useToast } from "@stride/ui";
import {
  gitOAuthConfigSchema,
  type GitOAuthConfig,
} from "@/lib/config/schemas/git-oauth-schema";
import { cn } from "@stride/ui";

/**
 * Git Infrastructure Configuration Form Props
 */
export interface GitInfrastructureConfigFormProps {
  /**
   * Initial configuration values
   */
  initialConfig?: {
    github?: {
      clientId?: string;
      source: "database" | "environment" | "default";
    };
    gitlab?: {
      clientId?: string;
      baseUrl?: string;
      source: "database" | "environment" | "default";
    };
  };
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: GitOAuthConfig) => Promise<void>;
  /**
   * Whether form is submitting
   */
  isSubmitting?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when test connection button is clicked
   */
  onTestConnection?: (provider: "github" | "gitlab") => Promise<void>;
  /**
   * Whether test connection is loading
   */
  testConnectionLoading?: {
    github?: boolean;
    gitlab?: boolean;
  };
}

/**
 * Git Infrastructure Configuration Form Component
 *
 * Allows admins to configure GitHub and GitLab OAuth credentials.
 * Shows read-only state when environment variables override UI settings.
 *
 * Critical: Secrets (clientSecret) are never displayed in UI,
 * even in read-only mode.
 */
export function GitInfrastructureConfigForm({
  initialConfig,
  onSubmit,
  isSubmitting = false,
  className,
  onTestConnection,
  testConnectionLoading = {},
}: GitInfrastructureConfigFormProps) {
  const toast = useToast();

  // Determine read-only state (env vars override UI)
  const isGitHubReadOnly = initialConfig?.github?.source === "environment";
  const isGitLabReadOnly = initialConfig?.gitlab?.source === "environment";

  // Form schema - make all fields optional since we're using partial config
  const formSchema = gitOAuthConfigSchema.partial();
  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      github: initialConfig?.github?.clientId
        ? {
            clientId: initialConfig.github.clientId,
            clientSecret: "", // Never pre-fill secrets
          }
        : undefined,
      gitlab: initialConfig?.gitlab
        ? {
            clientId: initialConfig.gitlab.clientId,
            baseUrl: initialConfig.gitlab.baseUrl || "https://gitlab.com",
            clientSecret: "", // Never pre-fill secrets
          }
        : undefined,
    },
  });

  // Handle form submission
  const onSubmitForm = async (data: FormData) => {
    try {
      // Filter out empty values
      const cleanedData: GitOAuthConfig = {};

      if (data.github?.clientId && data.github?.clientSecret) {
        cleanedData.github = {
          clientId: data.github.clientId,
          clientSecret: data.github.clientSecret,
        };
      }

      if (data.gitlab?.clientId && data.gitlab?.clientSecret) {
        cleanedData.gitlab = {
          clientId: data.gitlab.clientId,
          clientSecret: data.gitlab.clientSecret,
          baseUrl: data.gitlab.baseUrl || "https://gitlab.com",
        };
      }

      await onSubmit(cleanedData);

      // Reset form to show updated state (secrets will be empty)
      reset(
        {
          github: cleanedData.github
            ? {
                clientId: cleanedData.github.clientId,
                clientSecret: "", // Never show secrets after save
              }
            : undefined,
          gitlab: cleanedData.gitlab
            ? {
                clientId: cleanedData.gitlab.clientId,
                baseUrl: cleanedData.gitlab.baseUrl,
                clientSecret: "", // Never show secrets after save
              }
            : undefined,
        },
        { keepValues: false }
      );

      toast.success("Git OAuth configuration has been updated successfully.");
    } catch (error) {
      console.error("Failed to save Git OAuth configuration:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save configuration. Please try again.";
      toast.error("Failed to save configuration", {
        description: errorMessage,
      });
    }
  };

  // Handle test connection
  const handleTestConnection = async (provider: "github" | "gitlab") => {
    if (!onTestConnection) {
      return;
    }

    try {
      await onTestConnection(provider);
      toast.success(
        `${provider === "github" ? "GitHub" : "GitLab"} OAuth credentials are valid.`
      );
    } catch (error) {
      console.error(`Failed to test ${provider} connection:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to test ${provider === "github" ? "GitHub" : "GitLab"} connection.`;
      toast.error("Connection test failed", {
        description: errorMessage,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className={cn("space-y-6", className)}
    >
      {/* GitHub OAuth Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
            GitHub OAuth
          </h4>
          {onTestConnection && !isGitHubReadOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleTestConnection("github")}
              disabled={testConnectionLoading?.github || isSubmitting}
              loading={testConnectionLoading?.github}
            >
              Test Connection
            </Button>
          )}
        </div>

        {isGitHubReadOnly ? (
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Configured via environment variables. Update{" "}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                GITHUB_CLIENT_ID
              </code>{" "}
              and{" "}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                GITHUB_CLIENT_SECRET
              </code>{" "}
              to change.
            </p>
            {initialConfig?.github?.clientId && (
              <div className="mt-3">
                <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                  Client ID (read-only)
                </label>
                <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                  {initialConfig.github.clientId}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              {...register("github.clientId")}
              id="github-client-id"
              label="Client ID"
              placeholder="Enter GitHub OAuth App Client ID"
              error={errors.github?.clientId?.message}
            />

            <Input
              {...register("github.clientSecret")}
              id="github-client-secret"
              type="password"
              label="Client Secret"
              placeholder="Enter GitHub OAuth App Client Secret"
              error={errors.github?.clientSecret?.message}
            />
          </div>
        )}
      </div>

      {/* GitLab OAuth Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
            GitLab OAuth
          </h4>
          {onTestConnection && !isGitLabReadOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleTestConnection("gitlab")}
              disabled={testConnectionLoading?.gitlab || isSubmitting}
              loading={testConnectionLoading?.gitlab}
            >
              Test Connection
            </Button>
          )}
        </div>

        {isGitLabReadOnly ? (
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Configured via environment variables. Update{" "}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                GITLAB_CLIENT_ID
              </code>
              ,{" "}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                GITLAB_CLIENT_SECRET
              </code>
              , and{" "}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                GITLAB_BASE_URL
              </code>{" "}
              to change.
            </p>
            {initialConfig?.gitlab?.clientId && (
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                    Client ID (read-only)
                  </label>
                  <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                    {initialConfig.gitlab.clientId}
                  </div>
                </div>
                {initialConfig.gitlab.baseUrl && (
                  <div>
                    <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                      Base URL (read-only)
                    </label>
                    <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                      {initialConfig.gitlab.baseUrl}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              {...register("gitlab.clientId")}
              id="gitlab-client-id"
              label="Client ID"
              placeholder="Enter GitLab OAuth App Client ID"
              error={errors.gitlab?.clientId?.message}
            />

            <Input
              {...register("gitlab.clientSecret")}
              id="gitlab-client-secret"
              type="password"
              label="Client Secret"
              placeholder="Enter GitLab OAuth App Client Secret"
              error={errors.gitlab?.clientSecret?.message}
            />

            <Input
              {...register("gitlab.baseUrl")}
              id="gitlab-base-url"
              label="Base URL"
              placeholder="https://gitlab.com"
              error={errors.gitlab?.baseUrl?.message}
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      {(!isGitHubReadOnly || !isGitLabReadOnly) && (
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            loading={isSubmitting}
          >
            Save Configuration
          </Button>
        </div>
      )}
    </form>
  );
}

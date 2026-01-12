"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, useToast } from "@stride/ui";
import {
  gitLabOAuthConfigSchema,
  type GitLabOAuthConfig,
} from "@/lib/config/schemas/git-oauth-schema";
import { cn } from "@stride/ui";

/**
 * GitLab OAuth Configuration Form Props
 */
export interface GitLabOAuthConfigFormProps {
  /**
   * Initial configuration values
   */
  initialConfig?: {
    clientId?: string;
    baseUrl?: string;
    source: "database" | "environment" | "default";
  };
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: GitLabOAuthConfig) => Promise<void>;
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
  onTestConnection?: () => Promise<void>;
  /**
   * Whether test connection is loading
   */
  testConnectionLoading?: boolean;
}

/**
 * GitLab OAuth Configuration Form Component
 *
 * Allows admins to configure GitLab OAuth credentials.
 * Shows read-only state when environment variables override UI settings.
 *
 * Critical: Secrets (clientSecret) are never displayed in UI,
 * even in read-only mode.
 */
export function GitLabOAuthConfigForm({
  initialConfig,
  onSubmit,
  isSubmitting = false,
  className,
  onTestConnection,
  testConnectionLoading = false,
}: GitLabOAuthConfigFormProps) {
  const toast = useToast();

  // Determine read-only state (env vars override UI)
  const isReadOnly = initialConfig?.source === "environment";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<GitLabOAuthConfig>({
    resolver: zodResolver(gitLabOAuthConfigSchema),
    defaultValues: {
      clientId: initialConfig?.clientId || "",
      baseUrl: initialConfig?.baseUrl || "https://gitlab.com",
      clientSecret: "", // Never pre-fill secrets
    },
  });

  // Handle form submission
  const onSubmitForm = async (data: GitLabOAuthConfig) => {
    try {
      await onSubmit(data);

      // Reset form to show updated state (secrets will be empty)
      reset(
        {
          clientId: data.clientId,
          baseUrl: data.baseUrl || "https://gitlab.com",
          clientSecret: "", // Never show secrets after save
        },
        { keepValues: false }
      );

      toast.success("GitLab OAuth configuration has been updated successfully.");
    } catch (error) {
      console.error("Failed to save GitLab OAuth configuration:", error);
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
  const handleTestConnection = async () => {
    if (!onTestConnection) {
      return;
    }

    try {
      await onTestConnection();
      toast.success("GitLab OAuth credentials are valid.");
    } catch (error) {
      console.error("Failed to test GitLab connection:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to test GitLab connection.";
      toast.error("Connection test failed", {
        description: errorMessage,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className={cn("space-y-4", className)}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
          GitLab OAuth
        </h4>
        {onTestConnection && !isReadOnly && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            disabled={testConnectionLoading || isSubmitting}
            loading={testConnectionLoading}
          >
            Test Connection
          </Button>
        )}
      </div>

      {isReadOnly ? (
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
          {initialConfig?.clientId && (
            <div className="mt-3 space-y-2">
              <div>
                <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                  Client ID (read-only)
                </label>
                <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                  {initialConfig.clientId}
                </div>
              </div>
              {initialConfig.baseUrl && (
                <div>
                  <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                    Base URL (read-only)
                  </label>
                  <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                    {initialConfig.baseUrl}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <Input
              {...register("clientId")}
              id="gitlab-client-id"
              label="Client ID"
              placeholder="Enter GitLab OAuth App Client ID"
              error={errors.clientId?.message}
            />

            <Input
              {...register("clientSecret")}
              id="gitlab-client-secret"
              type="password"
              label="Client Secret"
              placeholder="Enter GitLab OAuth App Client Secret"
              error={errors.clientSecret?.message}
            />

            <Input
              {...register("baseUrl")}
              id="gitlab-base-url"
              label="Base URL"
              placeholder="https://gitlab.com"
              error={errors.baseUrl?.message}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              loading={isSubmitting}
            >
              Save GitLab Configuration
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

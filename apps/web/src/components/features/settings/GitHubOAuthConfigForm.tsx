"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, useToast } from "@stride/ui";
import {
  githubOAuthConfigSchema,
  type GitHubOAuthConfig,
} from "@/lib/config/schemas/git-oauth-schema";
import { cn } from "@stride/ui";

/**
 * GitHub OAuth Configuration Form Props
 */
export interface GitHubOAuthConfigFormProps {
  /**
   * Initial configuration values
   */
  initialConfig?: {
    clientId?: string;
    source: "database" | "environment" | "default";
  };
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: GitHubOAuthConfig) => Promise<void>;
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
 * GitHub OAuth Configuration Form Component
 *
 * Allows admins to configure GitHub OAuth credentials.
 * Shows read-only state when environment variables override UI settings.
 *
 * Critical: Secrets (clientSecret) are never displayed in UI,
 * even in read-only mode.
 */
export function GitHubOAuthConfigForm({
  initialConfig,
  onSubmit,
  isSubmitting = false,
  className,
  onTestConnection,
  testConnectionLoading = false,
}: GitHubOAuthConfigFormProps) {
  const toast = useToast();

  // Determine read-only state (env vars override UI)
  const isReadOnly = initialConfig?.source === "environment";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<GitHubOAuthConfig>({
    resolver: zodResolver(githubOAuthConfigSchema),
    defaultValues: {
      clientId: initialConfig?.clientId || "",
      clientSecret: "", // Never pre-fill secrets
    },
  });

  // Handle form submission
  const onSubmitForm = async (data: GitHubOAuthConfig) => {
    try {
      await onSubmit(data);

      // Reset form to show updated state (secrets will be empty)
      reset(
        {
          clientId: data.clientId,
          clientSecret: "", // Never show secrets after save
        },
        { keepValues: false }
      );

      toast.success("GitHub OAuth configuration has been updated successfully.");
    } catch (error) {
      console.error("Failed to save GitHub OAuth configuration:", error);
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
      toast.success("GitHub OAuth credentials are valid.");
    } catch (error) {
      console.error("Failed to test GitHub connection:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to test GitHub connection.";
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
          GitHub OAuth
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
              GITHUB_CLIENT_ID
            </code>{" "}
            and{" "}
            <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
              GITHUB_CLIENT_SECRET
            </code>{" "}
            to change.
          </p>
          {initialConfig?.clientId && (
            <div className="mt-3">
              <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                Client ID (read-only)
              </label>
              <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                {initialConfig.clientId}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <Input
              {...register("clientId")}
              id="github-client-id"
              label="Client ID"
              placeholder="Enter GitHub OAuth App Client ID"
              error={errors.clientId?.message}
            />

            <Input
              {...register("clientSecret")}
              id="github-client-secret"
              type="password"
              label="Client Secret"
              placeholder="Enter GitHub OAuth App Client Secret"
              error={errors.clientSecret?.message}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              loading={isSubmitting}
            >
              Save GitHub Configuration
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

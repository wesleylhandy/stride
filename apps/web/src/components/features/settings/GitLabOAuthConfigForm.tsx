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
import { FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

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
    configuredClientSecret?: boolean;
  };
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: GitLabOAuthConfig) => Promise<void>;
  /**
   * Callback to clear configuration (all-or-nothing)
   */
  onClear?: () => Promise<void>;
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
  onClear,
  isSubmitting = false,
  className,
  onTestConnection,
  testConnectionLoading = false,
}: GitLabOAuthConfigFormProps) {
  const toast = useToast();

  // Determine read-only state (env vars override UI)
  const isReadOnly = initialConfig?.source === "environment";

  // Track edit state - all-or-nothing pattern
  const [isEditing, setIsEditing] = React.useState(false);
  const isConfigured = !!(initialConfig?.clientId && initialConfig?.configuredClientSecret);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<GitLabOAuthConfig>({
    resolver: zodResolver(gitLabOAuthConfigSchema),
    defaultValues: {
      clientId: initialConfig?.clientId || "",
      baseUrl: initialConfig?.baseUrl || "https://gitlab.com",
      clientSecret: "", // Never pre-fill secrets
    },
  });

  const watchedValues = watch();
  
  // Custom dirty check - only dirty if editing and fields changed
  const isDirty = React.useMemo(() => {
    if (!isEditing) return false;
    if (watchedValues.clientId !== (initialConfig?.clientId || '')) return true;
    if (watchedValues.baseUrl !== (initialConfig?.baseUrl || 'https://gitlab.com')) return true;
    if (watchedValues.clientSecret) return true;
    return false;
  }, [watchedValues, initialConfig, isEditing]);

  // Handle edit - show all fields
  const handleEdit = () => {
    setIsEditing(true);
    setValue('clientId', initialConfig?.clientId || '', { shouldValidate: false });
    setValue('baseUrl', initialConfig?.baseUrl || 'https://gitlab.com', { shouldValidate: false });
    setValue('clientSecret', '', { shouldValidate: false });
  };

  // Handle clear - clear all fields (all-or-nothing)
  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear the GitLab OAuth configuration? This will remove Client ID, Client Secret, and Base URL.')) {
      return;
    }

    if (!onClear) {
      toast.error("Clear not supported", {
        description: "Clear functionality is not available.",
      });
      return;
    }

    try {
      await onClear();
      setIsEditing(false);
      reset({
        clientId: '',
        baseUrl: 'https://gitlab.com',
        clientSecret: '',
      }, { keepValues: false });
      toast.success("GitLab OAuth configuration has been cleared.");
    } catch (error) {
      console.error("Failed to clear GitLab OAuth configuration:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to clear configuration. Please try again.";
      toast.error("Failed to clear configuration", {
        description: errorMessage,
      });
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    reset({
      clientId: initialConfig?.clientId || '',
      baseUrl: initialConfig?.baseUrl || 'https://gitlab.com',
      clientSecret: '',
    }, { keepValues: false });
  };

  // Handle form submission - all-or-nothing
  const onSubmitForm = async (data: GitLabOAuthConfig) => {
    try {
      // All-or-nothing: schema requires all fields
      const cleanedData: GitLabOAuthConfig = {
        clientId: data.clientId.trim(),
        clientSecret: data.clientSecret.trim(),
        baseUrl: data.baseUrl?.trim() || "https://gitlab.com",
      };

      await onSubmit(cleanedData);

      // Reset form and state
      setIsEditing(false);
      reset(
        {
          clientId: cleanedData.clientId,
          baseUrl: cleanedData.baseUrl,
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
          {isConfigured && !isEditing ? (
            // Saved state view - all-or-nothing pattern
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-success dark:text-success-dark">✓</span>
                    <span className="text-sm font-medium text-foreground dark:text-foreground-dark">
                      Configuration saved
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleEdit}
                    >
                      <FiEdit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                    >
                      <FiTrash2 className="h-4 w-4 mr-1 text-error" />
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                      Client ID
                    </label>
                    <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                      {initialConfig?.clientId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                      Base URL
                    </label>
                    <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                      {initialConfig?.baseUrl || 'https://gitlab.com'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                      Client Secret
                    </label>
                    <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                      ••••••••••••••••• (hidden for security)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit mode - show all fields
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

              {/* Action Buttons */}
              <div className="flex justify-between gap-3 pt-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
                <div className="flex gap-3 ml-auto">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isDirty}
                    loading={isSubmitting}
                  >
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </form>
  );
}

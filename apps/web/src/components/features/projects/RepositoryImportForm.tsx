"use client";

import * as React from 'react';
import { z } from 'zod';
import { Button, Input } from '@stride/ui';
import type { RepositoryInfo } from '@/lib/types/repository';

// Client-safe project key generation (no database dependencies)
function generateProjectKeyFromName(repoName: string): string {
  if (!repoName || repoName.trim().length === 0) {
    throw new Error('Repository name cannot be empty');
  }

  // Convert to uppercase and remove all non-alphanumeric characters
  const cleaned = repoName.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleaned.length === 0) {
    throw new Error(
      'Repository name must contain at least one alphanumeric character',
    );
  }

  // Truncate to 10 characters (max project key length)
  let key = cleaned.slice(0, 10);

  // Ensure minimum 2 characters (min project key length)
  // If we have less than 2 characters after cleaning, pad with zeros or use a default
  if (key.length < 2) {
    // If we have at least 1 character, pad with "0" to reach 2
    // Otherwise, use a default key prefix
    key = key.length === 1 ? `${key}0` : 'PRJ';
  }

  return key;
}

// Client-safe project key validation schema (no database dependencies)
const projectKeySchema = z
  .string()
  .min(2, 'Project key must be at least 2 characters')
  .max(10, 'Project key must be less than 10 characters')
  .regex(
    /^[A-Z0-9]+$/,
    'Project key must contain only uppercase letters and numbers',
  );

// Client-safe project key validation function (format only, no uniqueness check)
function validateProjectKeyFormat(key: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    projectKeySchema.parse(key);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Invalid project key format',
      };
    }
    return { isValid: false, error: 'Invalid project key format' };
  }
}

export interface ImportProjectData {
  repositoryUrl: string;
  repositoryType: 'GitHub' | 'GitLab' | 'Bitbucket';
  accessToken: string;
  projectKey?: string;
  projectName?: string;
}

export interface RepositoryImportFormProps {
  /**
   * Repository information to import
   */
  repository: RepositoryInfo;
  /**
   * Provider type (GitHub/GitLab)
   */
  providerType: 'GitHub' | 'GitLab';
  /**
   * Access token for repository access
   */
  accessToken: string;
  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: ImportProjectData) => Promise<void>;
  /**
   * Callback when form is cancelled
   */
  onCancel: () => void;
  /**
   * Whether form is submitting
   */
  loading?: boolean;
  /**
   * Error message to display (optional)
   */
  error?: string | null;
}

/**
 * RepositoryImportForm component
 * 
 * Displays import confirmation form with repository details
 * and allows editing project key and name before importing
 */
export function RepositoryImportForm({
  repository,
  providerType,
  accessToken,
  onSubmit,
  onCancel,
  loading = false,
  error: externalError,
}: RepositoryImportFormProps) {
  const [formData, setFormData] = React.useState({
    projectKey: generateProjectKeyFromName(repository.name),
    projectName: repository.name,
  });
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Validate project key format (uniqueness will be checked by the API)
    const keyValidation = validateProjectKeyFormat(formData.projectKey);
    if (!keyValidation.isValid) {
      setValidationErrors({
        projectKey: keyValidation.error || 'Invalid project key format',
      });
      return;
    }

    // Validate project name
    if (!formData.projectName || formData.projectName.trim().length === 0) {
      setValidationErrors({
        projectName: 'Project name is required',
      });
      return;
    }

    if (formData.projectName.length > 100) {
      setValidationErrors({
        projectName: 'Project name must be less than 100 characters',
      });
      return;
    }

    try {
      const payload: ImportProjectData = {
        repositoryUrl: repository.url,
        repositoryType: providerType,
        accessToken,
        projectKey: formData.projectKey.toUpperCase(),
        projectName: formData.projectName.trim(),
      };

      await onSubmit(payload);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    }
  };

  const displayError = externalError || error;
  const isFormSubmitting = loading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
          Confirm Import Settings
        </h2>
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
          Review and adjust project settings before importing. You can edit the project key and name.
        </p>
      </div>

      {/* Repository Details (Read-only) */}
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
        <h3 className="text-sm font-medium text-foreground dark:text-foreground-dark mb-3">
          Repository Information
        </h3>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              Repository:
            </span>
            <p className="text-sm text-foreground dark:text-foreground-dark font-medium">
              {repository.name}
            </p>
          </div>
          {repository.description && (
            <div>
              <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                Description:
              </span>
              <p className="text-sm text-foreground dark:text-foreground-dark">
                {repository.description}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              URL:
            </span>
            <p className="text-sm text-foreground dark:text-foreground-dark break-all">
              {repository.url}
            </p>
          </div>
        </div>
      </div>

      {/* Import Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {displayError && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{displayError}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="projectKey"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1"
            >
              Project Key
            </label>
            <Input
              id="projectKey"
              type="text"
              required
              value={formData.projectKey}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  projectKey: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                })
              }
              className="mt-1"
              placeholder="PROJ"
              minLength={2}
              maxLength={10}
              disabled={isFormSubmitting}
              aria-invalid={validationErrors.projectKey ? 'true' : 'false'}
              aria-describedby={
                validationErrors.projectKey ? 'projectKey-error' : undefined
              }
            />
            {validationErrors.projectKey && (
              <p
                id="projectKey-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {validationErrors.projectKey}
              </p>
            )}
            <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              A short identifier for your project (2-10 uppercase letters/numbers). This will be used
              in issue keys and URLs.
            </p>
          </div>

          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1"
            >
              Project Name
            </label>
            <Input
              id="projectName"
              type="text"
              required
              value={formData.projectName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  projectName: e.target.value,
                })
              }
              className="mt-1"
              placeholder="My Project"
              maxLength={100}
              disabled={isFormSubmitting}
              aria-invalid={validationErrors.projectName ? 'true' : 'false'}
              aria-describedby={
                validationErrors.projectName ? 'projectName-error' : undefined
              }
            />
            {validationErrors.projectName && (
              <p
                id="projectName-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {validationErrors.projectName}
              </p>
            )}
            <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              Display name for your project (max 100 characters).
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isFormSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isFormSubmitting}
          >
            {isFormSubmitting ? 'Importing...' : 'Import Project'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Export default for backwards compatibility
export default RepositoryImportForm;

'use client';

import { useState } from 'react';
import { Button, Input } from '@stride/ui';
import { FaGithub, FaGitlab } from 'react-icons/fa';
import { FiEye, FiEyeOff, FiExternalLink } from 'react-icons/fi';
import { z } from 'zod';

const repositoryConnectionSchema = z.object({
  repositoryType: z.enum(['GitHub', 'GitLab'], {
    required_error: 'Repository type is required',
  }),
  repositoryUrl: z.string().url('Invalid repository URL'),
  accessToken: z.string().min(1, 'Access token is required'),
});

export interface RepositoryConnectionFormProps {
  projectId: string;
  onSubmit: (data: {
    repositoryType: 'GitHub' | 'GitLab';
    repositoryUrl: string;
    accessToken: string;
  }) => Promise<void>;
  onOAuthClick: (type: 'GitHub' | 'GitLab', repositoryUrl?: string) => void;
  loading?: boolean;
  oauthLoading?: boolean;
  error?: string | null;
  requireRepositoryUrlForOAuth?: boolean;
}

/**
 * RepositoryConnectionForm Component
 * 
 * Reusable form component for connecting repositories via OAuth or manual token.
 * Can be used in both onboarding and settings flows.
 */
export function RepositoryConnectionForm({
  projectId,
  onSubmit,
  onOAuthClick,
  loading = false,
  oauthLoading = false,
  error: externalError = null,
  requireRepositoryUrlForOAuth = false,
}: RepositoryConnectionFormProps) {
  const [repositoryType, setRepositoryType] = useState<'GitHub' | 'GitLab' | null>(null);
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setValidationErrors({});

    if (!repositoryType || !repositoryUrl || !accessToken.trim()) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      const validated = repositoryConnectionSchema.parse({
        repositoryType,
        repositoryUrl,
        accessToken: accessToken.trim(),
      });

      await onSubmit(validated);
      
      // Clear form on success
      setRepositoryUrl('');
      setAccessToken('');
      setRepositoryType(null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setValidationErrors(errors);
      } else {
        setFormError(err instanceof Error ? err.message : 'Failed to connect repository');
      }
    }
  };

  const displayError = externalError || formError;

  return (
    <div className="space-y-6">
      {/* OAuth Options */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
          Connect via OAuth (Recommended)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              if (requireRepositoryUrlForOAuth && !repositoryUrl) {
                setFormError('Please enter repository URL before connecting via OAuth');
                return;
              }
              onOAuthClick('GitHub', repositoryUrl || undefined);
            }}
            disabled={oauthLoading || (requireRepositoryUrlForOAuth && !repositoryUrl)}
            className="flex items-center justify-center rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-3 text-sm font-medium text-foreground dark:text-foreground-dark shadow-sm hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {oauthLoading ? (
              'Connecting...'
            ) : (
              <>
                <FaGithub className="mr-2 h-5 w-5" />
                Connect GitHub
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (requireRepositoryUrlForOAuth && !repositoryUrl) {
                setFormError('Please enter repository URL before connecting via OAuth');
                return;
              }
              onOAuthClick('GitLab', repositoryUrl || undefined);
            }}
            disabled={oauthLoading || (requireRepositoryUrlForOAuth && !repositoryUrl)}
            className="flex items-center justify-center rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-3 text-sm font-medium text-foreground dark:text-foreground-dark shadow-sm hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {oauthLoading ? (
              'Connecting...'
            ) : (
              <>
                <FaGitlab className="mr-2 h-5 w-5" />
                Connect GitLab
              </>
            )}
          </button>
        </div>
      </div>

      {/* Manual Connection */}
      <div className="border-t border-border dark:border-border-dark pt-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
          Or Connect Manually
        </h2>

        {displayError && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{displayError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="repositoryType"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark"
            >
              Repository Type
            </label>
            <select
              id="repositoryType"
              value={repositoryType || ''}
              onChange={(e) =>
                setRepositoryType(e.target.value as 'GitHub' | 'GitLab' | null)
              }
              className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark focus:border-accent focus:outline-none focus:ring-accent"
              required
            >
              <option value="">Select a repository type</option>
              <option value="GitHub">GitHub</option>
              <option value="GitLab">GitLab</option>
            </select>
            {validationErrors.repositoryType && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              className="mt-1"
              placeholder="https://github.com/owner/repo"
              required
            />
            {validationErrors.repositoryUrl && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.repositoryUrl}
              </p>
            )}
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
                type={showToken ? 'text' : 'password'}
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
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
            {validationErrors.accessToken && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.accessToken}
              </p>
            )}
            <p className="mt-1.5 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              {repositoryType === 'GitHub' ? (
                <>
                  Generate a token with <code className="rounded bg-surface-secondary dark:bg-surface-dark-secondary px-1">repo</code> scope at{' '}
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
              ) : repositoryType === 'GitLab' ? (
                <>
                  Generate a token with <code className="rounded bg-surface-secondary dark:bg-surface-dark-secondary px-1">api</code> scope at{' '}
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
                'Select a repository type to see token generation instructions'
              )}
            </p>
            <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              Your token is encrypted and stored securely. It will never be displayed again.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!repositoryType || !accessToken.trim()}>
              Connect Repository
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


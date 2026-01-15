'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@stride/ui';
import { RepositoryList } from './RepositoryList';
import { RepositoryImportForm } from './RepositoryImportForm';
import { getCsrfHeaders } from '@/lib/utils/csrf';
import type { RepositoryInfo } from '@/lib/types/repository';
import type { ImportProjectData } from './RepositoryImportForm';

export interface RepositoryImportFlowProps {
  /**
   * Available OAuth providers
   */
  availableProviders: {
    github: boolean;
    gitlab: boolean;
  };
}

type FlowStep = 'provider-selection' | 'oauth-pending' | 'repository-list' | 'import-form' | 'error';

/**
 * RepositoryImportFlow component
 * 
 * Main orchestrator for repository import flow:
 * 1. Provider selection (GitHub/GitLab)
 * 2. OAuth authentication
 * 3. Repository listing
 * 4. Repository selection (triggers import form - handled in User Story 3)
 * 
 * Features:
 * - OAuth flow integration
 * - Repository listing with pagination
 * - Error handling and loading states
 * - OAuth callback processing
 */
export function RepositoryImportFlow({
  availableProviders,
}: RepositoryImportFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Flow state
  const [step, setStep] = React.useState<FlowStep>('provider-selection');
  const [selectedProvider, setSelectedProvider] = React.useState<'GitHub' | 'GitLab' | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [selectedRepository, setSelectedRepository] = React.useState<RepositoryInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [isProcessingCallback, setIsProcessingCallback] = React.useState(false);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (data: ImportProjectData) => {
      const response = await fetch('/api/projects/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(), // Include CSRF token from cookie
        },
        credentials: 'include', // Include cookies for CSRF token
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import project');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate projects list query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Redirect to the newly created project
      router.push(`/projects/${data.project.id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to import project');
      setStep('error');
    },
  });

  // Check for OAuth callback (code in URL params) or selected repository
  React.useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');
    const repositoryParam = searchParams.get('repository');

    // Handle OAuth errors
    if (errorParam) {
      setError(errorDescription || errorParam || 'OAuth authorization failed');
      setStep('error');
      // Clean up URL
      router.replace('/projects/import');
      return;
    }

    // Handle OAuth success (code present)
    // Note: Don't check step here - OAuth callback can happen at any time after redirect
    // Also check that we're not already processing a callback
    if (code && state && !isProcessingCallback) {
      handleOAuthCallback(code, state);
      return;
    }

    // Handle repository selection from URL params (if returning to import form)
    if (repositoryParam && selectedProvider && accessToken && step === 'repository-list') {
      // Try to load repository from sessionStorage or fetch it
      const stored = sessionStorage.getItem('selected_repository');
      if (stored) {
        try {
          const repoData = JSON.parse(stored);
          setSelectedRepository(repoData);
          setStep('import-form');
          // Clean up URL
          router.replace('/projects/import');
        } catch {
          // Invalid stored data, ignore
        }
      }
    }
  }, [searchParams]);

  // Handle OAuth callback
  const handleOAuthCallback = async (code: string, state: string) => {
    // Prevent multiple simultaneous callback processing
    if (isProcessingCallback) {
      console.log('OAuth callback already processing, ignoring duplicate');
      return;
    }

    setIsProcessingCallback(true);
    setIsLoading(true);
    setError(null);

    try {
      // Verify state matches what we stored (CSRF protection)
      const storedState = sessionStorage.getItem('oauth_state');
      if (!storedState) {
        console.error('OAuth state not found in sessionStorage. This might happen if:');
        console.error('1. Session was cleared');
        console.error('2. OAuth was initiated in a different tab/window');
        console.error('3. Page was refreshed before callback');
        throw new Error('OAuth state not found in session. Please try again by selecting a provider.');
      }
      
      if (storedState !== state) {
        console.error('CSRF token mismatch - potential security issue:', {
          stored: storedState,
          received: state,
          storedLength: storedState.length,
          receivedLength: state.length,
        });
        throw new Error('Invalid CSRF token. The OAuth state does not match. This might be a security issue. Please try again.');
      }
      
      console.log('CSRF token validated successfully');

      // Get provider type from sessionStorage
      const storedProvider = sessionStorage.getItem('oauth_provider') as 'GitHub' | 'GitLab' | null;
      if (!storedProvider) {
        throw new Error('Provider type not found. Please try again by selecting a provider.');
      }

      // Exchange code for access token
      // Include CSRF token in headers for POST request
      const response = await fetch('/api/repositories/oauth/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(), // Include CSRF token from cookie
        },
        credentials: 'include', // Include cookies for CSRF token
        body: JSON.stringify({
          code,
          type: storedProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange OAuth code');
      }

      const data = await response.json();

      // Store access token and provider
      setAccessToken(data.accessToken);
      setSelectedProvider(storedProvider);
      setStep('repository-list');

      // Clean up sessionStorage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');

      // Clean up URL
      router.replace('/projects/import');
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete OAuth flow');
      setStep('error');
      // Don't clear sessionStorage on error - user might want to retry
    } finally {
      setIsLoading(false);
      setIsProcessingCallback(false);
    }
  };

  // Handle provider selection and initiate OAuth
  const handleProviderSelect = async (provider: 'GitHub' | 'GitLab') => {
    setIsLoading(true);
    setError(null);
    setSelectedProvider(provider);

    try {
      // Get OAuth authorization URL
      const response = await fetch(
        `/api/repositories/oauth/authorize?type=${provider}&returnTo=${encodeURIComponent(window.location.href)}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate OAuth');
      }

      const data = await response.json();

      // Store state and provider in sessionStorage for callback verification
      sessionStorage.setItem('oauth_state', data.state);
      sessionStorage.setItem('oauth_provider', provider);

      // Redirect to OAuth provider
      window.location.href = data.authUrl;
      setStep('oauth-pending');
    } catch (err) {
      console.error('OAuth initiation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth flow');
      setStep('error');
      setIsLoading(false);
    }
  };

  // Handle repository selection (triggers import form)
  const handleRepositorySelect = (repository: RepositoryInfo) => {
    // Store selected repository for import form
    sessionStorage.setItem('selected_repository', JSON.stringify({
      ...repository,
      providerType: selectedProvider,
      accessToken,
    }));

    // Show import form
    setSelectedRepository(repository);
    setStep('import-form');
    
    // Clean up URL
    router.replace('/projects/import');
  };

  // Handle import form submission
  const handleImportSubmit = async (data: ImportProjectData) => {
    await importMutation.mutateAsync(data);
  };

  // Handle import form cancellation
  const handleImportCancel = () => {
    setSelectedRepository(null);
    sessionStorage.removeItem('selected_repository');
    setStep('repository-list');
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Provider selection step
  if (step === 'provider-selection') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
            Select Git Provider
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            Choose a git provider to import repositories from. You'll be redirected to authenticate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableProviders.github && (
            <button
              onClick={() => handleProviderSelect('GitHub')}
              disabled={isLoading}
              className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 hover:border-primary dark:hover:border-primary-dark transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
              aria-label="Import projects from GitHub"
              aria-describedby="github-description"
            >
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
                GitHub
              </h3>
              <p id="github-description" className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                Import projects from your GitHub repositories
              </p>
            </button>
          )}

          {availableProviders.gitlab && (
            <button
              onClick={() => handleProviderSelect('GitLab')}
              disabled={isLoading}
              className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 hover:border-primary dark:hover:border-primary-dark transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
              aria-label="Import projects from GitLab"
              aria-describedby="gitlab-description"
            >
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
                GitLab
              </h3>
              <p id="gitlab-description" className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                Import projects from your GitLab projects
              </p>
            </button>
          )}
        </div>

        {!availableProviders.github && !availableProviders.gitlab && (
          <div className="rounded-lg border border-warning dark:border-warning-dark bg-surface dark:bg-surface-dark p-6">
            <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
              No git providers are configured. Please contact an administrator to configure OAuth.
            </p>
          </div>
        )}
      </div>
    );
  }

  // OAuth pending step
  if (step === 'oauth-pending' || isLoading) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 text-center" role="status" aria-live="polite">
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          Redirecting to {selectedProvider} for authentication...
        </p>
        <div className="mt-4" aria-hidden="true">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  // Error step
  if (step === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-error dark:border-error-dark bg-surface dark:bg-surface-dark p-6" role="alert" aria-live="assertive">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
            Error
          </h3>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-4">
            {error || 'An error occurred'}
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setStep('provider-selection');
              setError(null);
              setSelectedProvider(null);
              setAccessToken(null);
            }}
            aria-label="Try importing again"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Repository list step
  if (step === 'repository-list' && selectedProvider && accessToken) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-2">
            Select Repository
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            Choose a repository to import as a project.
          </p>
        </div>

        <RepositoryList
          providerType={selectedProvider}
          accessToken={accessToken}
          onSelectRepository={handleRepositorySelect}
          page={page}
          onPageChange={handlePageChange}
        />
      </div>
    );
  }

  // Import form step
  if (step === 'import-form' && selectedRepository && selectedProvider && accessToken) {
    return (
      <RepositoryImportForm
        repository={selectedRepository}
        providerType={selectedProvider}
        accessToken={accessToken}
        onSubmit={handleImportSubmit}
        onCancel={handleImportCancel}
        loading={importMutation.isPending}
        error={importMutation.error instanceof Error ? importMutation.error.message : null}
      />
    );
  }

  return null;
}

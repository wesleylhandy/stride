'use client';

import * as React from 'react';
import { Badge } from '@stride/ui';

/**
 * Infrastructure Status Configuration Response Type
 * 
 * Matches the API response from GET /api/settings/infrastructure/status
 * Note: Secrets (clientSecret, API keys) are never included in the response
 */
interface InfrastructureStatusConfig {
  gitConfig: {
    github?: {
      clientId: string;
      configured: boolean;
      source: 'database' | 'environment' | 'default';
    };
    gitlab?: {
      clientId: string;
      baseUrl?: string;
      configured: boolean;
      source: 'database' | 'environment' | 'default';
    };
  };
  aiConfig: {
    aiGatewayUrl?: string;
    llmEndpoint?: string;
    configured: boolean;
    source: 'database' | 'environment' | 'default';
  };
}

/**
 * InfrastructureStatusView Component
 * 
 * Read-only status view for non-admin users.
 * Displays configuration status without exposing sensitive credentials.
 * 
 * Critical: Secrets (clientSecret, API keys) are NEVER displayed,
 * even in this read-only view.
 */
export function InfrastructureStatusView() {
  const [config, setConfig] = React.useState<InfrastructureStatusConfig | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch configuration status on mount
  React.useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/settings/infrastructure/status');

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          if (response.status === 401) {
            setError('Authentication required');
            return;
          }
          throw new Error('Failed to fetch infrastructure status');
        }

        const data = await response.json();
        if (!cancelled) {
          setConfig(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch infrastructure status:', err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Failed to load infrastructure status';
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-4">
            Infrastructure Status
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            View global infrastructure configuration status.
          </p>
        </div>
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-4">
            Infrastructure Status
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            View global infrastructure configuration status.
          </p>
        </div>
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-4">
            Infrastructure Status
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            View global infrastructure configuration status.
          </p>
        </div>
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
            No configuration status available.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (configured: boolean, source: 'database' | 'environment' | 'default') => {
    if (!configured) {
      return <Badge variant="default">Not Configured</Badge>;
    }
    if (source === 'environment') {
      return <Badge variant="info">Configured (Environment)</Badge>;
    }
    if (source === 'database') {
      return <Badge variant="success">Configured (UI)</Badge>;
    }
    return <Badge variant="default">Default</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-4">
          Infrastructure Status
        </h2>
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
          View global infrastructure configuration status. Contact an administrator to modify settings.
        </p>
      </div>

      {/* Git OAuth Configuration Status */}
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          Git OAuth Configuration
        </h3>

        {/* GitHub Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
              GitHub
            </h4>
            {getStatusBadge(
              config.gitConfig.github?.configured || false,
              config.gitConfig.github?.source || 'default'
            )}
          </div>
          {config.gitConfig.github?.clientId && (
            <div>
              <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                Client ID
              </label>
              <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                {config.gitConfig.github.clientId}
              </div>
            </div>
          )}
        </div>

        {/* GitLab Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
              GitLab
            </h4>
            {getStatusBadge(
              config.gitConfig.gitlab?.configured || false,
              config.gitConfig.gitlab?.source || 'default'
            )}
          </div>
          {config.gitConfig.gitlab?.clientId && (
            <div>
              <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                Client ID
              </label>
              <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                {config.gitConfig.gitlab.clientId}
              </div>
            </div>
          )}
          {config.gitConfig.gitlab?.baseUrl && (
            <div>
              <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                Base URL
              </label>
              <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                {config.gitConfig.gitlab.baseUrl}
              </div>
            </div>
          )}
        </div>

        {!config.gitConfig.github && !config.gitConfig.gitlab && (
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            No Git OAuth configuration found.
          </p>
        )}
      </div>

      {/* AI Gateway Configuration Status */}
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          AI Gateway Configuration
        </h3>

        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
            Status
          </h4>
          {getStatusBadge(
            config.aiConfig.configured,
            config.aiConfig.source
          )}
        </div>

        {config.aiConfig.aiGatewayUrl && (
          <div>
            <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
              AI Gateway URL
            </label>
            <div className="text-sm text-foreground dark:text-foreground-dark font-mono break-all">
              {config.aiConfig.aiGatewayUrl}
            </div>
          </div>
        )}

        {config.aiConfig.llmEndpoint && (
          <div>
            <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
              Ollama Endpoint
            </label>
            <div className="text-sm text-foreground dark:text-foreground-dark font-mono break-all">
              {config.aiConfig.llmEndpoint}
            </div>
          </div>
        )}

        {!config.aiConfig.configured && (
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            No AI Gateway configuration found.
          </p>
        )}

        <div className="mt-4 p-3 bg-surface-secondary dark:bg-surface-dark-secondary rounded border border-border dark:border-border-dark">
          <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
            <strong>Note:</strong> API keys and sensitive credentials are not displayed for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
}

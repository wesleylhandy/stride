'use client';

import * as React from 'react';
import { useToast } from '@stride/ui';
import { GitHubOAuthConfigForm } from './GitHubOAuthConfigForm';
import { GitLabOAuthConfigForm } from './GitLabOAuthConfigForm';
import { AIInfrastructureConfigForm } from './AIInfrastructureConfigForm';
import type { GitHubOAuthConfig } from '@/lib/config/schemas/git-oauth-schema';
import type { GitLabOAuthConfig } from '@/lib/config/schemas/git-oauth-schema';
import type { AIGatewayConfig } from '@/lib/config/schemas/ai-gateway-schema';
import { getCsrfHeaders } from '@/lib/utils/csrf';

/**
 * Infrastructure Configuration Response Type
 * 
 * Matches the API response from GET /api/admin/settings/infrastructure
 * Note: Secrets (clientSecret, API keys) are never included in the response
 */
interface InfrastructureConfig {
  id: string | null;
  gitConfig: {
    github?: {
      clientId: string;
      configured: boolean;
      source: 'database' | 'environment' | 'default';
      configuredClientSecret?: boolean;
    };
    gitlab?: {
      clientId: string;
      baseUrl?: string;
      configured: boolean;
      source: 'database' | 'environment' | 'default';
      configuredClientSecret?: boolean;
    };
  };
  aiConfig: {
    aiGatewayUrl?: string;
    llmEndpoint?: string;
    configured: boolean;
    source: 'database' | 'environment' | 'default';
    configuredApiKeys?: {
      openaiApiKey?: boolean;
      anthropicApiKey?: boolean;
      googleAiApiKey?: boolean;
    };
  };
  updatedBy: string | null;
  updatedByUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * AdminInfrastructureSettings Component
 * 
 * Main settings page for global infrastructure configuration.
 * Displays Git OAuth and AI Gateway configuration with read-only state
 * when environment variables override UI settings.
 * 
 * Critical: Secrets (clientSecret, API keys) are NEVER displayed in UI,
 * even in read-only mode.
 */
export function AdminInfrastructureSettings() {
  const toast = useToast();
  const [config, setConfig] = React.useState<InfrastructureConfig | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [gitHubSubmitting, setGitHubSubmitting] = React.useState(false);
  const [gitLabSubmitting, setGitLabSubmitting] = React.useState(false);
  const [testConnectionLoading, setTestConnectionLoading] = React.useState<{
    github?: boolean;
    gitlab?: boolean;
    'ai-gateway'?: boolean;
    ollama?: boolean;
  }>({});

  // Fetch configuration on mount
  React.useEffect(() => {
    let cancelled = false;

    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/settings/infrastructure');

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          if (response.status === 403) {
            toast.error('Access denied', {
              description: 'Admin access required to view infrastructure settings.',
            });
            setError('Access denied');
            return;
          }
          if (response.status === 401) {
            toast.error('Authentication required', {
              description: 'Please log in to continue.',
            });
            setError('Authentication required');
            return;
          }
          throw new Error('Failed to fetch infrastructure configuration');
        }

        const data = await response.json();
        if (!cancelled) {
          setConfig(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch infrastructure configuration:', err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Failed to load infrastructure configuration';
          setError(errorMessage);
          toast.error('Failed to load configuration', {
            description: 'Please try refreshing the page.',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - fetch once per mount

  // Handle GitHub OAuth form submission
  const handleGitHubConfigSubmit = async (githubConfig: GitHubOAuthConfig) => {
    setGitHubSubmitting(true);
    try {
      // API merges with existing config, so we only send github config
      const response = await fetch('/api/admin/settings/infrastructure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          gitConfig: { github: githubConfig },
          aiConfig: {}, // Empty object, API will preserve existing aiConfig
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      // Refresh configuration after save
      const updatedData = await response.json();
      setConfig(updatedData);
    } catch (err) {
      throw err; // Re-throw to let form handle error display
    } finally {
      setGitHubSubmitting(false);
    }
  };

  // Handle GitHub OAuth config clear (all-or-nothing)
  const handleGitHubConfigClear = async () => {
    setGitHubSubmitting(true);
    try {
      // Send github: null to signal clearing to the API
      const response = await fetch('/api/admin/settings/infrastructure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          gitConfig: { github: null }, // null signals clearing to API
          aiConfig: {}, // Empty object, API will preserve existing aiConfig
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear configuration');
      }

      // Refresh configuration after clear
      const updatedData = await response.json();
      setConfig(updatedData);
    } catch (err) {
      throw err; // Re-throw to let form handle error display
    } finally {
      setGitHubSubmitting(false);
    }
  };

  // Handle GitLab OAuth form submission
  const handleGitLabConfigSubmit = async (gitlabConfig: GitLabOAuthConfig) => {
    setGitLabSubmitting(true);
    try {
      // API merges with existing config, so we only send gitlab config
      const response = await fetch('/api/admin/settings/infrastructure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          gitConfig: { gitlab: gitlabConfig },
          aiConfig: {}, // Empty object, API will preserve existing aiConfig
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      // Refresh configuration after save
      const updatedData = await response.json();
      setConfig(updatedData);
    } catch (err) {
      throw err; // Re-throw to let form handle error display
    } finally {
      setGitLabSubmitting(false);
    }
  };

  // Handle GitLab OAuth config clear (all-or-nothing)
  const handleGitLabConfigClear = async () => {
    setGitLabSubmitting(true);
    try {
      // Send gitlab: null to signal clearing to the API
      const response = await fetch('/api/admin/settings/infrastructure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          gitConfig: { gitlab: null }, // null signals clearing to API
          aiConfig: {}, // Empty object, API will preserve existing aiConfig
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear configuration');
      }

      // Refresh configuration after clear
      const updatedData = await response.json();
      setConfig(updatedData);
    } catch (err) {
      throw err; // Re-throw to let form handle error display
    } finally {
      setGitLabSubmitting(false);
    }
  };

  // Handle GitHub OAuth test connection
  const handleGitHubTestConnection = async () => {
    setTestConnectionLoading((prev) => ({ ...prev, github: true }));
    try {
      // Test endpoint doesn't exist yet (T629-T634)
      // For now, show a placeholder message
      throw new Error(
        `Test connection endpoint not yet implemented (tasks T629-T634)`,
      );
    } catch (err) {
      throw err; // Re-throw to let form handle error display
    } finally {
      setTestConnectionLoading((prev) => ({ ...prev, github: false }));
    }
  };

  // Handle GitLab OAuth test connection
  const handleGitLabTestConnection = async () => {
    setTestConnectionLoading((prev) => ({ ...prev, gitlab: true }));
    try {
      // Test endpoint doesn't exist yet (T629-T634)
      // For now, show a placeholder message
      throw new Error(
        `Test connection endpoint not yet implemented (tasks T629-T634)`,
      );
    } catch (err) {
      throw err; // Re-throw to let form handle error display
    } finally {
      setTestConnectionLoading((prev) => ({ ...prev, gitlab: false }));
    }
  };

  // Handle AI Gateway form submission
  const handleAIConfigSubmit = async (aiConfig: AIGatewayConfig) => {
    setIsSubmitting(true);
    try {
      // API expects full structure with both gitConfig and aiConfig
      // We'll send only aiConfig (gitConfig will default to {})
      const response = await fetch('/api/admin/settings/infrastructure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          gitConfig: {}, // Empty object, API will preserve existing gitConfig
          aiConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      // Refresh configuration after save
      const updatedData = await response.json();
      setConfig(updatedData);
    } catch (err) {
      throw err; // Re-throw to let form handle error display
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle AI Gateway test connection
  const handleAITestConnection = async (service: 'ai-gateway' | 'ollama') => {
    setTestConnectionLoading((prev) => ({ ...prev, [service]: true }));
    try {
      // Test endpoint doesn't exist yet (T632-T633)
      // For now, show a placeholder message
      throw new Error(
        `Test connection endpoint not yet implemented (tasks T632-T633)`,
      );
    } catch (err) {
      throw err; // Re-throw to let form handle error display
    } finally {
      setTestConnectionLoading((prev) => ({ ...prev, [service]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-4">
            Infrastructure Settings
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            Configure global Git OAuth and AI Gateway infrastructure settings.
          </p>
        </div>
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading configuration...
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
            Infrastructure Settings
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            Configure global Git OAuth and AI Gateway infrastructure settings.
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

  // Always show forms, even when no config exists (allows first-time creation)
  // The API always returns an object structure, even when id is null
  // Forms should handle undefined/null initial values gracefully
  // Forms handle read-only mode internally based on the source field

  // Ensure config is always an object (API always returns object structure)
  const safeConfig = config || {
    id: null,
    gitConfig: {},
    aiConfig: { configured: false, source: 'default' },
    updatedBy: null,
    updatedByUser: null,
    createdAt: null,
    updatedAt: null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-4">
          Infrastructure Settings
        </h2>
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
          Configure global Git OAuth and AI Gateway infrastructure settings.
          Environment variables override UI settings.
        </p>
      </div>

      {/* Git OAuth Configuration Section */}
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
          Git OAuth Configuration
        </h3>

        <div className="space-y-8">
          {/* GitHub OAuth Configuration Form */}
          <GitHubOAuthConfigForm
            initialConfig={
              safeConfig.gitConfig?.github
                ? {
                    clientId: safeConfig.gitConfig.github.clientId,
                    source: safeConfig.gitConfig.github.source,
                    configuredClientSecret: safeConfig.gitConfig.github.configuredClientSecret,
                  }
                : undefined
            }
            onSubmit={handleGitHubConfigSubmit}
            onClear={handleGitHubConfigClear}
            isSubmitting={gitHubSubmitting}
            onTestConnection={handleGitHubTestConnection}
            testConnectionLoading={testConnectionLoading.github || false}
          />

          {/* GitLab OAuth Configuration Form */}
          <GitLabOAuthConfigForm
            initialConfig={
              safeConfig.gitConfig?.gitlab
                ? {
                    clientId: safeConfig.gitConfig.gitlab.clientId,
                    baseUrl: safeConfig.gitConfig.gitlab.baseUrl,
                    source: safeConfig.gitConfig.gitlab.source,
                    configuredClientSecret: safeConfig.gitConfig.gitlab.configuredClientSecret,
                  }
                : undefined
            }
            onSubmit={handleGitLabConfigSubmit}
            onClear={handleGitLabConfigClear}
            isSubmitting={gitLabSubmitting}
            onTestConnection={handleGitLabTestConnection}
            testConnectionLoading={testConnectionLoading.gitlab || false}
          />
        </div>
      </div>

      {/* AI Gateway Configuration Section */}
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
          AI Gateway Configuration
        </h3>

        {/* AI Gateway Configuration Form */}
        <AIInfrastructureConfigForm
          initialConfig={{
            aiGatewayUrl: safeConfig.aiConfig?.aiGatewayUrl,
            llmEndpoint: safeConfig.aiConfig?.llmEndpoint,
            source: safeConfig.aiConfig?.source || 'default',
            configuredApiKeys: safeConfig.aiConfig?.configuredApiKeys,
          }}
          onSubmit={handleAIConfigSubmit}
          isSubmitting={isSubmitting}
          onTestConnection={handleAITestConnection}
          testConnectionLoading={testConnectionLoading}
        />
      </div>

    </div>
  );
}

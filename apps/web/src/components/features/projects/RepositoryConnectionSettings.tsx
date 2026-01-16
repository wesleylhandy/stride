'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RepositoryConnectionForm } from './RepositoryConnectionForm';
import { SyncStatusCard } from './SyncStatusCard';
import { Badge } from '@stride/ui';
import { FaGithub, FaGitlab } from 'react-icons/fa';

export interface RepositoryConnection {
  id: string;
  repositoryUrl: string;
  serviceType: 'GitHub' | 'GitLab' | 'Bitbucket';
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

export interface RepositoryConnectionSettingsProps {
  projectId: string;
}

/**
 * RepositoryConnectionSettings Component
 * 
 * Main component for managing repository connections in project settings.
 * Displays existing connection status and provides UI for connecting/updating repositories.
 */
export function RepositoryConnectionSettings({
  projectId,
}: RepositoryConnectionSettingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<RepositoryConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success message from OAuth callback
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      setSuccessMessage('Repository connected successfully!');
      // Clear the success param from URL
      router.replace(`/projects/${projectId}/settings/integrations`, { scroll: false });
      // Fetch updated connection
      fetchConnection();
    }
  }, [searchParams, projectId, router]);

  // Fetch existing connection
  const fetchConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/repositories`);

      if (response.status === 404) {
        // No connection exists - this is fine
        setConnection(null);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch connection');
      }

      const data = await response.json();
      setConnection(data);
    } catch (err) {
      // Only show error if it's not a 404
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err instanceof Error ? err.message : 'Failed to load connection');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, [projectId]);

  const handleOAuthClick = async (type: 'GitHub' | 'GitLab', repositoryUrl?: string) => {
    setIsOAuthLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Store returnTo URL and repository info for OAuth callback
      // Pass repository info in returnTo URL so callback can access it
      const returnTo = new URL(`/projects/${projectId}/settings/integrations`, window.location.origin);
      returnTo.searchParams.set('success', 'true');
      if (repositoryUrl) {
        returnTo.searchParams.set('repositoryUrl', repositoryUrl);
        returnTo.searchParams.set('repositoryType', type);
      }
      sessionStorage.setItem('oauth_return_to', returnTo.toString());

      // Build OAuth URL with returnTo parameter
      const oauthUrl = new URL(`/api/projects/${projectId}/repositories`, window.location.origin);
      oauthUrl.searchParams.set('action', 'oauth');
      oauthUrl.searchParams.set('type', type);
      if (repositoryUrl) {
        oauthUrl.searchParams.set('returnTo', returnTo.toString());
      }

      const response = await fetch(oauthUrl.toString());

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate OAuth');
      }

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth');
      setIsOAuthLoading(false);
    }
  };

  const handleManualConnection = async (data: {
    repositoryType: 'GitHub' | 'GitLab';
    repositoryUrl: string;
    accessToken: string;
  }) => {
    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/repositories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryUrl: data.repositoryUrl,
          repositoryType: data.repositoryType,
          accessToken: data.accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect repository');
      }

      setSuccessMessage('Repository connected successfully!');
      // Refetch connection status
      await fetchConnection();
    } catch (err) {
      throw err; // Let form component handle display
    } finally {
      setIsConnecting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'GitHub':
        return <FaGithub className="h-4 w-4" />;
      case 'GitLab':
        return <FaGitlab className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading connection status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Sync Status Card - Prominent, at top when connection exists */}
      {connection && (
        <SyncStatusCard
          projectId={projectId}
          repositoryConnection={connection}
          onSyncComplete={fetchConnection}
        />
      )}

      {/* Connection Information Card - Separate from sync */}
      {connection ? (
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
            Connection Information
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {getServiceIcon(connection.serviceType)}
              <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
                Service: <strong className="text-foreground dark:text-foreground-dark">{connection.serviceType}</strong>
              </span>
            </div>
            <div className="text-sm">
              <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
                Repository:{' '}
              </span>
              <a
                href={connection.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline font-mono break-all"
              >
                {connection.repositoryUrl}
              </a>
            </div>
            <div className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              Connected: {formatDate(connection.createdAt)}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border dark:border-border-dark">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              To update your connection, use the form below. This will replace the existing connection.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <div className="flex items-center gap-3">
            <Badge variant="default">Not Connected</Badge>
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              No repository connection configured for this project.
            </p>
          </div>
        </div>
      )}

      {/* Connection Form */}
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
          {connection ? 'Update Connection' : 'Connect Repository'}
        </h2>
        <RepositoryConnectionForm
          projectId={projectId}
          onSubmit={handleManualConnection}
          onOAuthClick={handleOAuthClick}
          loading={isConnecting}
          oauthLoading={isOAuthLoading}
          error={error}
          requireRepositoryUrlForOAuth={true}
        />
      </div>
    </div>
  );
}


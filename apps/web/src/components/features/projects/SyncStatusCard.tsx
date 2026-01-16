'use client';

import { useState, useEffect } from 'react';
import { ManualSyncButton } from './ManualSyncButton';
import { Badge } from '@stride/ui';
import { FaGithub, FaGitlab } from 'react-icons/fa';
import { formatRelativeTime } from '@/lib/utils/date';

export interface SyncStatusCardProps {
  projectId: string;
  repositoryConnection: {
    id: string;
    repositoryUrl: string;
    serviceType: 'GitHub' | 'GitLab' | 'Bitbucket';
    isActive: boolean;
    lastSyncAt: string | null;
  };
  onSyncComplete?: () => void;
}

/**
 * SyncStatusCard component
 * 
 * Prominent card displaying repository sync status and controls.
 * Provides a single, well-placed sync button with status information.
 * 
 * Location: Project Settings → Integrations (top of page)
 * Visibility: Only shown when repository connection exists
 */
export function SyncStatusCard({
  projectId,
  repositoryConnection,
  onSyncComplete,
}: SyncStatusCardProps) {
  const [lastSyncAt, setLastSyncAt] = useState(repositoryConnection.lastSyncAt);

  // Sync local state with prop when connection data updates
  useEffect(() => {
    setLastSyncAt(repositoryConnection.lastSyncAt);
  }, [repositoryConnection.lastSyncAt]);

  const handleSyncComplete = () => {
    // Update last sync time to now (optimistic update)
    setLastSyncAt(new Date().toISOString());
    // Call parent callback if provided (will refetch connection data)
    if (onSyncComplete) {
      onSyncComplete();
    }
  };
  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return formatRelativeTime(dateString);
    } catch {
      return 'Unknown';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'GitHub':
        return <FaGithub className="h-5 w-5" />;
      case 'GitLab':
        return <FaGitlab className="h-5 w-5" />;
      case 'Bitbucket':
        return <span className="text-lg">🔷</span>;
      default:
        return <span className="text-lg">📦</span>;
    }
  };

  return (
    <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getServiceIcon(repositoryConnection.serviceType)}
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Repository Sync
          </h2>
        </div>
        <Badge
          variant={repositoryConnection.isActive ? 'success' : 'warning'}
        >
          {repositoryConnection.isActive ? 'Webhook Active' : 'Webhook Inactive'}
        </Badge>
      </div>

      {/* Status Information */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
            Last synced:
          </span>
          <span className="font-medium text-foreground dark:text-foreground-dark">
            {formatLastSync(lastSyncAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
            Repository:
          </span>
          <a
            href={repositoryConnection.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-mono text-xs break-all"
          >
            {repositoryConnection.repositoryUrl}
          </a>
        </div>
        {!repositoryConnection.isActive && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-md mt-3">
            <p className="text-sm text-foreground dark:text-foreground-dark">
              ⚠️ Webhook is inactive. Use manual sync to update issues from the repository.
            </p>
          </div>
        )}
      </div>

      {/* Primary Sync Controls */}
      <div>
        <ManualSyncButton
          projectId={projectId}
          repositoryId={repositoryConnection.id}
          isActive={repositoryConnection.isActive}
          syncType="full"
          showSyncTypeSelector={true}
          onSyncComplete={handleSyncComplete}
        />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from '@stride/ui';
import { getCsrfHeaders } from '@/lib/utils/csrf';
import type {
  SyncOperationStatusResponse,
  SyncProgress,
  SyncResults,
} from '@/lib/sync/types';

export interface SyncProgressDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  repositoryId: string;
  operationId: string;
  onComplete?: () => void;
}

const POLL_INTERVAL = 2000; // Poll every 2 seconds

/**
 * SyncProgressDialog component
 * 
 * Displays progress of an async sync operation with real-time updates,
 * progress bar, stage information, and results summary.
 */
export function SyncProgressDialog({
  open,
  onClose,
  projectId,
  repositoryId,
  operationId,
  onComplete,
}: SyncProgressDialogProps) {
  const [status, setStatus] = useState<SyncOperationStatusResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for operation status
  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/repositories/${repositoryId}/sync/${operationId}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const data: SyncOperationStatusResponse = await response.json();
      setStatus(data);

      // If completed or failed, stop polling and call onComplete
      if (data.status === 'completed' || data.status === 'failed') {
        if (onComplete) {
          onComplete();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sync status');
    }
  }, [projectId, repositoryId, operationId, onComplete]);

  // Poll status while dialog is open and operation is pending/inProgress
  useEffect(() => {
    if (!open || !operationId) return;

    // Initial poll
    pollStatus();

    // Set up polling interval
    const interval = setInterval(() => {
      if (status?.status === 'pending' || status?.status === 'inProgress') {
        pollStatus();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [open, operationId, status?.status, pollStatus]);

  // Handle cancel
  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/repositories/${repositoryId}/sync/${operationId}`,
        {
          method: 'DELETE',
          headers: getCsrfHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to cancel sync operation');
      }

      // Poll once more to get updated status
      await pollStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel sync operation');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStageLabel = (stage?: string): string => {
    switch (stage) {
      case 'fetching':
        return 'Fetching issues from repository...';
      case 'matching':
        return 'Matching existing issues...';
      case 'creating':
        return 'Creating new issues...';
      case 'updating':
        return 'Updating existing issues...';
      default:
        return 'Processing...';
    }
  };

  const getProgressPercentage = (progress?: SyncProgress): number => {
    if (!progress || progress.total === 0) return 0;
    return Math.min(Math.round((progress.processed / progress.total) * 100), 100);
  };

  const renderProgress = () => {
    if (!status?.progress) return null;

    const percentage = getProgressPercentage(status.progress);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
            {getStageLabel(status.progress.stage)}
          </span>
          <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
            {status.progress.processed} / {status.progress.total || '?'}
          </span>
        </div>
        {/* T072: Accessibility - Progress bar with proper ARIA attributes */}
        <div className="w-full bg-background-secondary dark:bg-background-dark-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Sync progress: ${percentage}% complete`}
            aria-valuetext={`${status.progress.processed} of ${status.progress.total || '?'} issues processed`}
          />
        </div>
      </div>
    );
  };

  const renderResults = (results?: SyncResults) => {
    if (!results) return null;

    const parts: string[] = [];
    if (results.created > 0) parts.push(`${results.created} created`);
    if (results.updated > 0) parts.push(`${results.updated} updated`);
    if (results.skipped > 0) parts.push(`${results.skipped} skipped`);
    if (results.failed > 0) parts.push(`${results.failed} failed`);

    if (results.securityAdvisories) {
      const secParts: string[] = [];
      if (results.securityAdvisories.created > 0)
        secParts.push(`${results.securityAdvisories.created} security advisories created`);
      if (results.securityAdvisories.updated > 0)
        secParts.push(`${results.securityAdvisories.updated} security advisories updated`);
      if (secParts.length > 0) {
        parts.push(...secParts);
      }
    }

    if (parts.length === 0) {
      return <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">No issues to sync</p>;
    }

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-foreground dark:text-foreground-dark">Sync Results</h4>
        <ul className="list-disc list-inside text-sm text-foreground-secondary dark:text-foreground-dark-secondary space-y-1">
          {parts.map((part, idx) => (
            <li key={idx}>{part}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderError = (errorMessage: string) => {
    // Actionable suggestions based on error type
    let suggestions: string[] = [];
    
    if (errorMessage.includes('rate limit')) {
      suggestions = [
        'Wait a few minutes before trying again',
        'Reduce the number of issues being synced',
        'Use the "Issues Only" or "Security Only" sync type to reduce load',
      ];
    } else if (errorMessage.includes('permission') || errorMessage.includes('auth')) {
      suggestions = [
        'Verify your repository connection credentials',
        'Ensure your access token has the required permissions',
        'Reconnect the repository if needed',
      ];
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      suggestions = [
        'Check your internet connection',
        'Try again in a moment',
        'Verify the repository is accessible',
      ];
    } else {
      suggestions = [
        'Try syncing again',
        'Check the repository connection settings',
        'Contact support if the issue persists',
      ];
    }

    return (
      <div className="space-y-3">
        <div className="p-3 bg-error/10 border border-error/20 rounded-md">
          <p className="text-sm font-medium text-error mb-1">Error</p>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">{errorMessage}</p>
        </div>
        {suggestions.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">Suggestions:</p>
            <ul className="list-disc list-inside text-sm text-foreground-secondary dark:text-foreground-dark-secondary space-y-1">
              {suggestions.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const canCancel = status?.status === 'pending' || status?.status === 'inProgress';
  const isComplete = status?.status === 'completed' || status?.status === 'failed';

  // T073: Keyboard navigation - Handle ESC key and focus trap (handled by Modal component)
  // T072: Accessibility - Modal with proper ARIA attributes
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sync Progress"
      size="lg"
      aria-labelledby="sync-progress-dialog-title"
      aria-describedby="sync-progress-dialog-description"
      aria-live="polite"
      aria-busy={status?.status === 'pending' || status?.status === 'inProgress'}
    >
      <div className="space-y-6">
        {/* T072: Accessibility - Error message with proper ARIA */}
        {error && (
          <div 
            className="p-3 bg-error/10 border border-error/20 rounded-md"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-error" id="sync-progress-error">
              {error}
            </p>
          </div>
        )}
        {/* T072: Accessibility - Dialog description */}
        <div id="sync-progress-dialog-description" className="sr-only">
          {status?.status === 'pending' || status?.status === 'inProgress'
            ? 'Sync operation in progress. Progress updates are announced automatically.'
            : status?.status === 'completed'
              ? 'Sync operation completed successfully.'
              : status?.status === 'failed'
                ? 'Sync operation failed. Error details are displayed below.'
                : 'Sync operation status dialog'}
        </div>

        {/* Progress Display */}
        {/* T072: Accessibility - Progress with proper ARIA attributes */}
        {/* T075: Loading skeleton for initial state */}
        {!status ? (
          <div className="space-y-4 animate-pulse" role="status" aria-live="polite">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-background-secondary dark:bg-background-dark-secondary rounded w-48" />
                <div className="h-4 bg-background-secondary dark:bg-background-dark-secondary rounded w-20" />
              </div>
              <div className="w-full bg-background-secondary dark:bg-background-dark-secondary rounded-full h-2" />
            </div>
            <div className="h-4 bg-background-secondary dark:bg-background-dark-secondary rounded w-full" />
          </div>
        ) : status?.status === 'pending' || status?.status === 'inProgress' ? (
          <div className="space-y-4" role="status" aria-live="polite">
            {renderProgress()}
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Sync operation is in progress. This may take a few minutes for large repositories.
            </p>
          </div>
        ) : status?.status === 'completed' ? (
          <div className="space-y-4" role="status" aria-live="polite">
            <div className="p-3 bg-success/10 border border-success/20 rounded-md">
              <p className="text-sm font-medium text-success mb-2">Sync completed successfully</p>
              {renderResults(status.results)}
            </div>
          </div>
        ) : status?.status === 'failed' ? (
          <div className="space-y-4" role="alert" aria-live="assertive">
            {status.error && renderError(status.error)}
            {status.results && renderResults(status.results)}
          </div>
        ) : null}

        {/* Action Buttons */}
        {/* T073: Keyboard navigation - Buttons are focusable by default, ESC handled by Modal */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
          {canCancel && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isCancelling}
              aria-label="Cancel sync operation"
              aria-busy={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
          {isComplete && (
            <Button 
              variant="primary" 
              onClick={onClose}
              aria-label="Close sync progress dialog"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

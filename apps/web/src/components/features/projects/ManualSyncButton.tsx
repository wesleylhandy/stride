'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, useToast, Modal } from '@stride/ui';
import { getCsrfHeaders } from '@/lib/utils/csrf';
import type { SyncType } from '@/lib/sync/types';
import { SyncProgressDialog } from './SyncProgressDialog';

export interface ManualSyncButtonProps {
  projectId: string;
  repositoryId: string;
  isActive?: boolean;
  syncType?: SyncType;
  className?: string;
  showSyncTypeSelector?: boolean;
  onSyncComplete?: () => void;
}

/**
 * ManualSyncButton component
 * 
 * Button for triggering manual issue sync from Git repository.
 * Shows loading state during sync and displays success/error feedback.
 * Includes option to select sync type (full/issuesOnly/securityOnly).
 */
export function ManualSyncButton({
  projectId,
  repositoryId,
  isActive = false,
  syncType: initialSyncType = 'full',
  className,
  showSyncTypeSelector = true,
  onSyncComplete,
}: ManualSyncButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [syncType, setSyncType] = useState<SyncType>(initialSyncType);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [operationId, setOperationId] = useState<string | null>(null);

  const handleSync = async (confirmed = false) => {
    // T064: Show confirmation dialog if includeClosed is true and not yet confirmed
    if (includeClosed && !confirmed) {
      setShowConfirmationDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/repositories/${repositoryId}/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders(),
          },
          body: JSON.stringify({
            syncType,
            includeClosed,
            confirmation: confirmed ? true : undefined, // Send confirmation flag when user has confirmed
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        
        // Handle confirmation requirement (for active webhooks or includeClosed)
        if (response.status === 400 && error.requiresConfirmation) {
          // Show confirmation dialog for any case that requires confirmation
          setShowConfirmationDialog(true);
          return;
        }

        // Log the full error for debugging
        console.error('Sync error:', {
          status: response.status,
          error,
          confirmed,
          includeClosed,
          syncType,
        });

        throw new Error(error.error || 'Failed to sync issues');
      }

      // Handle async operation (202 Accepted)
      if (response.status === 202) {
        const asyncResponse = await response.json();
        setOperationId(asyncResponse.operationId);
        setProgressDialogOpen(true);
        setIsLoading(false);
        return;
      }

      // Handle synchronous completion
      const result = await response.json();

      // Show success message with results
      const { created, updated, skipped, failed, securityAdvisories } = result.results;
      
      const summaryParts: string[] = [];
      
      // Regular issues summary
      if (created > 0 || updated > 0 || skipped > 0 || failed > 0) {
        const issueParts = [
          created > 0 && `${created} issue${created !== 1 ? 's' : ''} created`,
          updated > 0 && `${updated} issue${updated !== 1 ? 's' : ''} updated`,
          skipped > 0 && `${skipped} skipped`,
          failed > 0 && `${failed} failed`,
        ].filter(Boolean);
        if (issueParts.length > 0) {
          summaryParts.push(issueParts.join(', '));
        }
      }
      
      // Security advisories summary (if available)
      if (securityAdvisories) {
        const { created: secCreated, updated: secUpdated, skipped: secSkipped, failed: secFailed } = securityAdvisories;
        if (secCreated > 0 || secUpdated > 0 || secSkipped > 0 || secFailed > 0) {
          const secParts = [
            secCreated > 0 && `${secCreated} security advisory${secCreated !== 1 ? 'ies' : ''} created`,
            secUpdated > 0 && `${secUpdated} security advisory${secUpdated !== 1 ? 'ies' : ''} updated`,
            secSkipped > 0 && `${secSkipped} security advisories skipped`,
            secFailed > 0 && `${secFailed} security advisories failed`,
          ].filter(Boolean);
          if (secParts.length > 0) {
            summaryParts.push(secParts.join(', '));
          }
        }
      }

      const successMessage = summaryParts.length > 0 
        ? `Sync completed: ${summaryParts.join('. ')}`
        : 'Sync completed: No issues to sync';
      toast.success(successMessage);

      // Call sync complete callback if provided
      if (onSyncComplete) {
        onSyncComplete();
      }

      // Refresh the page to show updated issues
      router.refresh();
    } catch (error) {
      console.error('Sync error:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to sync issues. Please try again.';

      toast.error('Sync failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (isLoading) return 'Syncing...';
    switch (syncType) {
      case 'securityOnly':
        return 'Sync Security Advisories';
      case 'issuesOnly':
        return 'Sync Issues Only';
      case 'full':
      default:
        return 'Sync Issues';
    }
  };

  const handleProgressDialogClose = () => {
    setProgressDialogOpen(false);
    setOperationId(null);
    // Refresh to show updated issues
    router.refresh();
  };

  const handleProgressDialogComplete = () => {
    // Call sync complete callback if provided
    if (onSyncComplete) {
      onSyncComplete();
    }
    // Refresh to show updated issues when sync completes
    router.refresh();
  };

  const handleConfirmSync = () => {
    setShowConfirmationDialog(false);
    handleSync(true); // Call with confirmed flag
  };

  // T075: Loading skeleton for sync button states
  if (isLoading && !progressDialogOpen) {
    return (
      <div className={`flex flex-col gap-3 ${className || ''}`}>
        <div className="flex items-center gap-2 animate-pulse">
          {showSyncTypeSelector && (
            <div className="h-10 w-32 bg-background-secondary dark:bg-background-dark-secondary rounded-md" />
          )}
          <div className="h-10 w-28 bg-background-secondary dark:bg-background-dark-secondary rounded-md" />
        </div>
        <div className="h-5 w-48 bg-background-secondary dark:bg-background-dark-secondary rounded animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-col gap-3 ${className || ''}`}>
        <div className="flex items-center gap-2">
          {showSyncTypeSelector && (
            <select
              value={syncType}
              onChange={(e) => setSyncType(e.target.value as SyncType)}
              disabled={isLoading}
              className="px-3 py-2 text-sm rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sync type"
              aria-describedby={showSyncTypeSelector ? "sync-type-description" : undefined}
            >
              <option value="full">Full Sync</option>
              <option value="issuesOnly">Issues Only</option>
              <option value="securityOnly">Security Advisories Only</option>
            </select>
          )}
          {/* T072: Accessibility - Add description for screen readers */}
          {showSyncTypeSelector && (
            <span id="sync-type-description" className="sr-only">
              Select sync type: Full sync includes both issues and security advisories, Issues Only syncs regular issues, Security Only syncs security advisories
            </span>
          )}
          <Button
            onClick={() => handleSync(false)}
            disabled={isLoading}
            variant="primary"
            className="bg-electric text-white hover:bg-electric-hover active:bg-electric-active shadow-sm hover:shadow-md"
            aria-label={getButtonLabel()}
            aria-busy={isLoading}
            aria-describedby="sync-button-description"
          >
            {getButtonLabel()}
          </Button>
          {/* T072: Accessibility - Add description for screen readers */}
          <span id="sync-button-description" className="sr-only">
            {isLoading 
              ? 'Sync operation in progress, please wait'
              : `Trigger ${syncType === 'full' ? 'full' : syncType === 'issuesOnly' ? 'issues only' : 'security advisories only'} sync for repository`}
          </span>
        </div>

        {/* T063: Include closed issues checkbox */}
        {/* T072: Accessibility - Proper label association and descriptions */}
        <label className="flex items-center gap-2 text-sm cursor-pointer" htmlFor="include-closed-checkbox">
          <input
            id="include-closed-checkbox"
            type="checkbox"
            checked={includeClosed}
            onChange={(e) => setIncludeClosed(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-border dark:border-border-dark bg-background dark:bg-background-dark text-accent dark:text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0 dark:focus:ring-offset-surface-dark checked:bg-accent checked:border-accent dark:checked:bg-accent dark:checked:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Include closed/archived issues"
            aria-describedby="include-closed-description"
          />
          <span 
            id="include-closed-description"
            className="text-foreground-secondary dark:text-foreground-dark-secondary"
          >
            Include closed/archived issues
          </span>
        </label>
        <span className="sr-only" id="include-closed-help">
          When checked, syncing will include closed and archived issues from the repository. This may create or update many issues and requires confirmation.
        </span>
      </div>

      {/* T064: Confirmation dialog for includeClosed or active webhooks */}
      <Modal
        open={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        title={includeClosed ? "Confirm Sync Closed Issues" : "Confirm Manual Sync"}
        size="md"
      >
        <div className="space-y-4">
          {includeClosed && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
              <p className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                Warning: Syncing Closed/Archived Issues
              </p>
              <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                You are about to sync closed and archived issues from the repository. This may create or update many issues in your project. 
                This action cannot be undone.
              </p>
            </div>
          )}
          {!includeClosed && isActive && (
            <div className="p-3 bg-info/10 border border-info/20 rounded-md">
              <p className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                Repository Webhook is Active
              </p>
              <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                This repository has an active webhook connection. Manual sync will proceed after confirmation. 
                This may create or update issues in your project.
              </p>
            </div>
          )}
          <div className="space-y-2">
            {/* T072: Accessibility - Description for screen readers */}
            <p 
              id="confirmation-dialog-description"
              className="text-sm text-foreground dark:text-foreground-dark"
            >
              {includeClosed 
                ? "Please confirm that you want to proceed with syncing closed/archived issues."
                : "Please confirm that you want to proceed with the manual sync."}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
            {/* T073: Keyboard navigation - Buttons are focusable by default, ESC handled by Modal */}
            <Button
              variant="ghost"
              onClick={() => setShowConfirmationDialog(false)}
              disabled={isLoading}
              aria-label="Cancel sync operation"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSync}
              disabled={isLoading}
              aria-label="Confirm and start sync operation"
              aria-busy={isLoading}
            >
              {isLoading ? 'Syncing...' : 'Confirm and Sync'}
            </Button>
          </div>
        </div>
      </Modal>

      {progressDialogOpen && operationId && (
        <SyncProgressDialog
          open={progressDialogOpen}
          onClose={handleProgressDialogClose}
          projectId={projectId}
          repositoryId={repositoryId}
          operationId={operationId}
          onComplete={handleProgressDialogComplete}
        />
      )}
    </>
  );
}

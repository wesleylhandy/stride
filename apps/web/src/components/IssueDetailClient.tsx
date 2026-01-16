'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { IssueDetail, useToast, type IssueBranch } from '@stride/ui';
import type { Issue, ProjectConfig, UpdateIssueInput } from '@stride/types';
import { CreateIssueModal } from './CreateIssueModal';
import { ManualLinkModal } from './features/projects/ManualLinkModal';
import type { CreateIssueInput } from '@stride/types';

export interface IssueDetailClientProps {
  issue: Issue;
  projectId: string;
  projectConfig?: ProjectConfig;
  branches?: IssueBranch[];
  canEdit?: boolean;
  canUseAITriage?: boolean;
  onUpdate?: (data: UpdateIssueInput) => Promise<void>;
  onStatusChange?: (newStatus: string) => Promise<void>;
}

/**
 * Client wrapper for IssueDetail that handles clone functionality and API calls
 */
export function IssueDetailClient({
  issue: initialIssue,
  projectId,
  projectConfig,
  branches = [],
  canEdit = false,
  canUseAITriage = false,
  onUpdate: providedOnUpdate,
  onStatusChange: providedOnStatusChange,
}: IssueDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [issue, setIssue] = React.useState<Issue>(initialIssue);
  const [isCloneModalOpen, setIsCloneModalOpen] = React.useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false);
  const [cloneInitialValues, setCloneInitialValues] = React.useState<Partial<CreateIssueInput> | undefined>();

  // Update issue when initialIssue changes (e.g., after refresh)
  React.useEffect(() => {
    setIssue(initialIssue);
  }, [initialIssue]);

  // Handle issue update - call API endpoint
  const handleUpdate = React.useCallback(async (data: UpdateIssueInput) => {
    // If custom handler provided, use it
    if (providedOnUpdate) {
      await providedOnUpdate(data);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/issues/${issue.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update issue');
      }

      const updatedIssue = await response.json();

      // Update local state
      setIssue(updatedIssue);

      // Show success toast
      toast.success('Issue updated successfully');

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Failed to update issue:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update issue. Please try again.';

      toast.error('Failed to update issue', {
        description: errorMessage,
      });

      // Re-throw so IssueDetail can handle it (show error state, etc.)
      throw error;
    }
  }, [projectId, issue.key, providedOnUpdate, router, toast]);

  // Handle status change - call status update API endpoint
  const handleStatusChange = React.useCallback(async (newStatus: string) => {
    // If custom handler provided, use it
    if (providedOnStatusChange) {
      await providedOnStatusChange(newStatus);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/issues/${issue.key}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to update issue status');
      }

      const updatedIssue = await response.json();

      // Update local state
      setIssue(updatedIssue);

      // Show success toast
      toast.success('Issue status updated successfully');

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Failed to update issue status:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update issue status. Please try again.';

      toast.error('Failed to update issue status', {
        description: errorMessage,
      });

      // Re-throw so IssueDetail can handle it
      throw error;
    }
  }, [projectId, issue.key, providedOnStatusChange, router, toast]);

  // T416: Create clone handler function
  const handleClone = React.useCallback(() => {
    // T427: Implement clone assignment preservation logic based on user_assignment.clone_preserve_assignee config
    const shouldPreserveAssignee = projectConfig?.user_assignment?.clone_preserve_assignee ?? true;
    
    // T417: Map issue data to CreateIssueInput excluding metadata
    const initialValues: Partial<CreateIssueInput> = {
      title: issue.title,
      description: issue.description,
      type: issue.type,
      priority: issue.priority,
      status: issue.status,
      // Include assigneeId only if config says to preserve it
      assigneeId: shouldPreserveAssignee ? issue.assigneeId : undefined,
      cycleId: issue.cycleId,
      storyPoints: issue.storyPoints,
      customFields: issue.customFields,
      // Exclude: id, key, createdAt, updatedAt, closedAt, reporterId (current user becomes reporter)
    };

    setCloneInitialValues(initialValues);
    // T418: Open CreateIssueModal with prefilled initialValues
    setIsCloneModalOpen(true);
  }, [issue, projectConfig]);

  const handleCloneModalClose = React.useCallback(() => {
    setIsCloneModalOpen(false);
    setCloneInitialValues(undefined);
  }, []);

  // T057: Create manual link handler
  const handleLink = React.useCallback(() => {
    setIsLinkModalOpen(true);
  }, []);

  const handleLinkModalClose = React.useCallback(() => {
    setIsLinkModalOpen(false);
  }, []);

  const handleLinkSuccess = React.useCallback(() => {
    // Refresh to show updated issue with external link
    router.refresh();
  }, [router]);

  return (
    <>
      <IssueDetail
        issue={issue}
        projectConfig={projectConfig}
        branches={branches}
        canEdit={canEdit}
        canUseAITriage={canUseAITriage}
        onUpdate={handleUpdate}
        onStatusChange={handleStatusChange}
        onClone={handleClone}
        onLink={handleLink}
      />
      {/* T418: Open CreateIssueModal with prefilled initialValues */}
      <CreateIssueModal
        open={isCloneModalOpen}
        onClose={handleCloneModalClose}
        projectId={projectId}
        projectConfig={projectConfig}
        initialValues={cloneInitialValues}
      />
      {/* T059: Manual link modal */}
      <ManualLinkModal
        open={isLinkModalOpen}
        onClose={handleLinkModalClose}
        projectId={projectId}
        issueKey={issue.key}
        onSuccess={handleLinkSuccess}
      />
    </>
  );
}


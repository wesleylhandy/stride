'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard, Button } from '@stride/ui';
import type { Issue } from '@stride/types';
import type { ProjectConfig } from '@stride/yaml-config';
import { addRecentItem } from '@/lib/commands/recent';
import { CreateIssueModal } from './CreateIssueModal';

export interface KanbanBoardClientProps {
  /**
   * Project ID
   */
  projectId: string;
  /**
   * Initial issues to display
   */
  initialIssues: Issue[];
  /**
   * Project configuration
   */
  projectConfig?: ProjectConfig;
  /**
   * Whether user can edit (move issues)
   */
  canEdit?: boolean;
}

/**
 * KanbanBoardClient component
 * 
 * Client-side wrapper for KanbanBoard that handles:
 * - API calls for status updates (T155)
 * - Issue navigation
 * - Recent items tracking
 */
export function KanbanBoardClient({
  projectId,
  initialIssues,
  projectConfig,
  canEdit = false,
}: KanbanBoardClientProps) {
  const router = useRouter();
  const [issues, setIssues] = React.useState<Issue[]>(initialIssues);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  // Update issues when initialIssues change
  React.useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  // Handle issue move (T155 - drag-and-drop functionality)
  const handleIssueMove = async (issueId: string, newStatus: string) => {
    if (!canEdit) {
      return;
    }

    const issue = issues.find((i) => i.id === issueId);
    if (!issue) {
      return;
    }

    // Optimistically update UI
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId ? { ...i, status: newStatus } : i
      )
    );
    setIsUpdating(issueId);

    try {
      // Call status update API
      const response = await fetch(
        `/api/projects/${projectId}/issues/${issue.key}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Parse validation errors for user-friendly messages
        let errorMessage = errorData.error || 'Failed to update issue status';
        
        if (errorData.details && Array.isArray(errorData.details)) {
          // Format validation errors nicely
          const errorMessages = errorData.details.map((err: any) => {
            if (err.message) {
              return err.message;
            }
            if (err.field) {
              return `Validation error in ${err.field}`;
            }
            return 'Validation error';
          });
          
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n\n');
          }
        }
        
        throw new Error(errorMessage);
      }

      const updatedIssue = await response.json();

      // Update local state with server response
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? updatedIssue : i))
      );
    } catch (error) {
      // Revert optimistic update on error
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId ? { ...i, status: issue.status } : i
        )
      );

      console.error('Failed to update issue status:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update issue status. Please check that all required fields are filled and the status transition is allowed.';
      
      // Use a more graceful error display (could be replaced with a toast component)
      const userMessage = errorMessage
        .split('\n\n')
        .map((msg, idx) => `• ${msg}`)
        .join('\n');
      
      alert(`Cannot move issue to this status:\n\n${userMessage}\n\nThe issue has been returned to its previous status.`);
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle issue click - navigate to issue detail
  const handleIssueClick = (issue: Issue) => {
    // Add to recent items
    addRecentItem({
      id: issue.id,
      label: `${issue.key}: ${issue.title}`,
      path: `/projects/${projectId}/issues/${issue.key}`,
      type: 'issue',
    });

    // Navigate to issue detail
    router.push(`/projects/${projectId}/issues/${issue.key}`);
  };

  if (!projectConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          Project configuration not found
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
          Drag and drop issues to change their status
        </p>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create New Issue
        </Button>
      </div>
      <div className="h-[calc(100vh-12rem)]">
        <KanbanBoard
          issues={issues}
          projectConfig={projectConfig}
          onIssueMove={canEdit ? handleIssueMove : undefined}
          onIssueClick={handleIssueClick}
        />
        {isUpdating && (
          <div className="fixed bottom-4 left-4 bg-background-secondary dark:bg-background-dark-secondary border border-border dark:border-border-dark rounded-lg p-3 shadow-lg">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Updating issue status...
            </p>
          </div>
        )}
      </div>
      <CreateIssueModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
        projectConfig={projectConfig}
      />
    </>
  );
}


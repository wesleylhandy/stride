'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard, Button, useToast } from '@stride/ui';
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
  const toast = useToast();
  const [issues, setIssues] = React.useState<Issue[]>(initialIssues);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  // Fetch users once for assignee display on cards
  const [users, setUsers] = React.useState<Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>>([]);

  // Fetch users on mount for assignee avatars
  React.useEffect(() => {
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (data?.users) {
          setUsers(data.users);
        }
      })
      .catch(() => {
        // Silent fail - cards will fall back to ID-based display
      });
  }, []);

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
        let errorMessage = errorData.error || errorData.message || 'Failed to update issue status';
        let helpUrl: string | undefined = errorData.helpUrl;
        
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
            errorMessage = errorMessages.join('. ');
          }
        }
        
        // Create error with helpUrl
        const error = new Error(errorMessage);
        (error as any).helpUrl = helpUrl;
        throw error;
      }

      const updatedIssue = await response.json();

      // Update local state with server response
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? updatedIssue : i))
      );

      // Show success toast
      toast.success('Issue status updated successfully');
    } catch (error) {
      // Revert optimistic update on error
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId ? { ...i, status: issue.status } : i
        )
      );

      console.error('Failed to update issue status:', error);
      
      // Parse error response for detailed messages
      let errorMessage = 'Failed to update issue status. Please check that all required fields are filled and the status transition is allowed.';
      let helpUrl: string | undefined;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        helpUrl = (error as any).helpUrl;
      }

      // Format error message for toast
      const formattedMessage = errorMessage
        .split('\n\n')
        .map((msg) => msg.trim())
        .filter((msg) => msg.length > 0)
        .join('. ');

      // Show error toast with action button
      toast.error(
        `Cannot move issue to this status`,
        {
          description: formattedMessage + '. The issue has been returned to its previous status.',
          action: helpUrl
            ? {
                label: 'View Help',
                onClick: () => {
                  window.open(helpUrl, '_blank');
                },
              }
            : {
                label: 'View Docs',
                onClick: () => {
                  window.open('/docs/configuration', '_blank');
                },
              },
        }
      );
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
          users={users}
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


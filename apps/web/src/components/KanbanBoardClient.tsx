'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard } from '@stride/ui';
import type { Issue } from '@stride/types';
import type { ProjectConfig } from '@stride/yaml-config';
import { addRecentItem } from '@/lib/commands/recent';

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
        const error = await response.json();
        throw new Error(error.error || 'Failed to update issue status');
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
      // Show error to user (could use a toast here)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to update issue status',
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
  );
}


'use client';

import * as React from 'react';
import { SprintPlanning, type CycleMetrics, useToast } from '@stride/ui';
import type { Issue, Cycle } from '@stride/types';
import type { ProjectConfig } from '@stride/yaml-config';
import { useRouter } from 'next/navigation';
import { getCsrfHeaders } from '@/lib/utils/csrf';

export interface SprintPlanningClientProps {
  projectId: string;
  cycle: Cycle;
  initialSprintIssues: Issue[];
  initialBacklogIssues: Issue[];
  initialMetrics?: CycleMetrics;
  canEdit?: boolean;
  projectConfig?: ProjectConfig;
}

/**
 * SprintPlanningClient component
 * 
 * Client-side wrapper for SprintPlanning that handles:
 * - API calls for issue assignment/removal
 * - Goal updates
 * - Optimistic updates
 */
export function SprintPlanningClient({
  projectId,
  cycle,
  initialSprintIssues,
  initialBacklogIssues,
  initialMetrics,
  canEdit = false,
  projectConfig,
}: SprintPlanningClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [sprintIssues, setSprintIssues] = React.useState<Issue[]>(initialSprintIssues);
  const [backlogIssues, setBacklogIssues] = React.useState<Issue[]>(initialBacklogIssues);
  const [metrics, setMetrics] = React.useState<CycleMetrics | undefined>(initialMetrics);
  const [isAssigning, setIsAssigning] = React.useState(false);
  
  // Track pending optimistic updates to prevent race conditions with router.refresh()
  const hasPendingUpdatesRef = React.useRef(false);

  // Fetch metrics on mount and when issues change
  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/cycles/${cycle.id}/metrics`
        );
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
  }, [projectId, cycle.id, sprintIssues.length]);

  // Update when initial data changes, but only if we don't have pending optimistic updates
  // This prevents router.refresh() from overwriting optimistic state with stale data
  React.useEffect(() => {
    if (!hasPendingUpdatesRef.current) {
      setSprintIssues(initialSprintIssues);
      setBacklogIssues(initialBacklogIssues);
    }
  }, [initialSprintIssues, initialBacklogIssues]);

  const handleAssignIssues = async (issueIds: string[]) => {
    if (!canEdit) {
      return;
    }

    // Optimistic update: immediately update UI as if operation succeeded
    const assignedIssues = backlogIssues.filter((i) => issueIds.includes(i.id));
    const previousSprintIssues = [...sprintIssues];
    const previousBacklogIssues = [...backlogIssues];
    
    setSprintIssues((prev) => [...prev, ...assignedIssues]);
    setBacklogIssues((prev) => prev.filter((i) => !issueIds.includes(i.id)));
    setIsAssigning(true);
    hasPendingUpdatesRef.current = true;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/cycles/${cycle.id}/issues`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders(),
          },
          body: JSON.stringify({ issueIds }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign issues');
      }

      // Show success toast
      toast.success(`Assigned ${issueIds.length} issue${issueIds.length !== 1 ? 's' : ''} to sprint`);

      // Trigger burndown chart refetch via custom event
      window.dispatchEvent(new CustomEvent('sprint-issues-updated'));

      // Wait a bit for database to commit, then refresh
      // This prevents race condition where refresh fetches stale data
      setTimeout(() => {
        hasPendingUpdatesRef.current = false;
        router.refresh();
      }, 300);
    } catch (error) {
      console.error('Failed to assign issues:', error);
      
      // Revert optimistic update on error
      setSprintIssues(previousSprintIssues);
      setBacklogIssues(previousBacklogIssues);
      hasPendingUpdatesRef.current = false;
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to assign issues to sprint';

      toast.error('Failed to assign issues', {
        description: errorMessage,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveIssues = async (issueIds: string[]) => {
    if (!canEdit) {
      return;
    }

    // Optimistic update: immediately update UI as if operation succeeded
    const removedIssues = sprintIssues.filter((i) => issueIds.includes(i.id));
    const previousSprintIssues = [...sprintIssues];
    const previousBacklogIssues = [...backlogIssues];
    
    setSprintIssues((prev) => prev.filter((i) => !issueIds.includes(i.id)));
    setBacklogIssues((prev) => [...prev, ...removedIssues]);
    setIsAssigning(true);
    hasPendingUpdatesRef.current = true;

    try {
      // Remove issues by setting their cycleId to null
      // Use Promise.all to make all API calls in parallel (faster, less chance of race condition)
      const updatePromises = issueIds.map(async (issueId) => {
        const issue = previousSprintIssues.find((i) => i.id === issueId);
        if (!issue) return;

        const response = await fetch(
          `/api/projects/${projectId}/issues/${issue.key}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getCsrfHeaders(),
            },
            body: JSON.stringify({ cycleId: null }),
          }
        );

        if (!response.ok) {
          // Check if response has content before parsing JSON
          const contentType = response.headers.get('content-type');
          let errorMessage = 'Failed to remove issue';
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const error = await response.json();
              errorMessage = error.error || error.message || errorMessage;
            } catch (parseError) {
              // If JSON parsing fails, use status text
              errorMessage = response.statusText || errorMessage;
            }
          } else {
            errorMessage = response.statusText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Show success toast
      toast.success(`Removed ${issueIds.length} issue${issueIds.length !== 1 ? 's' : ''} from sprint`);

      // Trigger burndown chart refetch via custom event
      window.dispatchEvent(new CustomEvent('sprint-issues-updated'));

      // Wait a bit for database to commit, then refresh
      // This prevents race condition where refresh fetches stale data
      setTimeout(() => {
        hasPendingUpdatesRef.current = false;
        router.refresh();
      }, 300);
    } catch (error) {
      console.error('Failed to remove issues:', error);
      
      // Revert optimistic update on error
      setSprintIssues(previousSprintIssues);
      setBacklogIssues(previousBacklogIssues);
      hasPendingUpdatesRef.current = false;
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to remove issues from sprint';

      toast.error('Failed to remove issues', {
        description: errorMessage,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateGoal = async (goal: string) => {
    if (!canEdit) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/cycles/${cycle.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders(),
          },
          body: JSON.stringify({ goal }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update goal');
      }

      // Show success toast
      toast.success('Sprint goal updated successfully');

      // Refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error('Failed to update goal:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update sprint goal';

      toast.error('Failed to update sprint goal', {
        description: errorMessage,
      });
      throw error;
    }
  };

  return (
    <SprintPlanning
      cycle={cycle}
      sprintIssues={sprintIssues}
      backlogIssues={backlogIssues}
      metrics={metrics}
      onAssignIssues={handleAssignIssues}
      onRemoveIssues={handleRemoveIssues}
      onUpdateGoal={handleUpdateGoal}
      canEdit={canEdit}
      projectConfig={projectConfig}
    />
  );
}


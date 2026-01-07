'use client';

import * as React from 'react';
import { SprintPlanning, type CycleMetrics, useToast } from '@stride/ui';
import type { Issue, Cycle } from '@stride/types';
import { useRouter } from 'next/navigation';

export interface SprintPlanningClientProps {
  projectId: string;
  cycle: Cycle;
  initialSprintIssues: Issue[];
  initialBacklogIssues: Issue[];
  initialMetrics?: CycleMetrics;
  canEdit?: boolean;
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
}: SprintPlanningClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [sprintIssues, setSprintIssues] = React.useState<Issue[]>(initialSprintIssues);
  const [backlogIssues, setBacklogIssues] = React.useState<Issue[]>(initialBacklogIssues);
  const [metrics, setMetrics] = React.useState<CycleMetrics | undefined>(initialMetrics);
  const [isAssigning, setIsAssigning] = React.useState(false);

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

  // Update when initial data changes
  React.useEffect(() => {
    setSprintIssues(initialSprintIssues);
    setBacklogIssues(initialBacklogIssues);
  }, [initialSprintIssues, initialBacklogIssues]);

  const handleAssignIssues = async (issueIds: string[]) => {
    if (!canEdit) {
      return;
    }

    setIsAssigning(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/cycles/${cycle.id}/issues`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ issueIds }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign issues');
      }

      const result = await response.json();
      const updatedIssues = result.data as Issue[];

      // Update local state
      const assignedIssues = backlogIssues.filter((i) => issueIds.includes(i.id));
      setSprintIssues((prev) => [...prev, ...assignedIssues]);
      setBacklogIssues((prev) => prev.filter((i) => !issueIds.includes(i.id)));

      // Show success toast
      toast.success(`Assigned ${issueIds.length} issue${issueIds.length !== 1 ? 's' : ''} to sprint`);

      // Refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error('Failed to assign issues:', error);
      
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

    setIsAssigning(true);

    try {
      // Remove issues by setting their cycleId to null
      // We'll need to update each issue individually
      for (const issueId of issueIds) {
        const issue = sprintIssues.find((i) => i.id === issueId);
        if (!issue) continue;

        const response = await fetch(
          `/api/projects/${projectId}/issues/${issue.key}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cycleId: null }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to remove issue');
        }
      }

      // Update local state
      const removedIssues = sprintIssues.filter((i) => issueIds.includes(i.id));
      setSprintIssues((prev) => prev.filter((i) => !issueIds.includes(i.id)));
      setBacklogIssues((prev) => [...prev, ...removedIssues]);

      // Show success toast
      toast.success(`Removed ${issueIds.length} issue${issueIds.length !== 1 ? 's' : ''} from sprint`);

      // Refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error('Failed to remove issues:', error);
      
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
    />
  );
}


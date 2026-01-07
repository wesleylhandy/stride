'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../utils/cn';
import { Badge } from '../atoms/Badge';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { IssueCard } from '../molecules/IssueCard';
import type { Issue, Cycle } from '@stride/types';

export interface CycleMetrics {
  averageCycleTime?: number;
  stats?: {
    average: number;
    median: number;
    min: number;
    max: number;
    count: number;
  };
}

export interface SprintPlanningProps {
  /**
   * The cycle/sprint being planned
   */
  cycle: Cycle;
  /**
   * Issues already assigned to the sprint
   */
  sprintIssues: Issue[];
  /**
   * Issues available in the backlog (not assigned to any cycle)
   */
  backlogIssues: Issue[];
  /**
   * Cycle time metrics (optional)
   */
  metrics?: CycleMetrics;
  /**
   * Callback when issues are assigned to the sprint
   */
  onAssignIssues?: (issueIds: string[]) => Promise<void>;
  /**
   * Callback when issues are removed from the sprint
   */
  onRemoveIssues?: (issueIds: string[]) => Promise<void>;
  /**
   * Callback when sprint goal is updated
   */
  onUpdateGoal?: (goal: string) => Promise<void>;
  /**
   * Whether the user can edit (assign/remove issues, update goal)
   */
  canEdit?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface SortableIssueCardProps {
  issue: Issue;
  onRemove?: () => void;
  canEdit?: boolean;
}

function SortableIssueCard({ issue, onRemove, canEdit }: SortableIssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <div className="relative group">
        <IssueCard
          issue={issue}
          isDragging={isDragging}
          className="mb-2"
          {...attributes}
          {...listeners}
        />
        {canEdit && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-error/10 hover:bg-error/20 text-error rounded-full p-1 text-xs"
            aria-label={`Remove ${issue.key} from sprint`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * SprintPlanning component
 * 
 * Provides a drag-and-drop interface for planning sprints:
 * - Assign issues from backlog to sprint
 * - Remove issues from sprint
 * - Display sprint capacity and story points
 * - Edit sprint goal
 */
export function SprintPlanning({
  cycle,
  sprintIssues,
  backlogIssues,
  metrics,
  onAssignIssues,
  onRemoveIssues,
  onUpdateGoal,
  canEdit = false,
  className,
}: SprintPlanningProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [goal, setGoal] = React.useState(cycle.goal || '');
  const [isSavingGoal, setIsSavingGoal] = React.useState(false);
  const [_isAssigning, setIsAssigning] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate sprint metrics
  const totalStoryPoints = React.useMemo(() => {
    return sprintIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
  }, [sprintIssues]);

  const completedStoryPoints = React.useMemo(() => {
    return sprintIssues
      .filter((issue) => issue.closedAt !== null)
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
  }, [sprintIssues]);

  const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

  // Calculate sprint duration
  const sprintDuration = React.useMemo(() => {
    const start = new Date(cycle.startDate);
    const end = new Date(cycle.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [cycle]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !canEdit) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dragging from backlog to sprint
    if (overId === 'sprint-issues' && !sprintIssues.find((i) => i.id === activeId)) {
      const issue = backlogIssues.find((i) => i.id === activeId);
      if (issue && onAssignIssues) {
        setIsAssigning(true);
        try {
          await onAssignIssues([activeId]);
        } catch (error) {
          console.error('Failed to assign issue:', error);
        } finally {
          setIsAssigning(false);
        }
      }
      return;
    }

    // If dragging from sprint to backlog
    if (overId === 'backlog-issues' && sprintIssues.find((i) => i.id === activeId)) {
      if (onRemoveIssues) {
        setIsAssigning(true);
        try {
          await onRemoveIssues([activeId]);
        } catch (error) {
          console.error('Failed to remove issue:', error);
        } finally {
          setIsAssigning(false);
        }
      }
      return;
    }

    // If reordering within sprint
    if (overId !== 'sprint-issues' && overId !== 'backlog-issues') {
      const oldIndex = sprintIssues.findIndex((i) => i.id === activeId);
      const newIndex = sprintIssues.findIndex((i) => i.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Reordering within sprint (visual only, no API call needed)
        // The order is not persisted in the database
      }
    }
  };

  const handleRemoveIssue = async (issueId: string) => {
    if (!canEdit || !onRemoveIssues) {
      return;
    }

    setIsAssigning(true);
    try {
      await onRemoveIssues([issueId]);
    } catch (error) {
      console.error('Failed to remove issue:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!canEdit || !onUpdateGoal) {
      return;
    }

    setIsSavingGoal(true);
    try {
      await onUpdateGoal(goal);
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setIsSavingGoal(false);
    }
  };

  const activeIssue = React.useMemo(() => {
    if (!activeId) return null;
    return [...sprintIssues, ...backlogIssues].find((i) => i.id === activeId);
  }, [activeId, sprintIssues, backlogIssues]);

  const { setNodeRef: setSprintRef } = useDroppable({
    id: 'sprint-issues',
  });

  const { setNodeRef: setBacklogRef } = useDroppable({
    id: 'backlog-issues',
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('flex flex-col h-full', className)}>
        {/* Sprint Header */}
        <div className="border-b border-border p-4 bg-background-secondary">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">{cycle.name}</h2>
              <p className="text-sm text-foreground-secondary">
                {new Date(cycle.startDate).toLocaleDateString()} -{' '}
                {new Date(cycle.endDate).toLocaleDateString()} ({sprintDuration} days)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-foreground-secondary">Story Points</div>
                <div className="text-2xl font-bold text-foreground">
                  {totalStoryPoints}
                </div>
                <div className="text-xs text-foreground-secondary">
                  {completedStoryPoints} completed, {remainingStoryPoints} remaining
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-foreground-secondary">Issues</div>
                <div className="text-2xl font-bold text-foreground">
                  {sprintIssues.length}
                </div>
              </div>
              {metrics && metrics.stats && metrics.stats.count > 0 && (
                <div className="text-right">
                  <div className="text-sm text-foreground-secondary">Avg Cycle Time</div>
                  <div className="text-2xl font-bold text-foreground">
                    {metrics.stats.average.toFixed(1)}
                  </div>
                  <div className="text-xs text-foreground-secondary">
                    days ({metrics.stats.count} completed)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sprint Goal */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Sprint Goal
            </label>
            <div className="flex gap-2">
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What is the goal of this sprint?"
                disabled={!canEdit || isSavingGoal}
                className="flex-1"
              />
              {canEdit && onUpdateGoal && (
                <Button
                  onClick={handleSaveGoal}
                  disabled={isSavingGoal || goal === (cycle.goal || '')}
                  size="sm"
                >
                  {isSavingGoal ? 'Saving...' : 'Save Goal'}
                </Button>
              )}
            </div>
          </div>

          {/* Cycle Time Metrics */}
          {metrics && metrics.stats && metrics.stats.count > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Cycle Time Metrics
              </h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-foreground-secondary">Average</div>
                  <div className="font-semibold text-foreground">
                    {metrics.stats.average.toFixed(1)} days
                  </div>
                </div>
                <div>
                  <div className="text-foreground-secondary">Median</div>
                  <div className="font-semibold text-foreground">
                    {metrics.stats.median.toFixed(1)} days
                  </div>
                </div>
                <div>
                  <div className="text-foreground-secondary">Min</div>
                  <div className="font-semibold text-foreground">
                    {metrics.stats.min.toFixed(1)} days
                  </div>
                </div>
                <div>
                  <div className="text-foreground-secondary">Max</div>
                  <div className="font-semibold text-foreground">
                    {metrics.stats.max.toFixed(1)} days
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sprint Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Sprint Issues */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">
                Sprint Issues ({sprintIssues.length})
              </h3>
              <Badge variant="default" size="sm">
                {totalStoryPoints} SP
              </Badge>
            </div>
            <div
              ref={setSprintRef}
              className={cn(
                'flex-1 overflow-y-auto rounded-lg border-2 border-dashed p-4',
                'border-border bg-background-secondary/50',
                'min-h-[200px]'
              )}
            >
              {sprintIssues.length === 0 ? (
                <div className="flex items-center justify-center h-full text-foreground-secondary">
                  <p>Drag issues from backlog to assign them to this sprint</p>
                </div>
              ) : (
                <SortableContext
                  items={sprintIssues.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sprintIssues.map((issue) => (
                    <SortableIssueCard
                      key={issue.id}
                      issue={issue}
                      onRemove={() => handleRemoveIssue(issue.id)}
                      canEdit={canEdit}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </div>

          {/* Backlog */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">
                Backlog ({backlogIssues.length})
              </h3>
            </div>
            <div
              ref={setBacklogRef}
              className={cn(
                'flex-1 overflow-y-auto rounded-lg border-2 border-dashed p-4',
                'border-border bg-background-secondary/50',
                'min-h-[200px]'
              )}
            >
              {backlogIssues.length === 0 ? (
                <div className="flex items-center justify-center h-full text-foreground-secondary">
                  <p>No issues in backlog</p>
                </div>
              ) : (
                <div>
                  {backlogIssues.map((issue) => (
                    <div key={issue.id} className="mb-2">
                      <IssueCard issue={issue} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeIssue ? (
          <div className="opacity-90">
            <IssueCard issue={activeIssue} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}


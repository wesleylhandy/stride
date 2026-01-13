"use client";

import * as React from "react";
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
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../utils/cn";
import { Badge } from "../atoms/Badge";
import { Input } from "../atoms/Input";
import { Button } from "../atoms/Button";
import { IssueCard } from "../molecules/IssueCard";
import type { Issue, Cycle } from "@stride/types";
import type { ProjectConfig } from "@stride/yaml-config";

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
  /**
   * Optional project configuration for status-based card coloring
   */
  projectConfig?: ProjectConfig;
}

interface SortableIssueCardProps {
  issue: Issue;
  onRemove?: () => void;
  canEdit?: boolean;
  projectConfig?: ProjectConfig;
}

function SortableIssueCard({
  issue,
  onRemove,
  canEdit,
  projectConfig,
}: SortableIssueCardProps) {
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
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <div {...attributes} {...listeners} className="relative group">
        <IssueCard
          issue={issue}
          isDragging={isDragging}
          className="mb-2"
          projectConfig={projectConfig}
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
  projectConfig,
}: SprintPlanningProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [goal, setGoal] = React.useState(cycle.goal || "");
  const [isSavingGoal, setIsSavingGoal] = React.useState(false);
  const [_isAssigning, setIsAssigning] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (matches KanbanBoard)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate sprint metrics
  const totalStoryPoints = React.useMemo(() => {
    return sprintIssues.reduce(
      (sum, issue) => sum + (issue.storyPoints || 0),
      0
    );
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

  const [overId, setOverId] = React.useState<string | null>(null);

  // Use closestCenter - it should find sortable items, and we'll handle droppable logic in handleDragEnd
  // This matches how KanbanBoard works

  const handleDragOver = (event: DragOverEvent) => {
    // Track what we're dragging over for better drop detection
    if (event.over) {
      setOverId(event.over.id as string);
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;

    // Use over from event, or fall back to overId from state (in case event.over is undefined)
    const droppedOverId = (over?.id as string) || overId;

    setActiveId(null);
    setOverId(null);

    if (!droppedOverId || !canEdit) {
      return;
    }

    // Check if dragging from backlog
    const isFromBacklog = backlogIssues.find((i) => i.id === activeId);

    // If dragging from backlog to sprint (check both direct drop on container and drop on items inside)
    // Also handle case where droppedOverId === activeId (empty sprint container - closestCenter returns the dragged item)
    const isDroppedOnSprint =
      droppedOverId === "sprint-issues" ||
      (isFromBacklog && sprintIssues.find((i) => i.id === droppedOverId)) ||
      (isFromBacklog &&
        droppedOverId === activeId &&
        sprintIssues.length === 0);

    if (
      isDroppedOnSprint &&
      isFromBacklog &&
      !sprintIssues.find((i) => i.id === activeId)
    ) {
      const issue = backlogIssues.find((i) => i.id === activeId);
      if (issue && onAssignIssues) {
        setIsAssigning(true);
        try {
          await onAssignIssues([activeId]);
        } catch (error) {
          console.error("Failed to assign issue:", error);
        } finally {
          setIsAssigning(false);
        }
      }
      return;
    }

    // Check if dragging from sprint
    const isFromSprint = sprintIssues.find((i) => i.id === activeId);

    // If dragging from sprint to backlog (check both direct drop on container and drop on items inside)
    // Also handle case where droppedOverId === activeId (empty backlog container - closestCenter returns the dragged item)
    const isDroppedOnBacklog =
      droppedOverId === "backlog-issues" ||
      (isFromSprint && backlogIssues.find((i) => i.id === droppedOverId)) ||
      (isFromSprint &&
        droppedOverId === activeId &&
        backlogIssues.length === 0);

    if (
      isDroppedOnBacklog &&
      isFromSprint &&
      !backlogIssues.find((i) => i.id === activeId)
    ) {
      if (onRemoveIssues) {
        setIsAssigning(true);
        try {
          await onRemoveIssues([activeId]);
        } catch (error) {
          console.error("Failed to remove issue:", error);
        } finally {
          setIsAssigning(false);
        }
      }
      return;
    }

    // If reordering within sprint
    if (
      droppedOverId !== "sprint-issues" &&
      droppedOverId !== "backlog-issues"
    ) {
      const oldIndex = sprintIssues.findIndex((i) => i.id === activeId);
      const newIndex = sprintIssues.findIndex((i) => i.id === droppedOverId);

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
      console.error("Failed to remove issue:", error);
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
      console.error("Failed to update goal:", error);
    } finally {
      setIsSavingGoal(false);
    }
  };

  const activeIssue = React.useMemo(() => {
    if (!activeId) return null;
    return [...sprintIssues, ...backlogIssues].find((i) => i.id === activeId);
  }, [activeId, sprintIssues, backlogIssues]);

  const { setNodeRef: setSprintRef, isOver: isOverSprint } = useDroppable({
    id: "sprint-issues",
    data: {
      type: "sprint-container",
    },
  });

  const { setNodeRef: setBacklogRef, isOver: isOverBacklog } = useDroppable({
    id: "backlog-issues",
    data: {
      type: "backlog-container",
    },
  });

  // Check if we're dragging a backlog issue over the sprint area
  // This handles both direct droppable detection and sortable item detection
  const isDraggingBacklogOverSprint = React.useMemo(() => {
    if (!activeId || !overId) {
      return false;
    }
    const isFromBacklog = backlogIssues.find((i) => i.id === activeId);
    if (!isFromBacklog) {
      return false;
    }

    // Case 1: Directly over the sprint droppable container
    if (overId === "sprint-issues") {
      return true;
    }

    // Case 2: Over a sprint issue (sortable item inside sprint)
    if (sprintIssues.find((i) => i.id === overId)) {
      return true;
    }

    // Case 3: overId === activeId means we're not over anything else
    // If sprint is empty and we're dragging from backlog, assume we're over the sprint container
    // This happens when closestCenter can't find collisions in an empty container
    if (overId === activeId && sprintIssues.length === 0) {
      // We're dragging from backlog and sprint is empty - likely over the sprint container
      return true;
    }

    return false;
  }, [activeId, overId, backlogIssues, sprintIssues]);

  // Check if we're dragging a sprint issue over the backlog area
  // This handles both direct droppable detection and sortable item detection
  const isDraggingSprintOverBacklog = React.useMemo(() => {
    if (!activeId || !overId) {
      return false;
    }
    const isFromSprint = sprintIssues.find((i) => i.id === activeId);
    if (!isFromSprint) {
      return false;
    }

    // Case 1: Directly over the backlog droppable container
    if (overId === "backlog-issues") {
      return true;
    }

    // Case 2: Over a backlog issue (sortable item inside backlog)
    if (backlogIssues.find((i) => i.id === overId)) {
      return true;
    }

    // Case 3: overId === activeId means we're not over anything else
    // If backlog is empty and we're dragging from sprint, assume we're over the backlog container
    // This happens when closestCenter can't find collisions in an empty container
    if (overId === activeId && backlogIssues.length === 0) {
      // We're dragging from sprint and backlog is empty - likely over the backlog container
      return true;
    }

    return false;
  }, [activeId, overId, sprintIssues, backlogIssues]);

  // Combined visual feedback: use droppable's isOver OR our manual tracking
  const showSprintDropZone = isOverSprint || isDraggingBacklogOverSprint;
  const showBacklogDropZone = isOverBacklog || isDraggingSprintOverBacklog;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex flex-col h-full", className)}>
        {/* Sprint Header */}
        <div className="border-b border-border dark:border-border-dark p-4 bg-background-secondary dark:bg-background-dark-secondary">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-1">
                {cycle.name}
              </h2>
              <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                {new Date(cycle.startDate).toLocaleDateString()} -{" "}
                {new Date(cycle.endDate).toLocaleDateString()} ({sprintDuration}{" "}
                days)
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-right">
                <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                  Story Points
                </div>
                <div className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                  {totalStoryPoints}
                </div>
                <div className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                  {completedStoryPoints} completed, {remainingStoryPoints}{" "}
                  remaining
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                  Issues
                </div>
                <div className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                  {sprintIssues.length}
                </div>
                <div className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary invisible">
                  placeholder
                </div>
              </div>
              {metrics && metrics.stats && metrics.stats.count > 0 && (
                <div className="text-right">
                  <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                    Avg Cycle Time
                  </div>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                    {metrics.stats.average.toFixed(1)}
                  </div>
                  <div className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                    days ({metrics.stats.count} completed)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sprint Goal */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
              Sprint Goal
            </label>
            <div className="flex items-center gap-2">
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
                  disabled={isSavingGoal || goal === (cycle.goal || "")}
                  variant="primary"
                >
                  {isSavingGoal ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
          </div>

          {/* Cycle Time Metrics */}
          {metrics && metrics.stats && metrics.stats.count > 0 && (
            <div className="mt-4 pt-4 border-t border-border dark:border-border-dark">
              <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                Cycle Time Metrics
              </h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-foreground-secondary dark:text-foreground-dark-secondary">
                    Average
                  </div>
                  <div className="font-semibold text-foreground dark:text-foreground-dark">
                    {metrics.stats.average.toFixed(1)} days
                  </div>
                </div>
                <div>
                  <div className="text-foreground-secondary dark:text-foreground-dark-secondary">
                    Median
                  </div>
                  <div className="font-semibold text-foreground dark:text-foreground-dark">
                    {metrics.stats.median.toFixed(1)} days
                  </div>
                </div>
                <div>
                  <div className="text-foreground-secondary dark:text-foreground-dark-secondary">
                    Min
                  </div>
                  <div className="font-semibold text-foreground dark:text-foreground-dark">
                    {metrics.stats.min.toFixed(1)} days
                  </div>
                </div>
                <div>
                  <div className="text-foreground-secondary dark:text-foreground-dark-secondary">
                    Max
                  </div>
                  <div className="font-semibold text-foreground dark:text-foreground-dark">
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
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                Sprint Issues ({sprintIssues.length})
              </h3>
              <Badge variant="default" size="sm">
                {totalStoryPoints} SP
              </Badge>
            </div>
            <div
              ref={setSprintRef}
              data-droppable-id="sprint-issues"
              className={cn(
                "flex-1 overflow-y-auto rounded-lg border-2 border-dashed p-4",
                "border-border dark:border-border-dark bg-background-secondary/50 dark:bg-background-dark-secondary/50",
                "min-h-[200px] transition-colors relative",
                showSprintDropZone &&
                  "border-accent bg-accent/10 dark:bg-accent/20"
              )}
            >
              {sprintIssues.length === 0 ? (
                <div className="flex items-center justify-center h-full text-foreground-secondary dark:text-foreground-dark-secondary">
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
                      projectConfig={projectConfig}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </div>

          {/* Backlog */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                Backlog ({backlogIssues.length})
              </h3>
            </div>
            <div
              ref={setBacklogRef}
              className={cn(
                "flex-1 overflow-y-auto rounded-lg border-2 border-dashed p-4",
                "border-border dark:border-border-dark bg-background-secondary/50 dark:bg-background-dark-secondary/50",
                "min-h-[200px] transition-colors",
                showBacklogDropZone &&
                  "border-accent bg-accent/10 dark:bg-accent/20"
              )}
            >
              {backlogIssues.length === 0 ? (
                <div className="flex items-center justify-center h-full text-foreground-secondary dark:text-foreground-dark-secondary">
                  <p>No issues in backlog</p>
                </div>
              ) : (
                <SortableContext
                  items={backlogIssues.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {backlogIssues.map((issue) => (
                    <SortableIssueCard
                      key={issue.id}
                      issue={issue}
                      projectConfig={projectConfig}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeIssue ? (
          <div className="opacity-90">
            <IssueCard
              issue={activeIssue}
              isDragging
              projectConfig={projectConfig}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

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
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../utils/cn';
import { Badge } from '../atoms/Badge';
import { IssueCard } from '../molecules/IssueCard';
import type { Issue } from '@stride/types';
import type { ProjectConfig, StatusConfig } from '@stride/yaml-config';

export interface ValidationError {
  field?: string;
  message: string;
}

export interface KanbanBoardProps {
  /**
   * List of issues to display
   */
  issues: Issue[];
  /**
   * Project configuration containing workflow statuses
   */
  projectConfig: ProjectConfig;
  /**
   * Callback when an issue is moved to a new status
   */
  onIssueMove?: (issueId: string, newStatus: string) => void;
  /**
   * Callback when an issue card is clicked
   */
  onIssueClick?: (issue: Issue) => void;
  /**
   * Filter by status (optional)
   */
  statusFilter?: string[];
  /**
   * Optional list of users for assignee display on cards
   */
  users?: Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface ColumnProps {
  status: StatusConfig;
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  isFiltered?: boolean;
  isValidDrop?: boolean;
  users?: Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
}

/**
 * Kanban column component (droppable)
 */
function KanbanColumn({ status, issues, onIssueClick, isFiltered: _isFiltered, isValidDrop, users }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.key,
  });

  const sortedIssues = React.useMemo(() => {
    // Sort issues by updated date (most recent first)
    return [...issues].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [issues]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full min-w-[280px] max-w-[320px]',
        'rounded-lg border-2',
        'bg-background-secondary dark:bg-background-dark-secondary',
        'transition-all',
        // Use border color changes instead of ring to prevent cutoff
        isOver && isValidDrop
          ? 'border-primary'
          : isOver && isValidDrop === false
          ? 'border-error'
          : 'border-border dark:border-border-dark'
      )}
      data-status={status.key}
    >
      <div className="p-4 border-b border-border dark:border-border-dark">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground dark:text-foreground-dark">{status.name}</h3>
          <Badge variant="default" size="sm">
            {issues.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <SortableContext
          items={sortedIssues.map((issue) => issue.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedIssues.map((issue) => (
            <SortableIssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick?.(issue)}
              users={users}
            />
          ))}
        </SortableContext>
        {sortedIssues.length === 0 && (
          <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary text-center py-8">
            No issues
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sortable issue card wrapper
 */
function SortableIssueCard({
  issue,
  onClick,
  users,
}: {
  issue: Issue;
  onClick?: () => void;
  users?: Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  // Track if we should prevent click (after a drag)
  const preventClickRef = React.useRef(false);
  const pointerDownTimeRef = React.useRef<number | null>(null);
  const pointerDownPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Track when drag starts - if dragging, prevent clicks
  React.useEffect(() => {
    if (isDragging) {
      preventClickRef.current = true;
    }
  }, [isDragging]);

  // Enhanced listeners that track pointer down
  const enhancedListeners = React.useMemo(() => {
    return {
      ...listeners,
      onPointerDown: (e: React.PointerEvent) => {
        pointerDownTimeRef.current = Date.now();
        pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
        preventClickRef.current = false;
        listeners?.onPointerDown?.(e);
      },
    };
  }, [listeners]);

  // Handle click - check if it was actually a drag
  const handleClick = (e: React.MouseEvent) => {
    // If we're currently dragging, definitely prevent click
    if (isDragging || preventClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Check if pointer moved significantly (more than activation distance)
    if (pointerDownPosRef.current) {
      const deltaX = Math.abs(e.clientX - pointerDownPosRef.current.x);
      const deltaY = Math.abs(e.clientY - pointerDownPosRef.current.y);
      const moved = deltaX > 8 || deltaY > 8; // Match activation constraint

      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        preventClickRef.current = true;
        // Reset after delay
        setTimeout(() => {
          preventClickRef.current = false;
        }, 300);
        return;
      }
    }

    // Only trigger click if no drag occurred
    if (onClick) {
      onClick();
    }

    // Reset tracking
    pointerDownTimeRef.current = null;
    pointerDownPosRef.current = null;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...enhancedListeners}>
        <IssueCard
          issue={issue}
          isDragging={isDragging}
          onClick={handleClick}
          users={users}
        />
      </div>
    </div>
  );
}

/**
 * KanbanBoard component
 * 
 * Displays issues in a Kanban board layout with drag-and-drop support.
 * Columns are generated from workflow statuses in the project configuration.
 * 
 * Features:
 * - Drag-and-drop reordering (T152)
 * - Keyboard navigation (T156)
 * - Column filtering (T157)
 * - Issue count badges (T158)
 * - Performance optimized (T159)
 */
/**
 * Client-side validation functions (T164, T165)
 */
function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  config: ProjectConfig,
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Find status configurations
  const currentStatusConfig = config.workflow.statuses.find(
    (s) => s.key === currentStatus,
  );
  const newStatusConfig = config.workflow.statuses.find(
    (s) => s.key === newStatus,
  );

  // Check if statuses exist in config
  if (!currentStatusConfig) {
    const availableStatuses = config.workflow.statuses.map(s => `"${s.name}" (${s.key})`).join(', ');
    errors.push({
      field: 'status',
      message: `Current status "${currentStatus}" is not defined in your project workflow configuration. Available statuses: ${availableStatuses}. Please update your project configuration to include this status.`,
    });
  }

  if (!newStatusConfig) {
    const availableStatuses = config.workflow.statuses.map(s => `"${s.name}" (${s.key})`).join(', ');
    errors.push({
      field: 'status',
      message: `Target status "${newStatus}" is not defined in your project workflow configuration. Available statuses: ${availableStatuses}. Please update your project configuration to include this status.`,
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // If statuses are the same, transition is valid (no-op)
  if (currentStatus === newStatus) {
    return { isValid: true, errors: [] };
  }

  // Validate transition based on status types
  if (currentStatusConfig && newStatusConfig) {
    // Cannot transition from closed to open or in_progress
    if (currentStatusConfig.type === 'closed') {
      if (newStatusConfig.type !== 'closed') {
        errors.push({
          field: 'status',
          message: `Cannot move from "${currentStatusConfig.name}" (${currentStatusConfig.type} status) to "${newStatusConfig.name}" (${newStatusConfig.type} status). Once an issue is closed, it can only be moved to another closed status.`,
        });
      }
    }
    
    // Provide helpful context about what transitions are allowed
    if (currentStatusConfig.type === 'open' && newStatusConfig.type === 'closed') {
      // This is allowed, no error
    } else if (currentStatusConfig.type === 'in_progress' && newStatusConfig.type === 'closed') {
      // This is allowed, no error
    } else if (currentStatusConfig.type === 'open' && newStatusConfig.type === 'in_progress') {
      // This is allowed, no error
    } else if (currentStatusConfig.type === 'in_progress' && newStatusConfig.type === 'in_progress') {
      // This is allowed, no error
    }
    // All other transitions from open/in_progress are allowed by default
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateRequiredCustomFields(
  issue: Issue,
  newStatus: string,
  config: ProjectConfig,
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Find the new status configuration
  const newStatusConfig = config.workflow.statuses.find(
    (s) => s.key === newStatus,
  );

  if (!newStatusConfig) {
    return { isValid: true, errors: [] };
  }

  // Check required custom fields
  const requiredFields = config.custom_fields.filter((field) => field.required);

  for (const field of requiredFields) {
    const fieldValue = issue.customFields[field.key];

    // Check if field is missing or empty
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      const fieldType = field.type || 'text';
      errors.push({
        field: `customFields.${field.key}`,
        message: `Required field "${field.name}" (${fieldType}) must be set before moving to "${newStatusConfig.name}". This is required by your project configuration.`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateStatusChange(
  issue: Issue,
  newStatus: string,
  config: ProjectConfig,
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Validate status transition
  const transitionResult = validateStatusTransition(
    issue.status,
    newStatus,
    config,
  );
  errors.push(...transitionResult.errors);

  // Validate required custom fields
  const fieldsResult = validateRequiredCustomFields(issue, newStatus, config);
  errors.push(...fieldsResult.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Simple toast notification component
 */
function ValidationToast({
  errors,
  onDismiss,
}: {
  errors: ValidationError[];
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-error-light border border-error rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-error-dark mb-2">
              Cannot Move Issue
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-error-dark">
              {errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 text-error-dark hover:text-error-dark/80"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard({
  issues,
  projectConfig,
  onIssueMove,
  onIssueClick,
  statusFilter,
  users,
  className,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [localIssues, setLocalIssues] = React.useState<Issue[]>(issues);
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[] | null>(null);
  const [draggedIssue, setDraggedIssue] = React.useState<Issue | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = React.useState<string | null>(null);

  // Update local issues when props change
  React.useEffect(() => {
    setLocalIssues(issues);
  }, [issues]);

  // Filter statuses if statusFilter is provided (T157)
  const visibleStatuses = React.useMemo(() => {
    if (!statusFilter || statusFilter.length === 0) {
      return projectConfig.workflow.statuses;
    }
    return projectConfig.workflow.statuses.filter((status) =>
      statusFilter.includes(status.key)
    );
  }, [projectConfig.workflow.statuses, statusFilter]);

  // Group issues by status (T153)
  const issuesByStatus = React.useMemo(() => {
    const grouped: Record<string, Issue[]> = {};
    
    // Initialize all statuses
    visibleStatuses.forEach((status) => {
      grouped[status.key] = [];
    });

    // Group issues
    localIssues.forEach((issue) => {
      const statusGroup = grouped[issue.status];
      if (statusGroup) {
        statusGroup.push(issue);
      }
    });

    return grouped;
  }, [localIssues, visibleStatuses]);

  // Configure sensors for drag-and-drop (T152, T156)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const issueId = event.active.id as string;
    setActiveId(issueId);
    const issue = localIssues.find((i) => i.id === issueId);
    setDraggedIssue(issue || null);
  };

  // Handle drag over (T165 - validate during drag)
  const handleDragOver = (event: DragOverEvent) => {
    const { active: _active, over } = event;
    
    if (!over || !draggedIssue) {
      setDropTargetStatus(null);
      return;
    }

    // Check if over a column
    const overStatus = visibleStatuses.find((status) => status.key === over.id);
    if (overStatus && draggedIssue.status !== overStatus.key) {
      setDropTargetStatus(overStatus.key);
    } else {
      setDropTargetStatus(null);
    }
  };

  // Handle drag end (T152, T165 - validate before move)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset drag state
    setActiveId(null);
    setDraggedIssue(null);
    setDropTargetStatus(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeIssue = localIssues.find((issue) => issue.id === active.id);
    if (!activeIssue) {
      return;
    }

    // Determine target status
    let targetStatus: string | null = null;

    // Check if dropped on another issue (reorder) or on a column (status change)
    const overIssue = localIssues.find((issue) => issue.id === over.id);
    
    if (overIssue) {
      // If dropped on issue in different column, move to that column
      if (activeIssue.status !== overIssue.status) {
        targetStatus = overIssue.status;
      }
      // If same column, just reorder (no validation needed)
      else {
        // Reorder within same column
        const activeColumn = issuesByStatus[activeIssue.status] || [];
        const oldIndex = activeColumn.findIndex((issue) => issue.id === active.id);
        const newIndex = activeColumn.findIndex((issue) => issue.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newColumn = arrayMove(activeColumn, oldIndex, newIndex);
          const updatedIssues = localIssues.map((issue) => {
            if (issue.status === activeIssue.status) {
              const issueIndex = newColumn.findIndex((i) => i.id === issue.id);
              if (issueIndex !== -1) {
                return newColumn[issueIndex];
              }
            }
            return issue;
          }).filter((issue): issue is Issue => issue !== undefined);
          setLocalIssues(updatedIssues);
        }
        return; // No status change, exit early
      }
    } else {
      // Check if dropped on a column (status container)
      const overStatus = visibleStatuses.find((status) => status.key === over.id);
      if (overStatus && activeIssue.status !== overStatus.key) {
        targetStatus = overStatus.key;
      }
    }

    // If no status change, exit
    if (!targetStatus) {
      return;
    }

    // Validate status change (T165)
    const validation = validateStatusChange(activeIssue, targetStatus, projectConfig);

    if (!validation.isValid) {
      // Show validation errors (T164) with user-friendly messages that explain configuration
      const friendlyErrors = validation.errors.map((err) => {
        // If message already explains the issue with configuration context, use it
        if (err.message && (err.message.includes('configuration') || err.message.includes('workflow') || err.message.includes('Required field'))) {
          return err;
        }
        return {
          ...err,
          message: err.message || `Cannot move issue to "${targetStatus}": ${err.field || 'validation failed'}. Check your project configuration for allowed status transitions.`,
        };
      });
      setValidationErrors(friendlyErrors);
      return; // Prevent the move
    }

    // Validation passed - proceed with move
    const updatedIssues = localIssues.map((issue) =>
      issue.id === active.id
        ? { ...issue, status: targetStatus }
        : issue
    );
    setLocalIssues(updatedIssues);
    onIssueMove?.(active.id as string, targetStatus);
  };

  const activeIssue = activeId
    ? localIssues.find((issue) => issue.id === activeId)
    : null;

  // Determine if drop is valid for each column (T165)
  const getIsValidDrop = (statusKey: string): boolean | undefined => {
    if (!draggedIssue || !dropTargetStatus) {
      return undefined;
    }
    if (dropTargetStatus !== statusKey) {
      return undefined;
    }
    const validation = validateStatusChange(draggedIssue, statusKey, projectConfig);
    return validation.isValid;
  };

  return (
    <div className={cn('w-full h-full', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleStatuses.map((status) => (
            <KanbanColumn
              key={status.key}
              status={status}
              issues={issuesByStatus[status.key] || []}
              onIssueClick={onIssueClick}
              isValidDrop={getIsValidDrop(status.key)}
              users={users}
            />
          ))}
        </div>
        <DragOverlay>
          {activeIssue ? (
            <div className="rotate-3 opacity-90">
              <IssueCard issue={activeIssue} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Validation error toast (T164) */}
      {validationErrors && validationErrors.length > 0 && (
        <ValidationToast
          errors={validationErrors}
          onDismiss={() => setValidationErrors(null)}
        />
      )}
    </div>
  );
}


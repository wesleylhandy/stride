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
  projectConfig?: ProjectConfig;
}

/**
 * Kanban column component (droppable)
 * 
 * Optimized for performance with memoization and conditional rendering
 */
const KanbanColumn = React.memo(function KanbanColumn({ status, issues, onIssueClick, isFiltered: _isFiltered, isValidDrop, users, projectConfig }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.key,
  });

  const sortedIssues = React.useMemo(() => {
    // Sort issues by updated date (most recent first)
    // Only sort if we have issues and it's actually necessary
    if (issues.length === 0) return [];
    if (issues.length === 1) return issues;
    
    return [...issues].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [issues]);

  // Memoize issue IDs for SortableContext to prevent unnecessary re-renders
  const issueIds = React.useMemo(() => 
    sortedIssues.map((issue) => issue.id),
    [sortedIssues]
  );

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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedIssues.length > 0 ? (
          <SortableContext
            items={issueIds}
            strategy={verticalListSortingStrategy}
          >
            {sortedIssues.map((issue) => (
              <SortableIssueCard
                key={issue.id}
                issue={issue}
                onClick={() => onIssueClick?.(issue)}
                users={users}
                projectConfig={projectConfig}
              />
            ))}
          </SortableContext>
        ) : (
          <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary text-center py-8">
            No issues
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for column memoization
  // Only re-render if issues array reference changed or status/config changed
  return (
    prevProps.status.key === nextProps.status.key &&
    prevProps.issues === nextProps.issues &&
        prevProps.isValidDrop === nextProps.isValidDrop &&
        prevProps.onIssueClick === nextProps.onIssueClick &&
        prevProps.users === nextProps.users &&
        prevProps.projectConfig === nextProps.projectConfig
  );
});

/**
 * Sortable issue card wrapper
 * 
 * Memoized to prevent unnecessary re-renders when parent re-renders
 */
const SortableIssueCard = React.memo(function SortableIssueCard({
  issue,
  onClick,
  users,
  projectConfig,
}: {
  issue: Issue;
  onClick?: () => void;
  users?: Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
  projectConfig?: ProjectConfig;
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
          projectConfig={projectConfig}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if issue data actually changed
  return (
    prevProps.issue.id === nextProps.issue.id &&
    prevProps.issue.status === nextProps.issue.status &&
    prevProps.issue.updatedAt === nextProps.issue.updatedAt &&
    prevProps.issue.title === nextProps.issue.title &&
        prevProps.issue.assigneeId === nextProps.issue.assigneeId &&
        prevProps.onClick === nextProps.onClick &&
        prevProps.users === nextProps.users &&
        prevProps.projectConfig === nextProps.projectConfig
    );
});

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
 * 
 * Validates status transitions based on workflow rules from the project configuration.
 * Rules are dynamically enforced based on the config prop - no hardcoded rules.
 * 
 * Note: This uses the config passed as a prop. For server-side validation,
 * always fetch fresh config from the database to ensure changes are immediately reflected.
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
      message: `Current status "${currentStatus}" is not defined in your project workflow configuration. Available statuses: ${availableStatuses}. See the [configuration troubleshooting guide](/docs/configuration-troubleshooting#status-x-is-not-defined-in-workflow) for help.`,
    });
  }

  if (!newStatusConfig) {
    const availableStatuses = config.workflow.statuses.map(s => `"${s.name}" (${s.key})`).join(', ');
    errors.push({
      field: 'status',
      message: `Target status "${newStatus}" is not defined in your project workflow configuration. Available statuses: ${availableStatuses}. See the [configuration troubleshooting guide](/docs/configuration-troubleshooting#status-x-is-not-defined-in-workflow) for help.`,
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // If statuses are the same, transition is valid (no-op)
  if (currentStatus === newStatus) {
    return { isValid: true, errors: [] };
  }

  // Validate transition based on status types and explicit transition rules
  // Permissive design: Allow all transitions except those explicitly blocked
  if (currentStatusConfig && newStatusConfig) {
    // First, check if explicit transition rules are defined for the current status
    // If transitions array is defined, only transitions to those statuses are allowed
    if (currentStatusConfig.transitions !== undefined && currentStatusConfig.transitions.length > 0) {
      if (!currentStatusConfig.transitions.includes(newStatus)) {
        const allowedStatusNames = currentStatusConfig.transitions
          .map(key => {
            const status = config.workflow.statuses.find(s => s.key === key);
            return status ? `"${status.name}" (${key})` : key;
          })
          .join(', ');
        
        errors.push({
          field: 'status',
          message: `Cannot move from "${currentStatusConfig.name}" to "${newStatusConfig.name}". Allowed transitions from "${currentStatusConfig.name}": ${allowedStatusNames}. See your project configuration for transition rules.`,
        });
        return { isValid: false, errors };
      }
    }

    // Second, apply built-in type-based restrictions
    // Only restriction: Cannot transition from closed to open/in_progress (except via "reopened")
    // Exception: Can transition to "reopened" status (type: in_progress) if configured
    if (currentStatusConfig.type === 'closed') {
      if (newStatusConfig.type !== 'closed') {
        // Check if target is a "reopened" status (common pattern for reopening closed issues)
        const isReopenedStatus = newStatusConfig.key === 'reopened' || newStatusConfig.name.toLowerCase() === 'reopened';
        
        if (isReopenedStatus) {
          // This is allowed - reopening closed issues via "reopened" status
          // No error needed
        } else {
          // Suggest using "reopened" status if available, or adding it to config
          const hasReopenedStatus = config.workflow.statuses.some(
            s => s.key === 'reopened' || s.name.toLowerCase() === 'reopened'
          );
          
          if (hasReopenedStatus) {
            errors.push({
              field: 'status',
              message: `Cannot move from "${currentStatusConfig.name}" (closed status) to "${newStatusConfig.name}". To reopen closed issues, move to the "Reopened" status instead. See the [configuration troubleshooting guide](/docs/configuration-troubleshooting#cannot-transition-from-closed-status) for details.`,
            });
          } else {
            errors.push({
              field: 'status',
              message: `Cannot move from "${currentStatusConfig.name}" (closed status) to "${newStatusConfig.name}". Closed issues can only move to other closed statuses. To enable reopening, add a "reopened" status with type "in_progress" to your configuration. The default configuration includes this status. See the [configuration troubleshooting guide](/docs/configuration-troubleshooting#cannot-transition-from-closed-status) for details.`,
            });
          }
        }
      }
      // If target is also closed, allow the transition (closed → closed)
      // No error needed
    }

    // All other transitions are allowed in permissive design:
    // - open ↔ in_progress (any status, bidirectional)
    // - open → closed
    // - in_progress ↔ in_progress (any status, bidirectional)
    // - in_progress → closed
    // - in_progress → open (bidirectional)
    // These are all allowed, so no additional validation needed
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
      <div className="flex gap-4 overflow-x-auto pb-4 pr-4">
        {visibleStatuses.map((status) => (
          <KanbanColumn
            key={status.key}
            status={status}
            issues={issuesByStatus[status.key] || []}
            onIssueClick={onIssueClick}
            isValidDrop={getIsValidDrop(status.key)}
            users={users}
            projectConfig={projectConfig}
          />
        ))}
      </div>
        <DragOverlay>
          {activeIssue ? (
            <div className="rotate-3 opacity-90">
              <IssueCard issue={activeIssue} isDragging projectConfig={projectConfig} />
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


'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { Badge, type BadgeProps } from '../atoms/Badge';
import type { Issue, IssueType, Priority } from '@stride/types';

export interface IssueCardProps {
  /**
   * Issue data to display
   */
  issue: Issue;
  /**
   * Whether the card is being dragged
   */
  isDragging?: boolean;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * IssueCard component
 * 
 * Displays a single issue in a compact card format for use in Kanban boards.
 * Shows key information: title, key, type, priority, and assignee.
 */
export function IssueCard({
  issue,
  isDragging = false,
  onClick,
  className,
}: IssueCardProps) {
  const getTypeVariant = (type: IssueType): BadgeProps['variant'] => {
    switch (type) {
      case 'Bug':
        return 'error';
      case 'Feature':
        return 'success';
      case 'Epic':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityVariant = (priority?: Priority): BadgeProps['variant'] => {
    switch (priority) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-lg border bg-background p-3 shadow-sm',
        'transition-all hover:shadow-md',
        'focus-ring focus-visible:outline-none',
        isDragging && 'opacity-50 shadow-lg',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`Issue ${issue.key}: ${issue.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground-secondary">
              {issue.key}
            </span>
            <Badge variant={getTypeVariant(issue.type)} size="sm">
              {issue.type}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
            {issue.title}
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          {issue.priority && (
            <Badge variant={getPriorityVariant(issue.priority)} size="sm">
              {issue.priority}
            </Badge>
          )}
          {issue.storyPoints !== undefined && issue.storyPoints !== null && (
            <span className="text-xs text-foreground-secondary">
              {issue.storyPoints} SP
            </span>
          )}
        </div>
        {issue.assigneeId && (
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-medium flex items-center justify-center border border-accent/20"
            title="Assigned"
            aria-label="Assigned"
          >
            {issue.assigneeId.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}


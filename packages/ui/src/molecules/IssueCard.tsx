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
  onClick?: (e: React.MouseEvent) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Optional list of users for assignee display (to avoid per-card fetching)
   * If provided, assignee will show initials/avatar with name on hover
   */
  users?: Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
}

/**
 * IssueCard component
 * 
 * Displays a single issue in a compact card format for use in Kanban boards.
 * Shows key information: title, key, type, priority, and assignee.
 */
/**
 * Component to display assignee avatar/initials with name on hover
 */
function AssigneeAvatar({
  assigneeId,
  users,
}: {
  assigneeId: string;
  users?: Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
}) {
  const [user, setUser] = React.useState<{
    name: string | null;
    username: string;
    avatarUrl: string | null;
  } | null>(null);

  React.useEffect(() => {
    // If users list is provided, use it (no fetch needed)
    if (users) {
      const foundUser = users.find((u) => u.id === assigneeId);
      if (foundUser) {
        setUser({
          name: foundUser.name,
          username: foundUser.username,
          avatarUrl: foundUser.avatarUrl,
        });
      }
      return;
    }

    // Otherwise, fetch user data (fallback for when users list not available)
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        const foundUser = data.users?.find((u: { id: string }) => u.id === assigneeId);
        if (foundUser) {
          setUser({
            name: foundUser.name,
            username: foundUser.username,
            avatarUrl: foundUser.avatarUrl,
          });
        }
      })
      .catch(() => {
        // Silent fail - will show initials from ID as fallback
      });
  }, [assigneeId, users]);

  // Generate initials from name or username
  const getInitials = (): string => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      const firstPart = parts[0];
      const lastPart = parts[parts.length - 1];
      const firstChar = firstPart?.[0];
      const lastChar = lastPart?.[0];
      if (parts.length >= 2 && firstChar && lastChar) {
        return (firstChar + lastChar).toUpperCase();
      }
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    // Fallback to first 2 chars of ID
    return assigneeId.slice(0, 2).toUpperCase();
  };

  // Generate tooltip text
  const getTooltip = (): string => {
    if (user?.name) {
      return `${user.name} (${user.username})`;
    }
    if (user?.username) {
      return user.username;
    }
    return 'Assigned';
  };

  return (
    <div
      className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-medium flex items-center justify-center border border-accent/20 overflow-hidden"
      title={getTooltip()}
      aria-label={`Assigned to ${getTooltip()}`}
    >
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={getTooltip()}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials()}</span>
      )}
    </div>
  );
}

export function IssueCard({
  issue,
  isDragging = false,
  onClick,
  className,
  users,
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
        'group cursor-pointer rounded-lg border border-border dark:border-border-dark',
        'bg-background dark:bg-background-dark p-3 shadow-sm',
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
            <span className="text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
              {issue.key}
            </span>
            <Badge variant={getTypeVariant(issue.type)} size="sm">
              {issue.type}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground dark:text-foreground-dark line-clamp-2 mb-2">
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
            <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              {issue.storyPoints} SP
            </span>
          )}
        </div>
        {issue.assigneeId && (
          <AssigneeAvatar assigneeId={issue.assigneeId} users={users} />
        )}
      </div>
    </div>
  );
}


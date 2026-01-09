'use client';

import * as React from 'react';
import { Badge, cn } from '@stride/ui';

export interface UserListItem {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: 'Admin' | 'Member' | 'Viewer';
  createdAt: Date | string;
}

export interface UserListProps {
  users: UserListItem[];
  className?: string;
}

type SortField = 'createdAt' | 'email' | 'username' | 'name';
type SortDirection = 'asc' | 'desc';

/**
 * UserList component
 * 
 * Displays users in a table format with sorting by created date (newest first by default).
 * Shows email, username, name, role badge, and created date.
 */
export function UserList({ users: initialUsers, className }: UserListProps) {
  const [sortField, setSortField] = React.useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');

  // Sort users based on current sort settings
  const sortedUsers = React.useMemo(() => {
    const sorted = [...initialUsers].sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortField) {
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'name':
          aValue = (a.name || a.username).toLowerCase();
          bValue = (b.name || b.username).toLowerCase();
          break;
        case 'createdAt':
        default:
          aValue = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
          bValue = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
          break;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [initialUsers, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setSortField(field);
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const roleColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    Admin: 'error',
    Member: 'success',
    Viewer: 'info',
  } as const;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-foreground-secondary dark:text-foreground-dark-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg
        className="w-4 h-4 text-foreground dark:text-foreground-dark"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-foreground dark:text-foreground-dark"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  if (sortedUsers.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          No users found.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border dark:border-border-dark">
            <th className="text-left py-3 px-4">
              <button
                onClick={() => handleSort('email')}
                className="flex items-center gap-2 text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark transition-colors focus-ring rounded"
              >
                Email
                <SortIcon field="email" />
              </button>
            </th>
            <th className="text-left py-3 px-4">
              <button
                onClick={() => handleSort('username')}
                className="flex items-center gap-2 text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark transition-colors focus-ring rounded"
              >
                Username
                <SortIcon field="username" />
              </button>
            </th>
            <th className="text-left py-3 px-4">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-2 text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark transition-colors focus-ring rounded"
              >
                Name
                <SortIcon field="name" />
              </button>
            </th>
            <th className="text-left py-3 px-4">
              <span className="text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
                Role
              </span>
            </th>
            <th className="text-left py-3 px-4">
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center gap-2 text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark transition-colors focus-ring rounded"
              >
                Created
                <SortIcon field="createdAt" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr
              key={user.id}
              className="border-b border-border dark:border-border-dark hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors"
            >
              <td className="py-3 px-4">
                <span className="text-sm text-foreground dark:text-foreground-dark">
                  {user.email}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm font-medium text-foreground dark:text-foreground-dark">
                  {user.username}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-foreground dark:text-foreground-dark">
                  {user.name || '-'}
                </span>
              </td>
              <td className="py-3 px-4">
                <Badge variant={roleColors[user.role] || 'default'}>
                  {user.role}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                  {formatDate(user.createdAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

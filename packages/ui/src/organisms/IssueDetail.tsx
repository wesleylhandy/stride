'use client';

import * as React from 'react';
import type { Issue, UpdateIssueInput } from '@stride/types';
import type { ProjectConfig, CustomFieldConfig } from '@stride/yaml-config';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { MarkdownRenderer } from '../molecules/MarkdownRenderer';
import { IssueForm } from './IssueForm';
import { cn } from '../utils/cn';

export interface IssueBranch {
  id: string;
  branchName: string;
  pullRequestUrl?: string | null;
  pullRequestNumber?: number | null;
  pullRequestStatus?: 'Open' | 'Merged' | 'Closed' | null;
  lastCommitSha?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IssueDetailProps {
  /**
   * Issue data
   */
  issue: Issue;
  /**
   * Project configuration (for custom fields and statuses)
   */
  projectConfig?: ProjectConfig;
  /**
   * Linked branches and PRs
   */
  branches?: IssueBranch[];
  /**
   * Whether user can edit
   */
  canEdit?: boolean;
  /**
   * Callback when issue is updated
   */
  onUpdate?: (data: UpdateIssueInput) => Promise<void>;
  /**
   * Callback when status is changed
   */
  onStatusChange?: (newStatus: string) => Promise<void>;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Format date for display
 */
function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Get badge variant for status type
 */
function getStatusVariant(
  statusType: 'open' | 'in_progress' | 'closed',
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (statusType) {
    case 'open':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'closed':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Get badge variant for priority
 */
function getPriorityVariant(
  priority?: string,
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (priority) {
    case 'Critical':
      return 'error';
    case 'High':
      return 'warning';
    case 'Medium':
      return 'info';
    case 'Low':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Render custom field value
 */
function renderCustomFieldValue(
  field: CustomFieldConfig,
  value: unknown,
): React.ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span className="text-foreground-secondary">Not set</span>;
  }

  switch (field.type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'date':
      if (typeof value === 'string' || value instanceof Date) {
        return formatDate(typeof value === 'string' ? new Date(value) : value);
      }
      return String(value);
    default:
      return String(value);
  }
}

/**
 * IssueDetail component
 * 
 * Displays issue information with edit functionality and status change UI.
 */
export function IssueDetail({
  issue,
  projectConfig,
  branches = [],
  canEdit = false,
  onUpdate,
  onStatusChange,
  className,
}: IssueDetailProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Get status configuration
  const statusConfig = projectConfig?.workflow.statuses.find(
    (s) => s.key === issue.status,
  );

  // Get available statuses for status change
  const availableStatuses = projectConfig?.workflow.statuses || [];

  const handleUpdate = async (data: UpdateIssueInput) => {
    if (!onUpdate) return;

    setIsUpdating(true);
    try {
      await onUpdate(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update issue:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;

    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Failed to change status:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  if (isEditing && canEdit) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Issue</h2>
          <Button
            variant="ghost"
            onClick={() => setIsEditing(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
        </div>
        <IssueForm
          projectId={issue.projectId}
          projectConfig={projectConfig}
          initialValues={{
            title: issue.title,
            description: issue.description,
            status: issue.status,
            type: issue.type,
            priority: issue.priority,
            assigneeId: issue.assigneeId || undefined,
            cycleId: issue.cycleId || undefined,
            storyPoints: issue.storyPoints,
            customFields: issue.customFields,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isUpdating}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{issue.title}</h1>
            <Badge variant={getStatusVariant(statusConfig?.type || 'open')}>
              {statusConfig?.name || issue.status}
            </Badge>
            {issue.priority && (
              <Badge variant={getPriorityVariant(issue.priority)}>
                {issue.priority}
              </Badge>
            )}
          </div>
          <div className="text-sm text-foreground-secondary">
            <span className="font-medium">{issue.key}</span>
            {' • '}
            <span>Created {formatDate(issue.createdAt)}</span>
            {issue.updatedAt && issue.updatedAt !== issue.createdAt && (
              <>
                {' • '}
                <span>Updated {formatDate(issue.updatedAt)}</span>
              </>
            )}
          </div>
        </div>
        {canEdit && (
          <Button
            variant="secondary"
            onClick={() => setIsEditing(true)}
            disabled={isUpdating}
          >
            Edit
          </Button>
        )}
      </div>

      {/* Status Change UI (T130) */}
      {canEdit && onStatusChange && availableStatuses.length > 0 && (
        <div className="p-4 bg-background-secondary rounded-lg border border-border">
          <label
            htmlFor="status-change"
            className="block text-sm font-medium mb-2"
          >
            Change Status
          </label>
          <div className="flex items-center gap-3">
            <select
              id="status-change"
              value={issue.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className={cn(
                'flex h-10 rounded-md border bg-background px-3 py-2 text-sm',
                'transition-colors focus-ring',
                'border-border hover:border-border-hover focus-visible:border-border-focus'
              )}
            >
              {availableStatuses.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.name}
                </option>
              ))}
            </select>
            {isUpdating && (
              <span className="text-sm text-foreground-secondary">
                Updating...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Issue Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-sm font-medium text-foreground-secondary">
              Type
            </label>
            <p className="mt-1 text-foreground">{issue.type}</p>
          </div>

          {/* Priority */}
          {issue.priority && (
            <div>
              <label className="text-sm font-medium text-foreground-secondary">
                Priority
              </label>
              <p className="mt-1">
                <Badge variant={getPriorityVariant(issue.priority)}>
                  {issue.priority}
                </Badge>
              </p>
            </div>
          )}

          {/* Story Points */}
          {issue.storyPoints !== undefined && (
            <div>
              <label className="text-sm font-medium text-foreground-secondary">
                Story Points
              </label>
              <p className="mt-1 text-foreground">{issue.storyPoints}</p>
            </div>
          )}

          {/* Assignee */}
          {issue.assigneeId && (
            <div>
              <label className="text-sm font-medium text-foreground-secondary">
                Assignee
              </label>
              <p className="mt-1 text-foreground">
                {issue.assigneeId} {/* TODO: Fetch and display user name */}
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Reporter */}
          <div>
            <label className="text-sm font-medium text-foreground-secondary">
              Reporter
            </label>
            <p className="mt-1 text-foreground">
              {issue.reporterId} {/* TODO: Fetch and display user name */}
            </p>
          </div>

          {/* Created At */}
          <div>
            <label className="text-sm font-medium text-foreground-secondary">
              Created
            </label>
            <p className="mt-1 text-foreground">{formatDate(issue.createdAt)}</p>
          </div>

          {/* Updated At */}
          {issue.updatedAt && (
            <div>
              <label className="text-sm font-medium text-foreground-secondary">
                Last Updated
              </label>
              <p className="mt-1 text-foreground">
                {formatDate(issue.updatedAt)}
              </p>
            </div>
          )}

          {/* Closed At */}
          {issue.closedAt && (
            <div>
              <label className="text-sm font-medium text-foreground-secondary">
                Closed
              </label>
              <p className="mt-1 text-foreground">{formatDate(issue.closedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {issue.description && (
        <div>
          <label className="text-sm font-medium text-foreground-secondary mb-2 block">
            Description
          </label>
          <div className="mt-2">
            <MarkdownRenderer content={issue.description} />
          </div>
        </div>
      )}

      {/* Custom Fields (T127) */}
      {projectConfig?.custom_fields &&
        projectConfig.custom_fields.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Custom Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectConfig.custom_fields.map((field) => {
                const value = issue.customFields[field.key];
                return (
                  <div key={field.key}>
                    <label className="text-sm font-medium text-foreground-secondary">
                      {field.name}
                    </label>
                    <p className="mt-1 text-foreground">
                      {renderCustomFieldValue(field, value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Linked Branches/PRs (T213-T216) */}
      {branches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Linked Branches & Pull Requests</h3>
          <div className="space-y-3">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="p-4 bg-background-secondary rounded-lg border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded border border-border">
                        {branch.branchName}
                      </code>
                      {branch.pullRequestStatus && (
                        <Badge
                          variant={
                            branch.pullRequestStatus === 'Merged'
                              ? 'success'
                              : branch.pullRequestStatus === 'Closed'
                              ? 'error'
                              : 'info'
                          }
                        >
                          {branch.pullRequestStatus}
                        </Badge>
                      )}
                    </div>
                    {branch.pullRequestUrl && (
                      <div className="mb-2">
                        <a
                          href={branch.pullRequestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <span>PR #{branch.pullRequestNumber}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    )}
                    {branch.lastCommitSha && (
                      <div className="text-xs text-foreground-secondary font-mono">
                        Latest commit: {branch.lastCommitSha.substring(0, 7)}
                      </div>
                    )}
                    <div className="text-xs text-foreground-secondary mt-1">
                      Linked {formatDate(branch.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


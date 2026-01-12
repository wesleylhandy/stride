'use client';

import * as React from 'react';
import { Button } from '../atoms/Button';
import { AISummary } from '../molecules/AISummary';
import { AIPrioritySuggestion } from '../molecules/AIPrioritySuggestion';
import { AIAssigneeSuggestion, type User } from '../molecules/AIAssigneeSuggestion';
import { cn } from '../utils/cn';

export interface AITriageAnalysisData {
  summary: string;
  priority: string;
  suggestedAssignee: string;
}

export interface AITriageAnalysisProps {
  /**
   * Issue ID
   */
  issueId: string;
  /**
   * Project ID
   */
  projectId: string;
  /**
   * Issue key for API calls
   */
  issueKey: string;
  /**
   * Available priority values from project config
   */
  availablePriorities?: string[];
  /**
   * Project members for assignee selection
   */
  projectMembers?: User[];
  /**
   * Callback when priority is accepted (optional - will update issue via API if not provided)
   */
  onPriorityAccepted?: (priority: string) => void;
  /**
   * Callback when assignee is selected (optional - will update issue via API if not provided)
   */
  onAssigneeSelected?: (userId: string) => void;
  /**
   * Callback to refresh issue data after update
   */
  onIssueUpdate?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * AITriageAnalysis component
 * Expandable accordion section displaying AI triage analysis
 * Positioned after issue details, before comments
 */
export function AITriageAnalysis({
  issueId: _issueId,
  projectId,
  issueKey,
  availablePriorities,
  projectMembers = [],
  onPriorityAccepted,
  onAssigneeSelected,
  onIssueUpdate,
  className,
}: AITriageAnalysisProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<AITriageAnalysisData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [fetchedProjectMembers, setFetchedProjectMembers] = React.useState<User[]>([]);

  // Fetch project members when component mounts or when we need them
  React.useEffect(() => {
    // Only fetch if we don't have members passed as prop
    if (projectMembers.length === 0) {
      fetch('/api/users')
        .then((res) => {
          if (!res.ok) return;
          return res.json();
        })
        .then((data) => {
          if (data?.users) {
            setFetchedProjectMembers(data.users.map((u: {
              id: string;
              username: string;
              name: string | null;
              avatarUrl: string | null;
            }) => ({
              id: u.id,
              username: u.username,
              name: u.name,
              avatarUrl: u.avatarUrl,
            })));
          }
        })
        .catch(() => {
          // Silent fail - assignee selection won't work but rest of component will
        });
    }
  }, [projectMembers.length]);

  // Use provided members or fetched members
  const membersToUse = projectMembers.length > 0 ? projectMembers : fetchedProjectMembers;

  // Fetch AI triage analysis
  const fetchAnalysis = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/issues/${issueKey}/ai-triage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to use AI triage');
        }
        if (response.status === 503) {
          throw new Error('AI Gateway is unavailable. Please check your configuration.');
        }
        if (response.status === 504) {
          throw new Error('AI analysis request timed out. Please try again.');
        }
        if (response.status === 502) {
          throw new Error('Invalid AI Gateway response. Please try again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to analyze issue');
      }

      const data = await response.json() as AITriageAnalysisData;
      setAnalysis(data);
      setIsExpanded(true); // Auto-expand when analysis is available
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while analyzing the issue';
      setError(errorMessage);
      console.error('AI triage error:', err);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [projectId, issueKey]);

  // Retry handler
  const handleRetry = React.useCallback(() => {
    setIsRetrying(true);
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Dismiss handler
  const handleDismiss = React.useCallback(() => {
    setIsExpanded(false);
    setAnalysis(null);
    setError(null);
  }, []);

  // Handle priority accept - update issue via API if callback not provided
  const handlePriorityAccept = React.useCallback(async (priority: string) => {
    if (onPriorityAccepted) {
      onPriorityAccepted(priority);
      return;
    }

    // Update issue via API
    try {
      const response = await fetch(
        `/api/projects/${projectId}/issues/${issueKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priority }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update priority');
      }

      // Refresh issue data
      if (onIssueUpdate) {
        onIssueUpdate();
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
      // Show error but don't block UI
    }
  }, [onPriorityAccepted, projectId, issueKey, onIssueUpdate]);

  // Handle assignee select - update issue via API if callback not provided
  const handleAssigneeSelect = React.useCallback(async (userId: string) => {
    if (onAssigneeSelected) {
      onAssigneeSelected(userId);
      return;
    }

    // Update issue via API
    try {
      const response = await fetch(
        `/api/projects/${projectId}/issues/${issueKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assigneeId: userId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update assignee');
      }

      // Refresh issue data
      if (onIssueUpdate) {
        onIssueUpdate();
      }
    } catch (error) {
      console.error('Failed to update assignee:', error);
      // Show error but don't block UI
    }
  }, [onAssigneeSelected, projectId, issueKey, onIssueUpdate]);

  if (!analysis && !isLoading && !error) {
    // Show trigger button when no analysis yet
    return (
      <div className={cn('space-y-4', className)}>
        <Button
          variant="secondary"
          onClick={fetchAnalysis}
          disabled={isLoading}
          loading={isLoading}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Triage with AI
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border dark:border-border-dark',
        'bg-background dark:bg-background-dark',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-4',
          'text-left transition-colors',
          'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
          'focus-ring'
        )}
        aria-expanded={isExpanded}
        aria-controls="ai-triage-content"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            AI Triage Analysis
          </h2>
          {analysis && (
            <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
              Analysis Ready
            </span>
          )}
        </div>
        <svg
          className={cn(
            'w-5 h-5 text-foreground-secondary dark:text-foreground-dark-secondary transition-transform',
            isExpanded && 'transform rotate-180'
          )}
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
      </button>

      {/* Content */}
      {isExpanded && (
        <div id="ai-triage-content" className="p-4 space-y-4 border-t border-border dark:border-border-dark">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                  Analyzing issue...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-error/10 border border-error rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-error mb-1">
                    Analysis Failed
                  </h3>
                  <p className="text-sm text-error/80">{error}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRetry}
                    disabled={isRetrying}
                    loading={isRetrying}
                  >
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {analysis && !isLoading && !error && (
            <div className="space-y-4">
              <AISummary summary={analysis.summary} />
              <AIPrioritySuggestion
                priority={analysis.priority}
                availablePriorities={availablePriorities}
                onAccept={handlePriorityAccept}
              />
              <AIAssigneeSuggestion
                suggestedAssignee={analysis.suggestedAssignee}
                projectMembers={membersToUse}
                onSelectAssignee={handleAssigneeSelect}
              />
              <div className="flex justify-end pt-2 border-t border-border dark:border-border-dark">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

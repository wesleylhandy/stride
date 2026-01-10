import { notFound } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository, issueRepository, prisma } from '@stride/database';
import type { ProjectConfig, StatusConfig } from '@stride/types';
import { PageContainer } from '@/components/templates/PageContainer';
import { Badge } from '@stride/ui';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Issues List Page
 * 
 * Displays all issues for the project in a list view.
 * 
 * Note: This is a placeholder page. Full implementation is planned for Phase 7.6.
 */
export default async function IssuesListPage({ params }: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;

  // Authenticate user
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || 'status' in authResult) {
    notFound();
  }

  // Fetch project
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  // Fetch issues
  const issues = await issueRepository.findMany({
    projectId,
  });

  // Get project config
  const projectConfigData = await projectRepository.getConfig(projectId);
  const projectConfig = projectConfigData?.config as unknown as ProjectConfig | undefined;

  // Fetch assignees for all issues that have assignees
  const assigneeIds = issues
    .map((issue) => issue.assigneeId)
    .filter((id): id is string => id !== null && id !== undefined);

  // Fetch users for assignees
  const assignees = assigneeIds.length > 0
    ? await prisma.user.findMany({
        where: {
          id: { in: assigneeIds },
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
        },
      })
    : [];

  // Create a map for quick lookup
  const assigneeMap = new Map(
    assignees.map((user) => [user.id, user])
  );

  // Helper function to get assignee display name
  const getAssigneeDisplay = (assigneeId: string | null | undefined): string | null => {
    if (!assigneeId) return null;
    const user = assigneeMap.get(assigneeId);
    if (!user) return null;
    return user.name ? `${user.name} (${user.username})` : user.username;
  };

  // Helper function to get status variant (matching IssueDetail)
  const getStatusVariant = (
    statusType: 'open' | 'in_progress' | 'closed',
  ): 'default' | 'success' | 'warning' | 'error' | 'info' => {
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
  };

  // Helper function to get type variant (matching IssueCard)
  const getTypeVariant = (type: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
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

  // Helper function to get priority variant (matching IssueDetail)
  const getPriorityVariant = (
    priority?: string | null,
  ): 'default' | 'success' | 'warning' | 'error' | 'info' => {
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
  };

  // Helper function to get status config and display name
  const getStatusDisplay = (statusKey: string): { name: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' } => {
    if (!projectConfig) {
      return { name: statusKey, variant: 'default' };
    }
    const statusConfig = projectConfig.workflow.statuses.find(
      (s: StatusConfig) => s.key === statusKey,
    );
    if (!statusConfig) {
      return { name: statusKey, variant: 'default' };
    }
    return {
      name: statusConfig.name,
      variant: getStatusVariant(statusConfig.type),
    };
  };

  return (
    <PageContainer variant="full" className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Issues
        </h2>
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
            No issues found. Create your first issue using the command palette (Cmd/Ctrl+K).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const statusDisplay = getStatusDisplay(issue.status);
            const assigneeDisplay = getAssigneeDisplay(issue.assigneeId);
            return (
              <div
                key={issue.id}
                className="p-4 border border-border dark:border-border-dark rounded-md bg-surface dark:bg-surface-dark hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors hover:shadow-sm"
              >
                <a
                  href={`/projects/${projectId}/issues/${issue.key}`}
                  className="block"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    {/* Issue content - flex-1 with min-w-0 to allow truncation */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
                          {issue.key}
                        </span>
                        <Badge variant={getTypeVariant(issue.type)} size="sm">
                          {issue.type}
                        </Badge>
                        <Badge variant={statusDisplay.variant} size="sm">
                          {statusDisplay.name}
                        </Badge>
                        {issue.priority && (
                          <Badge variant={getPriorityVariant(issue.priority)} size="sm">
                            {issue.priority}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-foreground dark:text-foreground-dark truncate">
                        {issue.title}
                      </h3>
                      {issue.description && (
                        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-1 line-clamp-2">
                          {issue.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {issue.storyPoints !== undefined && issue.storyPoints !== null && (
                          <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                            {issue.storyPoints} SP
                          </span>
                        )}
                        {/* Assignee on mobile - show inline with other metadata */}
                        {assigneeDisplay && (
                          <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary sm:hidden">
                            <span className="font-medium text-foreground dark:text-foreground-dark">{assigneeDisplay}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Assignee on desktop - show on right side */}
                    {assigneeDisplay && (
                      <div className="hidden sm:block flex-shrink-0 min-w-[120px] text-right">
                        <div className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                          Assigned to
                        </div>
                        <div className="text-sm font-medium text-foreground dark:text-foreground-dark">
                          {assigneeDisplay}
                        </div>
                      </div>
                    )}
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}


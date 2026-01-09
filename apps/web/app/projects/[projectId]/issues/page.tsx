import { notFound } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository, issueRepository } from '@stride/database';
import type { ProjectConfig, StatusConfig } from '@stride/types';

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

  // Helper function to get user-friendly status name from configuration
  const getStatusDisplayName = (statusKey: string): string => {
    if (!project.config) {
      return statusKey;
    }
    const projectConfig = project.config as unknown as ProjectConfig;
    const statusConfig = projectConfig.workflow.statuses.find(
      (s: StatusConfig) => s.key === statusKey,
    );
    return statusConfig?.name || statusKey;
  };

  return (
    <div className="py-6">
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
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="p-4 border border-border dark:border-border-dark rounded-md bg-surface dark:bg-surface-dark hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors"
            >
              <a
                href={`/projects/${projectId}/issues/${issue.key}`}
                className="block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground dark:text-foreground-dark">
                      {issue.key}: {issue.title}
                    </h3>
                    {issue.description && (
                      <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-1 line-clamp-2">
                        {issue.description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                    {getStatusDisplayName(issue.status)}
                  </span>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


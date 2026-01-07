import { notFound } from 'next/navigation';
import { IssueDetail } from '@stride/ui';
import { projectRepository, issueRepository, issueBranchRepository } from '@stride/database';
import { canUpdateIssue } from '@/lib/auth/permissions';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';

interface PageParams {
  params: Promise<{
    projectId: string;
    issueKey: string;
  }>;
}

/**
 * Issue Detail Page
 * 
 * Displays issue details with edit functionality and status change UI.
 */
export default async function IssueDetailPage({ params }: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId, issueKey } = await params;

  // Get auth (this will redirect if not authenticated)
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || 'status' in authResult) {
    notFound();
  }

  const session = authResult;

  // Fetch project to get config
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  // Fetch issue directly from repository
  const issue = await issueRepository.findByKey(
    projectId,
    issueKey,
  );

  if (!issue) {
    notFound();
  }

  // Fetch linked branches and PRs
  const branches = await issueBranchRepository.findByIssueId(issue.id);

  // Check edit permissions
  const canEdit = canUpdateIssue(session.role);

  // Note: Update and status change handlers should be implemented as Server Actions
  // For now, we'll pass undefined and let the component handle client-side API calls

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <IssueDetail
        issue={issue}
        projectConfig={project.config || undefined}
        branches={branches}
        canEdit={canEdit}
      />
    </div>
  );
}


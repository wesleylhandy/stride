import { notFound } from 'next/navigation';
import { IssueDetailClient } from '@/components/IssueDetailClient';
import { projectRepository, issueRepository, issueBranchRepository } from '@stride/database';
import type { Issue, ProjectConfig, IssueType, Priority } from '@stride/types';
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

  // Fetch project to verify it exists
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  // Fetch project config (stored as JSONB, already parsed)
  const projectConfigData = await projectRepository.getConfig(projectId);
  if (!projectConfigData || !projectConfigData.config) {
    notFound();
  }

  // project.config is stored as JSONB (already parsed) - cast through unknown first
  // No need to parse YAML - this ensures we use the exact config stored in database
  const projectConfig = projectConfigData.config as unknown as ProjectConfig;

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

  // Convert Prisma issue to @stride/types Issue (null -> undefined, enum conversion)
  const typedIssue: Issue = {
    ...issue,
    description: issue.description ?? undefined,
    assigneeId: issue.assigneeId ?? undefined,
    cycleId: issue.cycleId ?? undefined,
    closedAt: issue.closedAt ?? undefined,
    type: issue.type as IssueType,
    priority: issue.priority ? (issue.priority as Priority) : undefined,
    customFields: (issue.customFields as Record<string, unknown>) || {},
    storyPoints: issue.storyPoints ?? undefined,
  };

  // Check edit permissions
  const canEdit = canUpdateIssue(session.role);

  // Note: Update and status change handlers should be implemented as Server Actions
  // For now, we'll pass undefined and let the component handle client-side API calls

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <IssueDetailClient
        issue={typedIssue}
        projectId={projectId}
        projectConfig={projectConfig}
        branches={branches}
        canEdit={canEdit}
      />
    </div>
  );
}


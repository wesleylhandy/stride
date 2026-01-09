import { notFound } from 'next/navigation';
import { KanbanBoard } from '@stride/ui';
import { projectRepository, issueRepository } from '@stride/database';
import type { Issue, ProjectConfig, IssueType, Priority } from '@stride/types';
import type { ProjectConfig as YAMLProjectConfig } from '@stride/yaml-config';
import { canUpdateIssue } from '@/lib/auth/permissions';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { KanbanBoardClient } from '@/components/KanbanBoardClient';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Kanban Board Page
 * 
 * Displays issues in a Kanban board layout with drag-and-drop support.
 * 
 * Features:
 * - Drag-and-drop status changes (T155)
 * - Workflow validation (T164-T165)
 * - Real-time updates
 */
export default async function KanbanBoardPage({ params }: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;

  // Get auth (layout handles redirect, but we need session for permissions)
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || 'status' in authResult) {
    notFound();
  }

  const session = authResult;

  // Verify project exists
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  // Always fetch fresh config from database to ensure rule enforcement is dynamic and responsive
  // This ensures that when configuration changes, validation immediately reflects those changes
  const projectConfigData = await projectRepository.getConfig(projectId);
  if (!projectConfigData || !projectConfigData.config) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          Project configuration not found
        </p>
      </div>
    );
  }

  // project.config is stored as JSONB (already parsed) - cast directly to ProjectConfig
  // No need to parse YAML - this ensures we use the exact config stored in database
  const projectConfig = projectConfigData.config as YAMLProjectConfig;

  // Fetch all issues for the project
  const issues = await issueRepository.findMany({
    projectId,
  });

  // Convert Prisma issues to @stride/types Issue (null -> undefined, enum conversion)
  const typedIssues: Issue[] = issues.map((issue) => ({
    ...issue,
    description: issue.description ?? undefined,
    assigneeId: issue.assigneeId ?? undefined,
    cycleId: issue.cycleId ?? undefined,
    closedAt: issue.closedAt ?? undefined,
    type: issue.type as IssueType, // Cast Prisma enum to @stride/types enum
    priority: issue.priority ? (issue.priority as Priority) : undefined, // Cast Prisma enum to @stride/types enum
    customFields: (issue.customFields as Record<string, unknown>) || {},
    storyPoints: issue.storyPoints ?? undefined,
  }));

  // Check edit permissions
  const canEdit = canUpdateIssue(session.role);

  return (
    <div className="py-6">
      <KanbanBoardClient
        projectId={projectId}
        initialIssues={typedIssues}
        projectConfig={projectConfig as ProjectConfig}
        canEdit={canEdit}
      />
    </div>
  );
}


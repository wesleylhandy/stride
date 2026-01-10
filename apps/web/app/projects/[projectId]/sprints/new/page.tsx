import { notFound, redirect } from 'next/navigation';
import { cycleRepository, issueRepository, projectRepository } from '@stride/database';
import type { Issue, Cycle, IssueType, Priority } from '@stride/types';
import { canUpdateCycle, canViewCycle } from '@/lib/auth/permissions';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { SprintPlanningClient } from '@/components/SprintPlanningClient';
import { BurndownChartClient } from '@/components/BurndownChartClient';
import { PageContainer } from '@/components/templates/PageContainer';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    cycleId?: string;
  }>;
}

/**
 * Sprint Planning Page
 * 
 * Displays sprint planning interface for creating or editing a sprint.
 * 
 * Features:
 * - Drag-and-drop issue assignment (T224)
 * - Sprint capacity display (T225)
 * - Story points tracking (T226)
 * - Sprint goal input (T227)
 * - Issue assignment (T228)
 */
export default async function SprintPlanningPage({
  params,
  searchParams,
}: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;
  const { cycleId } = await searchParams;

  // Get auth
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || 'status' in authResult) {
    notFound();
  }

  const session = authResult;

  // Check permission to view cycles
  if (!canViewCycle(session.role)) {
    notFound();
  }

  // Fetch project
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  // If cycleId is provided, load that cycle; otherwise redirect to cycles list
  if (!cycleId) {
    // Redirect to cycles list or create new cycle page
    redirect(`/projects/${projectId}/sprints`);
  }

  // Fetch cycle
  const cycle = await cycleRepository.findById(cycleId);
  if (!cycle || cycle.projectId !== projectId) {
    notFound();
  }

  // Fetch issues assigned to this cycle
  const sprintIssues = await cycleRepository.getIssues(cycleId);

  // Fetch backlog issues (issues not assigned to any cycle)
  const allIssues = await issueRepository.findMany({
    projectId,
  });
  const backlogIssues = allIssues.filter((issue) => !issue.cycleId);

  // Convert Prisma issues to @stride/types Issue (null -> undefined, enum conversion)
  const typedSprintIssues: Issue[] = sprintIssues.map((issue) => ({
    ...issue,
    description: issue.description ?? undefined,
    assigneeId: issue.assigneeId ?? undefined,
    cycleId: issue.cycleId ?? undefined,
    closedAt: issue.closedAt ?? undefined,
    type: issue.type as IssueType,
    priority: issue.priority ? (issue.priority as Priority) : undefined,
    customFields: (issue.customFields as Record<string, unknown>) || {},
    storyPoints: issue.storyPoints ?? undefined,
  }));
  const typedBacklogIssues: Issue[] = backlogIssues.map((issue) => ({
    ...issue,
    description: issue.description ?? undefined,
    assigneeId: issue.assigneeId ?? undefined,
    cycleId: issue.cycleId ?? undefined,
    closedAt: issue.closedAt ?? undefined,
    type: issue.type as IssueType,
    priority: issue.priority ? (issue.priority as Priority) : undefined,
    customFields: (issue.customFields as Record<string, unknown>) || {},
    storyPoints: issue.storyPoints ?? undefined,
  }));

  // Convert Prisma cycle to @stride/types Cycle (null -> undefined)
  const typedCycle: Cycle = {
    ...cycle,
    description: cycle.description ?? undefined,
    goal: cycle.goal ?? undefined,
  };

  // Check edit permissions
  const canEdit = canUpdateCycle(session.role);

  return (
    <PageContainer variant="full" className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground-dark">
          Sprint Planning
        </h1>
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
          {project.name} - {cycle.name}
        </p>
      </div>
      
      {/* Burndown Chart */}
      <div className="mb-6 bg-background-secondary dark:bg-background-dark-secondary rounded-lg p-6 border border-border dark:border-border-dark">
        <h2 className="text-xl font-semibold mb-4 text-foreground dark:text-foreground-dark">
          Burndown Chart
        </h2>
        <BurndownChartClient
          projectId={projectId}
          cycleId={cycle.id}
        />
      </div>

      {/* Sprint Planning Interface */}
      <div className="h-[calc(100vh-20rem)]">
        <SprintPlanningClient
          projectId={projectId}
          cycle={typedCycle}
          initialSprintIssues={typedSprintIssues}
          initialBacklogIssues={typedBacklogIssues}
          canEdit={canEdit}
        />
      </div>
    </PageContainer>
  );
}


import { notFound } from 'next/navigation';
import { cycleRepository, issueRepository, projectRepository } from '@stride/database';
import type { Issue, Cycle, IssueType, Priority } from '@stride/types';
import type { ProjectConfig } from '@stride/yaml-config';
import { canUpdateCycle, canViewCycle } from '@/lib/auth/permissions';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { SprintPlanningClient } from '@/components/SprintPlanningClient';
import { BurndownChartClient } from '@/components/BurndownChartClient';
import { PageContainer } from '@stride/ui';
import type { Metadata } from 'next';
import { BreadcrumbMetadataSetter } from '@/components/features/projects/BreadcrumbMetadataSetter';

interface PageParams {
  params: Promise<{
    projectId: string;
    cycleId: string;
  }>;
}

/**
 * Generate metadata for sprint planning page
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { projectId, cycleId } = await params;
  
  const project = await projectRepository.findById(projectId);
  const cycle = cycleId ? await cycleRepository.findById(cycleId) : null;
  
  if (!project) {
    return {
      title: 'Projects | Sprints',
      description: 'Sprint planning',
    };
  }

  if (!cycle) {
    return {
      title: `Projects | ${project.name} | Sprints`,
      description: `Sprint planning for ${project.name}`,
    };
  }

  return {
    title: `Projects | ${project.name} | Sprints | ${cycle.name}`,
    description: `Sprint planning for ${cycle.name}`,
  };
}

/**
 * Sprint Planning Page
 * 
 * Displays sprint planning interface for a specific sprint.
 * 
 * Features:
 * - Drag-and-drop issue assignment
 * - Sprint capacity display
 * - Story points tracking
 * - Sprint goal input
 * - Issue assignment
 */
export default async function SprintPlanningPage({
  params,
}: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId, cycleId } = await params;

  // Get auth
  const headersList = await headers();
  const session = await requireAuthServer(headersList);

  if (!session) {
    notFound();
  }

  // Check permission to view cycles
  if (!canViewCycle(session.role)) {
    notFound();
  }

  // Fetch project
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  // Fetch cycle
  const cycle = await cycleRepository.findById(cycleId);
  if (!cycle || cycle.projectId !== projectId) {
    notFound();
  }

  // Fetch project configuration for issue card coloring
  const projectConfigData = await projectRepository.getConfig(projectId);
  const projectConfig = projectConfigData?.config as ProjectConfig | undefined;

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
    <>
      {/* Set breadcrumb metadata for cycle name */}
      <BreadcrumbMetadataSetter segmentLabels={{ [cycleId]: cycle.name }} />
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
          projectConfig={projectConfig}
        />
      </div>
    </PageContainer>
    </>
  );
}

// Force dynamic rendering - this route requires authentication
// and fetches user-specific data, so it cannot be statically generated
export const dynamic = 'force-dynamic';

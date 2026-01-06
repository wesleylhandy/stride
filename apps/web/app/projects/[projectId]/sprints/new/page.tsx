import { notFound, redirect } from 'next/navigation';
import { cycleRepository, issueRepository, projectRepository } from '@stride/database';
import { canUpdateCycle, canViewCycle } from '@/lib/auth/permissions';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { SprintPlanningClient } from '@/components/SprintPlanningClient';
import { BurndownChartClient } from '@/components/BurndownChartClient';

interface PageParams {
  params: {
    projectId: string;
  };
  searchParams: {
    cycleId?: string;
  };
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
  const project = await projectRepository.findById(params.projectId);
  if (!project) {
    notFound();
  }

  // If cycleId is provided, load that cycle; otherwise redirect to cycles list
  const cycleId = searchParams.cycleId;
  if (!cycleId) {
    // Redirect to cycles list or create new cycle page
    redirect(`/projects/${params.projectId}/sprints`);
  }

  // Fetch cycle
  const cycle = await cycleRepository.findById(cycleId);
  if (!cycle || cycle.projectId !== params.projectId) {
    notFound();
  }

  // Fetch issues assigned to this cycle
  const sprintIssues = await cycleRepository.getIssues(cycleId);

  // Fetch backlog issues (issues not assigned to any cycle)
  const allIssues = await issueRepository.findMany({
    projectId: params.projectId,
  });
  const backlogIssues = allIssues.filter((issue) => !issue.cycleId);

  // Check edit permissions
  const canEdit = canUpdateCycle(session.role);

  return (
    <div className="container mx-auto px-4 py-8 h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sprint Planning</h1>
        <p className="text-foreground-secondary mt-1">
          {project.name} - {cycle.name}
        </p>
      </div>
      
      {/* Burndown Chart */}
      <div className="mb-6 bg-background-secondary rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4">Burndown Chart</h2>
        <BurndownChartClient
          projectId={params.projectId}
          cycleId={cycle.id}
        />
      </div>

      {/* Sprint Planning Interface */}
      <div className="h-[calc(100vh-32rem)]">
        <SprintPlanningClient
          projectId={params.projectId}
          cycle={cycle}
          initialSprintIssues={sprintIssues}
          initialBacklogIssues={backlogIssues}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}


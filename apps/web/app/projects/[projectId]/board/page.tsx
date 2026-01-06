import { notFound } from 'next/navigation';
import { KanbanBoard } from '@stride/ui';
import { projectRepository, issueRepository } from '@stride/database';
import { canUpdateIssue } from '@/lib/auth/permissions';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { KanbanBoardClient } from '@/components/KanbanBoardClient';

interface PageParams {
  params: {
    projectId: string;
  };
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
  // Get auth
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || 'status' in authResult) {
    notFound();
  }

  const session = authResult;

  // Fetch project to get config
  const project = await projectRepository.findById(params.projectId);
  if (!project) {
    notFound();
  }

  // Fetch all issues for the project
  const issues = await issueRepository.findMany({
    projectId: params.projectId,
  });

  // Check edit permissions
  const canEdit = canUpdateIssue(session.role);

  return (
    <div className="container mx-auto px-4 py-8 h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Kanban Board</h1>
        <p className="text-foreground-secondary mt-1">
          {project.name} - Drag and drop issues to change their status
        </p>
      </div>
      <KanbanBoardClient
        projectId={params.projectId}
        initialIssues={issues}
        projectConfig={project.config || undefined}
        canEdit={canEdit}
      />
    </div>
  );
}


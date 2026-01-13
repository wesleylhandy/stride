import { notFound } from 'next/navigation';
import { cycleRepository, projectRepository } from '@stride/database';
import type { Cycle } from '@stride/types';
import { canCreateCycle, canViewCycle } from '@/lib/auth/permissions';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { PageContainer } from '@stride/ui';
import { SprintsPageClient } from '@/components/SprintsPageClient';
import type { Metadata } from 'next';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Generate metadata for sprints listing page
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { projectId } = await params;
  
  const project = await projectRepository.findById(projectId);
  
  if (!project) {
    return {
      title: 'Projects | Sprints',
      description: 'Sprint management',
    };
  }

  return {
    title: `Projects | ${project.name} | Sprints`,
    description: `Manage sprints for ${project.name}`,
  };
}

/**
 * Sprints Listing Page
 * 
 * Displays all sprints (cycles) for a project and provides navigation to sprint planning.
 * 
 * Features:
 * - Lists all sprints with name, date range, and goal
 * - "Create New Sprint" action (if user has permissions)
 * - Navigation to sprint planning for existing sprints
 */
export default async function SprintsPage({ params }: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;

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

  // Fetch all cycles for the project
  const cycles = await cycleRepository.findMany({ projectId });

  // Convert Prisma cycles to @stride/types Cycle (null -> undefined)
  const typedCycles: Cycle[] = cycles.map((cycle) => ({
    ...cycle,
    description: cycle.description ?? undefined,
    goal: cycle.goal ?? undefined,
  }));

  // Check permissions
  const canCreate = canCreateCycle(session.role);

  return (
    <PageContainer variant="full" className="py-6">
      <SprintsPageClient
        projectId={projectId}
        cycles={typedCycles}
        canCreate={canCreate}
        projectName={project.name}
      />
    </PageContainer>
  );
}

// Force dynamic rendering - this route requires authentication
// and fetches user-specific data, so it cannot be statically generated
export const dynamic = 'force-dynamic';

import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository } from '@stride/database';
import { ProjectLayout } from '@/components/templates/ProjectLayout';
import { ProjectBreadcrumbs } from '@/components/features/projects/ProjectBreadcrumbs';

interface ProjectLayoutWrapperProps {
  children: ReactNode;
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Project Layout
 * 
 * Wraps all /projects/[projectId] routes with project-specific layout.
 * Note: Parent layout (/projects/layout.tsx) already provides DashboardLayout,
 * so we only add project-specific header and tabs here.
 * 
 * Renders breadcrumbs directly above ProjectLayout to avoid React Context
 * hierarchy issues (context can't flow upward to DashboardLayout).
 */
export default async function ProjectLayoutWrapper({
  children,
  params,
}: ProjectLayoutWrapperProps) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;

  // Authenticate user (parent layout handles redirect, but we check here for safety)
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || 'status' in authResult) {
    notFound();
  }

  // Fetch project to get name and key
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  return (
    <>
      {/* Render breadcrumbs directly here - they'll appear above ProjectLayout */}
      {/* Positioned to match DashboardLayout breadcrumb container */}
      <div className="px-4 sm:px-6 lg:px-8 mb-4">
        <ProjectBreadcrumbs projectId={projectId} projectName={project.name} />
      </div>
      <ProjectLayout
        projectId={projectId}
        projectKey={project.key}
        projectName={project.name}
      >
        {children}
      </ProjectLayout>
    </>
  );
}


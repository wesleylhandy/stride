import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository } from '@stride/database';
import { ProjectLayout } from '@/components/templates/ProjectLayout';

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
    <ProjectLayout
      projectId={projectId}
      projectKey={project.key}
      projectName={project.name}
    >
      {children}
    </ProjectLayout>
  );
}


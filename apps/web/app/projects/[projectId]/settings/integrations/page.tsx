import { notFound } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository } from '@stride/database';
import { ProjectSettingsPageClient } from '@/components/features/projects/ProjectSettingsPageClient';
import type { Metadata } from 'next';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Generate metadata for project integrations settings page
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { projectId } = await params;
  
  const project = await projectRepository.findById(projectId);
  
  if (!project) {
    return {
      title: 'Projects | Settings | Integrations',
      description: 'Project integrations settings',
    };
  }

  return {
    title: `Projects | ${project.name} | Settings | Integrations`,
    description: `Integration settings for ${project.name}`,
  };
}

/**
 * Project Integrations Settings Page
 * 
 * Shows integrations tab content with the same header + tabs structure.
 * Matches the docs/configuration pattern.
 * 
 * Note: Permission checks are handled by RepositoryConnectionSettings component.
 */
export default async function ProjectIntegrationsPage({ params }: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;

  // Authenticate user
  const headersList = await headers();
  const session = await requireAuthServer(headersList);

  if (!session) {
    notFound();
  }

  // Fetch project
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  return (
    <ProjectSettingsPageClient
      projectId={projectId}
      projectName={project.name}
      projectKey={project.key}
      activeTab="integrations"
    />
  );
}


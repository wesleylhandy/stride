import { notFound } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository } from '@stride/database';
import { ProjectSettingsPageClient } from '@/components/features/projects/ProjectSettingsPageClient';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
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


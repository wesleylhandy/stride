import { notFound } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository } from '@stride/database';
import { ProjectSettingsNavigation } from '@/components/features/projects/ProjectSettingsNavigation';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Project Settings Index Page
 * 
 * Provides navigation to different project settings sections.
 * Displays project information and settings navigation links.
 */
export default async function ProjectSettingsPage({ params }: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;

  // Authenticate user
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || 'status' in authResult) {
    notFound();
  }

  // Fetch project
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Project Settings
        </h1>
        <div className="mt-2">
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            {project.name}
          </p>
          <p className="text-xs font-mono text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
            {project.key}
          </p>
        </div>
      </div>

      {/* Settings Navigation */}
      <div>
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
          Settings Sections
        </h2>
        <ProjectSettingsNavigation projectId={projectId} />
      </div>
    </div>
  );
}


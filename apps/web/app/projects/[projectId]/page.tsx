import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { projectRepository } from '@stride/database';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Generate metadata for project index page
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { projectId } = await params;
  
  const project = await projectRepository.findById(projectId);
  
  if (!project) {
    return {
      title: 'Projects',
      description: 'Project overview',
    };
  }

  return {
    title: `Projects | ${project.name}`,
    description: `Overview of ${project.name}`,
  };
}

/**
 * Project Index Page
 * 
 * Redirects to the board view as the default project page.
 * This handles navigation from the sidebar when clicking on a project.
 */
export default async function ProjectIndexPage({ params }: PageParams) {
  const { projectId } = await params;
  
  // Redirect to board view (default project view)
  redirect(`/projects/${projectId}/board`);
}


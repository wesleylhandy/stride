import { redirect } from 'next/navigation';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
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


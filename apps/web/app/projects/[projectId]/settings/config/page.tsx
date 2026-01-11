import { notFound, redirect } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository } from '@stride/database';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Project Configuration Settings Page
 * 
 * Redirects to the main settings page with config tab active.
 * The main settings page handles the tab navigation and content display.
 */
export default async function ProjectConfigPage({ params }: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;

  // Authenticate user
  const headersList = await headers();
  const session = await requireAuthServer(headersList);

  if (!session) {
    notFound();
  }

  // Fetch project to verify it exists
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  // Redirect to main settings page (config is the default/first tab)
  redirect(`/projects/${projectId}/settings`);
}


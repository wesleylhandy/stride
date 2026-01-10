import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository } from '@stride/database';

interface ProjectSettingsLayoutProps {
  children: ReactNode;
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Project Settings Layout
 * 
 * Shared layout for all project settings pages.
 * Provides authentication and project verification.
 * 
 * Note: Tabs are handled within individual pages (like docs/configuration pattern)
 * to allow tabs to appear below the title on the index page.
 */
export default async function ProjectSettingsLayout({
  children,
  params,
}: ProjectSettingsLayoutProps) {
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

  // Fetch project to verify it exists
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  return <>{children}</>;
}

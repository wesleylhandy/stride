import { notFound, redirect } from "next/navigation";
import { requireAuthServer } from "@/middleware/auth";
import { headers } from "next/headers";
import { projectRepository } from "@stride/database";
import { ProjectSettingsPageClient } from "@/components/features/projects/ProjectSettingsPageClient";
import type { Metadata } from "next";

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

/**
 * Generate metadata for project settings page
 */
export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }): Promise<Metadata> {
  const { projectId } = await params;
  
  const project = await projectRepository.findById(projectId);
  
  if (!project) {
    return {
      title: 'Projects | Settings',
      description: 'Project settings',
    };
  }

  return {
    title: `Projects | ${project.name} | Settings`,
    description: `Settings for ${project.name}`,
  };
}

/**
 * Project Settings Page
 *
 * Matches the docs/configuration pattern:
 * - Title at top
 * - Tabs below title
 * - First tab (Configuration) is preloaded by default
 * - Navigate between tabs
 */
export default async function ProjectSettingsPage({
  params,
  searchParams,
}: PageParams) {
  // Await params (Next.js 15+ requires this)
  const { projectId } = await params;
  const { tab } = await searchParams;

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

  // Determine active tab - default to 'config' (first tab)
  const activeTab = (tab === "integrations" ? "integrations" : "config") as
    | "config"
    | "integrations";

  return (
    <ProjectSettingsPageClient
      projectId={projectId}
      projectName={project.name}
      projectKey={project.key}
      activeTab={activeTab}
    />
  );
}

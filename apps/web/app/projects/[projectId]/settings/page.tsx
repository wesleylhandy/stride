import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/middleware/auth";
import { headers } from "next/headers";
import { projectRepository } from "@stride/database";
import { ProjectSettingsPageClient } from "@/components/features/projects/ProjectSettingsPageClient";

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
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
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  if (!authResult || "status" in authResult) {
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

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAuthServer } from "@/middleware/auth";
import { projectRepository } from "@stride/database";

interface RepositoryPageProps {
  searchParams: Promise<{
    projectId?: string;
  }>;
}

/**
 * Legacy Repository Page - Redirects based on context
 * 
 * Maintains backward compatibility:
 * - If projectId in query: Redirect to project settings (repository can be connected there)
 * - Otherwise: Redirect to project-setup (new flow) or projects page
 */
export default async function RepositoryPage({ searchParams }: RepositoryPageProps) {
  // Authenticate user
  const headersList = await headers();
  const session = await requireAuthServer(headersList);

  if (!session) {
    redirect("/login");
  }

  // Check if we have a projectId (from old flow)
  const params = await searchParams;
  const projectId = params.projectId;

  if (projectId) {
    // User came from old flow with a projectId
    // Redirect to project settings where they can connect repository
    redirect(`/projects/${projectId}/settings/integrations`);
  }

  // Check if user has any projects
  const projectsResult = await projectRepository.findManyPaginated(undefined, {
    page: 1,
    pageSize: 1,
  });

  if (projectsResult.items.length > 0) {
    // User has projects, redirect to projects page
    // They can connect repository through project settings
    redirect("/projects");
  } else {
    // No projects yet, redirect to project setup
    redirect("/onboarding/project-setup");
  }
}

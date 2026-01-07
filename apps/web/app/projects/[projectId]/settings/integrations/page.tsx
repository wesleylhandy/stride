import { notFound } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { projectRepository } from '@stride/database';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { RepositoryConnectionSettings } from '@/components/features/projects/RepositoryConnectionSettings';

interface PageParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Project Integrations Settings Page
 * 
 * Admin-only access to configure repository connections.
 * Displays existing connection status and allows connecting/updating repositories.
 */
export default async function ProjectIntegrationsPage({ params }: PageParams) {
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

  const session = authResult;

  // Check Admin permission
  if (!hasPermission(session.role, Permission.MANAGE_REPOSITORY)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">
            Access Denied
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            You do not have permission to manage repository connections. Admin access is required.
          </p>
        </div>
      </div>
    );
  }

  // Fetch project
  const project = await projectRepository.findById(projectId);
  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Repository Integrations
        </h1>
        <p className="mt-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
          Connect your GitHub or GitLab repository to enable automatic issue tracking and configuration sync.
        </p>
      </div>

      <RepositoryConnectionSettings projectId={projectId} />
    </div>
  );
}


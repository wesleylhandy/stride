import { redirect } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { resolveGitOAuthConfig } from '@/lib/config/infrastructure-precedence';
import { RepositoryImportFlow } from '@/components/features/projects/RepositoryImportFlow';
import { PageContainer } from '@stride/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Project',
  description: 'Import a project from GitHub or GitLab',
};

/**
 * Project Import Page
 * 
 * Server component that handles authentication and OAuth configuration checks.
 * Renders RepositoryImportFlow client component for the import workflow.
 * 
 * Features:
 * - Authentication required
 * - Checks infrastructure OAuth configuration status
 * - Handles error states and redirects
 */
export default async function ImportProjectPage() {
  try {
    // Authenticate user
    const headersList = await headers();
    const session = await requireAuthServer(headersList);

    // Redirect to login if not authenticated
    if (!session) {
      redirect('/login?returnTo=/projects/import');
    }

    // Check OAuth configuration status
    const gitConfig = await resolveGitOAuthConfig();
    const hasGitHubConfig = !!gitConfig.github;
    const hasGitLabConfig = !!gitConfig.gitlab;

    // If no OAuth providers are configured, show a message
    // (The client component will handle this gracefully)
    if (!hasGitHubConfig && !hasGitLabConfig) {
      return (
        <PageContainer variant="full" className="py-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold text-foreground dark:text-foreground-dark mb-4">
              Import Project
            </h1>
            <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
              <p className="text-foreground-secondary dark:text-foreground-dark-secondary mb-4">
                Git provider OAuth configuration is required to import projects.
              </p>
              <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                Please contact an administrator to configure GitHub or GitLab OAuth in the infrastructure settings.
              </p>
            </div>
          </div>
        </PageContainer>
      );
    }

    // Render import flow
    return (
      <PageContainer variant="full" className="py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-foreground dark:text-foreground-dark mb-6">
            Import Project from Git Provider
          </h1>
          <RepositoryImportFlow
            availableProviders={{
              github: hasGitHubConfig,
              gitlab: hasGitLabConfig,
            }}
          />
        </div>
      </PageContainer>
    );
  } catch (error) {
    console.error('Import page error:', {
      error,
      timestamp: new Date().toISOString(),
      path: '/projects/import',
    });

    // Re-throw to trigger error boundary
    throw error;
  }
}

// Force dynamic rendering - this route requires authentication
// and checks infrastructure configuration, so it cannot be statically generated
export const dynamic = 'force-dynamic';

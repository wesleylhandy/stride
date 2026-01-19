import { redirect } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { resolveGitOAuthConfig } from '@/lib/config/infrastructure-precedence';
import { ProjectSetupChoice } from '@/components/features/onboarding/ProjectSetupChoice';

/**
 * Project Setup Page (Server Component)
 * 
 * Shows choice between Import from Git Provider and Create Project Manually.
 * This replaces the old sequential flow (create → connect).
 */
export default async function ProjectSetupPage() {
  // Authenticate user
  const headersList = await headers();
  const session = await requireAuthServer(headersList);

  if (!session) {
    redirect('/login');
  }

  // Check OAuth configuration to determine available options
  const gitConfig = await resolveGitOAuthConfig();
  const hasGitHubConfig = !!gitConfig.github;
  const hasGitLabConfig = !!gitConfig.gitlab;
  const hasOAuthConfig = hasGitHubConfig || hasGitLabConfig;

  return (
    <ProjectSetupChoice
      hasOAuthConfig={hasOAuthConfig}
      availableProviders={{
        github: hasGitHubConfig,
        gitlab: hasGitLabConfig,
      }}
    />
  );
}

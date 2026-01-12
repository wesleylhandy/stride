import { redirect } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { prisma } from '@stride/database';
import { UserRole } from '@stride/types';
import { AdminInfrastructureSettings } from '@/components/features/settings/AdminInfrastructureSettings';
import { InfrastructureStatusView } from '@/components/features/settings/InfrastructureStatusView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | Infrastructure',
  description: 'Configure global infrastructure settings (Git OAuth and AI Gateway)',
};

/**
 * Infrastructure Settings Page
 * 
 * Page for viewing and configuring global infrastructure settings:
 * - Git OAuth configuration (GitHub, GitLab)
 * - AI Gateway configuration
 * 
 * Admin users: Full read/write access to configuration
 * Non-admin users: Read-only status view (no secrets exposed)
 * 
 * Authentication is required to access this page.
 */
export default async function InfrastructureSettingsPage() {
  // Authenticate user
  const headersList = await headers();
  const session = await requireAuthServer(headersList);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check user role
  const userData = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!userData) {
    redirect('/login');
  }

  // Admin users see full settings, non-admins see read-only status view
  if (userData.role === UserRole.Admin) {
    return <AdminInfrastructureSettings />;
  }

  return <InfrastructureStatusView />;
}

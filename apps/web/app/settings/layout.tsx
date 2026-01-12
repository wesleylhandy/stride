import { redirect } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { prisma } from '@stride/database';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { SettingsNavigation } from '../components/features/settings/SettingsNavigation';
import { PageContainer } from '@stride/ui';
import type { UserRole } from '@stride/types';
import type { BreadcrumbItem } from '@stride/ui';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

/**
 * Settings Layout
 * 
 * Shared layout for all settings pages.
 * Provides DashboardLayout, header, and persistent navigation tabs.
 * Fetches user session and role to show appropriate navigation items.
 */
export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  // Authenticate user
  const headersList = await headers();
  const session = await requireAuthServer(headersList);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Fetch user role
  const userData = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!userData) {
    redirect('/login');
  }

  const userRole = userData.role as UserRole;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Settings', href: '/settings/account' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <PageContainer variant="constrained">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            Settings
          </h1>
          <p className="mt-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            Manage your account and system settings.
          </p>
        </div>

        {/* Settings Navigation Tabs - Persistent across all settings pages */}
        <SettingsNavigation userRole={userRole} />

        {/* Settings Content - Changes based on route */}
        {children}
      </PageContainer>
    </DashboardLayout>
  );
}

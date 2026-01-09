import { redirect, notFound } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
import { headers } from 'next/headers';
import { prisma } from '@stride/database';
import { UserProfileForm } from '../../components/features/settings/UserProfileForm';
import { ChangePasswordForm } from '../../components/features/settings/ChangePasswordForm';
import { UserManagementClient } from '../users/UserManagementClient';
import { UserRole } from '@stride/types';
import type { User } from '@stride/types';

interface PageParams {
  params: Promise<{
    section: string;
  }>;
}

/**
 * Settings Section Page
 * 
 * Dynamic route for settings sections:
 * - /settings/account - Account settings
 * - /settings/users - User management (admin only)
 * 
 * Authentication is required to access this page.
 */
export default async function SettingsSectionPage({ params }: PageParams) {
  const { section } = await params;

  // Authenticate user
  const headersList = await headers();
  const session = await requireAuthServer(headersList);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Handle account section
  if (section === 'account') {
    // Fetch current user data
    const userData = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      redirect('/login');
    }

    // Convert Prisma user data to User type (handle null -> undefined conversion)
    const user: User = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      role: userData.role as User['role'],
      name: userData.name ?? undefined,
      avatarUrl: userData.avatarUrl ?? undefined,
      emailVerified: userData.emailVerified,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark mb-4">
            Account Settings
          </h2>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-6">
            Manage your account information and security settings.
          </p>
        </div>

        {/* Profile Form */}
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <UserProfileForm user={user} />
        </div>

        {/* Password Form */}
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <ChangePasswordForm />
        </div>
      </div>
    );
  }

  // Handle users section (admin only)
  if (section === 'users') {
    // Check admin access
    const userData = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!userData || userData.role !== UserRole.Admin) {
      redirect('/settings/account');
    }

    return <UserManagementClient />;
  }

  // Unknown section - 404
  notFound();
}

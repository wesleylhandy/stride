import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { prisma } from '@stride/database';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { UserProfileForm } from '../components/features/settings/UserProfileForm';
import { ChangePasswordForm } from '../components/features/settings/ChangePasswordForm';
import type { BreadcrumbItem } from '@stride/ui';
import type { SessionPayload } from '@/lib/auth/session';
import type { User } from '@stride/types';

/**
 * User Account Settings Page
 * 
 * Provides user account management:
 * - Profile information (name, username, avatar)
 * - Password change
 * 
 * Authentication is required to access this page.
 */
export default async function SettingsPage() {
  // Authenticate user
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  // Redirect to login if not authenticated
  if (authResult instanceof NextResponse || !authResult) {
    redirect('/login');
  }

  const session = authResult as SessionPayload;

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

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            Account Settings
          </h1>
          <p className="mt-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            Manage your account information and security settings.
          </p>
        </div>

        <div className="space-y-8">
          {/* Profile Form */}
          <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
            <UserProfileForm user={user} />
          </div>

          {/* Password Form */}
          <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


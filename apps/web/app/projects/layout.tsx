import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { BreadcrumbItem } from '@stride/ui';

interface ProjectsLayoutProps {
  children: ReactNode;
}

/**
 * Projects Layout
 * 
 * Wraps all /projects routes with DashboardLayout for consistent navigation.
 * Provides authentication check.
 * Note: Breadcrumbs are set by child layouts/pages.
 */
export default async function ProjectsLayout({ 
  children,
}: ProjectsLayoutProps) {
  // Authenticate user
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  // Redirect to login if not authenticated
  if (!authResult || 'status' in authResult) {
    redirect('/login');
  }

  // Check if we're on a board page to enable full-width layout
  // Note: In Next.js, we can't directly access pathname in server components,
  // so we'll use a client component wrapper for this specific case
  // For now, we'll let the board page handle its own width extension
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Projects' }];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}


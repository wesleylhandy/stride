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

  // Default breadcrumbs - will be overridden by child layouts if needed
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Projects' }];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}


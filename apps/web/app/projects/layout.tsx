import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireAuthServer } from '@/middleware/auth';
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
  const session = await requireAuthServer(headersList);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Breadcrumbs for projects listing page only
  // Note: For project detail pages (/projects/[projectId]/...), breadcrumbs are rendered
  // directly in ProjectLayoutWrapper to avoid React Context hierarchy issues.
  // Project pages will render their own breadcrumbs, so we don't pass breadcrumbs here
  // to avoid conflicts. DashboardLayout's BreadcrumbWrapperClient will handle the listing page.
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Projects' }, // Not clickable since we're already on this page
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}


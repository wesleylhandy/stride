import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { BreadcrumbItem } from '@stride/ui';

interface DocsLayoutProps {
  children: ReactNode;
}

/**
 * Documentation Layout
 * 
 * Wraps all /docs routes with DashboardLayout for consistent navigation.
 * Provides authentication check and breadcrumbs.
 */
export default async function DocsLayout({ 
  children,
}: DocsLayoutProps) {
  // Authenticate user
  const headersList = await headers();
  const authResult = await requireAuth({
    headers: headersList,
  } as any);

  // Redirect to login if not authenticated
  if (!authResult || 'status' in authResult) {
    redirect('/login');
  }

  // Breadcrumbs for documentation
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Projects', href: '/projects' },
    { label: 'Documentation' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}


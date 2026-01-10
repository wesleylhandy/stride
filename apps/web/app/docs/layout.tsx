import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/middleware/auth';
import { headers } from 'next/headers';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { DocsBreadcrumbs } from '@/components/features/docs/DocsBreadcrumbs';

interface DocsLayoutProps {
  children: ReactNode;
}

/**
 * Documentation Layout
 * 
 * Wraps all /docs routes with DashboardLayout for consistent navigation.
 * Provides authentication check and breadcrumbs.
 * 
 * Breadcrumbs are generated dynamically based on the current route:
 * - Documentation > Configuration
 * - Documentation > Installation
 * etc.
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

  // Breadcrumbs are generated client-side via DocsBreadcrumbs component
  // Since DocsBreadcrumbs is a client component, we need to pass it as a ReactNode
  // DashboardLayout will handle rendering it via BreadcrumbWrapperClient
  const docsBreadcrumbsComponent = <DocsBreadcrumbs />;

  return (
    <DashboardLayout breadcrumbs={docsBreadcrumbsComponent}>
      {children}
    </DashboardLayout>
  );
}


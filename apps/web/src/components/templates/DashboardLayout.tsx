import { ReactNode } from 'react';
import { TopBar } from '@stride/ui';
import { Sidebar } from '@stride/ui';
import { BreadcrumbItem } from '@stride/ui';
import { BreadcrumbWrapperClient } from '@/components/features/projects/BreadcrumbWrapperClient';

export interface DashboardLayoutProps {
  children: ReactNode;
  currentProjectId?: string | null;
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
}


/**
 * DashboardLayout component
 * 
 * Provides consistent layout for authenticated pages with:
 * - TopBar with user menu, search, notifications
 * - Sidebar with navigation and project selector
 * - Breadcrumbs for navigation context
 * - Main content area
 * 
 * Used as wrapper for all authenticated pages.
 */
export function DashboardLayout({
  children,
  currentProjectId,
  breadcrumbs,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background-secondary dark:bg-background-dark">
      {/* TopBar */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentProjectId={currentProjectId} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* DashboardLayout provides structure only - no width constraints */}
          {/* Pages should use PageContainer for width management */}
          <div className="py-6">
            {/* Breadcrumbs */}
            {/* Priority: Project breadcrumbs (from context) > explicit breadcrumbs prop */}
            <BreadcrumbWrapperClient breadcrumbs={breadcrumbs} />

            {/* Page content - pages control their own width via PageContainer */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


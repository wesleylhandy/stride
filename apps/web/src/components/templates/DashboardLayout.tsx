import { ReactNode } from 'react';
import { TopBar } from '@stride/ui';
import { Sidebar } from '@stride/ui';
import { Breadcrumbs, BreadcrumbItem } from '@stride/ui';

export interface DashboardLayoutProps {
  children: ReactNode;
  currentProjectId?: string | null;
  breadcrumbs?: BreadcrumbItem[];
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
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="px-4 sm:px-6 lg:px-8 mb-4">
                <Breadcrumbs items={breadcrumbs} />
              </div>
            )}

            {/* Page content - pages control their own width via PageContainer */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


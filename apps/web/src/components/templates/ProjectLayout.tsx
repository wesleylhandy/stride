import { ReactNode } from 'react';
import { ProjectHeader } from '../features/projects/ProjectHeader';
import { ProjectTabs } from '@stride/ui';
import { PageContainer } from '@stride/ui';
import { ProjectBreadcrumbs } from '../features/projects/ProjectBreadcrumbs';

export interface ProjectLayoutProps {
  children: ReactNode;
  projectId: string;
  projectKey: string;
  projectName: string;
}

/**
 * ProjectLayout component
 * 
 * Provides project-specific layout elements:
 * - Breadcrumbs for navigation context (rendered via DashboardLayout)
 * - ProjectHeader with project name, key, and settings link (full-width)
 * - ProjectTabs for navigation between project views (full-width)
 * - Main content area (width controlled by individual pages via PageContainer)
 * 
 * Note: This component does NOT include DashboardLayout to avoid nesting.
 * The parent layout (/projects/layout.tsx) should provide DashboardLayout.
 * Breadcrumbs are generated client-side and passed to DashboardLayout.
 * 
 * Header and tabs are full-width, while page content should use PageContainer
 * to control its width based on the page type (kanban=full, settings=constrained, etc.)
 */
export function ProjectLayout({
  children,
  projectId,
  projectKey,
  projectName,
}: ProjectLayoutProps) {
  return (
    <div className="flex flex-col">
      {/* Project Header - full width with proper constraints
          Components handle their own styling (border, background, padding) */}
      <div className="w-full">
        <PageContainer variant="full" withPadding={false}>
          <ProjectHeader
            projectKey={projectKey}
            projectName={projectName}
            projectId={projectId}
          />
        </PageContainer>
      </div>

      {/* Project Tabs - full width with proper constraints
          Components handle their own styling (border, background, padding) */}
      <div className="w-full">
        <PageContainer variant="full" withPadding={false}>
          <ProjectTabs projectId={projectId} />
        </PageContainer>
      </div>

      {/* Project Content - width controlled by pages via PageContainer */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

/**
 * ProjectBreadcrumbsWrapper component
 * 
 * Wrapper component that generates breadcrumbs for project routes.
 * This is separate from ProjectLayout because breadcrumbs need to be
 * rendered in DashboardLayout (parent), not in ProjectLayout.
 */
export function ProjectBreadcrumbsWrapper({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  return <ProjectBreadcrumbs projectId={projectId} projectName={projectName} />;
}

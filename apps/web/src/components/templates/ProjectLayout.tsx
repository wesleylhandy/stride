import { ReactNode } from 'react';
import { ProjectHeader } from '../features/projects/ProjectHeader';
import { ProjectTabs } from '@stride/ui';

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
 * - ProjectHeader with project name, key, and settings link
 * - ProjectTabs for navigation between project views
 * - Main content area
 * 
 * Note: This component does NOT include DashboardLayout to avoid nesting.
 * The parent layout (/projects/layout.tsx) should provide DashboardLayout.
 */
export function ProjectLayout({
  children,
  projectId,
  projectKey,
  projectName,
}: ProjectLayoutProps) {
  return (
    <div className="flex flex-col -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Project Header */}
      <ProjectHeader
        projectKey={projectKey}
        projectName={projectName}
        projectId={projectId}
      />

      {/* Project Tabs */}
      <ProjectTabs projectId={projectId} />

      {/* Project Content - restore padding for content only */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}


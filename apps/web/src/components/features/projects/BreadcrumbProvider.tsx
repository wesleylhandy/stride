'use client';

import { createContext, useContext, ReactNode } from 'react';
import { ProjectBreadcrumbs } from './ProjectBreadcrumbs';

interface BreadcrumbContextValue {
  projectId: string;
  projectName: string;
  breadcrumbComponent: ReactNode;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

/**
 * Hook to access breadcrumb context
 */
export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}

interface BreadcrumbProviderProps {
  children: ReactNode;
  projectId: string;
  projectName: string;
}

/**
 * BreadcrumbProvider component
 * 
 * Provides breadcrumb context to child components and renders
 * the breadcrumb component that can be consumed by DashboardLayout.
 */
export function BreadcrumbProvider({
  children,
  projectId,
  projectName,
}: BreadcrumbProviderProps) {
  const breadcrumbComponent = (
    <ProjectBreadcrumbs projectId={projectId} projectName={projectName} />
  );

  return (
    <BreadcrumbContext.Provider
      value={{ projectId, projectName, breadcrumbComponent }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * ProjectBreadcrumbConsumer component
 * 
 * Consumes breadcrumb context and renders the breadcrumb component.
 * This should be used in DashboardLayout or parent components.
 * Returns null if no context is available (e.g., not on a project page).
 */
export function ProjectBreadcrumbConsumer() {
  const context = useBreadcrumbContext();
  
  if (!context) {
    return null;
  }

  return <>{context.breadcrumbComponent}</>;
}

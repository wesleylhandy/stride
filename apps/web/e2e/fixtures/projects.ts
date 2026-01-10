/**
 * Project Fixtures for Playwright E2E Tests
 * 
 * Provides reusable project fixtures and test data factories:
 * - mockProject: Mock single project endpoint
 * - mockProjectsList: Mock projects list endpoint
 * - testProjects: Factory for common project configurations
 */

export interface MockProject {
  id: string;
  key: string;
  name: string;
  config?: ProjectConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectConfig {
  workflow?: WorkflowConfig;
  customFields?: CustomField[];
  [key: string]: unknown;
}

export interface WorkflowConfig {
  default_status: string;
  statuses: Status[];
  transitions?: Transition[];
}

export interface Status {
  key: string;
  name: string;
  type: 'open' | 'closed';
}

export interface Transition {
  from: string;
  to: string;
  requires?: string[];
}

export interface CustomField {
  key: string;
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date';
  required?: boolean;
  options?: string[];
}

export interface ProjectsListResponse {
  total: number;
  items: MockProject[];
  page?: number;
  pageSize?: number;
}

import { Page, Route } from '@playwright/test';

/**
 * Mock single project endpoint (/api/projects/:id)
 */
export async function mockProjectRoute(
  page: Page,
  project: MockProject
): Promise<void> {
  await page.route(new RegExp(`/api/projects/${project.id}(\\?.*)?$`), async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(project),
    });
  });
}

/**
 * Mock projects list endpoint (/api/projects)
 */
export async function mockProjectsList(
  page: Page,
  projects: MockProject[],
  options?: { page?: number; pageSize?: number }
): Promise<void> {
  const { page: pageNum = 1, pageSize = 10 } = options || {};
  
  await page.route(new RegExp('/api/projects(\\?.*)?$'), async (route: Route) => {
    const url = new URL(route.request().url());
    const requestedPage = parseInt(url.searchParams.get('page') || '1', 10);
    const requestedPageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    
    const startIndex = (requestedPage - 1) * requestedPageSize;
    const endIndex = startIndex + requestedPageSize;
    const paginatedItems = projects.slice(startIndex, endIndex);
    
    const response: ProjectsListResponse = {
      total: projects.length,
      items: paginatedItems,
      page: requestedPage,
      pageSize: requestedPageSize,
    };
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Factory for common project test data configurations
 */
export const testProjects = {
  /**
   * Project with complete onboarding (has config, statuses, etc.)
   */
  withOnboarding: (): MockProject => ({
    id: 'project-with-onboarding',
    key: 'APP',
    name: 'Test Project with Onboarding',
    config: {
      workflow: {
        default_status: 'todo',
        statuses: [
          { key: 'todo', name: 'To Do', type: 'open' },
          { key: 'in-progress', name: 'In Progress', type: 'open' },
          { key: 'done', name: 'Done', type: 'closed' },
        ],
        transitions: [
          { from: 'todo', to: 'in-progress' },
          { from: 'in-progress', to: 'done' },
        ],
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),

  /**
   * Empty project (no config, new user scenario)
   */
  withoutOnboarding: (): MockProject => ({
    id: 'project-without-onboarding',
    key: 'NEW',
    name: 'New Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),

  /**
   * Project with custom fields
   */
  withCustomFields: (fields: CustomField[]): MockProject => ({
    id: 'project-with-custom-fields',
    key: 'CUST',
    name: 'Project with Custom Fields',
    config: {
      customFields: fields,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),

  /**
   * Project with specific workflow configuration
   */
  withWorkflow: (workflow: WorkflowConfig): MockProject => ({
    id: 'project-with-workflow',
    key: 'WF',
    name: 'Project with Workflow',
    config: {
      workflow,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
};

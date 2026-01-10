import { Page, Route } from '@playwright/test';
import { User } from '../fixtures/auth';
import { MockProject, ProjectsListResponse } from '../fixtures/projects';

export interface LoginOptions {
  success?: boolean;
  delay?: number;
}

/**
 * Mock /api/auth/me endpoint
 */
export async function mockAuthRoute(
  page: Page,
  user?: Partial<User>
): Promise<void> {
  const defaultUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    role: 'Admin',
  };
  
  const userData: User = { ...defaultUser, ...user };
  
  await page.route('/api/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(userData),
    });
  });
}

/**
 * Mock /api/auth/login endpoint
 */
export async function mockLoginRoute(
  page: Page,
  options?: LoginOptions
): Promise<void> {
  const { success = true, delay = 0 } = options || {};
  
  await page.route('/api/auth/login', async (route: Route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    }
  });
}

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
export async function mockProjectsListRoute(
  page: Page,
  projects: MockProject[],
  options?: { page?: number; pageSize?: number }
): Promise<void> {
  const { page: pageNum = 1, pageSize = 10 } = options || {};
  
  await page.route(new RegExp('/api/projects(\\?.*)?$'), async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
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
 * Generic helper to mock JSON responses for any route
 */
export async function mockJsonResponse(
  page: Page,
  url: string | RegExp,
  data: unknown,
  status: number = 200
): Promise<void> {
  await page.route(url, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

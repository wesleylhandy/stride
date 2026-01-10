import { test as base, expect, Page } from '@playwright/test';

/**
 * Authentication Fixtures for Playwright E2E Tests
 * 
 * Provides reusable authentication fixtures and helpers:
 * - authenticatedPage: Pre-authenticated page ready for testing
 * - loginAsUser: Programmatic login helper
 * - mockAuth: Mock /api/auth/me endpoint
 * - mockLogin: Mock /api/auth/login endpoint
 */

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'Admin' | 'Member' | 'Viewer';
}

export interface LoginOptions {
  success?: boolean;
  delay?: number;
}

export interface AuthFixtures {
  authenticatedPage: Page;
  loginAsUser: (email: string, password: string) => Promise<void>;
  mockAuth: (user?: Partial<User>) => Promise<void>;
  mockLogin: (options?: LoginOptions) => Promise<void>;
}

// Default test user
const DEFAULT_USER: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  role: 'Admin',
};

/**
 * Mock /api/auth/me endpoint
 */
async function mockAuthRoute(page: Page, user?: Partial<User>): Promise<void> {
  const userData: User = { ...DEFAULT_USER, ...user };
  
  await page.route('/api/auth/me', async (route) => {
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
async function mockLoginRoute(page: Page, options?: LoginOptions): Promise<void> {
  const { success = true, delay = 0 } = options || {};
  
  await page.route('/api/auth/login', async (route) => {
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
 * Login as a user programmatically
 */
async function loginAsUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 5000 });
}

// Extend base test with authentication fixtures
export const test = base.extend<AuthFixtures>({
  /**
   * Mock /api/auth/me endpoint with optional user override
   */
  mockAuth: async ({ page }, use) => {
    await use(async (user?: Partial<User>) => {
      await mockAuthRoute(page, user);
    });
  },

  /**
   * Mock /api/auth/login endpoint with optional success/failure configuration
   */
  mockLogin: async ({ page }, use) => {
    await use(async (options?: LoginOptions) => {
      await mockLoginRoute(page, options);
    });
  },

  /**
   * Programmatic login helper
   */
  loginAsUser: async ({ page }, use) => {
    await use(async (email: string, password: string) => {
      await loginAsUser(page, email, password);
    });
  },

  /**
   * Pre-authenticated page - automatically logs in before test
   */
  authenticatedPage: async ({ page, loginAsUser, mockAuth, mockLogin }, use) => {
    // Set up auth mocks
    await mockAuth(DEFAULT_USER);
    await mockLogin({ success: true });
    
    // Mock projects list to redirect to dashboard
    await page.route('/api/projects?pageSize=1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 1, items: [{ id: '1', key: 'APP', name: 'Test Project' }] }),
      });
    });
    
    // Login
    await loginAsUser(DEFAULT_USER.email, 'password123');
    
    // Use the authenticated page
    await use(page);
  },
});

// Re-export expect for convenience
export { expect };

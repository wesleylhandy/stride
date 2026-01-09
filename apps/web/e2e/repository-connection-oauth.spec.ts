import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Repository Connection OAuth Flow
 * 
 * Tests the OAuth connection flow in project settings:
 * - Admin user can initiate OAuth connection
 * - OAuth redirect works correctly
 * - OAuth callback processes successfully
 * - Connection status updates after OAuth
 */

test.describe('Repository Connection OAuth Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: 'admin@example.com',
          username: 'admin',
          role: 'Admin',
        }),
      });
    });

    // Mock project fetch
    await page.route('/api/projects/test-project-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-project-id',
          key: 'TEST',
          name: 'Test Project',
        }),
      });
    });
  });

  test('admin user can initiate OAuth connection for GitHub', async ({ page }) => {
    // Mock repository connection fetch (no connection exists)
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      const url = new URL(route.request().url());
      const action = url.searchParams.get('action');
      
      if (action === 'oauth') {
        // Return OAuth URL
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authUrl: 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/projects/test-project-id/repositories/callback&state=test-state',
            state: 'test-state',
          }),
        });
      } else {
        // No connection exists
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No repository connection found' }),
        });
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Check that "Not Connected" status is displayed
    await expect(page.getByText(/not connected/i)).toBeVisible();

    // Find and click GitHub OAuth button
    const githubButton = page.getByRole('button', { name: /connect github/i });
    await expect(githubButton).toBeVisible();
    
    // Click GitHub button (this should trigger OAuth flow)
    await githubButton.click();

    // Verify that OAuth URL request was made
    await expect(
      page.waitForRequest(
        (request) =>
          request.url().includes('/api/projects/test-project-id/repositories') &&
          request.url().includes('action=oauth') &&
          request.url().includes('type=GitHub')
      )
    ).resolves.toBeTruthy();

    // Note: In a real E2E test, you would verify that window.location.href
    // changes to the OAuth URL. In Playwright, you would check the navigation
    // or use a mock that intercepts the redirect.
  });

  test('admin user can initiate OAuth connection for GitLab', async ({ page }) => {
    // Mock repository connection fetch (no connection exists)
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      const url = new URL(route.request().url());
      const action = url.searchParams.get('action');
      
      if (action === 'oauth') {
        // Return OAuth URL
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authUrl: 'https://gitlab.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/projects/test-project-id/repositories/callback&state=test-state',
            state: 'test-state',
          }),
        });
      } else {
        // No connection exists
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No repository connection found' }),
        });
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Find and click GitLab OAuth button
    const gitlabButton = page.getByRole('button', { name: /connect gitlab/i });
    await expect(gitlabButton).toBeVisible();
    
    // Click GitLab button
    await gitlabButton.click();

    // Verify that OAuth URL request was made
    await expect(
      page.waitForRequest(
        (request) =>
          request.url().includes('/api/projects/test-project-id/repositories') &&
          request.url().includes('action=oauth') &&
          request.url().includes('type=GitLab')
      )
    ).resolves.toBeTruthy();
  });

  test('OAuth button requires repository URL when requireRepositoryUrlForOAuth is true', async ({ page }) => {
    // Mock repository connection fetch (no connection exists)
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'No repository connection found' }),
      });
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // OAuth buttons should be disabled when no URL is entered
    const githubButton = page.getByRole('button', { name: /connect github/i });
    await expect(githubButton).toBeDisabled();

    // Enter repository URL
    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/repo');

    // OAuth buttons should now be enabled
    await expect(githubButton).toBeEnabled();
  });

  test('OAuth callback redirects back to settings page with success', async ({ page }) => {
    // Mock OAuth callback processing
    await page.route('/api/projects/test-project-id/repositories/callback*', async (route) => {
      const url = new URL(route.request().url());
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (code && state) {
        // Process OAuth callback
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'conn-123',
            repositoryUrl: 'https://github.com/owner/repo',
            serviceType: 'GitHub',
            isActive: true,
            lastSyncAt: null,
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Missing code or state' }),
        });
      }
    });

    // Mock connection fetch after callback
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      const url = new URL(route.request().url());
      const action = url.searchParams.get('action');
      
      if (!action) {
        // Return connection after callback
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'conn-123',
            repositoryUrl: 'https://github.com/owner/repo',
            serviceType: 'GitHub',
            isActive: true,
            lastSyncAt: null,
            createdAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Navigate to OAuth callback URL
    await page.goto(
      '/projects/test-project-id/settings/integrations?success=true&code=test-code&state=test-state'
    );

    // Wait for success message
    await expect(page.getByText(/repository connected successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify connection is displayed
    await expect(page.getByText(/connected repository/i)).toBeVisible();
    await expect(page.getByText(/github/i)).toBeVisible();
  });

  test('OAuth error is displayed when OAuth flow fails', async ({ page }) => {
    // Mock OAuth URL request failure
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      const url = new URL(route.request().url());
      const action = url.searchParams.get('action');
      
      if (action === 'oauth') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'OAuth initiation failed' }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No repository connection found' }),
        });
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Click GitHub OAuth button
    const githubButton = page.getByRole('button', { name: /connect github/i });
    await githubButton.click();

    // Verify error message is displayed
    await expect(page.getByText(/oauth.*failed/i)).toBeVisible();
  });

  test('loading state is shown during OAuth flow', async ({ page }) => {
    // Mock slow OAuth URL request
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      const url = new URL(route.request().url());
      const action = url.searchParams.get('action');
      
      if (action === 'oauth') {
        // Delay response to show loading state
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authUrl: 'https://github.com/login/oauth/authorize?client_id=test',
            state: 'test-state',
          }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No repository connection found' }),
        });
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Click GitHub OAuth button
    const githubButton = page.getByRole('button', { name: /connect github/i });
    await githubButton.click();

    // Verify loading state is shown
    await expect(page.getByText(/connecting.../i)).toBeVisible();
    
    // Verify button is disabled during loading
    await expect(githubButton).toBeDisabled();

    // Wait for loading to complete
    await expect(page.getByText(/connecting.../i)).not.toBeVisible({ timeout: 1000 });
  });

  test('non-admin user cannot access integrations page', async ({ page }) => {
    // Mock non-admin authentication
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: 'member@example.com',
          username: 'member',
          role: 'Member',
        }),
      });
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Should see access denied message
    await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/admin access is required/i)).toBeVisible();
  });

  test('OAuth flow with repository URL pre-filled', async ({ page }) => {
    // Mock repository connection fetch
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      const url = new URL(route.request().url());
      const action = url.searchParams.get('action');
      
      if (action === 'oauth') {
        const repositoryUrl = url.searchParams.get('repositoryUrl');
        // Verify repository URL is included in request
        expect(repositoryUrl).toBe('https://github.com/owner/repo');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authUrl: 'https://github.com/login/oauth/authorize?client_id=test',
            state: 'test-state',
          }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No repository connection found' }),
        });
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Enter repository URL
    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/repo');

    // Click GitHub OAuth button
    const githubButton = page.getByRole('button', { name: /connect github/i });
    await githubButton.click();

    // Verify OAuth request includes repository URL
    await expect(
      page.waitForRequest(
        (request) =>
          request.url().includes('repositoryUrl=https://github.com/owner/repo')
      )
    ).resolves.toBeTruthy();
  });
});

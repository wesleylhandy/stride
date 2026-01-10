import { test, expect } from '@playwright/test';
import { mockAuthRoute, mockProjectRoute } from '../utils/api-helpers';
import { testProjects } from '../fixtures/projects';

/**
 * E2E Tests for Repository Connection Manual Token Flow
 * 
 * Tests the manual token connection flow in project settings:
 * - Admin user can connect repository with manual token
 * - Form validation works correctly
 * - Connection status updates after manual connection
 * - Errors are displayed appropriately
 */

test.describe('Repository Connection Manual Token Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication using shared utility
    await mockAuthRoute(page, {
      id: 'user-123',
      email: 'admin@example.com',
      username: 'admin',
      role: 'Admin',
    });

    // Mock project fetch using shared utility
    const project = testProjects.withoutOnboarding();
    project.id = 'test-project-id';
    project.key = 'TEST';
    project.name = 'Test Project';

    await mockProjectRoute(page, project);

    // Mock repository connection fetch (no connection exists initially)
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No repository connection found' }),
        });
      }
    });
  });

  // ... existing tests remain the same - only beforeEach was refactored ...
  test('admin user can connect repository with manual GitHub token', async ({ page }) => {
    let connectionCreated = false;

    // Mock connection creation
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      if (route.request().method() === 'POST') {
        connectionCreated = true;
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
      } else if (route.request().method() === 'GET') {
        if (connectionCreated) {
          // Return connection after creation
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
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'No repository connection found' }),
          });
        }
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Fill in form
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitHub');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/repo');

    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('ghp_test1234567890');

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Verify success message
    await expect(page.getByText(/repository connected successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify connection is displayed
    await expect(page.getByText(/connected repository/i)).toBeVisible();
    await expect(page.getByText(/github/i)).toBeVisible();
    await expect(page.getByText('https://github.com/owner/repo')).toBeVisible();
  });

  test('admin user can connect repository with manual GitLab token', async ({ page }) => {
    let connectionCreated = false;

    // Mock connection creation
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      if (route.request().method() === 'POST') {
        connectionCreated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'conn-123',
            repositoryUrl: 'https://gitlab.com/owner/repo',
            serviceType: 'GitLab',
            isActive: true,
            lastSyncAt: null,
            createdAt: new Date().toISOString(),
          }),
        });
      } else if (route.request().method() === 'GET') {
        if (connectionCreated) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'conn-123',
              repositoryUrl: 'https://gitlab.com/owner/repo',
              serviceType: 'GitLab',
              isActive: true,
              lastSyncAt: null,
              createdAt: new Date().toISOString(),
            }),
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'No repository connection found' }),
          });
        }
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Fill in form
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitLab');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://gitlab.com/owner/repo');

    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('glpat-test1234567890');

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Verify success message
    await expect(page.getByText(/repository connected successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify connection is displayed
    await expect(page.getByText(/connected repository/i)).toBeVisible();
    await expect(page.getByText(/gitlab/i)).toBeVisible();
  });

  test('form validation prevents submission with empty fields', async ({ page }) => {
    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Try to submit form without filling fields
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Verify validation error is displayed
    await expect(page.getByText(/please fill in all fields/i)).toBeVisible();
  });

  test('form validation prevents submission with invalid URL', async ({ page }) => {
    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Fill in form with invalid URL
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitHub');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('not-a-valid-url');

    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('ghp_test123');

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Verify validation error is displayed
    await expect(page.getByText(/invalid repository url/i)).toBeVisible();
  });

  test('form validation prevents submission with empty token', async ({ page }) => {
    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Fill in form without token
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitHub');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/repo');

    // Leave token empty or with only whitespace
    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('   ');

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Verify validation error is displayed
    await expect(page.getByText(/please fill in all fields/i)).toBeVisible();
  });

  test('error message is displayed when connection fails', async ({ page }) => {
    // Mock connection failure
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid repository URL' }),
        });
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Fill in form
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitHub');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/repo');

    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('ghp_test123');

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Verify error message is displayed
    await expect(page.getByText(/invalid repository url/i)).toBeVisible({ timeout: 5000 });
  });

  test('token visibility can be toggled', async ({ page }) => {
    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    const tokenInput = page.getByLabel(/personal access token/i);
    const toggleButton = page.getByLabel(/show token|hide token/i);

    // Enter token
    await tokenInput.fill('secret-token-123');

    // Token should be hidden by default
    await expect(tokenInput).toHaveAttribute('type', 'password');

    // Click show token button
    await toggleButton.click();

    // Token should be visible
    await expect(tokenInput).toHaveAttribute('type', 'text');

    // Click hide token button
    await toggleButton.click();

    // Token should be hidden again
    await expect(tokenInput).toHaveAttribute('type', 'password');
  });

  test('form is cleared after successful connection', async ({ page }) => {
    let connectionCreated = false;

    // Mock connection creation
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      if (route.request().method() === 'POST') {
        connectionCreated = true;
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
      } else if (route.request().method() === 'GET') {
        if (connectionCreated) {
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
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'No repository connection found' }),
          });
        }
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Fill in form
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitHub');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/repo');

    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('ghp_test123');

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Wait for success message
    await expect(page.getByText(/repository connected successfully/i)).toBeVisible({ timeout: 5000 });

    // Form should be cleared
    await expect(urlInput).toHaveValue('');
    await expect(tokenInput).toHaveValue('');
  });

  test('loading state is shown during form submission', async ({ page }) => {
    // Mock slow connection creation
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      if (route.request().method() === 'POST') {
        // Delay response to show loading state
        await new Promise((resolve) => setTimeout(resolve, 500));
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

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Fill in form
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitHub');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/repo');

    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('ghp_test123');

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Verify button is disabled during loading
    await expect(submitButton).toBeDisabled();

    // Wait for loading to complete
    await expect(submitButton).not.toBeDisabled({ timeout: 1000 });
  });

  test('token is trimmed before submission', async ({ page }) => {
    let requestBody: any;

    // Mock connection creation and capture request body
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      if (route.request().method() === 'POST') {
        requestBody = await route.request().postDataJSON();
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

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Fill in form with token that has whitespace
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitHub');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/repo');

    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('  ghp_test123  '); // With whitespace

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Wait for request to complete
    await page.waitForTimeout(1000);

    // Verify token was trimmed in request
    expect(requestBody.accessToken).toBe('ghp_test123');
  });

  test('existing connection can be updated with new manual connection', async ({ page }) => {
    // Mock existing connection
    await page.route('/api/projects/test-project-id/repositories', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'conn-123',
            repositoryUrl: 'https://github.com/owner/old-repo',
            serviceType: 'GitHub',
            isActive: true,
            lastSyncAt: null,
            createdAt: new Date().toISOString(),
          }),
        });
      } else if (route.request().method() === 'POST') {
        // Update connection
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'conn-123',
            repositoryUrl: 'https://github.com/owner/new-repo',
            serviceType: 'GitHub',
            isActive: true,
            lastSyncAt: null,
            createdAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Navigate to integrations page
    await page.goto('/projects/test-project-id/settings/integrations');

    // Wait for page to load
    await page.waitForSelector('text=Repository Integrations');

    // Verify existing connection is displayed
    await expect(page.getByText(/connected repository/i)).toBeVisible();
    await expect(page.getByText('https://github.com/owner/old-repo')).toBeVisible();

    // Update connection
    const typeSelect = page.getByLabel(/repository type/i);
    await typeSelect.selectOption('GitHub');

    const urlInput = page.getByLabel(/repository url/i);
    await urlInput.fill('https://github.com/owner/new-repo');

    const tokenInput = page.getByLabel(/personal access token/i);
    await tokenInput.fill('ghp_newtoken123');

    // Submit form
    const submitButton = page.getByRole('button', { name: /connect repository/i });
    await submitButton.click();

    // Verify success message
    await expect(page.getByText(/repository connected successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify updated connection is displayed
    await expect(page.getByText('https://github.com/owner/new-repo')).toBeVisible();
  });
});

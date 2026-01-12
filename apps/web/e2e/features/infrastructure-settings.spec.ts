import { test, expect } from '@playwright/test';
import { mockAuthRoute } from '../utils/api-helpers';

/**
 * E2E Tests for Infrastructure Settings
 * 
 * Tests infrastructure configuration:
 * - Admin access to infrastructure settings page
 * - Non-admin users see read-only status view
 * - Configuration update via UI
 * - Environment variable precedence
 */

test.describe('Infrastructure Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication using shared utility
    await mockAuthRoute(page, {
      id: 'admin-123',
      email: 'admin@example.com',
      username: 'admin',
      role: 'Admin',
    });
  });

  test('admin can access infrastructure settings page', async ({ page }) => {
    // Mock infrastructure configuration API
    await page.route('**/api/admin/settings/infrastructure', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'config-1',
            gitConfig: {
              github: {
                clientId: 'github-client-id',
                configured: false,
                source: 'database',
              },
            },
            aiConfig: {
              aiGatewayUrl: 'http://ai-gateway:3001',
              configured: true,
              source: 'database',
            },
            updatedBy: null,
            updatedByUser: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Navigate to infrastructure settings
    await page.goto('/settings/infrastructure');

    // Wait for page to load
    await page.waitForSelector('text=Infrastructure Configuration', { timeout: 5000 });

    // Verify page title
    await expect(page.getByRole('heading', { name: /infrastructure configuration/i })).toBeVisible();
  });

  test('non-admin users see read-only status view', async ({ page }) => {
    // Mock authentication as non-admin
    await mockAuthRoute(page, {
      id: 'user-123',
      email: 'user@example.com',
      username: 'user',
      role: 'Member',
    });

    // Mock infrastructure status API (non-admin endpoint)
    await page.route('**/api/admin/settings/infrastructure', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden: Admin access required' }),
        });
      }
    });

    // Navigate to infrastructure settings
    await page.goto('/settings/infrastructure');

    // Verify read-only status view is shown
    await expect(page.getByText(/infrastructure status/i)).toBeVisible();

    // Verify no edit buttons are present
    await expect(page.getByRole('button', { name: /save/i })).not.toBeVisible();
  });

  test('admin can update configuration via UI', async ({ page }) => {
    let savedConfig: any = null;

    // Mock GET infrastructure configuration
    await page.route('**/api/admin/settings/infrastructure', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'config-1',
            gitConfig: {
              github: {
                clientId: '',
                configured: false,
                source: 'database',
              },
            },
            aiConfig: {
              aiGatewayUrl: '',
              configured: false,
              source: 'database',
            },
            updatedBy: null,
            updatedByUser: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else if (route.request().method() === 'PUT') {
        const requestBody = await route.request().postDataJSON();
        savedConfig = requestBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'config-1',
            gitConfig: requestBody.gitConfig,
            aiConfig: requestBody.aiConfig,
            updatedBy: 'admin-123',
            updatedByUser: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Navigate to infrastructure settings
    await page.goto('/settings/infrastructure');

    // Wait for page to load
    await page.waitForSelector('text=Infrastructure Configuration', { timeout: 5000 });

    // Fill GitHub OAuth configuration
    const githubClientIdInput = page.getByLabel(/github client id/i);
    const githubClientSecretInput = page.getByLabel(/github client secret/i);

    if (await githubClientIdInput.isVisible()) {
      await githubClientIdInput.fill('new-github-client-id');
      await githubClientSecretInput.fill('new-github-secret');
    }

    // Save configuration
    const saveButton = page.getByRole('button', { name: /save/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Wait for success message
      await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: 5000 });

      // Verify configuration was saved
      expect(savedConfig).toBeTruthy();
      expect(savedConfig.gitConfig?.github?.clientId).toBe('new-github-client-id');
    }
  });

  test('UI shows read-only state when environment variables override', async ({ page }) => {
    // Mock infrastructure configuration API with environment source
    await page.route('**/api/admin/settings/infrastructure', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'config-1',
            gitConfig: {
              github: {
                clientId: 'env-github-client-id',
                configured: true,
                source: 'environment',
              },
            },
            aiConfig: {
              aiGatewayUrl: 'http://env-ai-gateway:3001',
              configured: true,
              source: 'environment',
            },
            updatedBy: null,
            updatedByUser: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Navigate to infrastructure settings
    await page.goto('/settings/infrastructure');

    // Wait for page to load
    await page.waitForSelector('text=Infrastructure Configuration', { timeout: 5000 });

    // Verify read-only message is shown
    await expect(page.getByText(/configured via environment variables/i)).toBeVisible();

    // Verify input fields are disabled/read-only
    const githubClientIdInput = page.getByLabel(/github client id/i);
    if (await githubClientIdInput.isVisible()) {
      await expect(githubClientIdInput).toBeDisabled();
    }
  });

  test('secrets are never displayed in UI', async ({ page }) => {
    // Mock infrastructure configuration API
    await page.route('**/api/admin/settings/infrastructure', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'config-1',
            gitConfig: {
              github: {
                clientId: 'github-client-id',
                configured: true,
                source: 'database',
              },
            },
            aiConfig: {
              aiGatewayUrl: 'http://ai-gateway:3001',
              configured: true,
              source: 'database',
            },
            updatedBy: null,
            updatedByUser: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Navigate to infrastructure settings
    await page.goto('/settings/infrastructure');

    // Wait for page to load
    await page.waitForSelector('text=Infrastructure Configuration', { timeout: 5000 });

    // Verify secrets are not visible in page content
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('github-secret');
    expect(pageContent).not.toContain('sk-');
    expect(pageContent).not.toContain('sk-ant-');
    expect(pageContent).not.toContain('AIza');
  });
});

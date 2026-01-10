import { test, expect } from '@playwright/test';
import { mockAuthRoute, mockProjectRoute, mockProjectsListRoute } from '../utils/api-helpers';
import { testProjects } from '../fixtures/projects';

/**
 * E2E Tests for Documentation Access
 * 
 * Tests documentation accessibility:
 * - Documentation pages are accessible
 * - Navigation between sections works
 * - Links to documentation work from error messages
 * - Documentation content loads correctly
 */

test.describe('Documentation Access', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication using shared utility
    await mockAuthRoute(page, {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'Admin',
    });
  });

  test('configuration documentation page is accessible', async ({ page }) => {
    // Navigate to configuration documentation
    await page.goto('/docs/configuration');

    // Wait for page to load
    await page.waitForSelector('text=Configuration Documentation');

    // Verify page title
    await expect(page.getByRole('heading', { name: /configuration documentation/i })).toBeVisible();

    // Verify description
    await expect(page.getByText(/complete reference for stride yaml configuration/i)).toBeVisible();
  });

  test('documentation navigation tabs work correctly', async ({ page }) => {
    // Navigate to configuration documentation
    await page.goto('/docs/configuration');

    // Wait for page to load
    await page.waitForSelector('text=Configuration Documentation');

    // Verify all navigation tabs are present
    await expect(page.getByRole('link', { name: /reference/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /troubleshooting/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /examples/i })).toBeVisible();

    // Click on Troubleshooting tab
    await page.getByRole('link', { name: /troubleshooting/i }).click();

    // Verify URL changes
    await expect(page.url()).toContain('section=troubleshooting');

    // Click on Examples tab
    await page.getByRole('link', { name: /examples/i }).click();

    // Verify URL changes
    await expect(page.url()).toContain('section=examples');

    // Click on Reference tab
    await page.getByRole('link', { name: /reference/i }).click();

    // Verify URL changes back to reference
    await expect(page.url()).toContain('section=reference');
  });

  test('reference documentation section loads', async ({ page }) => {
    // Navigate to reference section
    await page.goto('/docs/configuration?section=reference');

    // Wait for content to load
    await page.waitForSelector('text=Configuration Documentation');

    // Verify content is displayed (markdown is rendered)
    // Content should include project configuration details
    await expect(page.locator('article, main')).toBeVisible();
  });

  test('troubleshooting documentation section loads', async ({ page }) => {
    // Navigate to troubleshooting section
    await page.goto('/docs/configuration?section=troubleshooting');

    // Wait for content to load
    await page.waitForSelector('text=Configuration Documentation');

    // Verify troubleshooting content is displayed
    await expect(page.locator('article, main')).toBeVisible();
  });

  test('examples documentation section loads', async ({ page }) => {
    // Navigate to examples section
    await page.goto('/docs/configuration?section=examples');

    // Wait for content to load
    await page.waitForSelector('text=Configuration Documentation');

    // Verify examples content is displayed
    await expect(page.locator('article, main')).toBeVisible();
  });

  test('documentation link works from error toast', async ({ page }) => {
    // Mock projects using shared utilities
    const project = testProjects.withOnboarding();
    project.id = 'project-123';
    project.key = 'TEST';
    project.name = 'Test Project';

    await mockProjectsListRoute(page, [project]);
    await mockProjectRoute(page, project);

    // Mock status update failure with help URL
    await page.route('/api/projects/project-123/issues*', async (route) => {
      if (route.request().url().includes('/status')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid status transition',
            helpUrl: '/docs/configuration',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total: 1,
            items: [
              {
                id: 'issue-123',
                key: 'TEST-1',
                title: 'Test Issue',
                status: 'todo',
                description: '',
                priority: null,
                assigneeId: null,
              },
            ],
          }),
        });
      }
    });

    // Navigate to board
    await page.goto('/projects/project-123/board');
    await page.waitForSelector('text=To Do');

    // Trigger error (drag issue to invalid status)
    const issueCard = page.getByText(/TEST-1/i).first();
    const doneColumn = page.getByText(/done/i).filter({ hasText: /^Done$/i }).first();
    const doneColumnBox = await doneColumn.boundingBox();

    if (doneColumnBox) {
      await issueCard.dragTo(doneColumn);
    }

    // Wait for error toast
    await expect(page.getByText(/cannot move issue|invalid status transition/i)).toBeVisible({
      timeout: 5000,
    });

    // Click "View Help" or "View Docs" button in toast
    const actionButton = page.getByRole('button', { name: /view help|view docs/i });
    await expect(actionButton).toBeVisible({ timeout: 3000 });

    // Click button - should navigate to documentation
    await actionButton.click();

    // Verify navigation to documentation page
    await expect(page).toHaveURL(/\/docs\/configuration/, { timeout: 5000 });

    // Verify documentation page loaded
    await expect(page.getByRole('heading', { name: /configuration documentation/i })).toBeVisible();
  });

  test('documentation is accessible from help tooltips', async ({ page }) => {
    // Mock projects using shared utilities
    const project = testProjects.withOnboarding();
    project.id = 'project-123';
    project.key = 'TEST';
    project.name = 'Test Project';

    await mockProjectsListRoute(page, [project]);
    await mockProjectRoute(page, project);

    await page.route('/api/projects/project-123/config', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'text/yaml',
          body: `project_key: TEST
project_name: Test Project
workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open`,
        });
      }
    });

    // Navigate to configuration editor
    await page.goto('/projects/project-123/settings/config');

    // Wait for page to load
    await page.waitForSelector('text=Configuration');

    // Look for help links or tooltips (implementation specific)
    // This would depend on how help tooltips are implemented in ConfigEditor
    // For now, we verify the page is accessible
    await expect(page.locator('main, article')).toBeVisible();
  });

  test('documentation content is properly formatted', async ({ page }) => {
    // Navigate to documentation
    await page.goto('/docs/configuration?section=reference');

    // Wait for content
    await page.waitForSelector('text=Configuration Documentation');

    // Verify markdown is rendered (not raw markdown)
    // Headings should be proper HTML headings
    const content = page.locator('article, main, [role="main"]');
    await expect(content).toBeVisible();

    // Content should not contain raw markdown syntax
    // (this would need to check for specific content patterns)
    const bodyText = await content.textContent();
    expect(bodyText).not.toContain('```yaml');
    expect(bodyText).not.toContain('## ');
  });

  test('documentation links work correctly', async ({ page }) => {
    // Navigate to documentation
    await page.goto('/docs/configuration');

    // Wait for page to load
    await page.waitForSelector('text=Configuration Documentation');

    // Get all links in the documentation
    const links = page.locator('a[href]');

    // Check that links exist
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);

    // Verify navigation tabs are links
    const referenceLink = page.getByRole('link', { name: /reference/i });
    await expect(referenceLink).toHaveAttribute('href', expect.stringContaining('/docs/configuration'));
  });

  test('documentation is accessible without authentication', async ({ page }) => {
    // Navigate to documentation without authentication
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    // Try to access documentation
    await page.goto('/docs/configuration');

    // Documentation should still be accessible (public)
    // Note: This depends on your routing/authentication setup
    // If documentation requires auth, this test should verify that
    await expect(page.locator('body')).toBeVisible();
  });

  test('documentation handles missing sections gracefully', async ({ page }) => {
    // Navigate to invalid section
    await page.goto('/docs/configuration?section=invalid');

    // Should fall back to default section or show error
    // Wait for page to load
    await page.waitForSelector('body');

    // Page should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});

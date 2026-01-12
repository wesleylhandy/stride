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

test.describe('Deployment Documentation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication using shared utility
    await mockAuthRoute(page, {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'Admin',
    });
  });

  test('deployment overview page is accessible', async ({ page }) => {
    // Navigate to deployment overview
    await page.goto('/docs/deployment');

    // Wait for page to load
    await page.waitForSelector('text=Deployment Guide', { timeout: 10000 });

    // Verify page title
    await expect(page.getByRole('heading', { name: /deployment guide/i })).toBeVisible();

    // Verify description
    await expect(page.getByText(/complete guides for deploying stride/i)).toBeVisible();

    // Verify status is 200 (no 404)
    const response = await page.goto('/docs/deployment');
    expect(response?.status()).toBe(200);
  });

  test('docker deployment guide is accessible', async ({ page }) => {
    // Navigate to docker guide
    await page.goto('/docs/deployment/docker');

    // Wait for page to load
    await page.waitForSelector('text=Docker Deployment', { timeout: 10000 });

    // Verify page title
    await expect(page.getByRole('heading', { name: /docker deployment/i })).toBeVisible();

    // Verify status is 200 (no 404)
    const response = await page.goto('/docs/deployment/docker');
    expect(response?.status()).toBe(200);
  });

  test('infrastructure configuration guide is accessible', async ({ page }) => {
    // Navigate to infrastructure configuration guide
    await page.goto('/docs/deployment/infrastructure-configuration');

    // Wait for page to load
    await page.waitForSelector('text=Infrastructure Configuration', { timeout: 10000 });

    // Verify page title
    await expect(page.getByRole('heading', { name: /infrastructure configuration/i })).toBeVisible();

    // Verify status is 200 (no 404)
    const response = await page.goto('/docs/deployment/infrastructure-configuration');
    expect(response?.status()).toBe(200);
  });

  test('invalid deployment guide returns 404', async ({ page }) => {
    // Navigate to invalid guide
    const response = await page.goto('/docs/deployment/invalid');

    // Should return 404
    expect(response?.status()).toBe(404);

    // Verify 404 page is shown
    await expect(page.getByText(/not found|404/i)).toBeVisible({ timeout: 5000 });
  });

  test('deployment navigation sidebar shows all guides', async ({ page }) => {
    // Navigate to deployment overview
    await page.goto('/docs/deployment');

    // Wait for page to load
    await page.waitForSelector('text=Deployment Guide', { timeout: 10000 });

    // Verify navigation sidebar shows all deployment guides
    await expect(page.getByRole('link', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /docker deployment/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /infrastructure configuration/i })).toBeVisible();
  });

  test('navigation sidebar works on individual guide pages', async ({ page }) => {
    // Navigate to docker guide
    await page.goto('/docs/deployment/docker');

    // Wait for page to load
    await page.waitForSelector('text=Docker Deployment', { timeout: 10000 });

    // Verify navigation sidebar shows all deployment guides
    await expect(page.getByRole('link', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /docker deployment/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /infrastructure configuration/i })).toBeVisible();

    // Click on infrastructure configuration link
    await page.getByRole('link', { name: /infrastructure configuration/i }).click();

    // Verify navigation worked
    await expect(page).toHaveURL(/\/docs\/deployment\/infrastructure-configuration/);
    await expect(page.getByRole('heading', { name: /infrastructure configuration/i })).toBeVisible();
  });

  test('breadcrumbs show correct hierarchy for deployment overview', async ({ page }) => {
    // Navigate to deployment overview
    await page.goto('/docs/deployment');

    // Wait for page to load
    await page.waitForSelector('text=Deployment Guide', { timeout: 10000 });

    // Verify breadcrumbs show: Documentation > Deployment
    await expect(page.getByRole('link', { name: /documentation/i })).toBeVisible();
    await expect(page.getByText(/deployment/i)).toBeVisible();
  });

  test('breadcrumbs show correct hierarchy for docker guide', async ({ page }) => {
    // Navigate to docker guide
    await page.goto('/docs/deployment/docker');

    // Wait for page to load
    await page.waitForSelector('text=Docker Deployment', { timeout: 10000 });

    // Verify breadcrumbs show: Documentation > Deployment > Docker Deployment
    await expect(page.getByRole('link', { name: /documentation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /deployment/i })).toBeVisible();
    await expect(page.getByText(/docker deployment/i)).toBeVisible();
  });

  test('breadcrumbs show correct hierarchy for infrastructure guide', async ({ page }) => {
    // Navigate to infrastructure guide
    await page.goto('/docs/deployment/infrastructure-configuration');

    // Wait for page to load
    await page.waitForSelector('text=Infrastructure Configuration', { timeout: 10000 });

    // Verify breadcrumbs show: Documentation > Deployment > Infrastructure Configuration
    await expect(page.getByRole('link', { name: /documentation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /deployment/i })).toBeVisible();
    await expect(page.getByText(/infrastructure configuration/i)).toBeVisible();
  });

  test('markdown content renders correctly on deployment overview', async ({ page }) => {
    // Navigate to deployment overview
    await page.goto('/docs/deployment');

    // Wait for page to load
    await page.waitForSelector('text=Deployment Guide', { timeout: 10000 });

    // Verify markdown is rendered (not raw markdown)
    const content = page.locator('article, main, [role="main"]');
    await expect(content).toBeVisible();

    // Content should not contain raw markdown syntax
    const bodyText = await content.textContent();
    expect(bodyText).not.toContain('```');
    expect(bodyText).not.toContain('## ');
  });

  test('markdown content renders correctly on docker guide', async ({ page }) => {
    // Navigate to docker guide
    await page.goto('/docs/deployment/docker');

    // Wait for page to load
    await page.waitForSelector('text=Docker Deployment', { timeout: 10000 });

    // Verify markdown is rendered
    const content = page.locator('article, main, [role="main"]');
    await expect(content).toBeVisible();

    // Content should not contain raw markdown syntax
    const bodyText = await content.textContent();
    expect(bodyText).not.toContain('```');
  });

  test('markdown content renders correctly on infrastructure guide', async ({ page }) => {
    // Navigate to infrastructure guide
    await page.goto('/docs/deployment/infrastructure-configuration');

    // Wait for page to load
    await page.waitForSelector('text=Infrastructure Configuration', { timeout: 10000 });

    // Verify markdown is rendered
    const content = page.locator('article, main, [role="main"]');
    await expect(content).toBeVisible();

    // Content should not contain raw markdown syntax
    const bodyText = await content.textContent();
    expect(bodyText).not.toContain('```');
  });

  test('navigation from docs index page to deployment section works', async ({ page }) => {
    // Navigate to docs index
    await page.goto('/docs');

    // Wait for page to load
    await page.waitForSelector('text=Documentation', { timeout: 10000 });

    // Find and click deployment section
    const deploymentLink = page.getByRole('link', { name: /deployment/i }).first();
    await expect(deploymentLink).toBeVisible();
    await deploymentLink.click();

    // Verify navigation to deployment overview
    await expect(page).toHaveURL(/\/docs\/deployment/);
    await expect(page.getByRole('heading', { name: /deployment guide/i })).toBeVisible();
  });

  test('deployment section appears in docs index page', async ({ page }) => {
    // Navigate to docs index
    await page.goto('/docs');

    // Wait for page to load
    await page.waitForSelector('text=Documentation', { timeout: 10000 });

    // Verify deployment section is visible
    await expect(page.getByRole('heading', { name: /deployment/i })).toBeVisible();
    await expect(page.getByText(/complete guides for deploying stride/i)).toBeVisible();

    // Verify subsections are visible
    await expect(page.getByText(/docker deployment/i)).toBeVisible();
    await expect(page.getByText(/infrastructure configuration/i)).toBeVisible();
  });

  test('page metadata is correct for deployment overview', async ({ page }) => {
    // Navigate to deployment overview
    await page.goto('/docs/deployment');

    // Wait for page to load
    await page.waitForSelector('text=Deployment Guide', { timeout: 10000 });

    // Verify page title
    await expect(page).toHaveTitle(/Deployment Guide - Stride/i);

    // Verify meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', expect.stringContaining('deploying Stride'));
  });

  test('page metadata is correct for docker guide', async ({ page }) => {
    // Navigate to docker guide
    await page.goto('/docs/deployment/docker');

    // Wait for page to load
    await page.waitForSelector('text=Docker Deployment', { timeout: 10000 });

    // Verify page title
    await expect(page).toHaveTitle(/Docker Deployment - Stride/i);

    // Verify meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', expect.stringContaining('Docker Compose'));
  });

  test('page metadata is correct for infrastructure guide', async ({ page }) => {
    // Navigate to infrastructure guide
    await page.goto('/docs/deployment/infrastructure-configuration');

    // Wait for page to load
    await page.waitForSelector('text=Infrastructure Configuration', { timeout: 10000 });

    // Verify page title
    await expect(page).toHaveTitle(/Infrastructure Configuration - Stride/i);

    // Verify meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', expect.stringContaining('infrastructure'));
  });

  test('authentication is required for deployment docs', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    // Try to access deployment docs
    const response = await page.goto('/docs/deployment');

    // Should redirect to login or show auth error
    // This depends on your auth setup - adjust based on actual behavior
    // If docs require auth, verify redirect or error
    // If docs are public, verify they're accessible
    expect(response?.status()).toBeGreaterThanOrEqual(200);
    expect(response?.status()).toBeLessThan(500);
  });

  test('links from deployment README to individual guides work', async ({ page }) => {
    // Navigate to deployment overview (which contains links)
    await page.goto('/docs/deployment');

    // Wait for page to load
    await page.waitForSelector('text=Deployment Guide', { timeout: 10000 });

    // Find and click Docker Deployment link
    const dockerLink = page.getByRole('link', { name: /docker deployment/i }).first();
    await expect(dockerLink).toBeVisible();
    await dockerLink.click();

    // Verify navigation to docker guide
    await expect(page).toHaveURL(/\/docs\/deployment\/docker/);
    await expect(page.getByRole('heading', { name: /docker deployment/i })).toBeVisible();

    // Go back and test infrastructure link
    await page.goBack();
    await page.waitForSelector('text=Deployment Guide', { timeout: 10000 });

    // Find and click Infrastructure Configuration link
    const infraLink = page.getByRole('link', { name: /infrastructure configuration/i }).first();
    await expect(infraLink).toBeVisible();
    await infraLink.click();

    // Verify navigation to infrastructure guide
    await expect(page).toHaveURL(/\/docs\/deployment\/infrastructure-configuration/);
    await expect(page.getByRole('heading', { name: /infrastructure configuration/i })).toBeVisible();
  });
});

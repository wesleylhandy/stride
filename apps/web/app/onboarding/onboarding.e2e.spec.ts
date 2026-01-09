import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Onboarding Pages
 * 
 * Tests the onboarding flow including:
 * - User with completed onboarding cannot re-enter onboarding flow
 * - Onboarding bypass logic
 */

test.describe('Onboarding Flow', () => {
  test('user with completed onboarding cannot re-enter onboarding flow', async ({ page }) => {
    // Mock: User has projects (onboarding complete)
    // In a real E2E test, you would set up test database with a user and projects
    
    // Login first (user with projects)
    await page.goto('/login');
    
    // Mock API responses for login
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    
    await page.route('/api/projects?pageSize=1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 1, items: [{ id: '1', key: 'APP', name: 'Test Project' }] }),
      });
    });
    
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Now try to access onboarding directly
    await page.goto('/onboarding');
    
    // Should be redirected away from onboarding (to dashboard or projects)
    // The actual behavior depends on the onboarding page's redirect logic
    // In a real scenario, the onboarding page should check onboarding status
    // and redirect if already complete
    
    // Wait a bit to see if redirect happens
    await page.waitForTimeout(1000);
    
    // URL should NOT be /onboarding (should be redirected)
    // Note: This test assumes the onboarding page has redirect logic
    // If it doesn't yet, this test will need to be updated when that logic is added
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/onboarding');
  });

  test('user without projects can access onboarding flow', async ({ page }) => {
    // Mock: User has no projects (onboarding incomplete)
    
    // Login first (user without projects)
    await page.goto('/login');
    
    // Mock API responses for login
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    
    await page.route('/api/projects?pageSize=1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 0, items: [] }),
      });
    });
    
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await page.waitForURL('/onboarding', { timeout: 5000 });
    
    // Should be able to access onboarding pages
    expect(page.url()).toContain('/onboarding');
  });
});

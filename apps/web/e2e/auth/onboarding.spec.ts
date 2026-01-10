import { test, expect } from '@playwright/test';
import { mockLoginRoute, mockProjectsListRoute } from '../utils/api-helpers';
import { fillForm, submitForm } from '../utils/page-helpers';
import { testProjects } from '../fixtures/projects';

/**
 * E2E Tests for Onboarding Pages
 * 
 * Tests the onboarding flow including:
 * - User with completed onboarding cannot re-enter onboarding flow
 * - Onboarding bypass logic
 */

test.describe('Onboarding Flow', () => {
  test('user with completed onboarding cannot re-enter onboarding flow', async ({ page }) => {
    // Mock API responses using shared utilities
    await mockLoginRoute(page, { success: true });
    await mockProjectsListRoute(page, [testProjects.withOnboarding()], { pageSize: 1 });
    
    // Login using shared utilities
    await page.goto('/login');
    await fillForm(page, {
      email: 'test@example.com',
      password: 'password123',
    });
    await submitForm(page);
    
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
    // Mock API responses using shared utilities
    await mockLoginRoute(page, { success: true });
    await mockProjectsListRoute(page, [], { pageSize: 1 });
    
    // Login using shared utilities
    await page.goto('/login');
    await fillForm(page, {
      email: 'test@example.com',
      password: 'password123',
    });
    await submitForm(page);
    
    // Should redirect to onboarding
    await page.waitForURL('/onboarding', { timeout: 5000 });
    
    // Should be able to access onboarding pages
    expect(page.url()).toContain('/onboarding');
  });
});

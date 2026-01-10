import { test, expect } from '@playwright/test';
import { mockLoginRoute, mockProjectsListRoute } from '../utils/api-helpers';
import { fillForm, submitForm } from '../utils/page-helpers';
import { testProjects } from '../fixtures/projects';

/**
 * E2E Tests for Login Page
 * 
 * Tests the complete login flow including:
 * - Login with completed onboarding (redirects to dashboard)
 * - Login with incomplete onboarding (redirects to onboarding)
 * - Mobile login experience
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('user with completed onboarding logs in and goes to dashboard', async ({ page }) => {
    // Mock API responses using shared utilities
    await mockLoginRoute(page, { success: true });
    await mockProjectsListRoute(page, [testProjects.withOnboarding()], { pageSize: 1 });
    
    // Fill and submit login form using shared utilities
    await fillForm(page, {
      email: 'test@example.com',
      password: 'password123',
    });
    await submitForm(page);
    
    // Should redirect to dashboard (not onboarding)
    await page.waitForURL('/dashboard', { timeout: 5000 });
    expect(page.url()).toContain('/dashboard');
    
    // Should NOT redirect to onboarding
    expect(page.url()).not.toContain('/onboarding');
  });

  test('user without projects logs in and goes to onboarding', async ({ page }) => {
    // Mock API responses using shared utilities
    await mockLoginRoute(page, { success: true });
    await mockProjectsListRoute(page, [], { pageSize: 1 });
    
    // Fill and submit login form using shared utilities
    await fillForm(page, {
      email: 'test@example.com',
      password: 'password123',
    });
    await submitForm(page);
    
    // Should redirect to onboarding (not dashboard)
    await page.waitForURL('/onboarding', { timeout: 5000 });
    expect(page.url()).toContain('/onboarding');
    
    // Should NOT redirect to dashboard
    expect(page.url()).not.toContain('/dashboard');
  });

  test('login page is usable on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    // Navigate to login page
    await page.goto('/login');
    
    // Verify form is visible and fits viewport
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check that there's no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    
    // Verify inputs are visible and accessible
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Verify touch targets are at least 44x44px
    const emailInputBox = await emailInput.boundingBox();
    const passwordInputBox = await passwordInput.boundingBox();
    const submitButtonBox = await page.locator('button[type="submit"]').boundingBox();
    
    expect(emailInputBox?.height).toBeGreaterThanOrEqual(44);
    expect(passwordInputBox?.height).toBeGreaterThanOrEqual(44);
    expect(submitButtonBox?.height).toBeGreaterThanOrEqual(44);
    expect(submitButtonBox?.width).toBeGreaterThanOrEqual(44);
  });

  test('login form fits mobile viewport without horizontal scroll', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to login page
    await page.goto('/login');
    
    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
  });

  test('touch targets are accessible on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to login page
    await page.goto('/login');
    
    // Get all interactive elements
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Verify each element has sufficient touch target size
    const elements = [
      { name: 'email', locator: emailInput },
      { name: 'password', locator: passwordInput },
      { name: 'submit', locator: submitButton },
    ];
    
    for (const { name, locator } of elements) {
      const box = await locator.boundingBox();
      expect(box?.height, `${name} input height should be >= 44px`).toBeGreaterThanOrEqual(44);
      if (name === 'submit') {
        expect(box?.width, `${name} button width should be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('displays validation errors on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to login page
    await page.goto('/login');
    
    // Try to submit without filling form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=/email is required/i')).toBeVisible();
    await expect(page.locator('text=/password is required/i')).toBeVisible();
    
    // Errors should be visible on mobile (not cut off)
    const errorBox = await page.locator('text=/email is required/i').boundingBox();
    expect(errorBox?.width).toBeGreaterThan(0);
    expect(errorBox?.height).toBeGreaterThan(0);
  });
});

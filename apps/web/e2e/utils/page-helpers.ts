import { Page, expect as playwrightExpect } from '@playwright/test';

/**
 * Wait for navigation to a specific URL or pattern
 */
export async function waitForNavigation(
  page: Page,
  url?: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  if (url) {
    await page.waitForURL(url, { timeout });
  } else {
    await page.waitForLoadState('networkidle', { timeout });
  }
}

/**
 * Navigate and wait for page to be ready
 */
export async function navigateAndWait(
  page: Page,
  url: string,
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'
): Promise<void> {
  await page.goto(url, { waitUntil });
}

/**
 * Fill form fields by name attribute
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [name, value] of Object.entries(fields)) {
    await page.fill(`input[name="${name}"], textarea[name="${name}"]`, value);
  }
}

/**
 * Submit a form by selector or first form on page
 */
export async function submitForm(
  page: Page,
  selector?: string
): Promise<void> {
  if (selector) {
    await page.click(selector);
  } else {
    await page.click('button[type="submit"]');
  }
  
  // Wait for navigation after form submission
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
    // Navigation might not happen, ignore timeout
  });
}

/**
 * Click an element and wait for navigation or specific condition
 */
export async function clickAndWait(
  page: Page,
  selector: string,
  waitFor?: string | RegExp
): Promise<void> {
  await page.click(selector);
  
  if (waitFor) {
    if (typeof waitFor === 'string') {
      await page.waitForURL(waitFor, { timeout: 5000 });
    } else {
      await page.waitForURL(waitFor, { timeout: 5000 });
    }
  } else {
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // Navigation might not happen, ignore timeout
    });
  }
}

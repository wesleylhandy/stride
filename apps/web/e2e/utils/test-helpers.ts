/**
 * Test Helper Utilities for Playwright E2E Tests
 * 
 * Provides common utilities for tests:
 * - retry: Retry flaky operations with exponential backoff
 * - generateEmail: Generate unique email addresses for tests
 * - generateProjectKey: Generate unique project keys for tests
 */

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; delay?: number }
): Promise<T> {
  const { retries = 3, delay = 1000 } = options || {};
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Generate a unique email address for testing
 */
export function generateEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate a unique project key for testing
 */
export function generateProjectKey(prefix: string = 'TEST'): string {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}${timestamp}${random}`;
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

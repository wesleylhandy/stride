/**
 * Client-side CSRF token utility
 * 
 * Reads CSRF token from cookie and provides helper to add to fetch requests
 */

/**
 * Get CSRF token from cookie (client-side)
 * The token is stored in a non-httpOnly cookie so JavaScript can read it
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token' && value) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Get headers object with CSRF token included
 * Use this for fetch requests that need CSRF protection
 */
export function getCsrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  if (!token) {
    return {};
  }

  return {
    'x-csrf-token': token,
  };
}

/**
 * Create a fetch wrapper that automatically includes CSRF token
 */
export function fetchWithCsrf(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getCsrfToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set('x-csrf-token', token);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

import { NextRequest, NextResponse } from "next/server";

/**
 * CSRF token cookie name
 */
const CSRF_TOKEN_COOKIE = "csrf-token";
const CSRF_TOKEN_HEADER = "x-csrf-token";

/**
 * Generate a cryptographically secure random token
 */
function generateCsrfToken(): string {
  // Use Web Crypto API (available in Edge Runtime)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Methods that require CSRF protection
 * GET, HEAD, OPTIONS are safe methods (idempotent, no side effects)
 */
const UNSAFE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Paths that should be exempt from CSRF protection
 * Webhook endpoints use HMAC signatures instead
 */
const CSRF_EXEMPT_PATHS = [
  "/api/webhooks/", // Webhook endpoints use HMAC verification
];

/**
 * Check if path is exempt from CSRF protection
 */
function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_TOKEN_COOKIE)?.value || null;
}

/**
 * Get CSRF token from header
 */
function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_TOKEN_HEADER) || null;
}

/**
 * Determine if cookie should be secure based on environment
 * Matches the exact logic used for session cookies in apps/web/app/api/auth/login/route.ts
 * 
 * Security behavior (secure by default in production):
 * - If COOKIE_SECURE="true": Always secure (HTTPS required)
 * - If COOKIE_SECURE="false": Never secure (explicit opt-in for local testing)
 * - If NODE_ENV=production and COOKIE_SECURE not set: Secure (HTTPS required)
 * - If NODE_ENV=development: Not secure (allows HTTP for local development)
 * 
 * IMPORTANT: Production defaults to secure=true. To test production builds locally over HTTP,
 * explicitly set COOKIE_SECURE=false. This is insecure and should never be used in actual production.
 * 
 * This follows the principle: secure by default, explicit opt-in required for insecure mode.
 */
function shouldUseSecureCookie(_request: NextRequest): boolean {
  // Explicit override takes precedence
  if (process.env.COOKIE_SECURE === "true") {
    return true;
  }
  if (process.env.COOKIE_SECURE === "false") {
    // Warn if production but explicitly allowing insecure cookies
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️  SECURITY WARNING: COOKIE_SECURE=false in production. " +
        "This is insecure and should only be used for local testing of production builds. " +
        "Never use this in actual production deployments."
      );
    }
    return false;
  }

  // In production, default to secure (requires HTTPS)
  // This matches session cookie behavior - secure by default, no back doors
  // For local testing of production builds, explicitly set COOKIE_SECURE=false
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  // In development, don't require HTTPS
  return false;
}

/**
 * Set CSRF token in cookie
 * Token is sent in a separate cookie that JavaScript can read
 * (not httpOnly) so client can send it in header
 */
function setCsrfTokenCookie(
  response: NextResponse,
  token: string,
  request: NextRequest,
): void {
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false, // Allow JavaScript to read for header submission
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Verify CSRF token
 * Compares token from cookie with token from header
 */
function verifyCsrfToken(
  cookieToken: string | null,
  headerToken: string | null,
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  let equal = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    equal |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  return equal === 0;
}

/**
 * CSRF protection middleware
 * Implements double-submit cookie pattern:
 * 1. Server sets CSRF token in cookie
 * 2. Client reads cookie and sends token in header for unsafe methods
 * 3. Server compares cookie token with header token
 */
export async function csrfMiddleware(
  request: NextRequest,
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Skip CSRF check for exempt paths
  if (isCsrfExempt(pathname)) {
    return null;
  }

  // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
  if (!UNSAFE_METHODS.includes(request.method)) {
    // Ensure token exists for future requests
    const existingToken = getCsrfTokenFromCookie(request);
    if (!existingToken) {
      // Generate and set token for future use
      const newToken = generateCsrfToken();
      const response = NextResponse.next();
      setCsrfTokenCookie(response, newToken, request);
      return response;
    }
    return null;
  }

  // For unsafe methods, verify CSRF token
  const cookieToken = getCsrfTokenFromCookie(request);
  const headerToken = getCsrfTokenFromHeader(request);

  if (!verifyCsrfToken(cookieToken, headerToken)) {
    return NextResponse.json(
      {
        error: "Invalid CSRF token",
        message: "CSRF token verification failed. Please refresh the page.",
      },
      { status: 403 },
    );
  }

  // Token verified - continue
  return null;
}

/**
 * Get or create CSRF token
 * Useful for API routes that need to return token to client
 */
export async function getOrCreateCsrfToken(
  request: NextRequest,
): Promise<string> {
  const existingToken = getCsrfTokenFromCookie(request);
  if (existingToken) {
    return existingToken;
  }

  // Generate new token
  return generateCsrfToken();
}

/**
 * Set CSRF token in response
 * Use this when creating new sessions or when token needs refresh
 * Note: This function requires a request to determine secure cookie setting
 */
export function setCsrfTokenInResponse(
  response: NextResponse,
  token: string,
  request: NextRequest,
): NextResponse {
  setCsrfTokenCookie(response, token, request);
  return response;
}
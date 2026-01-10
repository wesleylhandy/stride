import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  verifySession,
  getTokenFromHeaders,
  type SessionPayload,
} from "@/lib/auth/session";

/**
 * Auth middleware for protecting routes
 * Verifies session token and attaches user info to request
 */

export interface AuthenticatedRequest extends NextRequest {
  user?: SessionPayload;
}

/**
 * Middleware to verify authentication (for API routes)
 * Returns 401 if not authenticated
 * Also handles Server Components calling with { headers: Headers }
 */
export async function requireAuth(
  request: NextRequest | { headers: Headers },
): Promise<NextResponse | SessionPayload> {
  let token: string | null = null;

  // Check if this is a NextRequest (API route) - has cookies property
  if ('cookies' in request && request.cookies && typeof request.cookies.get === 'function') {
    // NextRequest from API route - use cookies API
    const sessionCookie = request.cookies.get('session');
    token = sessionCookie?.value || getTokenFromHeaders(request.headers);
  } else if ('headers' in request && request.headers instanceof Headers) {
    // Plain object with headers (Server Component) - use headers directly
    token = getTokenFromHeaders(request.headers);
  }

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const session = await verifySession(token);

  if (!session) {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 },
    );
  }

  return session;
}

/**
 * Server Component authentication helper
 * Accepts Headers directly (from next/headers) instead of NextRequest
 * Returns null if not authenticated (Server Components should redirect instead of returning errors)
 */
export async function requireAuthServer(
  headers: Headers,
): Promise<SessionPayload | null> {
  // In Server Components, use cookies() from next/headers for better cookie handling
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const token = sessionCookie?.value || getTokenFromHeaders(headers);

  if (!token) {
    return null;
  }

  const session = await verifySession(token);
  return session;
}

/**
 * Optional auth middleware
 * Attaches user info if authenticated, but doesn't require it
 */
export async function optionalAuth(
  request: NextRequest,
): Promise<SessionPayload | null> {
  // In Next.js App Router, use request.cookies to read cookies
  const sessionCookie = request.cookies.get('session');
  const token = sessionCookie?.value || getTokenFromHeaders(request.headers);

  if (!token) {
    return null;
  }

  const session = await verifySession(token);
  return session;
}

/**
 * Helper to create authenticated API handler
 * Wraps API route handler with auth check
 */
export function withAuth<T = unknown>(
  handler: (
    request: NextRequest,
    user: SessionPayload,
  ) => Promise<NextResponse<T>>,
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      // Auth failed, return error response
      return authResult as NextResponse<T>;
    }

    // Auth succeeded, call handler with user
    return handler(request, authResult);
  };
}


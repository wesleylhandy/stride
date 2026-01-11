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
 * Middleware to verify authentication (for API routes only)
 * Returns 401 if not authenticated
 * 
 * NOTE: For server components, use requireAuthServer() instead.
 */
export async function requireAuth(
  request: NextRequest,
): Promise<NextResponse | SessionPayload> {
  // Check cookie first (primary auth method for API routes)
  const sessionCookie = request.cookies.get('session');
  let token = sessionCookie?.value || null;

  // Fallback to Authorization header (for programmatic API access)
  if (!token) {
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
 * Uses cookies() API from next/headers (Next.js 16+ best practice)
 * Returns null if not authenticated (Server Components should redirect instead of returning errors)
 * 
 * @param headers - Headers from next/headers (used for type compatibility, cookies() is primary)
 * @returns Session payload or null if not authenticated
 */
export async function requireAuthServer(
  _headers: Headers,
): Promise<SessionPayload | null> {
  // Use cookies() API from next/headers (Next.js 16+ recommended approach)
  // This avoids manual cookie parsing and handles edge cases properly
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const token = sessionCookie?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);
  return session;
}

/**
 * Optional auth middleware (for API routes)
 * Attaches user info if authenticated, but doesn't require it
 */
export async function optionalAuth(
  request: NextRequest,
): Promise<SessionPayload | null> {
  // Check cookie first
  const sessionCookie = request.cookies.get('session');
  let token = sessionCookie?.value || null;

  // Fallback to Authorization header
  if (!token) {
    token = getTokenFromHeaders(request.headers);
  }

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


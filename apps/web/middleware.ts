import { NextRequest, NextResponse } from 'next/server';
import { requestIdMiddleware, getOrCreateRequestId, addRequestIdToResponse } from './src/middleware/request-id';
import { rateLimitMiddleware, addRateLimitHeaders } from './src/middleware/rate-limit';
import { csrfMiddleware } from './src/middleware/csrf';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Get or create request ID for logging
  const requestId = getOrCreateRequestId(request);

  // Check rate limiting first (before processing request)
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    // Rate limited - still add request ID for logging
    return addRequestIdToResponse(rateLimitResponse, requestId);
  }

  // Check CSRF protection (for unsafe methods)
  const csrfResponse = await csrfMiddleware(request);
  if (csrfResponse) {
    // CSRF failed - add request ID for logging
    return addRequestIdToResponse(csrfResponse, requestId);
  }

  // Add request ID to all requests
  const response = requestIdMiddleware(request);

  // Add rate limit headers to successful responses
  return addRateLimitHeaders(response, request);
}

export const config = {
  // Match all routes except static files and API routes that don't need request IDs
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};






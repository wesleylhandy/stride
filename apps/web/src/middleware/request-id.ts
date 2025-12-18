import { NextRequest, NextResponse } from 'next/server';

const REQUEST_ID_HEADER = 'x-request-id';
const REQUEST_ID_COOKIE = 'x-request-id';

/**
 * Generates a unique request ID using Web Crypto API (Edge Runtime compatible)
 */
export function generateRequestId(): string {
  // Use Web Crypto API which is available in Edge Runtime
  return crypto.randomUUID();
}

/**
 * Extracts request ID from request headers or cookies, or generates a new one
 */
export function getOrCreateRequestId(request: NextRequest): string {
  // Check header first
  const headerId = request.headers.get(REQUEST_ID_HEADER);
  if (headerId) {
    return headerId;
  }

  // Check cookie
  const cookieId = request.cookies.get(REQUEST_ID_COOKIE)?.value;
  if (cookieId) {
    return cookieId;
  }

  // Generate new ID
  return generateRequestId();
}

/**
 * Adds request ID to response headers and cookies
 */
export function addRequestIdToResponse(
  response: NextResponse,
  requestId: string
): NextResponse {
  // Add to response headers
  response.headers.set(REQUEST_ID_HEADER, requestId);

  // Set cookie for client-side access
  response.cookies.set(REQUEST_ID_COOKIE, requestId, {
    httpOnly: false, // Allow client-side access for debugging
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  return response;
}

/**
 * Middleware function to handle request ID
 */
export function requestIdMiddleware(request: NextRequest): NextResponse {
  const requestId = getOrCreateRequestId(request);
  const response = NextResponse.next();
  return addRequestIdToResponse(response, requestId);
}


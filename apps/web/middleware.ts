import { NextRequest, NextResponse } from 'next/server';
import { requestIdMiddleware } from './src/middleware/request-id';

export function middleware(request: NextRequest): NextResponse {
  // Add request ID to all requests
  return requestIdMiddleware(request);
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





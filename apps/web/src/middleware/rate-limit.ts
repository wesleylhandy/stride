import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting configuration
 * Limits requests per window per identifier (IP address or user ID)
 */
interface RateLimitConfig {
  /** Maximum requests allowed per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Rate limit configuration keys
 */
type RateLimitKey = 'auth' | 'api' | 'webhook' | 'public';

/**
 * Default rate limit configurations by endpoint type
 */
const DEFAULT_RATE_LIMITS: Record<RateLimitKey, RateLimitConfig> = {
  // Auth endpoints - stricter limits to prevent brute force
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // API endpoints - moderate limits
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Webhook endpoints - more permissive (expect bursts)
  webhook: {
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1 minute
  },
  // Public endpoints - very permissive
  public: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * In-memory store for rate limiting
 * In production, consider using Redis for distributed systems
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getRateLimitIdentifier(request: NextRequest): string {
  // Try to get IP address from headers (proxy-friendly)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // For authenticated requests, include user ID if available
  // This requires extracting user from session, but for simplicity
  // we'll use IP for now. Can be enhanced later.
  return `ip:${ip}`;
}

/**
 * Check if request should be rate limited
 * @returns true if request should be allowed, false if rate limited
 */
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired entry - create new window
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Entry exists and is valid - check count
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Determine rate limit configuration based on request path
 */
function getRateLimitConfig(request: NextRequest): RateLimitConfig {
  const pathname = request.nextUrl.pathname;

  // Auth endpoints - exclude /api/auth/me which is frequently called by UserMenu
  // Use API rate limit for /me endpoint since it's a safe GET endpoint
  if (pathname.startsWith("/api/auth")) {
    if (pathname === "/api/auth/me") {
      return DEFAULT_RATE_LIMITS.api;
    }
    return DEFAULT_RATE_LIMITS.auth;
  }

  // Webhook endpoints
  if (pathname.startsWith("/api/webhooks")) {
    return DEFAULT_RATE_LIMITS.webhook;
  }

  // Public endpoints (e.g., preview-link)
  if (pathname.startsWith("/api/preview-link")) {
    return DEFAULT_RATE_LIMITS.public;
  }

  // Default API rate limit
  if (pathname.startsWith("/api")) {
    return DEFAULT_RATE_LIMITS.api;
  }

  // Default for non-API routes
  return DEFAULT_RATE_LIMITS.public;
}

/**
 * Rate limiting middleware
 * Checks if request exceeds rate limit and returns 429 if so
 */
export function rateLimitMiddleware(
  request: NextRequest,
): NextResponse | null {
  const config = getRateLimitConfig(request);
  const identifier = getRateLimitIdentifier(request);
  const result = checkRateLimit(identifier, config);

  // If rate limited, return 429 response
  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      { status: 429 },
    );

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(result.resetTime).toISOString(),
    );
    response.headers.set(
      "Retry-After",
      Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
    );

    return response;
  }

  // Request allowed - add rate limit info to response headers
  // We'll do this in the middleware wrapper
  return null;
}

/**
 * Wrapper to add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  const config = getRateLimitConfig(request);
  const identifier = getRateLimitIdentifier(request);
  const entry = rateLimitStore.get(identifier);

  if (entry) {
    const remaining = Math.max(0, config.maxRequests - entry.count);
    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(entry.resetTime).toISOString(),
    );
  }

  return response;
}
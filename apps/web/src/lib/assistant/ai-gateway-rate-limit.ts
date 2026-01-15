/**
 * Rate limiting for AI Gateway API calls
 * Separate limits to protect the AI Gateway service from overload
 */

/**
 * Default rate limit configuration for AI Gateway calls
 * These limits are separate from per-user assistant rate limits
 */
const DEFAULT_AI_GATEWAY_RATE_LIMIT = {
  maxRequests: 60, // 60 requests per minute (shared across all users)
  windowMs: 60 * 1000, // 1 minute window
};

/**
 * Rate limit entry in memory store
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for AI Gateway rate limiting
 * Key: "ai-gateway" (shared limit for all AI Gateway calls)
 * In production, consider using Redis for distributed systems
 */
const aiGatewayRateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if an AI Gateway request should be rate limited
 * This is a shared limit across all users to protect the AI Gateway service
 * @param config - Optional custom rate limit configuration
 * @returns Rate limit check result
 */
export function checkAIGatewayRateLimit(
  config = DEFAULT_AI_GATEWAY_RATE_LIMIT
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const identifier = "ai-gateway"; // Shared limit for all calls
  const now = Date.now();
  const entry = aiGatewayRateLimitStore.get(identifier);

  // No entry or expired entry - create new window
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    aiGatewayRateLimitStore.set(identifier, {
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
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  aiGatewayRateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clear AI Gateway rate limit (useful for testing or manual reset)
 */
export function clearAIGatewayRateLimit(): void {
  aiGatewayRateLimitStore.delete("ai-gateway");
}

/**
 * Cleanup old AI Gateway rate limit entries (run periodically)
 * Removes expired entries to prevent memory leaks
 */
export function cleanupAIGatewayRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of aiGatewayRateLimitStore.entries()) {
    if (entry.resetTime < now) {
      aiGatewayRateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(cleanupAIGatewayRateLimitStore, 5 * 60 * 1000);
}

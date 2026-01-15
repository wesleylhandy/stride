/**
 * Rate limiting for assistant chat endpoints
 * Per-user message limits to prevent abuse
 */

/**
 * Default rate limit configuration for assistant endpoints
 */
const DEFAULT_ASSISTANT_RATE_LIMIT = {
  maxRequests: 20, // 20 messages per minute per user
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
 * In-memory store for rate limiting
 * Key: userId (or userId:projectId for project-specific limits)
 * In production, consider using Redis for distributed systems
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a user's request should be rate limited
 * @param userId - User ID
 * @param projectId - Optional project ID (for per-project limits if needed)
 * @param config - Optional custom rate limit configuration
 * @returns Rate limit check result
 */
export function checkAssistantRateLimit(
  userId: string,
  projectId?: string | null,
  config = DEFAULT_ASSISTANT_RATE_LIMIT
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  // Create identifier key (include projectId if provided for project-specific limits)
  const identifier = projectId ? `${userId}:${projectId}` : userId;

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
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clear rate limit for a user (useful for testing or manual reset)
 * @param userId - User ID
 * @param projectId - Optional project ID
 */
export function clearAssistantRateLimit(
  userId: string,
  projectId?: string | null
): void {
  const identifier = projectId ? `${userId}:${projectId}` : userId;
  rateLimitStore.delete(identifier);
}

/**
 * Cleanup old rate limit entries (run periodically)
 * Removes expired entries to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

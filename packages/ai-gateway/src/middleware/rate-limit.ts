// Rate limiting middleware
import type { IncomingMessage } from 'http';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (simple implementation)
// In production, consider using Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP

/**
 * Checks if request is within rate limit
 */
export async function rateLimiter(
  req: IncomingMessage
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const ip = getClientIP(req);
  const now = Date.now();

  // Get or create entry for this IP
  let entry = rateLimitStore.get(ip);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(ip, entry);
  }

  // Increment count
  entry.count += 1;

  // Check if limit exceeded
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 2); // Cleanup every 2 windows

function getClientIP(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const firstIP = forwarded.split(',')[0];
    if (firstIP) return firstIP.trim();
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP && typeof realIP === 'string') {
    return realIP;
  }

  const socket = req.socket;
  if (socket && socket.remoteAddress) {
    return socket.remoteAddress;
  }

  return 'unknown';
}

/**
 * Rate limiter utility for handling Git provider API rate limits
 * 
 * Implements exponential backoff with jitter for rate limit errors.
 * Supports rate limit detection via status codes and response headers.
 */

import { RateLimitError, RateLimitInfo } from "./types";

/**
 * Rate limit detection result
 */
interface RateLimitDetection {
  isRateLimited: boolean;
  rateLimitInfo?: RateLimitInfo;
  retryAfter?: number; // Seconds to wait before retry
}

/**
 * Configuration for exponential backoff
 */
export interface BackoffConfig {
  baseDelay: number; // Base delay in seconds (default: 60)
  maxAttempts: number; // Maximum retry attempts (default: 5)
  maxDelay: number; // Maximum delay in seconds (default: 600)
  jitterRange: number; // Jitter range in seconds (default: 10)
}

const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  baseDelay: 60,
  maxAttempts: 5,
  maxDelay: 600,
  jitterRange: 10,
};

/**
 * Detect rate limit from HTTP response
 * 
 * Checks status code and response headers for rate limit information.
 * Supports GitHub, GitLab, and Bitbucket rate limit headers.
 * 
 * @param statusCode - HTTP status code
 * @param headers - Response headers
 * @param provider - Git provider type
 * @returns Rate limit detection result
 */
export function detectRateLimit(
  statusCode: number,
  headers: Headers | Record<string, string>,
  provider: "GitHub" | "GitLab" | "Bitbucket",
): RateLimitDetection {
  const isRateLimited =
    statusCode === 429 || // Too Many Requests
    (statusCode === 403 && provider === "GitHub"); // GitHub uses 403 for rate limits

  if (!isRateLimited) {
    return { isRateLimited: false };
  }

  // Extract rate limit info from headers
  const rateLimitInfo = extractRateLimitInfo(headers, provider);
  const retryAfter = extractRetryAfter(headers);

  return {
    isRateLimited: true,
    rateLimitInfo,
    retryAfter,
  };
}

/**
 * Extract rate limit information from response headers
 * 
 * @param headers - Response headers
 * @param provider - Git provider type
 * @returns Rate limit information or undefined
 */
function extractRateLimitInfo(
  headers: Headers | Record<string, string>,
  provider: "GitHub" | "GitLab" | "Bitbucket",
): RateLimitInfo | undefined {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return headers[name.toLowerCase()] || headers[name] || null;
  };

  switch (provider) {
    case "GitHub": {
      const limit = getHeader("X-RateLimit-Limit");
      const remaining = getHeader("X-RateLimit-Remaining");
      const reset = getHeader("X-RateLimit-Reset");

      if (limit && remaining && reset) {
        return {
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          reset: parseInt(reset, 10),
        };
      }
      break;
    }

    case "GitLab": {
      const limit = getHeader("RateLimit-Limit");
      const remaining = getHeader("RateLimit-Remaining");
      const reset = getHeader("RateLimit-Reset");

      if (limit && remaining && reset) {
        return {
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          reset: parseInt(reset, 10),
        };
      }
      break;
    }

    case "Bitbucket": {
      // Bitbucket doesn't provide standard rate limit headers
      // Return undefined - will use default backoff
      break;
    }
  }

  return undefined;
}

/**
 * Extract Retry-After header value
 * 
 * @param headers - Response headers
 * @returns Retry-After value in seconds, or undefined
 */
function extractRetryAfter(
  headers: Headers | Record<string, string>,
): number | undefined {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return headers[name.toLowerCase()] || headers[name] || null;
  };

  const retryAfter = getHeader("Retry-After");
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds;
    }
  }

  return undefined;
}

/**
 * Calculate exponential backoff delay with jitter
 * 
 * Formula: delay = min(baseDelay * (2 ^ attempt) + jitter, maxDelay)
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Backoff configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
): number {
  const { baseDelay, maxDelay, jitterRange } = config;

  // Calculate exponential delay
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Add random jitter to prevent thundering herd
  const jitter = Math.random() * jitterRange;

  // Cap at max delay
  const totalDelay = Math.min(exponentialDelay + jitter, maxDelay);

  // Convert to milliseconds
  return Math.floor(totalDelay * 1000);
}

/**
 * Wait for specified duration
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with exponential backoff retry on rate limit errors
 * 
 * @param fn - Function to execute (should throw RateLimitError on rate limit)
 * @param config - Backoff configuration
 * @param onRetry - Optional callback called before each retry
 * @returns Result of function execution
 * @throws RateLimitError if max attempts exceeded
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
  onRetry?: (attempt: number, delay: number) => void,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on rate limit errors
      if (!(error instanceof RateLimitError)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === config.maxAttempts - 1) {
        throw error;
      }

      // Calculate delay
      const delay = error.retryAfter
        ? error.retryAfter * 1000 // Convert seconds to milliseconds
        : calculateBackoffDelay(attempt, config);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, delay);
      }

      // Wait before retry
      await wait(delay);
    }
  }

  // Should never reach here, but TypeScript requires it
  throw lastError;
}

/**
 * Create a RateLimitError from HTTP response
 * 
 * @param statusCode - HTTP status code
 * @param headers - Response headers
 * @param provider - Git provider type
 * @param message - Error message
 * @returns RateLimitError instance
 */
export function createRateLimitError(
  statusCode: number,
  headers: Headers | Record<string, string>,
  provider: "GitHub" | "GitLab" | "Bitbucket",
  message: string = "Rate limit exceeded",
): RateLimitError {
  const detection = detectRateLimit(statusCode, headers, provider);

  if (!detection.isRateLimited) {
    throw new Error("Not a rate limit error");
  }

  return new RateLimitError(
    message,
    detection.rateLimitInfo,
    detection.retryAfter,
  );
}

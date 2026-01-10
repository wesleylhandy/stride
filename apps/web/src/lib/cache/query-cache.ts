/**
 * Query result caching utility
 * 
 * Provides in-memory caching for database query results to reduce database load
 * and improve response times. Can be replaced with Redis in production for distributed systems.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  
  /**
   * Default TTL values (in milliseconds) for different query types
   */
  readonly defaultTTLs = {
    projects: 5 * 60 * 1000, // 5 minutes
    issues: 2 * 60 * 1000, // 2 minutes
    issueDetail: 1 * 60 * 1000, // 1 minute
    cycles: 5 * 60 * 1000, // 5 minutes
    config: 10 * 60 * 1000, // 10 minutes
    metrics: 30 * 1000, // 30 seconds
    default: 2 * 60 * 1000, // 2 minutes
  } as const;

  /**
   * Get a cached value by key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age >= entry.ttl) {
      // Entry expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a cached value with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTLs.default,
    };

    this.cache.set(key, entry);
  }

  /**
   * Set a cached value with a type-specific TTL
   */
  setTyped<T>(
    key: string,
    data: T,
    type: keyof typeof this.defaultTTLs,
  ): void {
    const ttl = this.defaultTTLs[type] ?? this.defaultTTLs.default;
    this.set(key, data, ttl);
  }

  /**
   * Delete a cached value by key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all cached values matching a pattern
   */
  deletePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*'))
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age >= entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
const queryCache = new QueryCache();

// Periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    queryCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cache key generators for consistent key formatting
 */
export const cacheKeys = {
  project: {
    list: (filters?: Record<string, unknown>) => 
      `project:list:${JSON.stringify(filters ?? {})}`,
    detail: (id: string) => `project:detail:${id}`,
    config: (id: string) => `project:config:${id}`,
  },
  issue: {
    list: (projectId: string, filters?: Record<string, unknown>) =>
      `issue:list:${projectId}:${JSON.stringify(filters ?? {})}`,
    detail: (projectId: string, key: string) =>
      `issue:detail:${projectId}:${key}`,
    search: (projectId: string, query: string, page?: number, pageSize?: number) =>
      `issue:search:${projectId}:${query}:${page ?? 1}:${pageSize ?? 20}`,
  },
  cycle: {
    list: (projectId: string) => `cycle:list:${projectId}`,
    detail: (projectId: string, id: string) =>
      `cycle:detail:${projectId}:${id}`,
    metrics: (projectId: string, id: string) =>
      `cycle:metrics:${projectId}:${id}`,
  },
  metrics: {
    burndown: (projectId: string, cycleId: string) =>
      `metrics:burndown:${projectId}:${cycleId}`,
    cycleTime: (projectId: string, startDate: string, endDate: string) =>
      `metrics:cycleTime:${projectId}:${startDate}:${endDate}`,
  },
} as const;

/**
 * Cached query executor
 * 
 * Executes a query function and caches the result. If the result is already cached,
 * returns the cached value instead of executing the query.
 * 
 * @param key - Cache key
 * @param queryFn - Function that executes the query
 * @param options - Caching options
 * @returns Cached or fresh query result
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options?: {
    ttl?: number;
    type?: keyof typeof queryCache.defaultTTLs;
    forceRefresh?: boolean;
  },
): Promise<T> {
  // Check cache first (unless forcing refresh)
  if (!options?.forceRefresh) {
    const cached = queryCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // Execute query
  const result = await queryFn();

  // Cache the result
  if (options?.type) {
    queryCache.setTyped(key, result, options.type);
  } else {
    queryCache.set(key, result, options?.ttl);
  }

  return result;
}

/**
 * Invalidate cache entries
 */
export function invalidateCache(key: string | string[]): void {
  if (Array.isArray(key)) {
    key.forEach(k => queryCache.delete(k));
  } else {
    queryCache.delete(key);
  }
}

/**
 * Invalidate all cache entries matching a pattern
 */
export function invalidateCachePattern(pattern: string | RegExp): void {
  queryCache.deletePattern(pattern);
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  queryCache.clear();
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats() {
  return queryCache.getStats();
}

// Export the cache instance for advanced usage
export { queryCache };

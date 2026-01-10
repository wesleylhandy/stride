/**
 * Cache invalidation utilities
 * 
 * This module provides utilities for invalidating caches when data changes.
 */

import {
  invalidateCachePattern,
  cacheKeys,
  type cacheKeys as CacheKeys,
} from './query-cache';

/**
 * Invalidate all caches for a project
 */
export function invalidateProjectCaches(projectId: string): void {
  // Invalidate all project-related caches
  invalidateCachePattern(new RegExp(`^project:.*:${projectId}`));
  invalidateCachePattern(new RegExp(`^issue:.*:${projectId}`));
  invalidateCachePattern(new RegExp(`^cycle:.*:${projectId}`));
  invalidateCachePattern(new RegExp(`^metrics:.*:${projectId}`));
}

/**
 * Invalidate workflow/config cache for a project
 */
export function invalidateConfigCache(projectId: string): void {
  invalidateCachePattern(new RegExp(`^project:config:${projectId}$`));
  // Also invalidate project detail cache since config is included
  invalidateCachePattern(new RegExp(`^project:detail:${projectId}$`));
}

/**
 * Invalidate issue cache for a project
 */
export function invalidateIssueCache(
  projectId: string,
  issueKey?: string,
): void {
  if (issueKey) {
    // Invalidate specific issue
    const key = cacheKeys.issue.detail(projectId, issueKey);
    invalidateCachePattern(key);
    // Also invalidate issue list caches (they may include this issue)
    invalidateCachePattern(new RegExp(`^issue:list:${projectId}:`));
    invalidateCachePattern(new RegExp(`^issue:search:${projectId}:`));
  } else {
    // Invalidate all issue caches for the project
    invalidateCachePattern(new RegExp(`^issue:.*:${projectId}`));
  }
}

/**
 * Invalidate cycle cache for a project
 */
export function invalidateCycleCache(
  projectId: string,
  cycleId?: string,
): void {
  if (cycleId) {
    // Invalidate specific cycle
    invalidateCachePattern(
      new RegExp(`^cycle:detail:${projectId}:${cycleId}$`),
    );
    invalidateCachePattern(
      new RegExp(`^cycle:metrics:${projectId}:${cycleId}$`),
    );
    // Also invalidate cycle list cache
    invalidateCachePattern(new RegExp(`^cycle:list:${projectId}$`));
  } else {
    // Invalidate all cycle caches for the project
    invalidateCachePattern(new RegExp(`^cycle:.*:${projectId}`));
  }
}

/**
 * Invalidate metrics cache for a project
 */
export function invalidateMetricsCache(projectId: string): void {
  invalidateCachePattern(new RegExp(`^metrics:.*:${projectId}`));
}


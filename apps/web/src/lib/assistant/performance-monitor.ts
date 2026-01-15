/**
 * Performance monitoring for AI assistant
 * Tracks response times and validates against SC-008 target (30 seconds for 95% of queries)
 */

interface PerformanceMetrics {
  responseTime: number;
  timestamp: number;
  sessionId?: string;
  contextType?: "project" | "infrastructure";
  messageLength?: number;
  error?: boolean;
}

const METRICS_STORAGE_KEY = "assistant_performance_metrics";
const MAX_STORED_METRICS = 1000; // Keep last 1000 metrics
const TARGET_P95_RESPONSE_TIME = 30000; // 30 seconds in milliseconds

/**
 * Record a performance metric
 */
export function recordMetric(metric: PerformanceMetrics): void {
  try {
    // In a real implementation, this would send to a monitoring service
    // For now, we'll log and optionally store in memory/localStorage for client-side
    const metrics = getStoredMetrics();
    metrics.push(metric);
    
    // Keep only the most recent metrics
    if (metrics.length > MAX_STORED_METRICS) {
      metrics.splice(0, metrics.length - MAX_STORED_METRICS);
    }
    
    // Store metrics (client-side only, server-side would use proper logging)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
      } catch {
        // localStorage may be disabled, ignore
      }
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Assistant Performance]", {
        responseTime: `${metric.responseTime}ms`,
        target: `${TARGET_P95_RESPONSE_TIME}ms`,
        status: metric.responseTime <= TARGET_P95_RESPONSE_TIME ? "✓" : "⚠",
        error: metric.error,
      });
    }
  } catch (error) {
    console.error("Failed to record performance metric:", error);
  }
}

/**
 * Get stored metrics (client-side only)
 */
function getStoredMetrics(): PerformanceMetrics[] {
  if (typeof window === "undefined") {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(METRICS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as PerformanceMetrics[];
    }
  } catch {
    // Ignore parse errors
  }
  
  return [];
}

/**
 * Calculate P95 response time from stored metrics
 */
export function calculateP95ResponseTime(metrics?: PerformanceMetrics[]): number {
  const allMetrics = metrics || getStoredMetrics();
  
  if (allMetrics.length === 0) {
    return 0;
  }
  
  // Filter out errors for P95 calculation
  const successfulMetrics = allMetrics
    .filter((m) => !m.error)
    .map((m) => m.responseTime)
    .sort((a, b) => a - b);
  
  if (successfulMetrics.length === 0) {
    return 0;
  }
  
  // Calculate 95th percentile
  const index = Math.ceil(successfulMetrics.length * 0.95) - 1;
  return successfulMetrics[index] || 0;
}

/**
 * Check if performance meets SC-008 target (30 seconds for 95% of queries)
 */
export function meetsPerformanceTarget(metrics?: PerformanceMetrics[]): {
  meets: boolean;
  p95: number;
  target: number;
  percentage: number;
} {
  const p95 = calculateP95ResponseTime(metrics);
  const meets = p95 <= TARGET_P95_RESPONSE_TIME;
  const percentage = TARGET_P95_RESPONSE_TIME > 0 
    ? (p95 / TARGET_P95_RESPONSE_TIME) * 100 
    : 0;
  
  return {
    meets,
    p95,
    target: TARGET_P95_RESPONSE_TIME,
    percentage,
  };
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  totalRequests: number;
  successfulRequests: number;
  errorRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  meetsTarget: boolean;
} {
  const metrics = getStoredMetrics();
  const total = metrics.length;
  const successful = metrics.filter((m) => !m.error).length;
  const errorRate = total > 0 ? (total - successful) / total : 0;
  
  const successfulMetrics = metrics.filter((m) => !m.error);
  const averageResponseTime = 
    successfulMetrics.length > 0
      ? successfulMetrics.reduce((sum, m) => sum + m.responseTime, 0) / successfulMetrics.length
      : 0;
  
  const p95 = calculateP95ResponseTime(metrics);
  const { meets } = meetsPerformanceTarget(metrics);
  
  return {
    totalRequests: total,
    successfulRequests: successful,
    errorRate,
    averageResponseTime,
    p95ResponseTime: p95,
    meetsTarget: meets,
  };
}

/**
 * Create a performance timer
 * Returns a function that records the metric when called
 */
export function createTimer(context?: {
  sessionId?: string;
  contextType?: "project" | "infrastructure";
  messageLength?: number;
}): (error?: boolean) => void {
  const startTime = Date.now();
  
  return (error?: boolean) => {
    const responseTime = Date.now() - startTime;
    recordMetric({
      responseTime,
      timestamp: Date.now(),
      sessionId: context?.sessionId,
      contextType: context?.contextType,
      messageLength: context?.messageLength,
      error: error || false,
    });
  };
}

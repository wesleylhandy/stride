/**
 * Metrics collection module
 * 
 * This is a stub implementation for T056.
 * Full implementation will be added in Phase 2.
 */

interface MetricsSummary {
  requests: {
    total: number;
    perMinute: number;
  };
  errors: {
    total: number;
    perMinute: number;
  };
  uptime: number;
}

class Metrics {
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;

  /**
   * Get current metrics summary
   */
  getSummary(): MetricsSummary {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    return {
      requests: {
        total: this.requestCount,
        perMinute: uptime > 0 ? Math.round((this.requestCount / uptime) * 60) : 0,
      },
      errors: {
        total: this.errorCount,
        perMinute: uptime > 0 ? Math.round((this.errorCount / uptime) * 60) : 0,
      },
      uptime,
    };
  }

  /**
   * Increment request counter
   */
  incrementRequest(): void {
    this.requestCount++;
  }

  /**
   * Increment error counter
   */
  incrementError(): void {
    this.errorCount++;
  }
}

export const metrics = new Metrics();

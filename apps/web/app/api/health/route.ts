/**
 * Health check endpoint
 * 
 * Provides application health status for monitoring and load balancers
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@stride/database';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      latency?: number;
    };
  };
}

/**
 * GET /api/health
 * Returns application health status
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  let databaseHealthy = false;
  let databaseLatency: number | undefined;

  try {
    // Check database connectivity
    const dbCheckStart = Date.now();
    databaseHealthy = await checkDatabaseHealth();
    databaseLatency = Date.now() - dbCheckStart;
  } catch (error) {
    // Database check failed
    databaseHealthy = false;
    databaseLatency = Date.now() - startTime;
  }

  // Determine overall health status
  // healthy: all critical services are working
  // degraded: some non-critical services are down, but core functionality works
  // unhealthy: critical services are down
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (databaseHealthy) {
    overallStatus = 'healthy';
  } else {
    overallStatus = 'unhealthy'; // Database is critical
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: {
        status: databaseHealthy ? 'healthy' : 'unhealthy',
        latency: databaseLatency,
      },
    },
  };

  // Return appropriate status code
  // healthy: 200, degraded: 200, unhealthy: 503
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, { status: statusCode });
}

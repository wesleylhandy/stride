import { NextResponse } from 'next/server';
import { metrics } from '@/src/lib/metrics';

/**
 * GET /api/metrics
 *
 * Returns application metrics for observability.
 * In production, this should be protected or rate-limited.
 */
export async function GET() {
  try {
    const summary = metrics.getSummary();

    return NextResponse.json(
      {
        status: 'ok',
        metrics: summary,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to retrieve metrics',
      },
      { status: 500 }
    );
  }
}


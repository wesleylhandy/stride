import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { UserRole } from '@stride/types';
import { metrics } from '@/lib/metrics';

/**
 * GET /api/metrics
 *
 * Returns application metrics for observability.
 * Admin-only access to prevent information disclosure.
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Admin-only access
    if (authResult.role !== UserRole.Admin) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Admin access required to view metrics',
        },
        { status: 403 }
      );
    }

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


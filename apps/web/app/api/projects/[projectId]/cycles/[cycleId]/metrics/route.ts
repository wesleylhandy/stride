import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import {
  cycleRepository,
  projectRepository,
} from "@stride/database";
import { canViewCycle } from "@/lib/auth/permissions";
import {
  calculateAverageCycleTime,
  calculateCycleTimeStats,
} from "@/lib/metrics/cycle-time";

interface RouteParams {
  params: {
    projectId: string;
    cycleId: string;
  };
}

/**
 * GET /api/projects/[projectId]/cycles/[cycleId]/metrics
 * Get cycle time metrics for a cycle
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    // Check permission to view cycles
    if (!canViewCycle(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot view cycles" },
        { status: 403 },
      );
    }

    // Verify project exists
    const project = await projectRepository.findById(params.projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Get cycle with issues
    const cycle = await cycleRepository.findById(params.cycleId);

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found" },
        { status: 404 },
      );
    }

    // Verify cycle belongs to project
    if (cycle.projectId !== params.projectId) {
      return NextResponse.json(
        { error: "Cycle not found in this project" },
        { status: 404 },
      );
    }

    // Get all issues for this cycle
    const issues = await cycleRepository.getIssues(params.cycleId);

    // Get closed statuses from project config
    const projectConfig = project.config as {
      workflow?: { statuses?: Array<{ key: string; type?: string }> };
    };
    const closedStatuses =
      projectConfig?.workflow?.statuses
        ?.filter((s) => s.type === "closed")
        ?.map((s) => s.key) || [];

    // Calculate metrics
    const averageCycleTime = calculateAverageCycleTime(issues, closedStatuses);
    const stats = calculateCycleTimeStats(issues, closedStatuses);

    return NextResponse.json({
      averageCycleTime: averageCycleTime,
      stats: {
        average: stats.average,
        median: stats.median,
        min: stats.min,
        max: stats.max,
        count: stats.count,
      },
    });
  } catch (error) {
    console.error("Get cycle metrics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


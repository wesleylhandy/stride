import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import {
  cycleRepository,
  projectRepository,
} from "@stride/database";
import { canViewCycle } from "@/lib/auth/permissions";
import {
  calculateBurndownData,
  calculateIdealBurndown,
} from "@/lib/metrics/burndown";

interface RouteParams {
  params: {
    projectId: string;
    cycleId: string;
  };
}

/**
 * GET /api/projects/[projectId]/cycles/[cycleId]/burndown
 * Get burndown chart data for a cycle
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

    // Calculate burndown data
    const actualBurndown = calculateBurndownData(cycle, issues);

    // Calculate total story points
    const totalStoryPoints = issues.reduce(
      (sum, issue) => sum + (issue.storyPoints || 0),
      0,
    );

    // Calculate ideal burndown line
    const idealBurndown = calculateIdealBurndown(
      totalStoryPoints,
      new Date(cycle.startDate),
      new Date(cycle.endDate),
    );

    return NextResponse.json({
      actual: actualBurndown,
      ideal: idealBurndown,
      totalStoryPoints,
    });
  } catch (error) {
    console.error("Get burndown data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


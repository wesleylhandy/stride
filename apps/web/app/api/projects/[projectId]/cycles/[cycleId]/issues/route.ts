import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import {
  cycleRepository,
  issueRepository,
  projectRepository,
} from "@stride/database";
import { assignIssuesToCycleSchema } from "@/lib/validation/cycle";
import {
  canUpdateCycle,
} from "@/lib/auth/permissions";
import { z } from "zod";

interface RouteParams {
  params: {
    projectId: string;
    cycleId: string;
  };
}

/**
 * POST /api/projects/[projectId]/cycles/[cycleId]/issues
 * Assign issues to a cycle
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    // Check permission to update cycles (required to assign issues)
    if (!canUpdateCycle(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot assign issues to cycles" },
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

    // Verify cycle exists and belongs to project
    const cycle = await cycleRepository.findById(params.cycleId);
    if (!cycle || cycle.projectId !== params.projectId) {
      return NextResponse.json(
        { error: "Cycle not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = assignIssuesToCycleSchema.parse(body);

    // Verify all issues exist and belong to the project
    for (const issueId of validated.issueIds) {
      const issue = await issueRepository.findById(issueId);
      if (!issue) {
        return NextResponse.json(
          { error: `Issue with id "${issueId}" not found` },
          { status: 404 },
        );
      }
      if (issue.projectId !== params.projectId) {
        return NextResponse.json(
          { error: `Issue with id "${issueId}" does not belong to this project` },
          { status: 400 },
        );
      }
    }

    // Assign all issues to the cycle
    await cycleRepository.assignIssues(params.cycleId, validated.issueIds);

    // Return updated issues
    const updatedIssues = await Promise.all(
      validated.issueIds.map((id) => issueRepository.findById(id)),
    );

    return NextResponse.json({
      data: updatedIssues.filter((issue) => issue !== null),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Assign issues to cycle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { cycleRepository, projectRepository } from "@stride/database";
import { updateCycleSchema } from "@/lib/validation/cycle";
import {
  canUpdateCycle,
  canViewCycle,
} from "@/lib/auth/permissions";
import { calculateAverageCycleTime } from "@/lib/metrics/cycle-time";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
    cycleId: string;
  }>;
}

/**
 * GET /api/projects/[projectId]/cycles/[cycleId]
 * Get cycle details with metrics
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
    const { projectId, cycleId } = await params;

    // Check permission to view cycles
    if (!canViewCycle(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot view cycles" },
        { status: 403 },
      );
    }

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Get cycle with issues
    const cycle = await cycleRepository.findById(cycleId);

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found" },
        { status: 404 },
      );
    }

    // Verify cycle belongs to project
    if (cycle.projectId !== projectId) {
      return NextResponse.json(
        { error: "Cycle not found in this project" },
        { status: 404 },
      );
    }

    // Calculate metrics
    const issues = await cycleRepository.getIssues(cycleId);
    const totalStoryPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    
    // Calculate completed story points (issues in "done" or "closed" status)
    const projectConfig = project.config as { workflow?: { statuses?: Array<{ key: string; type?: string }> } };
    const closedStatuses = projectConfig?.workflow?.statuses
      ?.filter((s) => s.type === "closed")
      ?.map((s) => s.key) || [];
    
    const completedStoryPoints = issues
      .filter((issue) => closedStatuses.includes(issue.status))
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    
    const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

    // Calculate average cycle time
    const averageCycleTime = calculateAverageCycleTime(issues, closedStatuses) || 0;

    return NextResponse.json({
      data: cycle,
      metrics: {
        totalStoryPoints,
        completedStoryPoints,
        remainingStoryPoints,
        averageCycleTime,
      },
    });
  } catch (error) {
    console.error("Get cycle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/projects/[projectId]/cycles/[cycleId]
 * Update a cycle
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const { projectId, cycleId } = await params;

    // Check permission to update cycles
    if (!canUpdateCycle(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot update cycles" },
        { status: 403 },
      );
    }

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Verify cycle exists and belongs to project
    const existingCycle = await cycleRepository.findById(cycleId);
    if (!existingCycle || existingCycle.projectId !== projectId) {
      return NextResponse.json(
        { error: "Cycle not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = updateCycleSchema.parse(body);

    // Convert date strings to Date objects if needed
    // Convert null to undefined to match UpdateCycleInput type
    const updateData: {
      name?: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      goal?: string;
    } = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) {
      updateData.description = validated.description ?? undefined;
    }
    if (validated.startDate !== undefined) {
      updateData.startDate =
        typeof validated.startDate === "string"
          ? new Date(validated.startDate)
          : validated.startDate;
    }
    if (validated.endDate !== undefined) {
      updateData.endDate =
        typeof validated.endDate === "string"
          ? new Date(validated.endDate)
          : validated.endDate;
    }
    if (validated.goal !== undefined) {
      updateData.goal = validated.goal ?? undefined;
    }

    // Update cycle
    const cycle = await cycleRepository.update(cycleId, updateData);

    return NextResponse.json({ data: cycle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    // Handle repository errors (e.g., duplicate name, invalid date range)
    if (error instanceof Error) {
      if (
        error.message.includes("already exists") ||
        error.message.includes("must be after")
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 },
        );
      }
    }

    console.error("Update cycle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { cycleRepository, projectRepository } from "@stride/database";
import { createCycleSchema } from "@/lib/validation/cycle";
import {
  canCreateCycle,
  canViewCycle,
  Permission,
  requirePermission,
} from "@/lib/auth/permissions";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * GET /api/projects/[projectId]/cycles
 * List cycles for a project
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
    const { projectId } = await params;

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

    // Get all cycles for the project
    const cycles = await cycleRepository.findMany({
      projectId,
    });

    return NextResponse.json({ data: cycles });
  } catch (error) {
    console.error("List cycles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects/[projectId]/cycles
 * Create a new cycle
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
    const { projectId } = await params;

    // Check permission to create cycles
    if (!canCreateCycle(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot create cycles" },
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

    const body = await request.json();
    const validated = createCycleSchema.parse(body);

    // Convert date strings to Date objects if needed
    const startDate =
      typeof validated.startDate === "string"
        ? new Date(validated.startDate)
        : validated.startDate;
    const endDate =
      typeof validated.endDate === "string"
        ? new Date(validated.endDate)
        : validated.endDate;

    // Create cycle
    const cycle = await cycleRepository.create({
      projectId,
      name: validated.name,
      description: validated.description,
      startDate,
      endDate,
      goal: validated.goal,
    });

    return NextResponse.json({ data: cycle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    // Handle repository errors (e.g., duplicate name)
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    console.error("Create cycle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


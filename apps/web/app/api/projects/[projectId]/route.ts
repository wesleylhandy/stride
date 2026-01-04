import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { projectRepository } from "@stride/database";
import { updateProjectSchema } from "@/lib/validation/project";
import { z } from "zod";

interface RouteParams {
  params: {
    projectId: string;
  };
}

/**
 * GET /api/projects/[projectId]
 * Get project details
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

    const project = await projectRepository.findById(params.projectId);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/projects/[projectId]
 * Update project
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

    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    // Check if project exists
    const existing = await projectRepository.findById(params.projectId);
    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Update project
    const project = await projectRepository.update(params.projectId, {
      name: validated.name,
      description: validated.description ?? undefined,
      repositoryUrl: validated.repositoryUrl ?? undefined,
      repositoryType: validated.repositoryType ?? undefined,
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/projects/[projectId]
 * Delete project
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Check if project exists
    const existing = await projectRepository.findById(params.projectId);
    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Delete project
    await projectRepository.delete(params.projectId);

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


/**
 * GET /api/projects/[projectId]/assistant/permissions
 * Check if current user has permission to use the assistant
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { projectRepository } from "@stride/database";
import { canUseProjectAssistant } from "@/lib/assistant/access-control";
import { UserRole } from "@stride/types";

/**
 * GET /api/projects/[projectId]/assistant/permissions
 * Check if user has permission to use the assistant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;
    const { projectId } = await params;

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get project config
    const projectConfigData = await projectRepository.getConfig(projectId);
    const projectConfig = projectConfigData?.config;

    // Check permission
    const userRole = session.role;
    const hasPermission = canUseProjectAssistant(
      userRole,
      projectConfig as any
    );

    return NextResponse.json({
      hasPermission,
      userRole,
      projectId,
    });
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

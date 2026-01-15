/**
 * GET /api/projects/[projectId]/assistant/sessions
 * List recent sessions for a project (last 30 days)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { projectRepository } from "@stride/database";
import { findSessionsByUser } from "@/lib/assistant/session-repository";
import { canUseProjectAssistant } from "@/lib/assistant/access-control";

/**
 * GET /api/projects/[projectId]/assistant/sessions
 * List recent sessions for a project (last 30 days)
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

    // Check access control
    const projectConfigData = await projectRepository.getConfig(projectId);
    const projectConfig = projectConfigData?.config;
    const userRole = session.role;
    
    const hasPermission = canUseProjectAssistant(userRole, projectConfig as any);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to view sessions" },
        { status: 403 }
      );
    }

    // Get sessions for user and project (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await findSessionsByUser(session.userId, {
      contextType: "project",
      limit: 50, // Limit to 50 most recent
      includeMessageCount: true,
    });

    // Filter by project and date
    const projectSessions = sessions
      .filter(
        (s) =>
          s.projectId === projectId &&
          new Date(s.updatedAt) >= thirtyDaysAgo
      )
      .map((s) => ({
        id: s.id,
        projectId: s.projectId,
        contextType: s.contextType,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        _count: s._count,
      }));

    return NextResponse.json(projectSessions);
  } catch (error) {
    console.error("Sessions API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

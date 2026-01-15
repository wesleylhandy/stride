/**
 * DELETE /api/projects/[projectId]/assistant/sessions/[sessionId]
 * Delete/archive a session
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { projectRepository } from "@stride/database";
import { findSessionById, deleteSession } from "@/lib/assistant/session-repository";
import { canUseProjectAssistant } from "@/lib/assistant/access-control";

/**
 * DELETE /api/projects/[projectId]/assistant/sessions/[sessionId]
 * Delete/archive a session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; sessionId: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;
    const { projectId, sessionId } = await params;

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
        { error: "Forbidden", message: "You do not have permission to delete sessions" },
        { status: 403 }
      );
    }

    // Find session
    const assistantSession = await findSessionById(sessionId);
    if (!assistantSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify session belongs to user and project
    if (
      assistantSession.userId !== session.userId ||
      assistantSession.projectId !== projectId
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have access to this session" },
        { status: 403 }
      );
    }

    // Delete session (cascades to messages via Prisma)
    await deleteSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

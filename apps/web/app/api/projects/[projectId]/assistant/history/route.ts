/**
 * GET /api/projects/[projectId]/assistant/history
 * Get conversation history for the assistant
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { projectRepository } from "@stride/database";
import { findSessionById, findOrCreateSession } from "@/lib/assistant/session-repository";
import { findMessagesBySession } from "@/lib/assistant/message-repository";
import { canUseProjectAssistant } from "@/lib/assistant/access-control";
import { UserRole } from "@stride/types";

/**
 * GET /api/projects/[projectId]/assistant/history
 * Get conversation history for a session
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
        { error: "Forbidden", message: "You do not have permission to view assistant history" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionIdParam = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit", message: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Validate offset
    if (offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset", message: "Offset must be non-negative" },
        { status: 400 }
      );
    }

    // Get or create session
    let assistantSession;
    if (sessionIdParam) {
      // Use provided session ID
      assistantSession = await findSessionById(sessionIdParam);
      
      // Verify session belongs to user and project
      if (!assistantSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      if (
        assistantSession.userId !== session.userId ||
        assistantSession.projectId !== projectId
      ) {
        return NextResponse.json(
          { error: "Forbidden", message: "You do not have access to this session" },
          { status: 403 }
        );
      }
    } else {
      // Find or create most recent session
      assistantSession = await findOrCreateSession({
        userId: session.userId,
        projectId,
        contextType: "project",
      });
    }

    // Get messages for session
    const messages = await findMessagesBySession(assistantSession.id, {
      limit,
      offset,
    });

    // Return history
    return NextResponse.json({
      sessionId: assistantSession.id,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.createdAt.toISOString(),
      })),
      totalCount: messages.length, // Note: This is the count for this page, not total
    });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

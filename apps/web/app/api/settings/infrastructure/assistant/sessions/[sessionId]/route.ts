/**
 * DELETE /api/settings/infrastructure/assistant/sessions/[sessionId]
 * Delete/archive an infrastructure session
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { findSessionById, deleteSession } from "@/lib/assistant/session-repository";
import { canUseInfrastructureAssistant } from "@/lib/assistant/access-control";

/**
 * DELETE /api/settings/infrastructure/assistant/sessions/[sessionId]
 * Delete/archive an infrastructure session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;
    const { sessionId } = await params;

    // Check access control (system admin only)
    const hasPermission = canUseInfrastructureAssistant(session.role);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to delete infrastructure sessions" },
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

    // Verify session belongs to user and is infrastructure context
    if (
      assistantSession.userId !== session.userId ||
      assistantSession.contextType !== "infrastructure"
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
    console.error("Delete infrastructure session API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

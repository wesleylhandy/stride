/**
 * GET /api/settings/infrastructure/assistant/sessions
 * List recent infrastructure sessions (last 30 days)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { findSessionsByUser } from "@/lib/assistant/session-repository";
import { canUseInfrastructureAssistant } from "@/lib/assistant/access-control";
import { UserRole } from "@stride/types";

/**
 * GET /api/settings/infrastructure/assistant/sessions
 * List recent infrastructure sessions (last 30 days)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    // Check access control (system admin only)
    const hasPermission = canUseInfrastructureAssistant(session.role);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to view infrastructure sessions" },
        { status: 403 }
      );
    }

    // Get sessions for user (infrastructure context, last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await findSessionsByUser(session.userId, {
      contextType: "infrastructure",
      limit: 50, // Limit to 50 most recent
      includeMessageCount: true,
    });

    // Filter by date
    const infrastructureSessions = sessions
      .filter((s) => new Date(s.updatedAt) >= thirtyDaysAgo)
      .map((s) => ({
        id: s.id,
        projectId: s.projectId,
        contextType: s.contextType,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        _count: s._count,
      }));

    return NextResponse.json(infrastructureSessions);
  } catch (error) {
    console.error("Infrastructure sessions API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

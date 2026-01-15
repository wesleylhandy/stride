/**
 * GET /api/settings/infrastructure/assistant/history
 * Get conversation history for infrastructure assistant
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { findSessionById } from "@/lib/assistant/session-repository";
import { findMessagesBySession } from "@/lib/assistant/message-repository";
import { canUseInfrastructureAssistant } from "@/lib/assistant/access-control";
import { UserRole } from "@stride/types";
import { z } from "zod";

const historyQuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * GET /api/settings/infrastructure/assistant/history
 * Get conversation history for infrastructure assistant
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;
    const userRole = session.role;

    // Check access control (system admin only)
    const hasPermission = canUseInfrastructureAssistant(userRole);

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "System admin role required to access infrastructure assistant history",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const validated = historyQuerySchema.parse({
      sessionId: searchParams.get("sessionId") || undefined, // Convert null to undefined
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    // If sessionId is provided, verify it belongs to infrastructure context
    if (validated.sessionId) {
      const sessionData = await findSessionById(validated.sessionId);
      if (!sessionData) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      // Verify session is for infrastructure context and belongs to user
      if (
        sessionData.contextType !== "infrastructure" ||
        sessionData.userId !== session.userId
      ) {
        return NextResponse.json(
          { error: "Forbidden", message: "Access denied to this session" },
          { status: 403 }
        );
      }
    }

    // Get messages (if sessionId provided, filter by it; otherwise get most recent infrastructure session)
    let messages;
    let sessionIdForMessages: string | null = null;
    
    if (validated.sessionId) {
      sessionIdForMessages = validated.sessionId;
      messages = await findMessagesBySession(validated.sessionId, {
        limit: validated.limit,
        offset: validated.offset,
      });
    } else {
      // Find most recent infrastructure session for this user
      const { findSessionsByUser } = await import(
        "@/lib/assistant/session-repository"
      );
      const sessions = await findSessionsByUser(session.userId, {
        contextType: "infrastructure",
        limit: 1,
      });

      if (sessions.length === 0) {
        return NextResponse.json({
          messages: [],
          total: 0,
          sessionId: null,
        });
      }

      const mostRecentSession = sessions[0];
      if (!mostRecentSession) {
        return NextResponse.json({
          messages: [],
          total: 0,
          sessionId: null,
        });
      }
      
      sessionIdForMessages = mostRecentSession.id;
      messages = await findMessagesBySession(mostRecentSession.id, {
        limit: validated.limit,
        offset: validated.offset,
      });
    }

    // Format messages for response
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata,
      createdAt: msg.createdAt.toISOString(),
    }));

    // Get total count
    const { countMessagesBySession } = await import(
      "@/lib/assistant/message-repository"
    );
    const total = sessionIdForMessages
      ? await countMessagesBySession(sessionIdForMessages)
      : formattedMessages.length;

    return NextResponse.json({
      messages: formattedMessages,
      total,
      sessionId: sessionIdForMessages,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error) {
    console.error("Infrastructure assistant history API error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

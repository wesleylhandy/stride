/**
 * POST /api/projects/[projectId]/assistant/chat
 * Send a message to the AI configuration assistant
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { projectRepository } from "@stride/database";
import { findOrCreateSession } from "@/lib/assistant/session-repository";
import { createMessage } from "@/lib/assistant/message-repository";
import { buildConversationContext } from "@/lib/assistant/context-manager";
import { buildAssistantPrompt } from "@/lib/assistant/prompt-builder";
import { retrieveDocumentation } from "@/lib/assistant/doc-retrieval";
import { callAIChat } from "@/lib/assistant/ai-chat";
import { checkAssistantRateLimit } from "@/lib/assistant/rate-limit";
import { checkAIGatewayRateLimit } from "@/lib/assistant/ai-gateway-rate-limit";
import { canUseProjectAssistant } from "@/lib/assistant/access-control";
import { isValidationRequest } from "@/lib/assistant/validation-detector";
import { validateAndFormat } from "@/lib/assistant/config-validator";
import { parseAssistantResponse } from "@/lib/assistant/response-parser";
import { trackDocumentationUsage } from "@/lib/assistant/doc-analytics";
import { createTimer } from "@/lib/assistant/performance-monitor";
import { UserRole } from "@stride/types";
import { z } from "zod";
import { Prisma } from "@stride/database";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().uuid().optional(),
});

/**
 * POST /api/projects/[projectId]/assistant/chat
 * Send a message to the AI assistant and get a response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const startTime = Date.now();
  let sessionId: string | undefined;
  let contextType: "project" | "infrastructure" = "project";
  let messageLength = 0;

  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      const responseTime = Date.now() - startTime;
      console.log("[Assistant Chat] Auth failed", { responseTime: `${responseTime}ms` });
      return authResult;
    }
    const session = authResult;
    const { projectId } = await params;

    // Log request
    console.log("[Assistant Chat] Request received", {
      userId: session.userId,
      projectId,
      timestamp: new Date().toISOString(),
    });

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check access control (admin by default, configurable per project)
    const projectConfigData = await projectRepository.getConfig(projectId);
    const projectConfig = projectConfigData?.config;
    const userRole = session.role;
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Chat API] Permission check:', {
        userId: session.userId,
        userRole,
        userRoleType: typeof userRole,
        userRoleValue: String(userRole),
        isAdmin: userRole === UserRole.Admin,
        projectId,
        hasProjectConfig: !!projectConfig,
        projectConfigType: typeof projectConfig,
      });
    }
    
    const hasPermission = canUseProjectAssistant(userRole, projectConfig as any);
    
    if (!hasPermission) {
      // Additional debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chat API] Permission denied:', {
          userId: session.userId,
          userRole,
          userRoleType: typeof userRole,
          userRoleValue: String(userRole),
          isAdmin: userRole === UserRole.Admin,
          projectId,
          projectConfigExists: !!projectConfig,
        });
      }
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to use the assistant" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validated = chatRequestSchema.parse(body);
    messageLength = validated.message.length;

    // Check rate limiting (per-user)
    const rateLimitCheck = checkAssistantRateLimit(session.userId, projectId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Please try again after ${rateLimitCheck.retryAfter} seconds.`,
          retryAfter: rateLimitCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitCheck.retryAfter),
            "X-RateLimit-Remaining": String(rateLimitCheck.remaining),
            "X-RateLimit-Reset": String(rateLimitCheck.resetTime),
          },
        }
      );
    }

    // Check AI Gateway rate limiting (shared limit)
    const aiGatewayRateLimitCheck = checkAIGatewayRateLimit();
    if (!aiGatewayRateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Service temporarily unavailable",
          message: "AI Gateway is rate limited. Please try again later.",
          retryAfter: aiGatewayRateLimitCheck.retryAfter,
        },
        {
          status: 503,
          headers: {
            "Retry-After": String(aiGatewayRateLimitCheck.retryAfter),
          },
        }
      );
    }

    // Find or create session
    const assistantSession = await findOrCreateSession({
      userId: session.userId,
      projectId,
      contextType: "project",
    });

    // Use provided sessionId if different from found session (for future multi-session support)
    sessionId = validated.sessionId || assistantSession.id;

    // Create user message
    const userMessage = await createMessage({
      sessionId,
      role: "user",
      content: validated.message,
    });

    // Build conversation context (sliding window)
    const conversationContext = await buildConversationContext(sessionId);

    // Get project configuration for context
    const config = await projectRepository.getConfig(projectId);
    const projectConfigYaml = config?.configYaml;
    const projectConfigDatabase = config?.config;

    // Check if this is a validation request
    const isValidation = isValidationRequest(validated.message);
    
    // Perform validation if requested
    let validationContext: {
      isValid: boolean;
      summary: string;
      findings: Array<{
        type: "error" | "warning" | "info" | "best_practice";
        severity: "critical" | "high" | "medium" | "low";
        path: (string | number)[];
        message: string;
        recommendation?: string;
        documentationLink?: string;
      }>;
      schemaErrors?: Array<{
        message: string;
        path: (string | number)[];
        code: string;
      }>;
    } | undefined;

    if (isValidation && projectConfigDatabase) {
      try {
        const validationResult = validateAndFormat(projectConfigDatabase);
        validationContext = {
          isValid: validationResult.isValid,
          summary: validationResult.summary,
          findings: validationResult.findings,
          schemaErrors: validationResult.schemaErrors,
        };
      } catch (error) {
        // If validation fails, log but don't block the request
        console.error("Configuration validation error:", error);
      }
    }

    // Build prompt with documentation retrieval
    // Retrieve documentation separately so we can pass it to response parser for analytics
    const documentation = await retrieveDocumentation(validated.message, 5);
    
    const { systemPrompt, userMessage: promptUserMessage } =
      await buildAssistantPrompt({
        conversationContext,
        userQuery: validated.message,
        projectConfigYaml,
        projectConfigDatabase,
        validationContext,
        documentation,
      });

    // Call AI chat
    let assistantResponse: string;
    try {
      const chatResponse = await callAIChat(
        {
          systemPrompt,
          userMessage: promptUserMessage,
        },
        projectId
      );
      assistantResponse = chatResponse.content;
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chat API] AI Response received:', {
          responseLength: assistantResponse.length,
          responsePreview: assistantResponse.substring(0, 200),
          isSystemPrompt: assistantResponse.includes('You are an AI configuration assistant'),
        });
      }
    } catch (error) {
      // Handle AI Gateway errors
      if (error instanceof Error) {
        if (
          error.message.includes("not configured") ||
          error.message.includes("unavailable")
        ) {
          return NextResponse.json(
            {
              error: "AI Gateway unavailable",
              message:
                "The AI provider is not configured. Please configure an AI provider in project settings.",
            },
            { status: 503 }
          );
        }

        if (error.message.includes("timeout") || error.message.includes("timed out")) {
          return NextResponse.json(
            {
              error: "Request timeout",
              message:
                "The AI request took longer than 30 seconds. Please try again.",
            },
            { status: 504 }
          );
        }

        if (error.message.includes("Invalid") || error.message.includes("malformed")) {
          return NextResponse.json(
            {
              error: "Invalid response",
              message:
                "The AI provider returned an invalid response. Please try again.",
            },
            { status: 502 }
          );
        }

        // Generic error
        console.error("AI chat error:", error);
        return NextResponse.json(
          {
            error: "AI Gateway error",
            message: error.message || "An error occurred while processing your message.",
          },
          { status: 502 }
        );
      }

      // Unknown error
      console.error("Unknown AI chat error:", error);
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "An unexpected error occurred while processing your message.",
        },
        { status: 500 }
      );
    }

    // Parse response to extract metadata (validation findings, doc links, suggestions)
    const parsedMetadata = parseAssistantResponse(
      assistantResponse,
      validationContext
    );

    // Create assistant message with parsed metadata
    const assistantMessage = await createMessage({
      sessionId,
      role: "assistant",
      content: assistantResponse,
      metadata: parsedMetadata as unknown as Prisma.JsonValue,
    });

    // Track documentation usage for analytics
    trackDocumentationUsage(sessionId, projectId, parsedMetadata);

    // Record performance metric
    const responseTime = Date.now() - startTime;
    const recordMetric = createTimer({
      sessionId,
      contextType,
      messageLength,
    });
    recordMetric(); // No error

    // Log success
    console.log("[Assistant Chat] Success", {
      userId: session.userId,
      projectId,
      sessionId,
      responseTime: `${responseTime}ms`,
      messageLength,
      meetsTarget: responseTime <= 30000,
    });

    // Return response with both user and assistant messages
    return NextResponse.json({
      sessionId,
      userMessage: {
        id: userMessage.id,
        role: "user",
        content: validated.message,
        createdAt: userMessage.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: "assistant",
        content: assistantResponse,
        metadata: assistantMessage.metadata,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
      message: assistantResponse, // Keep for backward compatibility
      metadata: assistantMessage.metadata,
      suggestions: parsedMetadata.suggestions || [],
    });
  } catch (error) {
    // Record performance metric with error
    const responseTime = Date.now() - startTime;
    const recordMetric = createTimer({
      sessionId,
      contextType,
      messageLength,
    });
    recordMetric(true); // Error occurred - createTimer returns a function that accepts optional error param

    // Log error
    console.error("[Assistant Chat] Error", {
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: `${responseTime}ms`,
      sessionId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Invalid request format",
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

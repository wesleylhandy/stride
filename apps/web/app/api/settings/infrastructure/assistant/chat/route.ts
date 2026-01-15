/**
 * POST /api/settings/infrastructure/assistant/chat
 * Send a message to the AI infrastructure configuration assistant
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { findOrCreateSession } from "@/lib/assistant/session-repository";
import { createMessage } from "@/lib/assistant/message-repository";
import { buildConversationContext } from "@/lib/assistant/context-manager";
import { buildAssistantPrompt, buildPromptWithDocumentation } from "@/lib/assistant/prompt-builder";
import { retrieveDocumentation } from "@/lib/assistant/doc-retrieval";
import { callAIChat } from "@/lib/assistant/ai-chat";
import { checkAssistantRateLimit } from "@/lib/assistant/rate-limit";
import { checkAIGatewayRateLimit } from "@/lib/assistant/ai-gateway-rate-limit";
import { canUseInfrastructureAssistant } from "@/lib/assistant/access-control";
import { parseAssistantResponse } from "@/lib/assistant/response-parser";
import { trackDocumentationUsage } from "@/lib/assistant/doc-analytics";
import { globalInfrastructureConfigRepository, Prisma } from "@stride/database";
import {
  resolveGitOAuthConfig,
  resolveAIGatewayConfig,
} from "@/lib/config/infrastructure-precedence";
import { UserRole } from "@stride/types";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().uuid().optional(),
});

/**
 * POST /api/settings/infrastructure/assistant/chat
 * Send a message to the AI infrastructure assistant and get a response
 */
export async function POST(request: NextRequest) {
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
          message: "System admin role required to use the infrastructure assistant",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validated = chatRequestSchema.parse(body);

    // Check rate limiting (per-user, no projectId for infrastructure)
    const rateLimitCheck = checkAssistantRateLimit(session.userId, "infrastructure");
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

    // Find or create session (infrastructure context, no projectId)
    const assistantSession = await findOrCreateSession({
      userId: session.userId,
      projectId: null,
      contextType: "infrastructure",
    });

    // Use provided sessionId if different from found session (for future multi-session support)
    const sessionId = validated.sessionId || assistantSession.id;

    // Create user message
    const userMessage = await createMessage({
      sessionId,
      role: "user",
      content: validated.message,
    });

    // Build conversation context (sliding window)
    const conversationContext = await buildConversationContext(sessionId);

    // Get infrastructure configuration for context
    // Note: We resolve with precedence to get the actual active config (env vars or DB)
    const [gitConfig, aiConfig] = await Promise.all([
      resolveGitOAuthConfig(),
      resolveAIGatewayConfig(),
    ]);

    const infrastructureConfig = {
      gitConfig: {
        github: gitConfig.github
          ? {
              clientId: gitConfig.github.clientId,
              configured: !!gitConfig.github.clientId,
              // Never include secrets in context
            }
          : undefined,
        gitlab: gitConfig.gitlab
          ? {
              clientId: gitConfig.gitlab.clientId,
              baseUrl: gitConfig.gitlab.baseUrl,
              configured: !!gitConfig.gitlab.clientId,
              // Never include secrets in context
            }
          : undefined,
      },
      aiConfig: {
        aiGatewayUrl: aiConfig.aiGatewayUrl,
        llmEndpoint: aiConfig.llmEndpoint,
        configured: !!aiConfig.aiGatewayUrl,
        // Never include API keys in context
        configuredApiKeys: {
          openai: !!aiConfig.openaiApiKey,
          anthropic: !!aiConfig.anthropicApiKey,
          google: !!aiConfig.googleAiApiKey,
        },
      },
    };

    // Retrieve documentation separately so we can pass it to response parser for analytics
    const documentation = await retrieveDocumentation(validated.message, 5);
    
    // Build prompt with documentation retrieval
    const { systemPrompt, userMessage: promptUserMessage } =
      await buildAssistantPrompt({
        conversationContext,
        userQuery: validated.message,
        infrastructureConfig,
        documentation,
      });

    // Call AI chat (no projectId for infrastructure)
    // For infrastructure, we can't use project-specific provider selection
    // Use global AI provider selection instead
    let assistantResponse: string;
    try {
      // For infrastructure assistant, we need to use a global provider
      // Since we're in infrastructure context, use the first available provider
      // The AI Gateway should handle provider selection at the global level
      const chatResponse = await callAIChat(
        {
          systemPrompt,
          userMessage: promptUserMessage,
        },
        "infrastructure" // Use special identifier for infrastructure context
      );
      assistantResponse = chatResponse.content;
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
                "The AI provider is not configured. Please configure an AI provider in infrastructure settings.",
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

    // Parse response to extract metadata (documentation links, etc.)
    // Pass documentation context for analytics tracking
    const parsedMetadata = parseAssistantResponse(
      assistantResponse,
      undefined, // No validation context for infrastructure
      documentation.map((doc) => ({ 
        reference: {
          file: doc.reference.file,
          section: doc.reference.section,
          description: doc.reference.description,
        }
      }))
    );

    // Create assistant message with parsed metadata
    const assistantMessage = await createMessage({
      sessionId,
      role: "assistant",
      content: assistantResponse,
      metadata: parsedMetadata as unknown as Prisma.JsonValue,
    });

    // Track documentation usage for analytics (projectId is null for infrastructure)
    trackDocumentationUsage(sessionId, null, parsedMetadata);

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
    console.error("Infrastructure chat API error:", error);

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

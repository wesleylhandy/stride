import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import {
  resolveGitOAuthConfig,
  resolveAIGatewayConfig,
} from "@/lib/config/infrastructure-precedence";

/**
 * GET /api/settings/infrastructure/status
 * Get global infrastructure configuration status (read-only, no secrets)
 * Authentication: Any authenticated user (not admin-only)
 * 
 * This endpoint provides read-only access to infrastructure configuration
 * status for non-admin users. Secrets are never included in the response.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Any authenticated user can view status (not admin-only)
    // Resolve configuration with precedence
    const [gitConfig, aiConfig] = await Promise.all([
      resolveGitOAuthConfig(),
      resolveAIGatewayConfig(),
    ]);

    // Build response (never expose secrets)
    const response = {
      gitConfig: {
        github: gitConfig.github
          ? {
              clientId: gitConfig.github.clientId,
              configured: true,
              source: gitConfig.github.source,
            }
          : undefined,
        gitlab: gitConfig.gitlab
          ? {
              clientId: gitConfig.gitlab.clientId,
              baseUrl: gitConfig.gitlab.baseUrl,
              configured: true,
              source: gitConfig.gitlab.source,
            }
          : undefined,
      },
      aiConfig: {
        aiGatewayUrl: aiConfig.aiGatewayUrl,
        llmEndpoint: aiConfig.llmEndpoint,
        configured: !!(
          aiConfig.aiGatewayUrl ||
          aiConfig.llmEndpoint ||
          aiConfig.openaiApiKey ||
          aiConfig.anthropicApiKey ||
          aiConfig.googleAiApiKey
        ),
        source: aiConfig.source,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get infrastructure status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

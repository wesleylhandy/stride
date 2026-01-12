import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import type { SessionPayload } from "@/lib/auth/session";
import { UserRole } from "@stride/types";
import { globalInfrastructureConfigRepository } from "@stride/database";

/**
 * GET /api/admin/settings/infrastructure/audit
 * Get configuration change history (audit log)
 * Authentication: Admin only
 * 
 * Note: Since GlobalInfrastructureConfig is a singleton, this endpoint
 * returns the current configuration's update history metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult as SessionPayload;

    // Admin-only access check
    if (session.role !== UserRole.Admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // Parse pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "10", 10),
      100,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    // Get current configuration (singleton pattern)
    const config = await globalInfrastructureConfigRepository.get();

    if (!config) {
      // No configuration exists yet
      return NextResponse.json({
        changes: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Determine which sections have been configured
    const sectionsChanged: string[] = [];
    const gitConfig = config.gitConfig as
      | { github?: unknown; gitlab?: unknown }
      | undefined;
    const aiConfig = config.aiConfig as
      | { aiGatewayUrl?: unknown; llmEndpoint?: unknown; openaiApiKey?: unknown; anthropicApiKey?: unknown; googleAiApiKey?: unknown }
      | undefined;

    if (
      gitConfig &&
      (gitConfig.github || gitConfig.gitlab)
    ) {
      sectionsChanged.push("gitConfig");
    }

    if (
      aiConfig &&
      (aiConfig.aiGatewayUrl ||
        aiConfig.llmEndpoint ||
        aiConfig.openaiApiKey ||
        aiConfig.anthropicApiKey ||
        aiConfig.googleAiApiKey)
    ) {
      sectionsChanged.push("aiConfig");
    }

    // Build change record
    const change = {
      id: config.id,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt.toISOString(),
      sectionsChanged,
    };

    // Return paginated response (even though there's only one record, format is consistent)
    const changes = offset === 0 ? [change] : [];
    const total = config ? 1 : 0;

    return NextResponse.json({
      changes,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get infrastructure configuration audit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

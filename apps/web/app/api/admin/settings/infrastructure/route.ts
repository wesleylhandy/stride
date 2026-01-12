import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import type { SessionPayload } from "@/lib/auth/session";
import { UserRole } from "@stride/types";
import { globalInfrastructureConfigRepository } from "@stride/database";
import type { Prisma } from "@stride/database";
import {
  validateInfrastructureConfigStrict,
  validateInfrastructureConfig,
} from "@/lib/config/validate-infrastructure";
import {
  encryptGitConfig,
  encryptAiConfig,
} from "@/lib/config/encrypt-infrastructure";
import { decrypt } from "@/lib/integrations/storage";
import {
  resolveGitOAuthConfig,
  resolveAIGatewayConfig,
} from "@/lib/config/infrastructure-precedence";
import { z } from "zod";

/**
 * GET /api/admin/settings/infrastructure
 * Get global infrastructure configuration (without sensitive credentials)
 * Authentication: Admin only
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

    // Resolve configuration with precedence
    const [gitConfig, aiConfig, dbConfig] = await Promise.all([
      resolveGitOAuthConfig(),
      resolveAIGatewayConfig(),
      globalInfrastructureConfigRepository.get(),
    ]);

    // Build response (never expose secrets)
    const response = {
      id: dbConfig?.id || null,
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
      updatedBy: dbConfig?.updatedBy || null,
      updatedByUser: null, // TODO: Add user relation back after Prisma client is regenerated
      createdAt: dbConfig?.createdAt ? dbConfig.createdAt.toISOString() : null,
      updatedAt: dbConfig?.updatedAt.toISOString() || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get infrastructure configuration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/settings/infrastructure
 * Update global infrastructure configuration
 * Authentication: Admin only
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();

    // Validate configuration
    const validationResult = validateInfrastructureConfig(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const validatedConfig = validationResult.data;

    // Get existing config to preserve values not being updated
    const existingConfig = await globalInfrastructureConfigRepository.get();
    
    // Check if aiConfig was explicitly provided in the request body
    // (to distinguish between "not updating" vs "delete all")
    const aiConfigProvided = 'aiConfig' in body;

    // Encrypt sensitive credentials before storage
    // Only update configs that have actual values (not empty objects)
    let encryptedGitConfig: Prisma.InputJsonValue | undefined;
    let encryptedAiConfig: Prisma.InputJsonValue | undefined;

    try {
      // Check if gitConfig has actual values (not just empty object from default)
      const hasGitConfig =
        validatedConfig.gitConfig &&
        (validatedConfig.gitConfig.github ||
          validatedConfig.gitConfig.gitlab);

      if (hasGitConfig) {
        // Merge with existing config to preserve other providers
        const existingGitConfig = existingConfig?.gitConfig as
          | {
              github?: { clientId: string; clientSecret: string };
              gitlab?: {
                clientId: string;
                clientSecret: string;
                baseUrl?: string;
              };
            }
          | undefined;

        // Start with new config, then merge in existing providers that aren't being updated
        const mergedGitConfig: {
          github?: { clientId: string; clientSecret: string };
          gitlab?: {
            clientId: string;
            clientSecret: string;
            baseUrl?: string;
          };
        } = {
          ...validatedConfig.gitConfig,
        };

        // Preserve existing providers that aren't being updated
        if (existingGitConfig) {
          // If updating github, preserve gitlab from existing
          if (validatedConfig.gitConfig.github && existingGitConfig.gitlab) {
            try {
              mergedGitConfig.gitlab = {
                clientId: existingGitConfig.gitlab.clientId,
                clientSecret: decrypt(existingGitConfig.gitlab.clientSecret),
                baseUrl: existingGitConfig.gitlab.baseUrl,
              };
            } catch (error) {
              // If decryption fails, skip preserving this provider
              console.error("Failed to decrypt existing GitLab config:", error);
            }
          }
          // If updating gitlab, preserve github from existing
          if (validatedConfig.gitConfig.gitlab && existingGitConfig.github) {
            try {
              mergedGitConfig.github = {
                clientId: existingGitConfig.github.clientId,
                clientSecret: decrypt(existingGitConfig.github.clientSecret),
              };
            } catch (error) {
              // If decryption fails, skip preserving this provider
              console.error("Failed to decrypt existing GitHub config:", error);
            }
          }
        }

        encryptedGitConfig = encryptGitConfig(
          mergedGitConfig,
        ) as Prisma.InputJsonValue;
      } else if (existingConfig) {
        // Preserve existing encrypted gitConfig if not updating
        encryptedGitConfig = existingConfig.gitConfig as Prisma.InputJsonValue;
      }

      // Check if aiConfig has actual values
      const hasAiConfig =
        validatedConfig.aiConfig &&
        (validatedConfig.aiConfig.aiGatewayUrl ||
          validatedConfig.aiConfig.llmEndpoint ||
          validatedConfig.aiConfig.openaiApiKey ||
          validatedConfig.aiConfig.anthropicApiKey ||
          validatedConfig.aiConfig.googleAiApiKey);

      if (hasAiConfig) {
        // Has values - encrypt and store
        encryptedAiConfig = encryptAiConfig(
          validatedConfig.aiConfig,
        ) as Prisma.InputJsonValue;
      } else if (aiConfigProvided) {
        // aiConfig was explicitly provided but is empty - delete all AI config
        encryptedAiConfig = {} as Prisma.InputJsonValue;
      } else if (existingConfig) {
        // aiConfig not provided - preserve existing
        encryptedAiConfig = existingConfig.aiConfig as Prisma.InputJsonValue;
      }
    } catch (encryptionError) {
      console.error("Encryption error:", encryptionError);
      return NextResponse.json(
        { error: "Failed to encrypt credentials" },
        { status: 500 },
      );
    }

    // Update configuration with upsert pattern
    try {
      const updatedConfig = await globalInfrastructureConfigRepository.update({
        gitConfig: encryptedGitConfig,
        aiConfig: encryptedAiConfig,
        updatedBy: session.userId,
      });

      // Return response (never expose secrets)
      const response = {
        id: updatedConfig.id,
        gitConfig: {
          github: validatedConfig.gitConfig.github
            ? {
                clientId: validatedConfig.gitConfig.github.clientId,
                configured: true,
              }
            : undefined,
          gitlab: validatedConfig.gitConfig.gitlab
            ? {
                clientId: validatedConfig.gitConfig.gitlab.clientId,
                baseUrl: validatedConfig.gitConfig.gitlab.baseUrl,
                configured: true,
              }
            : undefined,
        },
        aiConfig: {
          aiGatewayUrl: validatedConfig.aiConfig.aiGatewayUrl,
          llmEndpoint: validatedConfig.aiConfig.llmEndpoint,
          configured: !!(
            validatedConfig.aiConfig.aiGatewayUrl ||
            validatedConfig.aiConfig.llmEndpoint ||
            validatedConfig.aiConfig.openaiApiKey ||
            validatedConfig.aiConfig.anthropicApiKey ||
            validatedConfig.aiConfig.googleAiApiKey
          ),
        },
        updatedBy: session.userId,
        updatedAt: updatedConfig.updatedAt.toISOString(),
        message: "Configuration updated successfully",
      };

      return NextResponse.json(response, { status: 200 });
    } catch (updateError) {
      console.error("Update configuration error:", updateError);
      return NextResponse.json(
        { error: "Failed to update configuration" },
        { status: 500 },
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error("Update infrastructure configuration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

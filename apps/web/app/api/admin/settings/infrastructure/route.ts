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

    // Check which API keys are configured in database (without decrypting values)
    const dbAiConfig = dbConfig?.aiConfig as
      | {
          openaiApiKey?: string;
          anthropicApiKey?: string;
          googleAiApiKey?: string;
          openaiDefaultModel?: string;
          anthropicDefaultModel?: string;
          googleAiDefaultModel?: string;
          ollamaDefaultModel?: string;
        }
      | undefined;

    // Check which client secrets are configured in database (without decrypting values)
    const dbGitConfig = dbConfig?.gitConfig as
      | {
          github?: { clientId: string; clientSecret: string };
          gitlab?: { clientId: string; clientSecret: string; baseUrl?: string };
        }
      | undefined;

    // Build response (never expose secrets)
    const response = {
      id: dbConfig?.id || null,
      gitConfig: {
        github: gitConfig.github
          ? {
              clientId: gitConfig.github.clientId,
              configured: true,
              source: gitConfig.github.source,
              configuredClientSecret: !!(dbGitConfig?.github?.clientSecret),
            }
          : undefined,
        gitlab: gitConfig.gitlab
          ? {
              clientId: gitConfig.gitlab.clientId,
              baseUrl: gitConfig.gitlab.baseUrl,
              configured: true,
              source: gitConfig.gitlab.source,
              configuredClientSecret: !!(dbGitConfig?.gitlab?.clientSecret),
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
        // Indicate which API keys are configured (without values)
        configuredApiKeys: {
          openaiApiKey: !!(dbAiConfig?.openaiApiKey || aiConfig.openaiApiKey),
          anthropicApiKey: !!(dbAiConfig?.anthropicApiKey || aiConfig.anthropicApiKey),
          googleAiApiKey: !!(dbAiConfig?.googleAiApiKey || aiConfig.googleAiApiKey),
        },
        // Return default models from database (plain text, not sensitive)
        defaultModels: {
          openai: dbAiConfig?.openaiDefaultModel,
          anthropic: dbAiConfig?.anthropicDefaultModel,
          googleAi: dbAiConfig?.googleAiDefaultModel,
          ollama: dbAiConfig?.ollamaDefaultModel,
        },
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

    // Check for explicit clearing signals before validation
    // (to distinguish between "not updating" vs "clear this provider")
    const gitConfigBody = body.gitConfig as
      | { github?: unknown; gitlab?: unknown }
      | undefined;
    const githubShouldBeCleared =
      gitConfigBody && ('github' in gitConfigBody) && gitConfigBody.github === null;
    const gitlabShouldBeCleared =
      gitConfigBody && ('gitlab' in gitConfigBody) && gitConfigBody.gitlab === null;

    // Remove null values for validation (schema doesn't accept null)
    const bodyForValidation = { ...body };
    if (bodyForValidation.gitConfig) {
      bodyForValidation.gitConfig = { ...bodyForValidation.gitConfig };
      if (githubShouldBeCleared) {
        delete bodyForValidation.gitConfig.github;
      }
      if (gitlabShouldBeCleared) {
        delete bodyForValidation.gitConfig.gitlab;
      }
    }

    // Validate configuration
    const validationResult = validateInfrastructureConfig(bodyForValidation);
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

        // Handle explicit clearing
        if (githubShouldBeCleared) {
          delete mergedGitConfig.github;
        }
        if (gitlabShouldBeCleared) {
          delete mergedGitConfig.gitlab;
        }

        // Preserve existing providers that aren't being updated
        if (existingGitConfig) {
          // If updating github, preserve gitlab from existing (unless it's being cleared)
          if (
            validatedConfig.gitConfig.github &&
            existingGitConfig.gitlab &&
            !gitlabShouldBeCleared
          ) {
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
          // If updating gitlab, preserve github from existing (unless it's being cleared)
          if (
            validatedConfig.gitConfig.gitlab &&
            existingGitConfig.github &&
            !githubShouldBeCleared
          ) {
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

        // If merged config is empty (both cleared), encrypt empty object
        // Otherwise encrypt the merged config
        if (Object.keys(mergedGitConfig).length === 0) {
          encryptedGitConfig = {} as Prisma.InputJsonValue;
        } else {
          encryptedGitConfig = encryptGitConfig(
            mergedGitConfig,
          ) as Prisma.InputJsonValue;
        }
      } else if (githubShouldBeCleared || gitlabShouldBeCleared) {
        // Explicit clearing requested but no new config - handle clearing only
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

        const clearedGitConfig: {
          github?: { clientId: string; clientSecret: string };
          gitlab?: {
            clientId: string;
            clientSecret: string;
            baseUrl?: string;
          };
        } = {};

        // Preserve providers that aren't being cleared
        if (existingGitConfig) {
          if (!githubShouldBeCleared && existingGitConfig.github) {
            try {
              clearedGitConfig.github = {
                clientId: existingGitConfig.github.clientId,
                clientSecret: decrypt(existingGitConfig.github.clientSecret),
              };
            } catch (error) {
              console.error("Failed to decrypt existing GitHub config:", error);
            }
          }
          if (!gitlabShouldBeCleared && existingGitConfig.gitlab) {
            try {
              clearedGitConfig.gitlab = {
                clientId: existingGitConfig.gitlab.clientId,
                clientSecret: decrypt(existingGitConfig.gitlab.clientSecret),
                baseUrl: existingGitConfig.gitlab.baseUrl,
              };
            } catch (error) {
              console.error("Failed to decrypt existing GitLab config:", error);
            }
          }
        }

        encryptedGitConfig = encryptGitConfig(
          clearedGitConfig,
        ) as Prisma.InputJsonValue;
      } else if (existingConfig) {
        // Preserve existing encrypted gitConfig if not updating
        encryptedGitConfig = existingConfig.gitConfig as Prisma.InputJsonValue;
      }

      // Simple merge: start with existing, apply updates
      // Empty string = delete, has value = update, not provided = preserve
      const existingAiConfig = existingConfig?.aiConfig as {
        openaiApiKey?: string;
        anthropicApiKey?: string;
        googleAiApiKey?: string;
        aiGatewayUrl?: string;
        llmEndpoint?: string;
      } | undefined;

      // Build merged config: start with existing, apply updates
      const mergedAiConfig: typeof validatedConfig.aiConfig = {};
      
      // Copy existing values first (they're already encrypted)
      if (existingAiConfig) {
        if (existingAiConfig.aiGatewayUrl) mergedAiConfig.aiGatewayUrl = existingAiConfig.aiGatewayUrl;
        if (existingAiConfig.llmEndpoint) mergedAiConfig.llmEndpoint = existingAiConfig.llmEndpoint;
        if (existingAiConfig.openaiApiKey) mergedAiConfig.openaiApiKey = existingAiConfig.openaiApiKey;
        if (existingAiConfig.anthropicApiKey) mergedAiConfig.anthropicApiKey = existingAiConfig.anthropicApiKey;
        if (existingAiConfig.googleAiApiKey) mergedAiConfig.googleAiApiKey = existingAiConfig.googleAiApiKey;
      }

      // Apply updates from request (empty string = delete by not including it)
      if (validatedConfig.aiConfig) {
        if ('aiGatewayUrl' in validatedConfig.aiConfig) {
          const value = validatedConfig.aiConfig.aiGatewayUrl?.trim();
          if (value) {
            mergedAiConfig.aiGatewayUrl = value;
          } else {
            delete mergedAiConfig.aiGatewayUrl;
          }
        }
        if ('llmEndpoint' in validatedConfig.aiConfig) {
          const value = validatedConfig.aiConfig.llmEndpoint?.trim();
          if (value) {
            mergedAiConfig.llmEndpoint = value;
          } else {
            delete mergedAiConfig.llmEndpoint;
          }
        }
        if ('openaiApiKey' in validatedConfig.aiConfig) {
          const value = validatedConfig.aiConfig.openaiApiKey?.trim();
          if (value) {
            // Will be encrypted by encryptAiConfig
            mergedAiConfig.openaiApiKey = value;
          } else {
            delete mergedAiConfig.openaiApiKey;
          }
        }
        if ('anthropicApiKey' in validatedConfig.aiConfig) {
          const value = validatedConfig.aiConfig.anthropicApiKey?.trim();
          if (value) {
            // Will be encrypted by encryptAiConfig
            mergedAiConfig.anthropicApiKey = value;
          } else {
            delete mergedAiConfig.anthropicApiKey;
          }
        }
        if ('googleAiApiKey' in validatedConfig.aiConfig) {
          const value = validatedConfig.aiConfig.googleAiApiKey?.trim();
          if (value) {
            // Will be encrypted by encryptAiConfig
            mergedAiConfig.googleAiApiKey = value;
          } else {
            delete mergedAiConfig.googleAiApiKey;
          }
        }
      }

      if (aiConfigProvided) {
        // Encrypt and store merged config
        encryptedAiConfig = encryptAiConfig(
          mergedAiConfig,
        ) as Prisma.InputJsonValue;
      } else {
        // aiConfig not provided - preserve existing
        encryptedAiConfig = existingConfig?.aiConfig as Prisma.InputJsonValue;
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

      // Get updated config to return configuredApiKeys and configuredClientSecrets
      const finalConfig = await globalInfrastructureConfigRepository.get();
      const finalDbAiConfig = finalConfig?.aiConfig as
        | {
            openaiApiKey?: string;
            anthropicApiKey?: string;
            googleAiApiKey?: string;
            openaiDefaultModel?: string;
            anthropicDefaultModel?: string;
            googleAiDefaultModel?: string;
            ollamaDefaultModel?: string;
          }
        | undefined;
      const finalDbGitConfig = finalConfig?.gitConfig as
        | {
            github?: { clientId: string; clientSecret: string };
            gitlab?: { clientId: string; clientSecret: string; baseUrl?: string };
          }
        | undefined;

      // Return response (never expose secrets)
      const response = {
        id: updatedConfig.id,
        gitConfig: {
          github: validatedConfig.gitConfig.github
            ? {
                clientId: validatedConfig.gitConfig.github.clientId,
                configured: true,
                configuredClientSecret: !!finalDbGitConfig?.github?.clientSecret,
              }
            : undefined,
          gitlab: validatedConfig.gitConfig.gitlab
            ? {
                clientId: validatedConfig.gitConfig.gitlab.clientId,
                baseUrl: validatedConfig.gitConfig.gitlab.baseUrl,
                configured: true,
                configuredClientSecret: !!finalDbGitConfig?.gitlab?.clientSecret,
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
          configuredApiKeys: {
            openaiApiKey: !!finalDbAiConfig?.openaiApiKey,
            anthropicApiKey: !!finalDbAiConfig?.anthropicApiKey,
            googleAiApiKey: !!finalDbAiConfig?.googleAiApiKey,
          },
          // Return default models from database (plain text, not sensitive)
          defaultModels: {
            openai: finalDbAiConfig?.openaiDefaultModel,
            anthropic: finalDbAiConfig?.anthropicDefaultModel,
            googleAi: finalDbAiConfig?.googleAiDefaultModel,
            ollama: finalDbAiConfig?.ollamaDefaultModel,
          },
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

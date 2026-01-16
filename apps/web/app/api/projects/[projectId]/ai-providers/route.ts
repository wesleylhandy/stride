import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { prisma, projectRepository } from "@stride/database";
import { UserRole } from "@stride/types";
import { encrypt } from "@/lib/integrations/storage";
import { resolveAIGatewayConfig } from "@/lib/config/infrastructure-precedence";
import { discoverModels } from "@/lib/ai/model-discovery";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

const createAiProviderSchema = z.object({
  providerType: z.enum(["openai", "anthropic", "google-gemini", "ollama"]),
  apiKey: z.string().optional(),
  endpointUrl: z.string().url().optional().or(z.literal("")),
  authToken: z.string().optional(),
  enabledModels: z.array(z.string()).default([]),
  defaultModel: z.string().optional(),
});

/**
 * GET /api/projects/[projectId]/ai-providers
 * List all AI providers for a project
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const { projectId } = await params;

    // Admin-only access
    if (session.role !== UserRole.Admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Get all AI providers for the project
    const providers = await prisma.aiProviderConfig.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    // Return providers without sensitive data (API keys and tokens are encrypted, don't return them)
    const safeProviders = providers.map((provider) => ({
      id: provider.id,
      providerType: provider.providerType,
      endpointUrl: provider.endpointUrl,
      enabledModels: provider.enabledModels as string[],
      defaultModel: provider.defaultModel,
      isActive: provider.isActive,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
      source: "project" as const,
    }));

    // Get global/infrastructure AI config to show available global providers
    const globalConfig = await resolveAIGatewayConfig();
    const globalProviders: Array<{
      id: string;
      providerType: string;
      endpointUrl: string | null;
      enabledModels: string[];
      defaultModel: string | null;
      isActive: boolean;
      source: "global";
      modelsSource?: "fetched" | "fallback";
    }> = [];

    // Check which project-specific providers exist (to avoid showing duplicate global providers)
    const projectProviderTypes = new Set(providers.map((p) => p.providerType));

    // Helper function to discover models with fallback
    const discoverModelsWithFallback = async (
      providerType: "openai" | "anthropic" | "google-gemini" | "ollama",
      apiKey?: string,
      endpointUrl?: string,
      authToken?: string
    ): Promise<{ models: string[]; source: "fetched" | "fallback" }> => {
      try {
        const models = await discoverModels({
          providerType,
          apiKey,
          endpointUrl,
          authToken,
        });
        return { models, source: "fetched" };
      } catch (error) {
        // Fallback to common models if discovery fails
        console.warn(`Failed to discover models for ${providerType}:`, error);
        const fallbackModels: Record<string, string[]> = {
          openai: ["gpt-3.5-turbo", "gpt-4"],
          anthropic: [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
          ],
          "google-gemini": ["gemini-pro", "gemini-pro-vision"],
          ollama: ["llama2", "mistral"],
        };
        return {
          models: fallbackModels[providerType] || [],
          source: "fallback",
        };
      }
    };

    // Add global providers that aren't overridden by project-specific config
    // Fetch actual models from provider APIs
    if (globalConfig.openaiApiKey && !projectProviderTypes.has("openai")) {
      const { models, source } = await discoverModelsWithFallback(
        "openai",
        globalConfig.openaiApiKey
      );
      // Use configured default model if available, otherwise use first model
      const defaultModel = globalConfig.openaiDefaultModel && models.includes(globalConfig.openaiDefaultModel)
        ? globalConfig.openaiDefaultModel
        : (models.length > 0 ? (models[0] ?? null) : null);
      globalProviders.push({
        id: "infrastructure-openai",
        providerType: "openai",
        endpointUrl: null,
        enabledModels: models,
        defaultModel,
        isActive: true,
        source: "global",
        modelsSource: source,
      });
    }

    if (globalConfig.anthropicApiKey && !projectProviderTypes.has("anthropic")) {
      const { models, source } = await discoverModelsWithFallback(
        "anthropic",
        globalConfig.anthropicApiKey
      );
      // Use configured default model if available, otherwise use first model
      const defaultModel = globalConfig.anthropicDefaultModel && models.includes(globalConfig.anthropicDefaultModel)
        ? globalConfig.anthropicDefaultModel
        : (models.length > 0 ? (models[0] ?? null) : null);
      globalProviders.push({
        id: "infrastructure-anthropic",
        providerType: "anthropic",
        endpointUrl: null,
        enabledModels: models,
        defaultModel,
        isActive: true,
        source: "global",
        modelsSource: source,
      });
    }

    if (globalConfig.googleAiApiKey && !projectProviderTypes.has("google-gemini")) {
      const { models, source } = await discoverModelsWithFallback(
        "google-gemini",
        globalConfig.googleAiApiKey
      );
      // Use configured default model if available, otherwise use first model
      const defaultModel = globalConfig.googleAiDefaultModel && models.includes(globalConfig.googleAiDefaultModel)
        ? globalConfig.googleAiDefaultModel
        : (models.length > 0 ? (models[0] ?? null) : null);
      globalProviders.push({
        id: "infrastructure-google-gemini",
        providerType: "google-gemini",
        endpointUrl: null,
        enabledModels: models,
        defaultModel,
        isActive: true,
        source: "global",
        modelsSource: source,
      });
    }

    if (globalConfig.llmEndpoint && !projectProviderTypes.has("ollama")) {
      const { models, source } = await discoverModelsWithFallback(
        "ollama",
        undefined,
        globalConfig.llmEndpoint
      );
      // Use configured default model if available, otherwise use first model
      const defaultModel = globalConfig.ollamaDefaultModel && models.includes(globalConfig.ollamaDefaultModel)
        ? globalConfig.ollamaDefaultModel
        : (models.length > 0 ? (models[0] ?? null) : null);
      globalProviders.push({
        id: "infrastructure-ollama",
        providerType: "ollama",
        endpointUrl: globalConfig.llmEndpoint,
        enabledModels: models,
        defaultModel,
        isActive: true,
        source: "global",
        modelsSource: source,
      });
    }

    return NextResponse.json({
      projectProviders: safeProviders,
      globalProviders,
    });
  } catch (error) {
    console.error("Get AI providers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects/[projectId]/ai-providers
 * Create a new AI provider configuration
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const { projectId } = await params;

    // Admin-only access
    if (session.role !== UserRole.Admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = createAiProviderSchema.parse(body);

    // Validate required fields based on provider type
    const cloudProviders = ["openai", "anthropic", "google-gemini"];
    if (cloudProviders.includes(validated.providerType) && !validated.apiKey) {
      return NextResponse.json(
        { error: "API key is required for cloud providers" },
        { status: 400 },
      );
    }

    if (validated.providerType === "ollama" && !validated.endpointUrl) {
      return NextResponse.json(
        { error: "Endpoint URL is required for self-hosted providers" },
        { status: 400 },
      );
    }

    // Check if provider of this type already exists for this project
    const existing = await prisma.aiProviderConfig.findUnique({
      where: {
        projectId_providerType: {
          projectId,
          providerType: validated.providerType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Provider type ${validated.providerType} already configured for this project` },
        { status: 409 },
      );
    }

    // Prepare data for database
    const data: {
      projectId: string;
      providerType: string;
      apiKey?: string;
      endpointUrl?: string;
      authToken?: string;
      enabledModels: any;
      defaultModel?: string;
    } = {
      projectId,
      providerType: validated.providerType,
      enabledModels: validated.enabledModels || [],
    };

    // Encrypt API key if provided (for cloud providers)
    if (validated.apiKey) {
      data.apiKey = encrypt(validated.apiKey);
    }

    // Store endpoint URL as plain text (for self-hosted)
    if (validated.endpointUrl) {
      data.endpointUrl = validated.endpointUrl;
    }

    // Encrypt auth token if provided (optional for self-hosted)
    if (validated.authToken) {
      data.authToken = encrypt(validated.authToken);
    }

    // Set default model if provided
    if (validated.defaultModel) {
      data.defaultModel = validated.defaultModel;
    }

    // Create provider
    const provider = await prisma.aiProviderConfig.create({
      data,
    });

    // Return provider without sensitive data
    return NextResponse.json({
      id: provider.id,
      providerType: provider.providerType,
      endpointUrl: provider.endpointUrl,
      enabledModels: provider.enabledModels as string[],
      defaultModel: provider.defaultModel,
      isActive: provider.isActive,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Create AI provider error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

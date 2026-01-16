import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { UserRole } from "@stride/types";
import { discoverModels } from "@/lib/ai/model-discovery";
import { resolveAIGatewayConfig } from "@/lib/config/infrastructure-precedence";
import { z } from "zod";

const discoverModelsSchema = z.object({
  providerType: z.enum(["openai", "anthropic", "google-gemini", "ollama"]),
});

/**
 * POST /api/admin/settings/infrastructure/discover-models
 * Discover available models from global infrastructure AI provider
 * 
 * Uses configured API keys from infrastructure config to discover models.
 * Supports:
 * - OpenAI: Fetches models from OpenAI API
 * - Anthropic: Fetches models from Anthropic API
 * - Google Gemini: Fetches models from Google Gemini API
 * - Ollama: Fetches models from Ollama endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    // Admin-only access
    if (session.role !== UserRole.Admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = discoverModelsSchema.parse(body);

    // Get global infrastructure config
    const globalConfig = await resolveAIGatewayConfig();

    // Validate required fields based on provider type
    const cloudProviders = ["openai", "anthropic", "google-gemini"];
    if (cloudProviders.includes(validated.providerType)) {
      let apiKey: string | undefined;
      
      switch (validated.providerType) {
        case "openai":
          apiKey = globalConfig.openaiApiKey;
          break;
        case "anthropic":
          apiKey = globalConfig.anthropicApiKey;
          break;
        case "google-gemini":
          apiKey = globalConfig.googleAiApiKey;
          break;
      }

      if (!apiKey) {
        return NextResponse.json(
          { error: `API key for ${validated.providerType} is not configured in infrastructure settings` },
          { status: 400 },
        );
      }

      try {
        const models = await discoverModels({
          providerType: validated.providerType,
          apiKey,
        });

        return NextResponse.json({ models });
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("fetch")) {
          return NextResponse.json(
            {
              error:
                "Failed to connect to provider. Please check the configuration and network connectivity.",
            },
            { status: 400 },
          );
        }

        if (error instanceof Error && error.name === "AbortError") {
          return NextResponse.json(
            {
              error:
                "Request timed out. Please check the configuration and network connectivity.",
            },
            { status: 408 },
          );
        }

        console.error("Model discovery error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to discover models. Please check the configuration and try again.";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }

    // Ollama provider
    if (validated.providerType === "ollama") {
      if (!globalConfig.llmEndpoint) {
        return NextResponse.json(
          { error: "Ollama endpoint URL is not configured in infrastructure settings" },
          { status: 400 },
        );
      }

      try {
        const models = await discoverModels({
          providerType: "ollama",
          endpointUrl: globalConfig.llmEndpoint,
        });

        return NextResponse.json({ models });
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("fetch")) {
          return NextResponse.json(
            {
              error:
                "Failed to connect to Ollama endpoint. Please check the endpoint URL and network connectivity.",
            },
            { status: 400 },
          );
        }

        if (error instanceof Error && error.name === "AbortError") {
          return NextResponse.json(
            {
              error:
                "Request timed out. Please check the endpoint URL and network connectivity.",
            },
            { status: 408 },
          );
        }

        console.error("Model discovery error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to discover models. Please check the endpoint URL and try again.";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }

    return NextResponse.json(
      { error: "Unsupported provider type" },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Discover models error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

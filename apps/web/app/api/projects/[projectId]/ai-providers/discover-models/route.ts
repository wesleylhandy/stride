import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { UserRole } from "@stride/types";
import { discoverModels } from "@/lib/ai/model-discovery";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

const discoverModelsSchema = z.object({
  providerType: z.enum(["openai", "anthropic", "google-gemini", "ollama"]),
  apiKey: z.string().optional(),
  endpointUrl: z.string().url().optional().or(z.literal("")),
  authToken: z.string().optional(),
});

/**
 * POST /api/projects/[projectId]/ai-providers/discover-models
 * Discover available models from AI provider
 * 
 * Supports:
 * - OpenAI: Fetches models from OpenAI API
 * - Anthropic: Returns curated list (no public API endpoint)
 * - Google Gemini: Fetches models from Google Gemini API
 * - Ollama: Fetches models from Ollama endpoint
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

    const body = await request.json();
    const validated = discoverModelsSchema.parse(body);

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
        { error: "Endpoint URL is required for Ollama" },
        { status: 400 },
      );
    }

    try {
      const models = await discoverModels({
        providerType: validated.providerType,
        apiKey: validated.apiKey,
        endpointUrl: validated.endpointUrl,
        authToken: validated.authToken,
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

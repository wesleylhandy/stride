import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { prisma, projectRepository } from "@stride/database";
import { UserRole } from "@stride/types";
import { encrypt } from "@/lib/integrations/storage";
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
    }));

    return NextResponse.json(safeProviders);
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

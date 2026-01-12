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
    providerId: string;
  }>;
}

const updateAiProviderSchema = z.object({
  apiKey: z.string().optional(),
  endpointUrl: z.string().url().optional().or(z.literal("")),
  authToken: z.string().optional(),
  enabledModels: z.array(z.string()).optional(),
  defaultModel: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/projects/[projectId]/ai-providers/[providerId]
 * Update an AI provider configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const { projectId, providerId } = await params;

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

    // Find existing provider
    const existing = await prisma.aiProviderConfig.findFirst({
      where: {
        id: providerId,
        projectId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "AI provider not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = updateAiProviderSchema.parse(body);

    // Prepare update data
    const updateData: {
      apiKey?: string;
      endpointUrl?: string;
      authToken?: string;
      enabledModels?: any;
      defaultModel?: string;
      isActive?: boolean;
    } = {};

    // Encrypt API key if provided (only update if new value provided)
    if (validated.apiKey !== undefined && validated.apiKey !== "") {
      updateData.apiKey = encrypt(validated.apiKey);
    }

    // Update endpoint URL if provided
    if (validated.endpointUrl !== undefined) {
      updateData.endpointUrl = validated.endpointUrl || undefined;
    }

    // Encrypt auth token if provided (only update if new value provided)
    if (validated.authToken !== undefined && validated.authToken !== "") {
      updateData.authToken = encrypt(validated.authToken);
    }

    // Update enabled models if provided
    if (validated.enabledModels !== undefined) {
      updateData.enabledModels = validated.enabledModels;
    }

    // Update default model if provided
    if (validated.defaultModel !== undefined) {
      updateData.defaultModel = validated.defaultModel || undefined;
    }

    // Update isActive if provided
    if (validated.isActive !== undefined) {
      updateData.isActive = validated.isActive;
    }

    // Update provider
    const provider = await prisma.aiProviderConfig.update({
      where: { id: providerId },
      data: updateData,
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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Update AI provider error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/projects/[projectId]/ai-providers/[providerId]
 * Delete an AI provider configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const { projectId, providerId } = await params;

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

    // Find existing provider
    const existing = await prisma.aiProviderConfig.findFirst({
      where: {
        id: providerId,
        projectId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "AI provider not found" },
        { status: 404 },
      );
    }

    // Delete provider
    await prisma.aiProviderConfig.delete({
      where: { id: providerId },
    });

    return NextResponse.json({ message: "AI provider deleted successfully" });
  } catch (error) {
    console.error("Delete AI provider error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

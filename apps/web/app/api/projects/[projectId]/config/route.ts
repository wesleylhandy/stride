import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@stride/database";
import { parseYamlConfig } from "@stride/yaml-config";
import type { Prisma } from "@stride/database";
import { requireAuth } from "@/middleware/auth";
import { canManageProjectConfig } from "@/lib/auth/permissions";
import { invalidateConfigCache } from "@/lib/cache/invalidation";

/**
 * GET /api/projects/[projectId]/config
 * Retrieve project configuration as YAML
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const projectId = params.projectId;

    // Check if project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Any authenticated user can view config (Viewer+)

    const config = await projectRepository.getConfig(projectId);
    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      configYaml: config.configYaml,
      configVersion: config.configVersion,
    });
  } catch (error) {
    console.error("Error fetching project config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[projectId]/config
 * Update project configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    // Only Admin can update config
    if (!canManageProjectConfig(session.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const projectId = params.projectId;
    const body = await request.json();
    const { configYaml, configVersion } = body;

    if (!configYaml || typeof configYaml !== "string") {
      return NextResponse.json(
        { error: "configYaml is required and must be a string" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse and validate YAML syntax
    const parseResult = parseYamlConfig(configYaml);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "YAML validation failed",
          errors: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Additional schema validation is handled by parseYamlConfig
    // which internally calls validateConfig
    if (!parseResult.data) {
      return NextResponse.json(
        {
          error: "Schema validation failed",
          errors: parseResult.errors || [
            {
              message: "Configuration does not match required schema",
              path: [],
              code: "SCHEMA_ERROR",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Update configuration in database
    // Cast to Prisma.JsonValue for storage
    const updatedProject = await projectRepository.updateConfig(
      projectId,
      configYaml,
      parseResult.data as unknown as Prisma.JsonValue,
      configVersion
    );

    // Invalidate config cache so components fetch fresh config
    invalidateConfigCache(projectId);

    return NextResponse.json({
      success: true,
      configVersion: updatedProject.configVersion,
      message: "Configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating project config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


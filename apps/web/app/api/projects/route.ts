import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { projectRepository } from "@stride/database";
import type { Prisma } from "@stride/database";
import {
  createProjectSchema,
  validateProjectKeyUnique,
} from "@/lib/validation/project";
import { generateDefaultConfig } from "@stride/yaml-config";
import { parseYamlConfig, stringifyYamlConfig } from "@stride/yaml-config";
import { z } from "zod";

/**
 * GET /api/projects
 * List all projects (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const search = searchParams.get("search") || undefined;

    // Build filter
    const filter = search
      ? {
          name: search,
        }
      : undefined;

    // Get paginated projects
    const result = await projectRepository.findManyPaginated(filter, {
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;

    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    // Validate project key uniqueness
    const keyValidation = await validateProjectKeyUnique(validated.key);
    if (!keyValidation.isValid) {
      return NextResponse.json(
        { error: keyValidation.error },
        { status: 400 },
      );
    }

    // Generate default configuration
    const defaultConfig = generateDefaultConfig(validated.key, validated.name);

    // Convert to YAML string
    const configYaml = stringifyYamlConfig(defaultConfig);

    // Parse and validate the config
    const parseResult = parseYamlConfig(configYaml);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Failed to generate valid default configuration",
          details: parseResult.errors,
        },
        { status: 500 },
      );
    }

    if (!parseResult.data) {
      return NextResponse.json(
        {
          error: "Failed to generate valid default configuration",
        },
        { status: 500 },
      );
    }

    // Create project
    const project = await projectRepository.create({
      key: validated.key,
      name: validated.name,
      description: validated.description,
      configYaml,
      config: parseResult.data as Prisma.JsonValue,
      repositoryUrl: validated.repositoryUrl || undefined,
      repositoryType: validated.repositoryType,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 },
      );
    }

    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


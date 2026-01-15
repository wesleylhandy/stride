/**
 * POST /api/projects/[projectId]/assistant/apply-suggestion
 * Apply a configuration suggestion from the AI assistant
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { projectRepository } from "@stride/database";
import { applySuggestion, type ConfigurationSuggestion } from "@/lib/assistant/suggestion-applier";
import { canUseProjectAssistant } from "@/lib/assistant/access-control";
import { canManageProjectConfig } from "@/lib/auth/permissions";
import { UserRole } from "@stride/types";
import { z } from "zod";

const applySuggestionSchema = z.object({
  suggestion: z.object({
    type: z.enum(["workflow", "custom_field", "automation_rule", "infrastructure", "full"]),
    config: z.union([z.record(z.unknown()), z.string()]),
    explanation: z.string().optional(),
  }),
  resolveConflicts: z.enum(["keep_current", "use_suggested", "manual"]).optional().default("use_suggested"),
});

/**
 * POST /api/projects/[projectId]/assistant/apply-suggestion
 * Apply a configuration suggestion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;
    const { projectId } = await params;

    // Verify project exists
    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check access control (must be able to use assistant)
    const projectConfigData = await projectRepository.getConfig(projectId);
    const projectConfig = projectConfigData?.config;
    const userRole = session.role;
    
    const hasPermission = canUseProjectAssistant(userRole, projectConfig as any);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to use the assistant" },
        { status: 403 }
      );
    }

    // Check if user can manage project config (admin role required for applying)
    if (!canManageProjectConfig(session.role)) {
      return NextResponse.json(
        { error: "Forbidden", message: "You must be an admin to apply configuration changes" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validated = applySuggestionSchema.parse(body);

    // Apply suggestion
    const result = await applySuggestion(
      projectId,
      validated.suggestion as ConfigurationSuggestion,
      validated.resolveConflicts
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Application failed",
          message: result.error || "Failed to apply configuration suggestion",
        },
        { status: 400 }
      );
    }

    if (!result.applied) {
      // Suggestion not applied (conflicts, user chose to keep current, etc.)
      return NextResponse.json({
        success: true,
        applied: false,
        message: "Suggestion not applied",
        conflictResolution: result.conflictResolution,
      });
    }

    // Successfully applied
    return NextResponse.json({
      success: true,
      applied: true,
      message: "Configuration suggestion applied successfully",
      conflictResolution: result.conflictResolution,
    });
  } catch (error) {
    console.error("Apply suggestion API error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Invalid suggestion format",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

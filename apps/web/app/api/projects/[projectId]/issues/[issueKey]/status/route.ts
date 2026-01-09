import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { issueRepository, projectRepository } from "@stride/database";
import type { Issue, IssueType, Priority } from "@stride/types";
import type { ProjectConfig } from "@stride/yaml-config";
import {
  updateIssueStatusSchema,
} from "@/lib/validation/issue";
import {
  canUpdateIssue,
} from "@/lib/auth/permissions";
import { validateStatusChange } from "@/lib/workflow/validation";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
    issueKey: string;
  }>;
}

/**
 * PATCH /api/projects/[projectId]/issues/[issueKey]/status
 * Update issue status
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const { projectId, issueKey } = await params;

    // Check permission to update issues
    if (!canUpdateIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot update issues" },
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

    // Find issue by key
    const existing = await issueRepository.findByKey(
      projectId,
      issueKey,
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = updateIssueStatusSchema.parse(body);

    // Validate status change against workflow rules (T161-T163)
    // Always fetch fresh config from database to ensure validation uses latest configuration
    // This ensures rule enforcement is dynamic and responsive to configuration changes
    const projectConfig = await projectRepository.getConfig(projectId);
    if (!projectConfig || !projectConfig.config) {
      return NextResponse.json(
        { error: "Project configuration not found" },
        { status: 500 },
      );
    }

    // project.config is stored as JSONB (already parsed) - cast directly to ProjectConfig
    // No need to parse YAML - this ensures we use the exact config stored in database
    const config = projectConfig.config as ProjectConfig;

    // Convert Prisma issue to types Issue (null -> undefined, enum conversion)
    const issueForValidation: Issue = {
      ...existing,
      description: existing.description ?? undefined,
      assigneeId: existing.assigneeId ?? undefined,
      cycleId: existing.cycleId ?? undefined,
      closedAt: existing.closedAt ?? undefined,
      type: existing.type as IssueType,
      priority: existing.priority ? (existing.priority as Priority) : undefined,
      customFields: (existing.customFields as Record<string, unknown>) || {},
      storyPoints: existing.storyPoints ?? undefined,
    };

    // Validate using the fresh config from database - rules are dynamically enforced
    const validationResult = validateStatusChange(
      issueForValidation,
      validated.status,
      config,
    );

    if (!validationResult.isValid) {
      // Enhance error messages with configuration context
      const enhancedErrors = validationResult.errors.map((err) => {
        // If error already has good context, keep it
        if (err.message && (err.message.includes('configuration') || err.message.includes('workflow') || err.message.includes('Required field'))) {
          return err;
        }
        // Otherwise add context about checking configuration
        return {
          ...err,
          message: err.message || `Validation failed for ${err.field || 'status'}. Please check your project configuration.`,
        };
      });
      
      return NextResponse.json(
        {
          error: 'Status transition validation failed',
          details: enhancedErrors,
          message: 'Cannot move issue to this status. See details for specific requirements from your project configuration.',
          helpUrl: '/docs/configuration-troubleshooting',
        },
        { status: 400 },
      );
    }

    // Update only the status field
    const updatedIssue = await issueRepository.update(existing.id, {
      status: validated.status,
    });

    return NextResponse.json(updatedIssue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Update issue status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

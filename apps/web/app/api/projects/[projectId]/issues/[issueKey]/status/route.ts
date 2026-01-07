import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { issueRepository, projectRepository } from "@stride/database";
import type { Issue, IssueType, Priority } from "@stride/types";
import { parseYamlConfig } from "@stride/yaml-config";
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
    if (project.config) {
      // Parse project config
      const parseResult = parseYamlConfig(project.config as unknown as string);
      if (!parseResult.success || !parseResult.data) {
        return NextResponse.json(
          { error: "Invalid project configuration" },
          { status: 500 },
        );
      }
      
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
      const validationResult = validateStatusChange(
        issueForValidation,
        validated.status,
        parseResult.data,
      );

      if (!validationResult.isValid) {
        return NextResponse.json(
          {
            error: 'Status transition validation failed',
            details: validationResult.errors,
          },
          { status: 400 },
        );
      }
    }

    // Update only the status field
    const issue = await issueRepository.update(existing.id, {
      status: validated.status,
    });

    return NextResponse.json(issue);
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


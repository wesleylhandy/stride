import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { issueRepository, projectRepository } from "@stride/database";
import {
  updateIssueStatusSchema,
} from "@/lib/validation/issue";
import {
  canUpdateIssue,
} from "@/lib/auth/permissions";
import { validateStatusChange } from "@/lib/workflow/validation";
import { z } from "zod";

interface RouteParams {
  params: {
    projectId: string;
    issueKey: string;
  };
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

    // Check permission to update issues
    if (!canUpdateIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot update issues" },
        { status: 403 },
      );
    }

    // Verify project exists
    const project = await projectRepository.findById(params.projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // Find issue by key
    const existing = await issueRepository.findByKey(
      params.projectId,
      params.issueKey,
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
      const validationResult = validateStatusChange(
        existing,
        validated.status,
        project.config,
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


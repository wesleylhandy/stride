import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { issueRepository, projectRepository } from "@stride/database";
import type { Prisma } from "@stride/database";
import {
  updateIssueSchema,
} from "@/lib/validation/issue";
import {
  canViewIssue,
  canUpdateIssue,
} from "@/lib/auth/permissions";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
    issueKey: string;
  }>;
}

/**
 * GET /api/projects/[projectId]/issues/[issueKey]
 * Get issue details by key
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
    const { projectId, issueKey } = await params;

    // Check permission to view issues
    if (!canViewIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Cannot view issues" },
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
    const issue = await issueRepository.findByKey(
      projectId,
      issueKey,
    );

    if (!issue) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Get issue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/projects/[projectId]/issues/[issueKey]
 * PATCH /api/projects/[projectId]/issues/[issueKey]
 * Update an issue
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
    const validated = updateIssueSchema.parse(body);

    // Build update data, converting null to undefined for most fields
    // (Prisma ignores undefined, leaving fields unchanged)
    // Only include fields that are explicitly provided
    const updateData: Parameters<typeof issueRepository.update>[1] = {};

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) {
      updateData.description = validated.description ?? undefined;
    }
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.type !== undefined) updateData.type = validated.type;
    if (validated.priority !== undefined) {
      updateData.priority = validated.priority ?? undefined;
    }
    if (validated.assigneeId !== undefined) {
      updateData.assigneeId = validated.assigneeId ?? undefined;
    }
    // CRITICAL: Preserve null for cycleId - don't convert to undefined!
    // This allows removing issues from cycles by setting cycleId to null
    if (validated.cycleId !== undefined) {
      // Type assertion needed because UpdateIssueInput doesn't allow null,
      // but Prisma accepts null to clear the field
      (updateData as { cycleId?: string | null }).cycleId = validated.cycleId;
    }
    if (validated.customFields !== undefined) {
      updateData.customFields = validated.customFields;
    }
    if (validated.storyPoints !== undefined) {
      updateData.storyPoints = validated.storyPoints ?? undefined;
    }

    // Update issue
    const issue = await issueRepository.update(existing.id, updateData);

    return NextResponse.json(issue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Update issue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/projects/[projectId]/issues/[issueKey]
 * Update an issue (alias for PUT)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  // Reuse PUT handler logic
  return PUT(request, { params });
}

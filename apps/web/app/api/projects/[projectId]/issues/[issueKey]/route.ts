import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { issueRepository, projectRepository } from "@stride/database";
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

    // Convert null to undefined for repository
    const updateData = {
      ...validated,
      description: validated.description ?? undefined,
      assigneeId: validated.assigneeId ?? undefined,
      cycleId: validated.cycleId ?? undefined,
      priority: validated.priority ?? undefined,
      storyPoints: validated.storyPoints ?? undefined,
    };

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


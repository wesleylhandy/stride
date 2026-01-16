/**
 * POST /api/projects/[projectId]/issues/[issueKey]/link-external
 * Manually link an issue to an external repository issue
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { prisma, issueRepository, projectRepository } from "@stride/database";
import { canUpdateIssue } from "@/lib/auth/permissions";
import { manualLinkRequestSchema } from "@/lib/sync/types";
import { DuplicateMatcher } from "@/lib/sync/duplicate-matcher";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    projectId: string;
    issueKey: string;
  }>;
}

/**
 * POST /api/projects/[projectId]/issues/[issueKey]/link-external
 * Link issue to external repository issue
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
    const { projectId, issueKey } = await params;

    // Check permission (admin or member, not viewer)
    if (!canUpdateIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Only administrators and members can link issues" },
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

    // Find issue by key (consistent with other routes)
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

    if (issue.projectId !== projectId) {
      return NextResponse.json(
        { error: "Issue does not belong to this project" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = manualLinkRequestSchema.parse(body);

    // T055: Validate external identifier format
    // The schema already validates the format via externalIdSchema regex
    // Additional validation: verify repository URL matches an existing connection
    const repositoryConnection = await prisma.repositoryConnection.findFirst({
      where: {
        projectId,
        repositoryUrl: validated.repositoryUrl,
        serviceType: validated.providerType,
      },
    });

    if (!repositoryConnection) {
      return NextResponse.json(
        {
          error: "Repository connection not found. Please ensure the repository is connected to this project.",
        },
        { status: 404 },
      );
    }

    // Generate external ID in the same format used by sync
    // Use provided externalId if available, otherwise construct from components
    let externalId: string;
    if (validated.externalId) {
      externalId = validated.externalId;
    } else if (validated.issueNumber) {
      externalId = DuplicateMatcher.generateExternalId(
        validated.providerType,
        validated.repositoryUrl,
        validated.issueNumber.toString(),
      );
    } else {
      return NextResponse.json(
        { error: "Either externalId or issueNumber must be provided" },
        { status: 400 },
      );
    }

    // T056: Check for duplicate external ID (prevent linking if another issue already has this external ID)
    const duplicateMatcher = new DuplicateMatcher();
    const duplicateCheck = await duplicateMatcher.matchByExternalId(
      projectId,
      externalId,
    );

    if (duplicateCheck.matched && duplicateCheck.issueId !== issue.id) {
      return NextResponse.json(
        {
          error: `Another issue (${duplicateCheck.issueId}) is already linked to this external issue`,
        },
        { status: 409 },
      );
    }

    // Update issue customFields with external sync metadata
    const currentCustomFields = (issue.customFields || {}) as Record<string, unknown>;
    const updatedCustomFields = {
      ...currentCustomFields,
      externalId,
      externalSync: {
        providerType: validated.providerType,
        repositoryUrl: validated.repositoryUrl,
        issueNumber: validated.issueNumber,
        syncedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        securityAdvisory: false, // Manual links are not security advisories
      },
    };

    // Update the issue using the ID from the fetched issue
    const updatedIssue = await issueRepository.update(issue.id, {
      customFields: updatedCustomFields,
    });

    return NextResponse.json({
      success: true,
      issue: updatedIssue,
      externalId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Link external issue error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

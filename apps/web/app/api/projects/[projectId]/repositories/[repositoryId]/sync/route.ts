/**
 * POST /api/projects/[projectId]/repositories/[repositoryId]/sync
 * Trigger manual issue sync from Git repository
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { prisma, projectRepository } from "@stride/database";
import { canCreateIssue } from "@/lib/auth/permissions";
import { IssueSyncService } from "@/lib/sync/issue-sync-service";
import { syncRequestSchema } from "@/lib/sync/types";
import { syncOperationStore } from "@/lib/sync/sync-operation-store";
import { decrypt } from "@/lib/integrations/storage";
import {
  fetchGitHubIssues,
  parseGitHubRepositoryUrl,
} from "@/lib/integrations/github";
import {
  fetchGitLabIssues,
  parseGitLabRepositoryUrl,
} from "@/lib/integrations/gitlab";
import {
  fetchBitbucketIssues,
  parseBitbucketRepositoryUrl,
} from "@/lib/integrations/bitbucket";
import { z } from "zod";
import { randomUUID } from "crypto";

interface RouteParams {
  params: Promise<{
    projectId: string;
    repositoryId: string;
  }>;
}

/**
 * POST /api/projects/[projectId]/repositories/[repositoryId]/sync
 * Trigger manual issue sync
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
    const { projectId, repositoryId } = await params;

    // Check permission (admin or member, not viewer)
    if (!canCreateIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Only administrators and members can trigger sync" },
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

    // Get repository connection
    const connection = await prisma.repositoryConnection.findUnique({
      where: { id: repositoryId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Repository connection not found" },
        { status: 404 },
      );
    }

    // Verify connection belongs to project
    if (connection.projectId !== projectId) {
      return NextResponse.json(
        { error: "Repository connection does not belong to this project" },
        { status: 403 },
      );
    }

    // Check for concurrent sync
    const activeSyncs = syncOperationStore.findActiveByRepository(repositoryId);
    if (activeSyncs.length > 0) {
      return NextResponse.json(
        { error: "A sync operation is already in progress for this repository" },
        { status: 409 },
      );
    }

    // Check webhook status and require confirmation if active
    const body = await request.json();
    const validated = syncRequestSchema.parse(body);

    // T060: Require confirmation if webhook is active OR if includeClosed is true
    if (connection.isActive && !validated.confirmation) {
      return NextResponse.json(
        {
          error: "Repository webhook is active. Manual sync will proceed after confirmation.",
          requiresConfirmation: true,
        },
        { status: 400 },
      );
    }

    // T065: Require confirmation when includeClosed is true
    if (validated.includeClosed && !validated.confirmation) {
      return NextResponse.json(
        {
          error: "Confirmation is required when syncing closed/archived issues.",
          requiresConfirmation: true,
        },
        { status: 400 },
      );
    }

    // Detect if async mode is needed (repository size > 100 issues)
    // Fetch first page to estimate size
    let needsAsync = false;
    try {
      const accessToken = decrypt(connection.accessToken);
      
      if (validated.syncType === "full" || validated.syncType === "issuesOnly") {
        let firstPageCount = 0;
        
        if (connection.serviceType === "GitHub") {
          const parsed = parseGitHubRepositoryUrl(connection.repositoryUrl);
          if (parsed) {
            const response = await fetchGitHubIssues(
              parsed.owner,
              parsed.repo,
              accessToken,
              {
                state: validated.includeClosed ? "all" : "open",
                page: 1,
                perPage: 100,
              },
            );
            firstPageCount = response.issues.length;
            // If we got 100 issues and there's a next page, estimate > 100 total
            needsAsync = response.issues.length === 100 && response.hasNext;
          }
        } else if (connection.serviceType === "GitLab") {
          const projectPath = parseGitLabRepositoryUrl(connection.repositoryUrl);
          if (projectPath) {
            const response = await fetchGitLabIssues(
              projectPath,
              accessToken,
              {
                state: validated.includeClosed ? "all" : "opened",
                page: 1,
                perPage: 100,
              },
            );
            needsAsync = response.issues.length === 100 && response.hasNext;
          }
        } else if (connection.serviceType === "Bitbucket") {
          const parsed = parseBitbucketRepositoryUrl(connection.repositoryUrl);
          if (parsed) {
            const response = await fetchBitbucketIssues(
              parsed.workspace,
              parsed.repoSlug,
              accessToken,
              {
                state: validated.includeClosed ? "all" : "open",
                page: 1,
                perPage: 100,
              },
            );
            needsAsync = response.issues.length === 100 && response.hasNext;
          }
        }
      }
    } catch (error) {
      // If we can't estimate, default to sync mode (smaller repos)
      console.warn("Could not estimate repository size for async detection:", error);
    }

    // Initialize sync service
    const syncService = new IssueSyncService();

    // For async operations, create operation and return 202
    if (needsAsync) {
      const operationId = randomUUID();
      const abortController = new AbortController();

      // Create operation record
      syncOperationStore.create({
        id: operationId,
        repositoryConnectionId: repositoryId,
        projectId,
        userId: session.userId,
        status: "pending",
        syncType: validated.syncType || "full",
        includeClosed: validated.includeClosed || false,
        abortController,
      });

      // Start sync asynchronously (don't await)
      syncService
        .syncRepositoryIssues(repositoryId, session.userId, {
          syncType: validated.syncType || "full",
          includeClosed: validated.includeClosed || false,
          operationId,
          abortSignal: abortController.signal,
        })
        .then(async (results) => {
          // Update lastSyncAt on successful completion
          await prisma.repositoryConnection.update({
            where: { id: repositoryId },
            data: { lastSyncAt: new Date() },
          });
        })
        .catch((error) => {
          console.error("Async sync error:", error);
          // Error already tracked in operation store
        });

      return NextResponse.json(
        {
          operationId,
          status: "pending",
          location: `/api/projects/${projectId}/repositories/${repositoryId}/sync/${operationId}`,
        },
        { status: 202 },
      );
    }

    // Synchronous operation for smaller repositories
    const startTime = Date.now();
    const results = await syncService.syncRepositoryIssues(
      repositoryId,
      session.userId,
      {
        syncType: validated.syncType || "full",
        includeClosed: validated.includeClosed || false,
      },
    );

    const duration = (Date.now() - startTime) / 1000;

    // Update lastSyncAt timestamp
    await prisma.repositoryConnection.update({
      where: { id: repositoryId },
      data: {
        lastSyncAt: new Date(),
      },
    });

    // Return sync results
    return NextResponse.json({
      status: "completed",
      results,
      duration,
      repositoryUrl: connection.repositoryUrl,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

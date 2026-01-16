/**
 * GET /api/projects/[projectId]/repositories/[repositoryId]/sync/[operationId]
 * GET sync operation status
 * 
 * DELETE /api/projects/[projectId]/repositories/[repositoryId]/sync/[operationId]
 * Cancel sync operation
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { prisma } from "@stride/database";
import { canCreateIssue } from "@/lib/auth/permissions";
import { syncOperationStore } from "@/lib/sync/sync-operation-store";

interface RouteParams {
  params: Promise<{
    projectId: string;
    repositoryId: string;
    operationId: string;
  }>;
}

/**
 * GET /api/projects/[projectId]/repositories/[repositoryId]/sync/[operationId]
 * Get sync operation status
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
    const { projectId, repositoryId, operationId } = await params;

    // Check permission
    if (!canCreateIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Only administrators and members can view sync status" },
        { status: 403 },
      );
    }

    // Verify repository connection belongs to project
    const connection = await prisma.repositoryConnection.findUnique({
      where: { id: repositoryId },
    });

    if (!connection || connection.projectId !== projectId) {
      return NextResponse.json(
        { error: "Repository connection not found" },
        { status: 404 },
      );
    }

    // Get operation
    const operation = syncOperationStore.get(operationId);

    if (!operation) {
      return NextResponse.json(
        { error: "Sync operation not found" },
        { status: 404 },
      );
    }

    // Verify operation belongs to repository
    if (operation.repositoryConnectionId !== repositoryId) {
      return NextResponse.json(
        { error: "Sync operation does not belong to this repository" },
        { status: 403 },
      );
    }

    // Return operation status
    return NextResponse.json({
      operationId,
      status: operation.status,
      progress: operation.progress,
      results: operation.results,
      error: operation.error,
      startedAt: operation.startedAt?.toISOString(),
      completedAt: operation.completedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Get sync operation status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/projects/[projectId]/repositories/[repositoryId]/sync/[operationId]
 * Cancel sync operation
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const session = authResult;
    const { projectId, repositoryId, operationId } = await params;

    // Check permission
    if (!canCreateIssue(session.role)) {
      return NextResponse.json(
        { error: "Permission denied: Only administrators and members can cancel sync" },
        { status: 403 },
      );
    }

    // Verify repository connection belongs to project
    const connection = await prisma.repositoryConnection.findUnique({
      where: { id: repositoryId },
    });

    if (!connection || connection.projectId !== projectId) {
      return NextResponse.json(
        { error: "Repository connection not found" },
        { status: 404 },
      );
    }

    // Get operation
    const operation = syncOperationStore.get(operationId);

    if (!operation) {
      return NextResponse.json(
        { error: "Sync operation not found" },
        { status: 404 },
      );
    }

    // Verify operation belongs to repository
    if (operation.repositoryConnectionId !== repositoryId) {
      return NextResponse.json(
        { error: "Sync operation does not belong to this repository" },
        { status: 403 },
      );
    }

    // Check if operation can be cancelled
    if (operation.status === "completed" || operation.status === "failed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed or failed operation" },
        { status: 400 },
      );
    }

    // Cancel the operation
    if (operation.abortController) {
      operation.abortController.abort();
    }

    // Update operation status
    syncOperationStore.update(operationId, {
      status: "failed",
      error: "Operation cancelled by user",
      completedAt: new Date(),
    });

    return NextResponse.json({
      operationId,
      status: "failed",
      error: "Operation cancelled by user",
    });
  } catch (error) {
    console.error("Cancel sync operation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

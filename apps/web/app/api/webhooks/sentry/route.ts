/**
 * Sentry webhook endpoint
 * T241: Create Sentry webhook endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stride/database";
import { parseSentryError } from "@/lib/webhooks/error-parsers";
import {
  handleErrorWebhook,
  handleErrorWebhookError,
} from "@/lib/webhooks/error-handlers";
import { logger } from "@/lib/logger";

/**
 * POST /api/webhooks/sentry
 * Handle Sentry webhook events
 */
export async function POST(request: NextRequest) {
  let rawBody: string;
  let payload: unknown;

  try {
    rawBody = await request.text();
    payload = JSON.parse(rawBody);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // Sentry webhooks can have different event types
  // We're primarily interested in error events
  const eventType = (payload as { action?: string }).action || "event.created";

  // Find project by webhook configuration
  // For now, we'll need to identify the project from the payload
  // This might require additional configuration or matching logic
  let projectId: string | undefined;

  try {
    // Try to find project by matching repository URL or other identifier
    // Sentry events may include project information
    const sentryProject = (payload as { project?: { slug?: string } }).project;
    
    // For now, get the first project (in production, this should match by Sentry project slug)
    // TODO: Add proper project matching logic based on Sentry project configuration
    const project = await prisma.project.findFirst();
    if (project) {
      projectId = project.id;
    }
  } catch (error) {
    logger.error("Failed to find project for Sentry webhook", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }

  if (!projectId) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  try {
    // Parse error from Sentry payload
    const errorTrace = parseSentryError(payload);

    if (!errorTrace) {
      return NextResponse.json(
        { error: "Invalid error payload" },
        { status: 400 },
      );
    }

    // Handle error webhook (create or update issue)
    const result = await handleErrorWebhook(
      projectId,
      errorTrace,
      "Sentry",
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create issue from error" },
        { status: 500 },
      );
    }

    logger.info("Sentry webhook processed successfully", {
      projectId,
      issueId: result.issueId,
      issueKey: result.issueKey,
      isNew: result.isNew,
    });

    return NextResponse.json(
      {
        success: true,
        issueId: result.issueId,
        issueKey: result.issueKey,
        isNew: result.isNew,
      },
      { status: 200 },
    );
  } catch (error) {
    handleErrorWebhookError(error, {
      serviceType: "Sentry",
      projectId,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


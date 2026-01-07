/**
 * Datadog webhook endpoint
 * T242: Create Datadog webhook endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stride/database";
import { parseDatadogError } from "@/lib/webhooks/error-parsers";
import {
  handleErrorWebhook,
  handleErrorWebhookError,
} from "@/lib/webhooks/error-handlers";
import { logger } from "@/lib/logger";

/**
 * POST /api/webhooks/datadog
 * Handle Datadog webhook events
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

  // Find project by webhook configuration
  // For now, we'll need to identify the project from the payload
  let projectId: string | undefined;

  try {
    // Try to find project by matching repository URL or other identifier
    // Datadog events may include project information in tags
    const datadogEvent = (payload as { event?: { tags?: string[] } }).event;
    
    // For now, get the first project (in production, this should match by Datadog tags or configuration)
    // TODO: Add proper project matching logic based on Datadog configuration
    const project = await prisma.project.findFirst();
    if (project) {
      projectId = project.id;
    }
  } catch (error) {
    logger.error("Failed to find project for Datadog webhook", error instanceof Error ? error : undefined);
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
    // Parse error from Datadog payload
    const errorTrace = parseDatadogError(payload);

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
      "Datadog",
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create issue from error" },
        { status: 500 },
      );
    }

    logger.info("Datadog webhook processed successfully", {
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
      serviceType: "Datadog",
      projectId,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}



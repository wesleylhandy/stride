/**
 * New Relic webhook endpoint
 * T243: Create New Relic webhook endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stride/database";
import { parseNewRelicError } from "@/lib/webhooks/error-parsers";
import {
  handleErrorWebhook,
  handleErrorWebhookError,
} from "@/lib/webhooks/error-handlers";
import { logger } from "@/lib/logger";

/**
 * POST /api/webhooks/newrelic
 * Handle New Relic webhook events
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
    // New Relic events may include account or policy information
    const newRelicData = payload as { account_name?: string; policy_name?: string };
    
    // For now, get the first project (in production, this should match by New Relic account/policy configuration)
    // TODO: Add proper project matching logic based on New Relic configuration
    const project = await prisma.project.findFirst();
    if (project) {
      projectId = project.id;
    }
  } catch (error) {
    logger.error("Failed to find project for New Relic webhook", error instanceof Error ? error : undefined);
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
    // Parse error from New Relic payload
    const errorTrace = parseNewRelicError(payload);

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
      "New Relic",
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create issue from error" },
        { status: 500 },
      );
    }

    logger.info("New Relic webhook processed successfully", {
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
      serviceType: "New Relic",
      projectId,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


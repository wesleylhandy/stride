/**
 * Error handlers for monitoring service webhooks
 * T247-T251: Create issues from error webhooks, extract error details, set issue type, link error traces, group similar errors
 */

import { logger } from "../logger";
import { issueRepository, prisma } from "@stride/database";
import type { ErrorTrace } from "./error-parsers";
import { groupSimilarErrors } from "./error-grouping";
import { Priority, IssueType, UserRole } from "@stride/types";

/**
 * Get the first admin user for system-created issues
 * Returns null if no admin exists (should not happen in production)
 */
async function getSystemReporterId(): Promise<string | null> {
  try {
    const admin = await prisma.user.findFirst({
      where: {
        role: UserRole.Admin,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (admin) {
      return admin.id;
    }

    // Fallback to first user if no admin exists
    const firstUser = await prisma.user.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    return firstUser?.id || null;
  } catch (error) {
    logger.error("Failed to get system reporter", error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Create an issue from an error trace
 * T247: Create issues from error webhooks
 * T248: Extract error details (title, severity, timestamp)
 * T249: Set issue type to Bug automatically
 */
export async function createIssueFromError(
  projectId: string,
  errorTrace: ErrorTrace,
  serviceName: "Sentry" | "Datadog" | "New Relic",
): Promise<{ issueId: string; issueKey: string } | null> {
  try {
    // Map severity to priority
    const priorityMap: Record<
      ErrorTrace["severity"],
      Priority
    > = {
      low: Priority.Low,
      medium: Priority.Medium,
      high: Priority.High,
      critical: Priority.Critical,
    };
    const priority = priorityMap[errorTrace.severity] || Priority.Medium;

    // Build description with error details
    let description = `**Error from ${serviceName}**\n\n`;
    description += `**Message:** ${errorTrace.message}\n\n`;
    description += `**Timestamp:** ${errorTrace.timestamp.toISOString()}\n\n`;

    if (errorTrace.environment) {
      description += `**Environment:** ${errorTrace.environment}\n\n`;
    }

    if (errorTrace.release) {
      description += `**Release:** ${errorTrace.release}\n\n`;
    }

    if (errorTrace.tags && Object.keys(errorTrace.tags).length > 0) {
      description += `**Tags:**\n`;
      for (const [key, value] of Object.entries(errorTrace.tags)) {
        description += `- ${key}: ${value}\n`;
      }
      description += `\n`;
    }

    if (errorTrace.stackTrace) {
      description += `**Stack Trace:**\n\n\`\`\`\n${errorTrace.stackTrace}\n\`\`\`\n\n`;
    }

    if (errorTrace.context && Object.keys(errorTrace.context).length > 0) {
      description += `**Additional Context:**\n`;
      description += `\`\`\`json\n${JSON.stringify(errorTrace.context, null, 2)}\n\`\`\`\n`;
    }

    // Store error trace data in customFields for Root Cause Dashboard
    const customFields: Record<string, unknown> = {
      errorTrace: {
        service: serviceName,
        severity: errorTrace.severity,
        timestamp: errorTrace.timestamp.toISOString(),
        environment: errorTrace.environment,
        release: errorTrace.release,
        tags: errorTrace.tags,
        context: errorTrace.context,
        fingerprint: errorTrace.fingerprint,
        stackTrace: errorTrace.stackTrace,
      },
    };

    // Get system reporter (first admin user)
    const reporterId = await getSystemReporterId();
    if (!reporterId) {
      logger.error("No system reporter available for error issue creation", undefined, {
        projectId,
        service: serviceName,
      });
      return null;
    }

    // Create issue with type Bug
    const issue = await issueRepository.create({
      projectId,
      title: errorTrace.message,
      description,
      type: IssueType.Bug, // T249: Set issue type to Bug automatically
      priority,
      status: "Backlog", // Start in backlog, can be auto-assigned based on severity
      customFields,
      reporterId, // Use first admin as system reporter
    });

    logger.info("Created issue from error webhook", {
      projectId,
      issueId: issue.id,
      issueKey: issue.key,
      service: serviceName,
      severity: errorTrace.severity,
    });

    return {
      issueId: issue.id,
      issueKey: issue.key,
    };
  } catch (error) {
    logger.error("Failed to create issue from error", error instanceof Error ? error : undefined, {
      projectId,
      service: serviceName,
      errorMessage: errorTrace.message,
    });
    return null;
  }
}

/**
 * Handle error webhook and create/update issue
 * T250: Link error traces to issues
 * T251: Group similar errors
 */
export async function handleErrorWebhook(
  projectId: string,
  errorTrace: ErrorTrace,
  serviceName: "Sentry" | "Datadog" | "New Relic",
): Promise<{ issueId: string; issueKey: string; isNew: boolean } | null> {
  try {
    // T251: Group similar errors
    const existingIssue = await groupSimilarErrors(
      projectId,
      errorTrace,
      serviceName,
    );

    if (existingIssue) {
      // Update existing issue with new error occurrence
      await updateIssueWithErrorTrace(
        existingIssue.id,
        errorTrace,
        serviceName,
      );

      logger.info("Updated existing issue with error trace", {
        projectId,
        issueId: existingIssue.id,
        issueKey: existingIssue.key,
        service: serviceName,
      });

      return {
        issueId: existingIssue.id,
        issueKey: existingIssue.key,
        isNew: false,
      };
    }

    // Create new issue
    const result = await createIssueFromError(projectId, errorTrace, serviceName);
    if (!result) {
      return null;
    }

    return {
      ...result,
      isNew: true,
    };
  } catch (error) {
    logger.error("Failed to handle error webhook", error instanceof Error ? error : undefined, {
      projectId,
      service: serviceName,
    });
    return null;
  }
}

/**
 * Update existing issue with new error trace occurrence
 * T250: Link error traces to issues
 */
async function updateIssueWithErrorTrace(
  issueId: string,
  errorTrace: ErrorTrace,
  serviceName: "Sentry" | "Datadog" | "New Relic",
): Promise<void> {
  try {
    const issue = await issueRepository.findById(issueId);
    if (!issue) {
      return;
    }

    // Get existing customFields
    const customFields = (issue.customFields as Record<string, unknown>) || {};
    const existingErrorTraces = (customFields.errorTraces as Array<unknown>) || [];

    // Add new error trace occurrence
    const newTrace = {
      service: serviceName,
      severity: errorTrace.severity,
      timestamp: errorTrace.timestamp.toISOString(),
      environment: errorTrace.environment,
      release: errorTrace.release,
      tags: errorTrace.tags,
      context: errorTrace.context,
      stackTrace: errorTrace.stackTrace,
    };

    existingErrorTraces.push(newTrace);

    // Update customFields with all error traces
    const updatedCustomFields = {
      ...customFields,
      errorTraces: existingErrorTraces,
      // Keep latest error trace for quick access
      errorTrace: {
        service: serviceName,
        severity: errorTrace.severity,
        timestamp: errorTrace.timestamp.toISOString(),
        environment: errorTrace.environment,
        release: errorTrace.release,
        tags: errorTrace.tags,
        context: errorTrace.context,
        fingerprint: errorTrace.fingerprint,
        stackTrace: errorTrace.stackTrace,
        occurrenceCount: existingErrorTraces.length,
      },
    };

    await issueRepository.update(issueId, {
      customFields: updatedCustomFields,
    });
  } catch (error) {
    logger.error("Failed to update issue with error trace", error instanceof Error ? error : undefined, {
      issueId,
      service: serviceName,
    });
  }
}

/**
 * Handle webhook errors gracefully
 * T246: Handle webhook errors gracefully
 */
export function handleErrorWebhookError(
  error: unknown,
  context: {
    serviceType: string;
    projectId?: string;
    errorMessage?: string;
  },
): void {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error("Error webhook processing failed", error instanceof Error ? error : undefined, {
    serviceType: context.serviceType,
    projectId: context.projectId,
    errorMessage: context.errorMessage,
    processingError: errorMessage,
    stack: errorStack,
  });
}


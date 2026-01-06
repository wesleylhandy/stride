import { logger } from "../logger";
import { prisma } from "@stride/database";

/**
 * Handle webhook processing errors gracefully
 * @param error - Error object
 * @param context - Additional context information
 */
export function handleWebhookError(
  error: unknown,
  context: {
    serviceType: string;
    eventType: string;
    projectId?: string;
    repositoryUrl?: string;
  },
): void {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error("Webhook processing error", {
    serviceType: context.serviceType,
    eventType: context.eventType,
    projectId: context.projectId,
    repositoryUrl: context.repositoryUrl,
    error: errorMessage,
    stack: errorStack,
  });

  // Update webhook last received timestamp even on error
  // This helps track webhook activity
  if (context.projectId) {
    prisma.webhook
      .updateMany({
        where: {
          projectId: context.projectId,
        },
        data: {
          lastReceivedAt: new Date(),
        },
      })
      .catch((updateError) => {
        logger.error("Failed to update webhook timestamp", {
          error: updateError,
          projectId: context.projectId,
        });
      });
  }
}

/**
 * Log successful webhook processing
 */
export function logWebhookSuccess(context: {
  serviceType: string;
  eventType: string;
  projectId: string;
  repositoryUrl?: string;
  issueKey?: string;
}): void {
  logger.info("Webhook processed successfully", {
    serviceType: context.serviceType,
    eventType: context.eventType,
    projectId: context.projectId,
    repositoryUrl: context.repositoryUrl,
    issueKey: context.issueKey,
  });
}


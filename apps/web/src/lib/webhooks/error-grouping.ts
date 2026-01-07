/**
 * Error grouping logic for similar errors
 * T251: Group similar errors
 */

import { issueRepository } from "@stride/database";
import type { ErrorTrace } from "./error-parsers";
import { logger } from "../logger";

/**
 * Group similar errors by fingerprint or message similarity
 * Returns existing issue if similar error found, null otherwise
 */
export async function groupSimilarErrors(
  projectId: string,
  errorTrace: ErrorTrace,
  serviceName: "Sentry" | "Datadog" | "New Relic",
): Promise<{ id: string; key: string } | null> {
  try {
    // First, try to find by fingerprint if available
    if (errorTrace.fingerprint) {
      const issues = await issueRepository.findMany({
        projectId,
        type: "Bug",
      });

      for (const issue of issues) {
        const customFields = (issue.customFields as Record<string, unknown>) || {};
        const errorTraceData = customFields.errorTrace as
          | Record<string, unknown>
          | undefined;

        if (errorTraceData?.fingerprint === errorTrace.fingerprint) {
          logger.info("Found existing issue by fingerprint", {
            projectId,
            issueId: issue.id,
            issueKey: issue.key,
            fingerprint: errorTrace.fingerprint,
          });
          return { id: issue.id, key: issue.key };
        }
      }
    }

    // If no fingerprint match, try to find by message similarity
    // Group errors with similar messages (same first 100 chars)
    const messagePrefix = errorTrace.message.substring(0, 100).toLowerCase();

    const issues = await issueRepository.findMany({
      projectId,
      type: "Bug",
    });

    for (const issue of issues) {
      // Check if issue title starts with similar message
      const issueTitlePrefix = issue.title.substring(0, 100).toLowerCase();

      // Simple similarity check: if first 50 chars match, consider it similar
      if (
        messagePrefix.substring(0, 50) === issueTitlePrefix.substring(0, 50) &&
        issueTitlePrefix.length > 20 // Avoid matching very short titles
      ) {
        // Verify it's from the same service
        const customFields = (issue.customFields as Record<string, unknown>) || {};
        const errorTraceData = customFields.errorTrace as
          | Record<string, unknown>
          | undefined;

        if (errorTraceData?.service === serviceName) {
          logger.info("Found existing issue by message similarity", {
            projectId,
            issueId: issue.id,
            issueKey: issue.key,
            messagePrefix: messagePrefix.substring(0, 50),
          });
          return { id: issue.id, key: issue.key };
        }
      }
    }

    return null;
  } catch (error) {
    logger.error("Failed to group similar errors", error instanceof Error ? error : undefined, {
      projectId,
      service: serviceName,
    });
    return null;
  }
}



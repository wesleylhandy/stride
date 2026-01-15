/**
 * Documentation reference tracking for analytics
 * Tracks which documentation sections are used in assistant responses
 */

import type { ParsedResponseMetadata } from "./response-parser";

/**
 * Log documentation usage for analytics
 * This can be extended to send to analytics service (e.g., PostHog, Mixpanel)
 * 
 * @param sessionId - Assistant session ID
 * @param projectId - Project ID (if applicable)
 * @param metadata - Parsed response metadata containing documentation usage
 */
export function trackDocumentationUsage(
  sessionId: string,
  projectId: string | null,
  metadata: ParsedResponseMetadata
): void {
  // Track which documentation was used in prompt context
  if (metadata.documentationUsed && metadata.documentationUsed.length > 0) {
    const usageData = {
      sessionId,
      projectId,
      timestamp: new Date().toISOString(),
      docsUsed: metadata.documentationUsed.map((doc) => ({
        file: doc.file,
        section: doc.section || null,
        description: doc.description,
      })),
      docsReferenced: metadata.documentationLinks?.length || 0,
    };

    // Log for development/debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[Doc Analytics] Documentation usage:", usageData);
    }

    // TODO: Send to analytics service in production
    // Example:
    // if (process.env.ANALYTICS_ENABLED === "true") {
    //   analyticsService.track("documentation_used", {
    //     session_id: sessionId,
    //     project_id: projectId,
    //     docs_count: metadata.documentationUsed.length,
    //     docs: metadata.documentationUsed.map(d => d.file),
    //   });
    // }
  }

  // Track which documentation links were included in response
  if (metadata.documentationLinks && metadata.documentationLinks.length > 0) {
    const referenceData = {
      sessionId,
      projectId,
      timestamp: new Date().toISOString(),
      linksCount: metadata.documentationLinks.length,
      links: metadata.documentationLinks.map((link) => ({
        title: link.title,
        url: link.url,
        file: link.file || null,
        section: link.section || null,
      })),
    };

    // Log for development/debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[Doc Analytics] Documentation links in response:", referenceData);
    }

    // TODO: Send to analytics service in production
  }
}

/**
 * Aggregate documentation usage statistics from message metadata
 * This can be used to generate analytics reports
 * 
 * @param messages - Array of assistant messages with metadata
 * @returns Aggregated statistics
 */
export function aggregateDocumentationStats(
  messages: Array<{ metadata: unknown }>
): {
  totalMessages: number;
  messagesWithDocs: number;
  totalDocsUsed: number;
  mostReferencedDocs: Array<{ file: string; count: number }>;
} {
  const docUsageMap = new Map<string, number>();
  let messagesWithDocs = 0;
  let totalDocsUsed = 0;

  for (const message of messages) {
    const metadata = message.metadata as ParsedResponseMetadata | null;
    if (!metadata) continue;

    if (metadata.documentationUsed && metadata.documentationUsed.length > 0) {
      messagesWithDocs++;
      totalDocsUsed += metadata.documentationUsed.length;

      for (const doc of metadata.documentationUsed) {
        const key = doc.file;
        docUsageMap.set(key, (docUsageMap.get(key) || 0) + 1);
      }
    }
  }

  // Get top referenced docs
  const mostReferencedDocs = Array.from(docUsageMap.entries())
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalMessages: messages.length,
    messagesWithDocs,
    totalDocsUsed,
    mostReferencedDocs,
  };
}

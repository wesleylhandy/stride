/**
 * Duplicate issue matcher for manual sync operations
 * 
 * Implements multi-tier matching strategy:
 * 1. External identifier match (most reliable)
 * 2. Title + repository URL match (fallback)
 * 
 * Prevents duplicate issue creation during manual sync.
 */

import { issueRepository, type Issue } from "@stride/database";
import type {
  ExternalId,
  DuplicateMatch,
  SyncedIssueCustomFields,
} from "./types";

/**
 * DuplicateMatcher class for finding existing issues that match external issues
 */
export class DuplicateMatcher {
  /**
   * Find duplicate issue for a given external issue
   * 
   * Matching priority:
   * 1. External identifier match (exact match on customFields.externalId)
   * 2. Title + repository URL match (fallback for legacy issues)
   * 
   * @param projectId - Project ID to search within
   * @param externalId - External identifier in format "{provider}:{repoUrl}:{issueId}"
   * @param title - Issue title (for fallback matching)
   * @param repositoryUrl - Repository URL (for fallback matching)
   * @returns Duplicate match result
   */
  async findDuplicate(
    projectId: string,
    externalId: ExternalId,
    title: string,
    repositoryUrl: string,
  ): Promise<DuplicateMatch> {
    // Priority 1: Match on external identifier
    const externalIdMatch = await this.matchByExternalId(projectId, externalId);
    if (externalIdMatch.matched) {
      return externalIdMatch;
    }

    // Priority 2: Match on title + repository URL (fallback)
    const titleMatch = await this.matchByTitleAndRepository(
      projectId,
      title,
      repositoryUrl,
    );
    if (titleMatch.matched) {
      return titleMatch;
    }

    // No match found
    return { matched: false };
  }

  /**
   * Match issue by external identifier
   * 
   * Searches for issues with matching customFields.externalId.
   * Uses Prisma JSONB query to search within customFields.
   * 
   * @param projectId - Project ID to search within
   * @param externalId - External identifier to match
   * @returns Duplicate match result
   */
  async matchByExternalId(
    projectId: string,
    externalId: ExternalId,
  ): Promise<DuplicateMatch> {
    // Query issues in the project
    const issues = await issueRepository.findMany({ projectId });

    // Check each issue's customFields for externalId match
    for (const issue of issues) {
      const customFields = issue.customFields as
        | SyncedIssueCustomFields
        | null
        | undefined;

      if (customFields?.externalId === externalId) {
        return {
          matched: true,
          issueId: issue.id,
          matchType: "externalId",
        };
      }
    }

    return { matched: false };
  }

  /**
   * Match issue by title and repository URL
   * 
   * Searches for issues with matching title and repository URL in customFields.
   * This is a fallback for legacy issues that don't have externalId stored.
   * 
   * @param projectId - Project ID to search within
   * @param title - Issue title to match
   * @param repositoryUrl - Repository URL to match
   * @returns Duplicate match result
   */
  private async matchByTitleAndRepository(
    projectId: string,
    title: string,
    repositoryUrl: string,
  ): Promise<DuplicateMatch> {
    // Query issues in the project
    const issues = await issueRepository.findMany({ projectId });

    // Normalize title for comparison (trim, lowercase)
    const normalizedTitle = title.trim().toLowerCase();
    const normalizedRepositoryUrl = repositoryUrl.trim().toLowerCase();

    // Check each issue for title + repository URL match
    for (const issue of issues) {
      // Check if title matches (case-insensitive, trimmed)
      const issueTitle = issue.title.trim().toLowerCase();
      if (issueTitle !== normalizedTitle) {
        continue;
      }

      // Check if repository URL matches in customFields
      const customFields = issue.customFields as
        | SyncedIssueCustomFields
        | null
        | undefined;

      if (customFields?.externalSync?.repositoryUrl) {
        const issueRepositoryUrl = customFields.externalSync.repositoryUrl
          .trim()
          .toLowerCase();

        if (issueRepositoryUrl === normalizedRepositoryUrl) {
          return {
            matched: true,
            issueId: issue.id,
            matchType: "titleAndRepository",
          };
        }
      }
    }

    return { matched: false };
  }

  /**
   * Check if external identifier is already in use
   * 
   * Validates that an external identifier is unique within a project.
   * Used before creating new issues or updating existing ones.
   * 
   * @param projectId - Project ID to check within
   * @param externalId - External identifier to check
   * @param excludeIssueId - Optional issue ID to exclude from check (for updates)
   * @returns True if external ID is already in use
   */
  async isExternalIdInUse(
    projectId: string,
    externalId: ExternalId,
    excludeIssueId?: string,
  ): Promise<boolean> {
    const issues = await issueRepository.findMany({ projectId });

    for (const issue of issues) {
      // Skip excluded issue (for update scenarios)
      if (excludeIssueId && issue.id === excludeIssueId) {
        continue;
      }

      const customFields = issue.customFields as
        | SyncedIssueCustomFields
        | null
        | undefined;

      if (customFields?.externalId === externalId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate external identifier from provider information
   * 
   * Format: "{provider}:{repositoryUrl}:{issueId}"
   * 
   * @param provider - Git provider type
   * @param repositoryUrl - Repository URL
   * @param issueId - Provider-specific issue ID
   * @returns External identifier string
   */
  static generateExternalId(
    provider: "GitHub" | "GitLab" | "Bitbucket",
    repositoryUrl: string,
    issueId: string | number,
  ): ExternalId {
    // Normalize provider name to lowercase for consistency
    const providerPrefix = provider.toLowerCase();
    return `${providerPrefix}:${repositoryUrl}:${issueId}`;
  }

  /**
   * Parse external identifier into components
   * 
   * @param externalId - External identifier string
   * @returns Parsed components or null if invalid format
   */
  static parseExternalId(
    externalId: ExternalId,
  ): { provider: string; repositoryUrl: string; issueId: string } | null {
    // Format: "{provider}:{repositoryUrl}:{issueId}"
    const parts = externalId.split(":");
    if (parts.length < 3) {
      return null;
    }

    const provider = parts[0];
    const issueId = parts[parts.length - 1];
    // Repository URL may contain colons (e.g., https://), so join middle parts
    const repositoryUrl = parts.slice(1, -1).join(":");

    if (!provider || !repositoryUrl || !issueId) {
      return null;
    }

    return {
      provider,
      repositoryUrl,
      issueId,
    };
  }
}

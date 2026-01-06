/**
 * Branch detection and issue linking utilities
 */

import { issueRepository } from "@stride/database";
import { logger } from "../logger";
import { updateIssueStatusOnBranchCreation } from "./status-updates";

/**
 * Extract issue key from branch name
 * Supports formats like:
 * - feature/APP-123-description
 * - APP-123
 * - fix/APP-456-bug
 * - APP-789
 * @param branchName - Git branch name
 * @returns Issue key (e.g., "APP-123") or null if not found
 */
export function extractIssueKeyFromBranch(
  branchName: string,
): string | null {
  // Pattern: PROJECT_KEY-NUMBER (e.g., APP-123, PROJ-456)
  // Matches at start of string or after / or -
  const issueKeyPattern = /\b([A-Z][A-Z0-9]*-[0-9]+)\b/i;

  const match = branchName.match(issueKeyPattern);
  if (match) {
    return match[1].toUpperCase(); // Normalize to uppercase
  }

  return null;
}

/**
 * Find issue by key in a project
 * @param projectId - Project ID
 * @param issueKey - Issue key (e.g., "APP-123")
 * @returns Issue or null if not found
 */
export async function findIssueByKey(
  projectId: string,
  issueKey: string,
): Promise<{ id: string; status: string; projectId: string } | null> {
  try {
    const issue = await issueRepository.findByKey(projectId, issueKey);
    if (!issue) {
      return null;
    }

    return {
      id: issue.id,
      status: issue.status,
      projectId: issue.projectId,
    };
  } catch (error) {
    logger.error("Failed to find issue by key", {
      projectId,
      issueKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Process branch creation and link to issue
 * @param projectId - Project ID
 * @param branchName - Branch name
 * @param commitSha - Latest commit SHA (optional)
 * @returns Issue ID if linked, null otherwise
 */
export async function processBranchCreation(
  projectId: string,
  branchName: string,
  commitSha?: string,
): Promise<string | null> {
  const issueKey = extractIssueKeyFromBranch(branchName);

  if (!issueKey) {
    logger.debug("No issue key found in branch name", {
      projectId,
      branchName,
    });
    return null;
  }

  const issue = await findIssueByKey(projectId, issueKey);

  if (!issue) {
    logger.debug("Issue not found for branch", {
      projectId,
      branchName,
      issueKey,
    });
    return null;
  }

  // Update issue status to "In Progress" if applicable
  await updateIssueStatusOnBranchCreation(projectId, issue.id, issue.status);

  return issue.id;
}

/**
 * Handle multiple branches per issue
 * @param issueId - Issue ID
 * @param branchName - Branch name
 * @returns true if branch was added, false if already exists
 */
export async function addBranchToIssue(
  issueId: string,
  branchName: string,
  commitSha?: string,
): Promise<boolean> {
  const { issueBranchRepository } = await import("@stride/database");
  
  try {
    await issueBranchRepository.createOrUpdate(issueId, branchName, {
      lastCommitSha: commitSha,
    });
    return true;
  } catch (error) {
    logger.error("Failed to add branch to issue", {
      issueId,
      branchName,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}


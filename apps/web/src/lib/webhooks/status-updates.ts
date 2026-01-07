/**
 * Status update logic for webhook-triggered issue updates
 */

import { issueRepository } from "@stride/database";
import { projectRepository } from "@stride/database";
import { logger } from "../logger";
import type { ProjectConfig } from "@stride/yaml-config";

/**
 * Find "In Progress" status in project configuration
 */
function findInProgressStatus(config: ProjectConfig): string | null {
  const inProgressStatus = config.workflow.statuses.find(
    (status) => status.type === "in_progress",
  );

  return inProgressStatus?.key || null;
}

/**
 * Find completion status in project configuration
 */
function findCompletionStatus(config: ProjectConfig): string | null {
  const completionStatus = config.workflow.statuses.find(
    (status) => status.type === "closed",
  );

  return completionStatus?.key || null;
}

/**
 * Update issue status when branch is created
 * Moves issue to "In Progress" status if it's currently in an "open" status
 */
export async function updateIssueStatusOnBranchCreation(
  projectId: string,
  issueId: string,
  currentStatus: string,
): Promise<void> {
  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      logger.error("Project not found for status update", undefined, { projectId });
      return;
    }

    const config = project.config as unknown as ProjectConfig;

    // Find current status config
    const currentStatusConfig = config.workflow.statuses.find(
      (s) => s.key === currentStatus,
    );

    // Only update if current status is "open" type
    if (currentStatusConfig?.type !== "open") {
      logger.debug("Issue not in open status, skipping branch creation update", {
        issueId,
        currentStatus,
      });
      return;
    }

    // Find "In Progress" status
    const inProgressStatus = findInProgressStatus(config);
    if (!inProgressStatus) {
      logger.warn("No in_progress status found in config", { projectId });
      return;
    }

    // Update issue status
    await issueRepository.update(issueId, {
      status: inProgressStatus,
    });

    logger.info("Issue status updated on branch creation", {
      issueId,
      oldStatus: currentStatus,
      newStatus: inProgressStatus,
    });
  } catch (error) {
    logger.error("Failed to update issue status on branch creation", error instanceof Error ? error : undefined, {
      issueId,
    });
  }
}

/**
 * Update issue status when PR is merged
 * Moves issue to completion status
 */
export async function updateIssueStatusOnPRMerge(
  projectId: string,
  issueId: string,
  currentStatus: string,
): Promise<void> {
  try {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      logger.error("Project not found for status update", undefined, { projectId });
      return;
    }

    const config = project.config as unknown as ProjectConfig;

    // Find completion status
    const completionStatus = findCompletionStatus(config);
    if (!completionStatus) {
      logger.warn("No closed status found in config", { projectId });
      return;
    }

    // Update issue status
    await issueRepository.update(issueId, {
      status: completionStatus,
    });

    logger.info("Issue status updated on PR merge", {
      issueId,
      oldStatus: currentStatus,
      newStatus: completionStatus,
    });
  } catch (error) {
    logger.error("Failed to update issue status on PR merge", error instanceof Error ? error : undefined, {
      issueId,
    });
  }
}


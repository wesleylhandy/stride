/**
 * Pull request webhook payload parsing and processing
 */

import type {
  GitHubPullRequestPayload,
  GitLabMergeRequestPayload,
  BitbucketPullRequestPayload,
} from "./parsers";
import { extractIssueKeyFromBranch, findIssueByKey } from "./branch-detection";
import { updateIssueStatusOnPRMerge } from "./status-updates";
import { logger } from "../logger";

export interface ParsedPRData {
  issueKey: string | null;
  branchName: string;
  prNumber: number;
  prUrl: string;
  prStatus: "open" | "merged" | "closed";
  commitSha?: string;
}

/**
 * Parse GitHub PR webhook and extract relevant data
 */
export function parseGitHubPR(
  payload: GitHubPullRequestPayload,
): ParsedPRData | null {
  if (payload.action !== "opened" && payload.action !== "closed") {
    return null;
  }

  const pr = payload.pull_request;
  const branchName = pr.head.ref;
  const issueKey = extractIssueKeyFromBranch(branchName);

  let prStatus: "open" | "merged" | "closed" = "open";
  if (pr.merged) {
    prStatus = "merged";
  } else if (pr.state === "closed") {
    prStatus = "closed";
  }

  return {
    issueKey,
    branchName,
    prNumber: pr.number,
    prUrl: pr.html_url,
    prStatus,
    commitSha: pr.head.sha,
  };
}

/**
 * Parse GitLab merge request webhook and extract relevant data
 */
export function parseGitLabMR(
  payload: GitLabMergeRequestPayload,
): ParsedPRData | null {
  const mr = payload.object_attributes;
  const branchName = mr.source_branch;
  const issueKey = extractIssueKeyFromBranch(branchName);

  let prStatus: "open" | "merged" | "closed" = "open";
  if (mr.merged) {
    prStatus = "merged";
  } else if (mr.state === "closed") {
    prStatus = "closed";
  }

  return {
    issueKey,
    branchName,
    prNumber: mr.iid,
    prUrl: mr.url,
    prStatus,
    commitSha: mr.last_commit.id,
  };
}

/**
 * Parse Bitbucket PR webhook and extract relevant data
 */
export function parseBitbucketPR(
  payload: BitbucketPullRequestPayload,
): ParsedPRData | null {
  const pr = payload.pullrequest;
  const branchName = pr.source.branch.name;
  const issueKey = extractIssueKeyFromBranch(branchName);

  let prStatus: "open" | "merged" | "closed" = "open";
  if (pr.state === "MERGED") {
    prStatus = "merged";
  } else if (pr.state === "DECLINED" || pr.state === "SUPERSEDED") {
    prStatus = "closed";
  }

  return {
    issueKey,
    branchName,
    prNumber: pr.id,
    prUrl: pr.links.html.href,
    prStatus,
    commitSha: pr.source.commit.hash,
  };
}

/**
 * Process PR webhook and update issue
 */
export async function processPRWebhook(
  projectId: string,
  prData: ParsedPRData,
): Promise<string | null> {
  if (!prData.issueKey) {
    logger.debug("No issue key found in PR branch", {
      projectId,
      branchName: prData.branchName,
    });
    return null;
  }

  const issue = await findIssueByKey(projectId, prData.issueKey);

  if (!issue) {
    logger.debug("Issue not found for PR", {
      projectId,
      issueKey: prData.issueKey,
    });
    return null;
  }

  // Update issue status if PR is merged
  if (prData.prStatus === "merged") {
    await updateIssueStatusOnPRMerge(projectId, issue.id, issue.status);
  }

  return issue.id;
}


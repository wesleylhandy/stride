import { prisma } from "../connection";
import type { IssueBranch, PullRequestStatus } from "@prisma/client";

export interface CreateIssueBranchInput {
  issueId: string;
  branchName: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  pullRequestStatus?: PullRequestStatus;
  lastCommitSha?: string;
}

export interface UpdateIssueBranchInput {
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  pullRequestStatus?: PullRequestStatus;
  lastCommitSha?: string;
}

/**
 * Issue branch repository for managing branch and PR links to issues
 */
export class IssueBranchRepository {
  /**
   * Find branch by ID
   */
  async findById(id: string): Promise<IssueBranch | null> {
    return prisma.issueBranch.findUnique({
      where: { id },
      include: {
        issue: true,
      },
    });
  }

  /**
   * Find branches by issue ID
   */
  async findByIssueId(issueId: string): Promise<IssueBranch[]> {
    return prisma.issueBranch.findMany({
      where: { issueId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find branch by branch name
   */
  async findByBranchName(branchName: string): Promise<IssueBranch | null> {
    return prisma.issueBranch.findFirst({
      where: { branchName },
      include: {
        issue: true,
      },
    });
  }

  /**
   * Find branch by PR URL
   */
  async findByPRUrl(pullRequestUrl: string): Promise<IssueBranch | null> {
    return prisma.issueBranch.findUnique({
      where: { pullRequestUrl },
      include: {
        issue: true,
      },
    });
  }

  /**
   * Create or update branch link
   * If branch already exists for issue, update it; otherwise create new
   */
  async createOrUpdate(
    issueId: string,
    branchName: string,
    data: Partial<CreateIssueBranchInput> = {},
  ): Promise<IssueBranch> {
    // Check if branch already exists for this issue
    const existing = await prisma.issueBranch.findFirst({
      where: {
        issueId,
        branchName,
      },
    });

    if (existing) {
      // Update existing branch
      return prisma.issueBranch.update({
        where: { id: existing.id },
        data: {
          pullRequestUrl: data.pullRequestUrl ?? existing.pullRequestUrl,
          pullRequestNumber:
            data.pullRequestNumber ?? existing.pullRequestNumber,
          pullRequestStatus:
            data.pullRequestStatus ?? existing.pullRequestStatus,
          lastCommitSha: data.lastCommitSha ?? existing.lastCommitSha,
        },
      });
    }

    // Create new branch link
    return prisma.issueBranch.create({
      data: {
        issueId,
        branchName,
        pullRequestUrl: data.pullRequestUrl,
        pullRequestNumber: data.pullRequestNumber,
        pullRequestStatus: data.pullRequestStatus,
        lastCommitSha: data.lastCommitSha,
      },
    });
  }

  /**
   * Create new branch link
   */
  async create(data: CreateIssueBranchInput): Promise<IssueBranch> {
    return prisma.issueBranch.create({
      data,
    });
  }

  /**
   * Update branch link
   */
  async update(
    id: string,
    data: UpdateIssueBranchInput,
  ): Promise<IssueBranch> {
    return prisma.issueBranch.update({
      where: { id },
      data,
    });
  }

  /**
   * Update branch by PR URL (for PR webhooks)
   */
  async updateByPRUrl(
    pullRequestUrl: string,
    data: UpdateIssueBranchInput,
  ): Promise<IssueBranch | null> {
    const existing = await prisma.issueBranch.findUnique({
      where: { pullRequestUrl },
    });

    if (!existing) {
      return null;
    }

    return prisma.issueBranch.update({
      where: { id: existing.id },
      data,
    });
  }

  /**
   * Delete branch link
   */
  async delete(id: string): Promise<void> {
    await prisma.issueBranch.delete({
      where: { id },
    });
  }

  /**
   * Count branches for an issue
   */
  async countByIssueId(issueId: string): Promise<number> {
    return prisma.issueBranch.count({
      where: { issueId },
    });
  }
}

// Export singleton instance
export const issueBranchRepository = new IssueBranchRepository();


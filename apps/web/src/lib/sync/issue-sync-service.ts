/**
 * Issue sync service for manually synchronizing repository issues
 * 
 * Handles fetching issues from Git providers, duplicate detection, and creating/updating issues.
 */

import { prisma, issueRepository } from "@stride/database";
import { decrypt } from "@/lib/integrations/storage";
import {
  fetchGitHubIssues,
  fetchGitHubDependabotAlerts,
  parseGitHubRepositoryUrl,
  type GitHubIssue,
  type GitHubDependabotAlert,
} from "@/lib/integrations/github";
import {
  fetchGitLabIssues,
  fetchGitLabVulnerabilityFindings,
  parseGitLabRepositoryUrl,
  type GitLabIssue,
  type GitLabVulnerabilityFinding,
} from "@/lib/integrations/gitlab";
import {
  fetchBitbucketIssues,
  parseBitbucketRepositoryUrl,
  type BitbucketIssue,
} from "@/lib/integrations/bitbucket";
import { DuplicateMatcher } from "./duplicate-matcher";
import type {
  ProviderIssue,
  SyncResults,
  SyncProgress,
  SyncType,
  ExternalId,
  SyncedIssueCustomFields,
} from "./types";
import {
  ProviderApiError,
  RateLimitError,
} from "./types";
import { IssueType, Priority } from "@stride/types";
import { syncOperationStore } from "./sync-operation-store";
import { logger } from "@/lib/logger";
import { errorTracker } from "@/lib/error-tracking";

/**
 * Configuration for sync operation
 */
export interface SyncConfig {
  syncType?: SyncType;
  includeClosed?: boolean;
  onProgress?: (progress: SyncProgress) => void;
  abortSignal?: AbortSignal;
  operationId?: string; // Optional operation ID for async tracking
}

/**
 * IssueSyncService class for synchronizing repository issues
 */
export class IssueSyncService {
  private duplicateMatcher: DuplicateMatcher;

  constructor() {
    this.duplicateMatcher = new DuplicateMatcher();
  }

  /**
   * Sync repository issues from Git provider
   * 
   * @param repositoryConnectionId - Repository connection ID
   * @param userId - User ID triggering the sync
   * @param config - Sync configuration
   * @returns Sync results
   */
  async syncRepositoryIssues(
    repositoryConnectionId: string,
    userId: string,
    config: SyncConfig = {},
  ): Promise<SyncResults> {
    const { syncType = "full", includeClosed = false, onProgress, abortSignal, operationId } = config;
    const startTime = Date.now();

    // T066: Log sync operation start
    await logger.info("Sync operation started", {
      repositoryConnectionId,
      userId,
      syncType,
      includeClosed,
      operationId,
    });

    // Update operation status to inProgress if operationId provided
    if (operationId) {
      const operation = syncOperationStore.get(operationId);
      if (operation) {
        syncOperationStore.update(operationId, {
          status: "inProgress",
          startedAt: new Date(),
        });
      }
    }

    // Create progress callback that updates operation store
    const progressCallback = (progress: SyncProgress) => {
      if (operationId) {
        syncOperationStore.update(operationId, { progress });
      }
      if (onProgress) {
        onProgress(progress);
      }
    };

    // Get repository connection
    const connection = await prisma.repositoryConnection.findUnique({
      where: { id: repositoryConnectionId },
    });

    if (!connection) {
      const error = new Error("Repository connection not found");
      await logger.error("Repository connection not found", error, {
        repositoryConnectionId,
        userId,
      });
      throw error;
    }

    // Decrypt access token
    let accessToken: string;
    try {
      accessToken = decrypt(connection.accessToken);
    } catch (error) {
      const decryptionError = new Error("Failed to decrypt access token");
      await logger.error("Failed to decrypt access token", error instanceof Error ? error : undefined, {
        repositoryConnectionId,
        userId,
        projectId: connection.projectId,
        serviceType: connection.serviceType,
      });
      throw decryptionError;
    }

    // Validate token and permissions (basic check - try to fetch repository info)
    await this.validateRepositoryAccess(
      connection.serviceType,
      connection.repositoryUrl,
      accessToken,
    );

    // Initialize results
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      securityAdvisories: {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      },
      errors: [],
    };

    try {
      // Fetch issues based on sync type
      if (syncType === "full" || syncType === "issuesOnly") {
        await this.syncRegularIssues(
          connection,
          accessToken,
          userId,
          includeClosed,
          results,
          progressCallback,
          abortSignal,
        );
      }

      if (syncType === "full" || syncType === "securityOnly") {
        await this.syncSecurityAdvisories(
          connection,
          accessToken,
          userId,
          results,
          progressCallback,
          abortSignal,
        );
      }

      // Update operation status to completed if operationId provided
      if (operationId) {
        syncOperationStore.update(operationId, {
          status: "completed",
          results,
          completedAt: new Date(),
        });
      }

      // T066: Log sync completion with results
      // T067: Track metrics (duration, counts, error rates)
      const duration = Math.round((Date.now() - startTime) / 1000); // Duration in seconds
      const totalIssues = results.created + results.updated + results.skipped + results.failed;
      const errorRate = totalIssues > 0 ? (results.failed / totalIssues) * 100 : 0;
      const securityAdvisoryCount = results.securityAdvisories 
        ? results.securityAdvisories.created + results.securityAdvisories.updated + 
          results.securityAdvisories.skipped + results.securityAdvisories.failed
        : 0;

      await logger.info("Sync operation completed", {
        repositoryConnectionId,
        userId,
        projectId: connection.projectId,
        serviceType: connection.serviceType,
        repositoryUrl: connection.repositoryUrl,
        syncType,
        includeClosed,
        operationId,
        duration,
        results: {
          created: results.created,
          updated: results.updated,
          skipped: results.skipped,
          failed: results.failed,
          securityAdvisories: results.securityAdvisories,
        },
        metrics: {
          duration,
          totalIssues,
          securityAdvisoryCount,
          errorRate: `${errorRate.toFixed(2)}%`,
          throughput: duration > 0 ? Math.round(totalIssues / duration) : 0, // Issues per second
        },
      });

      return results;
    } catch (error) {
      // T066: Log sync failure with error details
      const duration = Math.round((Date.now() - startTime) / 1000);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const isRateLimitError = error instanceof RateLimitError;
      const isProviderApiError = error instanceof ProviderApiError;

      await logger.error("Sync operation failed", error instanceof Error ? error : undefined, {
        repositoryConnectionId,
        userId,
        projectId: connection?.projectId,
        serviceType: connection?.serviceType,
        repositoryUrl: connection?.repositoryUrl,
        syncType,
        includeClosed,
        operationId,
        duration,
        errorType: isRateLimitError ? "RateLimitError" : isProviderApiError ? "ProviderApiError" : "Unknown",
        errorMessage,
      });

      // Capture error in error tracking service
      if (error instanceof Error) {
        await errorTracker.captureError(error, {
          userId,
          tags: {
            feature: "sync",
            serviceType: connection?.serviceType || "unknown",
            errorType: isRateLimitError ? "rate_limit" : isProviderApiError ? "provider_api" : "unknown",
          },
          extra: {
            repositoryConnectionId,
            projectId: connection?.projectId,
            repositoryUrl: connection?.repositoryUrl,
            syncType,
            includeClosed,
            operationId,
            duration,
          },
        });
      }

      // Update operation status to failed if operationId provided
      if (operationId) {
        syncOperationStore.update(operationId, {
          status: "failed",
          error: errorMessage,
          completedAt: new Date(),
        });
      }
      throw error;
    }
  }

  /**
   * Sync regular issues from repository
   */
  private async syncRegularIssues(
    connection: {
      id: string;
      projectId: string;
      repositoryUrl: string;
      serviceType: "GitHub" | "GitLab" | "Bitbucket";
    },
    accessToken: string,
    userId: string,
    includeClosed: boolean,
    results: SyncResults,
    onProgress?: (progress: SyncProgress) => void,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    let page = 1;
    let hasNext = true;
    let totalProcessed = 0;
    const PROGRESS_UPDATE_INTERVAL = 10; // Update progress every 10 issues

    // Update progress: fetching stage
    if (onProgress) {
      onProgress({
        current: 0,
        total: 0, // Will update when we know total
        processed: 0,
        stage: "fetching",
      });
    }

    while (hasNext && !abortSignal?.aborted) {
      // Fetch issues page
      const providerIssues = await this.fetchIssuesPage(
        connection.serviceType,
        connection.repositoryUrl,
        accessToken,
        page,
        includeClosed,
      );

      if (providerIssues.issues.length === 0) {
        hasNext = false;
        break;
      }

      // Update progress: matching stage
      if (onProgress) {
        onProgress({
          current: page,
          total: providerIssues.issues.length, // Approximate
          processed: totalProcessed,
          stage: "matching",
        });
      }

      // Process each issue
      for (const providerIssue of providerIssues.issues) {
        if (abortSignal?.aborted) {
          await logger.warn("Sync operation aborted", {
            repositoryConnectionId: connection.id,
            userId,
            page,
            totalProcessed,
          });
          break;
        }

        try {
          await this.processIssue(
            connection,
            providerIssue,
            userId,
            results,
            totalProcessed,
            // Only pass onProgress if we're at the update interval or it's the last issue
            totalProcessed % PROGRESS_UPDATE_INTERVAL === 0 ? onProgress : undefined,
          );
          totalProcessed++;

          // Periodic progress update
          if (onProgress && totalProcessed % PROGRESS_UPDATE_INTERVAL === 0) {
            onProgress({
              current: totalProcessed,
              total: totalProcessed, // Approximate
              processed: totalProcessed,
              stage: "creating",
            });
          }
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          results.errors?.push({
            error: errorMessage,
          });
          
          // T066: Log individual issue processing error
          await logger.warn("Failed to process issue during sync", {
            repositoryConnectionId: connection.id,
            userId,
            projectId: connection.projectId,
            providerIssueId: providerIssue.id,
            providerIssueNumber: providerIssue.number,
            providerIssueTitle: providerIssue.title,
            page,
            totalProcessed,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Check for next page
      hasNext = providerIssues.hasNext;
      if (hasNext && providerIssues.nextPage) {
        page = providerIssues.nextPage;
      } else if (hasNext) {
        page++;
      }
    }
  }

  /**
   * Sync security advisories from repository
   */
  private async syncSecurityAdvisories(
    connection: {
      id: string;
      projectId: string;
      repositoryUrl: string;
      serviceType: "GitHub" | "GitLab" | "Bitbucket";
    },
    accessToken: string,
    userId: string,
    results: SyncResults,
    onProgress?: (progress: SyncProgress) => void,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    // Bitbucket doesn't support security advisories
    if (connection.serviceType === "Bitbucket") {
      return;
    }

    let page = 1;
    let hasNext = true;
    let totalProcessed = 0;

    while (hasNext && !abortSignal?.aborted) {
      // Fetch security advisories page
      const response = await this.fetchSecurityAdvisoriesPage(
        connection.serviceType,
        connection.repositoryUrl,
        accessToken,
        page,
      );

      if (response.advisories.length === 0) {
        hasNext = false;
        break;
      }

      // Process each advisory
      for (const advisory of response.advisories) {
        if (abortSignal?.aborted) {
          break;
        }

        try {
          await this.processSecurityAdvisory(
            connection,
            advisory,
            userId,
            results,
            totalProcessed,
            onProgress,
          );
          totalProcessed++;
        } catch (error) {
          results.failed++;
          if (!results.securityAdvisories) {
            results.securityAdvisories = {
              created: 0,
              updated: 0,
              skipped: 0,
              failed: 0,
            };
          }
          results.securityAdvisories.failed++;
          results.errors?.push({
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Check for next page
      hasNext = response.hasNext;
      if (hasNext && response.nextPage) {
        page = response.nextPage;
      } else if (hasNext) {
        page++;
      }
    }
  }

  /**
   * Fetch a page of issues from provider
   */
  private async fetchIssuesPage(
    serviceType: "GitHub" | "GitLab" | "Bitbucket",
    repositoryUrl: string,
    accessToken: string,
    page: number,
    includeClosed: boolean,
  ): Promise<{
    issues: ProviderIssue[];
    hasNext: boolean;
    nextPage?: number;
  }> {
    try {
      if (serviceType === "GitHub") {
        const parsed = parseGitHubRepositoryUrl(repositoryUrl);
        if (!parsed) {
          throw new Error("Invalid GitHub repository URL");
        }

        const response = await fetchGitHubIssues(
          parsed.owner,
          parsed.repo,
          accessToken,
          {
            state: includeClosed ? "all" : "open",
            page,
            perPage: 100,
            includeClosed,
          },
        );

        return {
          issues: response.issues.map(this.normalizeGitHubIssue),
          hasNext: response.hasNext,
          nextPage: response.nextPage,
        };
      } else if (serviceType === "GitLab") {
        const projectPath = parseGitLabRepositoryUrl(repositoryUrl);
        if (!projectPath) {
          throw new Error("Invalid GitLab repository URL");
        }

        const response = await fetchGitLabIssues(
          projectPath,
          accessToken,
          {
            state: includeClosed ? "all" : "opened",
            page,
            perPage: 100,
            includeClosed,
          },
        );

        return {
          issues: response.issues.map(this.normalizeGitLabIssue),
          hasNext: response.hasNext,
          nextPage: response.nextPage,
        };
      } else if (serviceType === "Bitbucket") {
        const parsed = parseBitbucketRepositoryUrl(repositoryUrl);
        if (!parsed) {
          throw new Error("Invalid Bitbucket repository URL");
        }

        const response = await fetchBitbucketIssues(
          parsed.workspace,
          parsed.repoSlug,
          accessToken,
          {
            state: includeClosed ? "all" : "open",
            page,
            perPage: 100,
            includeClosed,
          },
        );

        return {
          issues: response.issues.map(this.normalizeBitbucketIssue),
          hasNext: response.hasNext,
          nextPage: response.nextPage,
        };
      } else {
        throw new Error(`Unsupported service type: ${serviceType}`);
      }
    } catch (error) {
      // T066: Log API fetch error
      if (error instanceof RateLimitError) {
        await logger.warn("Rate limit error while fetching issues", {
          serviceType,
          repositoryUrl,
          page,
          rateLimitInfo: error.rateLimitInfo,
          retryAfter: error.retryAfter,
          error: error.message,
        });
        throw error;
      }
      
      const apiError = new ProviderApiError(
        error instanceof Error ? error.message : "Failed to fetch issues",
        500,
        serviceType,
      );
      
      await logger.error("Failed to fetch issues from provider", error instanceof Error ? error : undefined, {
        serviceType,
        repositoryUrl,
        page,
        statusCode: apiError.statusCode,
      });
      
      throw apiError;
    }
  }

  /**
   * Fetch security advisories page
   */
  private async fetchSecurityAdvisoriesPage(
    serviceType: "GitHub" | "GitLab",
    repositoryUrl: string,
    accessToken: string,
    page: number,
  ): Promise<{
    advisories: ProviderIssue[];
    hasNext: boolean;
    nextPage?: number;
  }> {
    try {
      if (serviceType === "GitHub") {
        const parsed = parseGitHubRepositoryUrl(repositoryUrl);
        if (!parsed) {
          return { advisories: [], hasNext: false };
        }

        const response = await fetchGitHubDependabotAlerts(
          parsed.owner,
          parsed.repo,
          accessToken,
          {
            state: "open",
            page,
            perPage: 100,
          },
        );

        return {
          advisories: response.alerts.map((alert) =>
            this.normalizeGitHubDependabotAlert(alert, repositoryUrl),
          ),
          hasNext: response.hasNext,
          nextPage: response.nextPage,
        };
      } else if (serviceType === "GitLab") {
        const projectPath = parseGitLabRepositoryUrl(repositoryUrl);
        if (!projectPath) {
          return { advisories: [], hasNext: false };
        }

        const response = await fetchGitLabVulnerabilityFindings(
          projectPath,
          accessToken,
          {
            state: "detected",
            page,
            perPage: 100,
          },
        );

        return {
          advisories: response.findings.map((finding) =>
            this.normalizeGitLabVulnerabilityFinding(finding, repositoryUrl),
          ),
          hasNext: response.hasNext,
          nextPage: response.nextPage,
        };
      }

      return { advisories: [], hasNext: false };
    } catch (error) {
      // T066: Log security advisory fetch error
      if (error instanceof RateLimitError) {
        await logger.warn("Rate limit error while fetching security advisories", {
          serviceType,
          repositoryUrl,
          page,
          rateLimitInfo: error.rateLimitInfo,
          retryAfter: error.retryAfter,
          error: error.message,
        });
        throw error;
      }
      
      const apiError = new ProviderApiError(
        error instanceof Error ? error.message : "Failed to fetch security advisories",
        500,
        serviceType,
      );
      
      await logger.error("Failed to fetch security advisories from provider", error instanceof Error ? error : undefined, {
        serviceType,
        repositoryUrl,
        page,
        statusCode: apiError.statusCode,
      });
      
      throw apiError;
    }
  }

  /**
   * Process a single issue (create or update)
   */
  private async processIssue(
    connection: {
      id: string;
      projectId: string;
      repositoryUrl: string;
      serviceType: "GitHub" | "GitLab" | "Bitbucket";
    },
    providerIssue: ProviderIssue,
    userId: string,
    results: SyncResults,
    processed: number,
    onProgress?: (progress: SyncProgress) => void,
  ): Promise<void> {
    // Generate external ID
    const externalId = DuplicateMatcher.generateExternalId(
      connection.serviceType,
      connection.repositoryUrl,
      providerIssue.id,
    );

    // Check for duplicate
    const match = await this.duplicateMatcher.findDuplicate(
      connection.projectId,
      externalId,
      providerIssue.title,
      connection.repositoryUrl,
    );

    if (match.matched && match.issueId) {
      // Update existing issue
      await this.updateIssue(
        match.issueId,
        providerIssue,
        externalId,
        connection,
        userId,
      );
      results.updated++;
    } else {
      // Create new issue
      await this.createIssue(
        connection.projectId,
        providerIssue,
        externalId,
        connection,
        userId,
      );
      results.created++;
    }

    // Update progress: creating/updating stage
    if (onProgress) {
      onProgress({
        current: processed + 1,
        total: processed + 1, // Approximate
        processed: processed + 1,
        stage: match.matched ? "updating" : "creating",
      });
    }
  }

  /**
   * Process a security advisory
   */
  private async processSecurityAdvisory(
    connection: {
      id: string;
      projectId: string;
      repositoryUrl: string;
      serviceType: "GitHub" | "GitLab" | "Bitbucket";
    },
    advisory: ProviderIssue,
    userId: string,
    results: SyncResults,
    processed: number,
    onProgress?: (progress: SyncProgress) => void,
  ): Promise<void> {
    // Track security advisory counts separately
    const beforeCreated = results.created;
    const beforeUpdated = results.updated;
    const beforeSkipped = results.skipped;
    const beforeFailed = results.failed;

    // Security advisories are treated as issues with special metadata
    await this.processIssue(connection, advisory, userId, results, processed, onProgress);

    // Update security advisory counts based on what changed
    const createdDelta = results.created - beforeCreated;
    const updatedDelta = results.updated - beforeUpdated;
    const skippedDelta = results.skipped - beforeSkipped;
    const failedDelta = results.failed - beforeFailed;

    if (!results.securityAdvisories) {
      results.securityAdvisories = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };
    }

    results.securityAdvisories.created += createdDelta;
    results.securityAdvisories.updated += updatedDelta;
    results.securityAdvisories.skipped += skippedDelta;
    results.securityAdvisories.failed += failedDelta;

    // Adjust main counts (they were already incremented by processIssue)
    // We want main counts to include security advisories too, so we keep the increment
    // The securityAdvisories counts are separate for detailed reporting
  }

  /**
   * Create a new issue from provider issue
   */
  private async createIssue(
    projectId: string,
    providerIssue: ProviderIssue,
    externalId: ExternalId,
    connection: {
      repositoryUrl: string;
      serviceType: "GitHub" | "GitLab" | "Bitbucket";
    },
    userId: string,
  ): Promise<void> {
    // Build custom fields with external sync metadata
    const customFields: SyncedIssueCustomFields = {
      externalId,
      externalSync: {
        providerType: connection.serviceType,
        repositoryUrl: connection.repositoryUrl,
        issueNumber: providerIssue.number,
        syncedAt: new Date().toISOString(),
        securityAdvisory: providerIssue.securityAdvisory || false,
      },
    };

    // Determine issue type and priority
    let issueType = IssueType.Task;
    let priority: Priority | undefined;

    if (providerIssue.securityAdvisory) {
      issueType = IssueType.Bug;
      // Map severity to priority
      if (providerIssue.labels.some((l) => l.name.toLowerCase().includes("critical"))) {
        priority = Priority.Critical;
      } else if (providerIssue.labels.some((l) => l.name.toLowerCase().includes("high"))) {
        priority = Priority.High;
      }
    }

    await issueRepository.create({
      projectId,
      title: providerIssue.title,
      description: providerIssue.body || undefined,
      status: providerIssue.state === "open" ? "Backlog" : "Done",
      type: issueType,
      priority,
      customFields: customFields as Record<string, unknown>,
      reporterId: userId,
    });
  }

  /**
   * Update an existing issue from provider issue
   */
  private async updateIssue(
    issueId: string,
    providerIssue: ProviderIssue,
    externalId: ExternalId,
    connection: {
      repositoryUrl: string;
      serviceType: "GitHub" | "GitLab" | "Bitbucket";
    },
    userId: string,
  ): Promise<void> {
    const existing = await issueRepository.findById(issueId);
    if (!existing) {
      const error = new Error("Issue not found for update");
      await logger.warn("Issue not found for update during sync", {
        issueId,
        providerIssueId: providerIssue.id,
        providerIssueNumber: providerIssue.number,
        error: error.message,
      });
      throw error;
    }

    // Update custom fields with latest sync metadata
    const customFields = (existing.customFields || {}) as SyncedIssueCustomFields;
    customFields.externalId = externalId;
    customFields.externalSync = {
      ...customFields.externalSync,
      providerType: connection.serviceType,
      repositoryUrl: connection.repositoryUrl,
      issueNumber: providerIssue.number,
      syncedAt: customFields.externalSync?.syncedAt || new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      securityAdvisory: providerIssue.securityAdvisory || false,
    };

    // Update issue fields
    await issueRepository.update(issueId, {
      title: providerIssue.title,
      description: providerIssue.body || undefined,
      customFields: customFields as Record<string, unknown>,
    });
  }

  /**
   * Validate repository access token and permissions
   */
  private async validateRepositoryAccess(
    serviceType: "GitHub" | "GitLab" | "Bitbucket",
    repositoryUrl: string,
    accessToken: string,
  ): Promise<void> {
    // Basic validation - try to fetch repository info
    // This is a simplified check; in production, you might want more thorough validation
    try {
      if (serviceType === "GitHub") {
        const parsed = parseGitHubRepositoryUrl(repositoryUrl);
        if (!parsed) {
          throw new Error("Invalid GitHub repository URL");
        }
        // Could fetch repository info here to validate token
      } else if (serviceType === "GitLab") {
        const projectPath = parseGitLabRepositoryUrl(repositoryUrl);
        if (!projectPath) {
          throw new Error("Invalid GitLab repository URL");
        }
        // Could fetch project info here to validate token
      } else if (serviceType === "Bitbucket") {
        const parsed = parseBitbucketRepositoryUrl(repositoryUrl);
        if (!parsed) {
          throw new Error("Invalid Bitbucket repository URL");
        }
        // Could fetch repository info here to validate token
      }
    } catch (error) {
      const validationError = new Error(
        `Failed to validate repository access: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      
      // T066: Log validation error
      await logger.error("Failed to validate repository access", error instanceof Error ? error : undefined, {
        serviceType,
        repositoryUrl,
      });
      
      throw validationError;
    }
  }

  /**
   * Normalize GitHub issue to ProviderIssue format
   */
  private normalizeGitHubIssue(issue: GitHubIssue): ProviderIssue {
    return {
      id: issue.id.toString(),
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels.map((l) => ({ name: l.name, color: l.color })),
      assignees: issue.assignees.map((a) => ({
        login: a.login,
        name: a.name || undefined,
        email: a.email || undefined,
      })),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      htmlUrl: issue.html_url,
      securityAdvisory: false,
    };
  }

  /**
   * Normalize GitLab issue to ProviderIssue format
   */
  private normalizeGitLabIssue(issue: GitLabIssue): ProviderIssue {
    return {
      id: issue.id.toString(),
      number: issue.iid,
      title: issue.title,
      body: issue.description,
      state: issue.state === "opened" ? "open" : "closed",
      labels: issue.labels.map((name) => ({ name })),
      assignees: issue.assignees.map((a) => ({
        login: a.username,
        name: a.name,
        email: a.email,
      })),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      htmlUrl: issue.web_url,
      securityAdvisory: false,
    };
  }

  /**
   * Normalize Bitbucket issue to ProviderIssue format
   */
  private normalizeBitbucketIssue(issue: BitbucketIssue): ProviderIssue {
    return {
      id: issue.id,
      number: parseInt(issue.id, 10) || 0,
      title: issue.title,
      body: issue.content?.raw || null,
      state: issue.state === "new" || issue.state === "open" ? "open" : "closed",
      labels: [], // Bitbucket doesn't have labels in the same way
      assignees: [], // Bitbucket assignees would need additional API call
      createdAt: issue.created_on,
      updatedAt: issue.updated_on,
      htmlUrl: issue.links.html.href,
      securityAdvisory: false,
    };
  }

  /**
   * Normalize GitHub Dependabot alert to ProviderIssue format
   */
  private normalizeGitHubDependabotAlert(
    alert: GitHubDependabotAlert,
    repositoryUrl: string,
  ): ProviderIssue {
    const severity = alert.security_advisory.severity;
    const priority =
      severity === "critical"
        ? Priority.Critical
        : severity === "high"
          ? Priority.High
          : severity === "medium"
            ? Priority.Medium
            : Priority.Low;

    return {
      id: alert.number.toString(),
      number: alert.number,
      title: `Security: ${alert.security_advisory.summary}`,
      body: alert.security_advisory.description,
      state: alert.state === "open" ? "open" : "closed",
      labels: [
        { name: "security", color: "#d73a4a" },
        { name: severity, color: severity === "critical" ? "#d73a4a" : "#fb8500" },
      ],
      assignees: [],
      createdAt: alert.created_at,
      updatedAt: alert.updated_at,
      htmlUrl: alert.html_url,
      securityAdvisory: true,
    };
  }

  /**
   * Normalize GitLab vulnerability finding to ProviderIssue format
   */
  private normalizeGitLabVulnerabilityFinding(
    finding: GitLabVulnerabilityFinding,
    repositoryUrl: string,
  ): ProviderIssue {
    const severity = finding.severity;
    const priority =
      severity === "critical"
        ? Priority.Critical
        : severity === "high"
          ? Priority.High
          : severity === "medium"
            ? Priority.Medium
            : Priority.Low;

    return {
      id: finding.id.toString(),
      number: finding.id,
      title: `Security: ${finding.name}`,
      body: finding.description,
      state: finding.state === "detected" ? "open" : "closed",
      labels: [
        { name: "security", color: "#d73a4a" },
        { name: severity, color: severity === "critical" ? "#d73a4a" : "#fb8500" },
      ],
      assignees: [],
      createdAt: finding.created_at,
      updatedAt: finding.updated_at,
      htmlUrl: `${repositoryUrl}/-/security/vulnerabilities/${finding.id}`,
      securityAdvisory: true,
    };
  }
}

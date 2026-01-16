/**
 * TypeScript types for manual issue sync operations
 * 
 * Defines types for sync requests, responses, progress tracking, and external identifiers.
 */

import { z } from "zod";

/**
 * Git provider types
 */
export type ProviderType = "GitHub" | "GitLab" | "Bitbucket";

/**
 * Sync type options
 */
export type SyncType = "full" | "issuesOnly" | "securityOnly";

/**
 * Sync operation status
 */
export type SyncOperationStatus = "pending" | "inProgress" | "completed" | "failed";

/**
 * Sync progress stage
 */
export type SyncProgressStage = "fetching" | "matching" | "creating" | "updating";

/**
 * External identifier format: {provider}:{repositoryUrl}:{issueId}
 * Example: "github:https://github.com/owner/repo:123"
 */
export type ExternalId = string;

/**
 * External sync metadata stored in Issue.customFields
 */
export interface ExternalSyncMetadata {
  providerType: ProviderType;
  repositoryUrl: string;
  issueNumber?: number;
  syncedAt: string; // ISO 8601 timestamp
  lastSyncedAt?: string; // ISO 8601 timestamp
  securityAdvisory?: boolean; // True if synced from security advisory
}

/**
 * Extended customFields structure for synced issues
 */
export interface SyncedIssueCustomFields {
  externalId?: ExternalId;
  externalSync?: ExternalSyncMetadata;
  // Other custom fields may exist
  [key: string]: unknown;
}

/**
 * Sync request parameters
 */
export interface SyncRequest {
  syncType?: SyncType;
  includeClosed?: boolean;
  confirmation?: boolean; // Required when includeClosed is true
}

/**
 * Sync progress tracking
 */
export interface SyncProgress {
  current: number; // Current issue number being processed
  total: number; // Total issues to sync
  processed: number; // Issues processed so far
  stage: SyncProgressStage; // Current sync stage
}

/**
 * Sync results summary
 */
export interface SyncResults {
  created: number; // Issues created
  updated: number; // Issues updated
  skipped: number; // Issues skipped (duplicates)
  failed: number; // Issues that failed to sync
  securityAdvisories?: {
    created: number; // Security advisories created
    updated: number; // Security advisories updated
    skipped: number; // Security advisories skipped (duplicates)
    failed: number; // Security advisories that failed to sync
  };
  errors?: Array<{
    issueId?: string;
    error: string;
  }>;
}

/**
 * Sync operation response (for async operations)
 */
export interface SyncOperationResponse {
  operationId: string;
  status: "pending";
  location: string; // URL to check sync status
}

/**
 * Sync result (for synchronous operations)
 */
export interface SyncResult {
  status: "completed";
  results: SyncResults;
  duration: number; // Sync duration in seconds
  repositoryUrl: string;
  syncedAt: string; // ISO 8601 timestamp
}

/**
 * Sync operation status (for async operations)
 */
export interface SyncOperationStatusResponse {
  operationId: string;
  status: SyncOperationStatus;
  progress?: SyncProgress;
  results?: SyncResults;
  error?: string; // Error message if status is failed
  startedAt?: string; // ISO 8601 timestamp
  completedAt?: string | null; // ISO 8601 timestamp
}

/**
 * Git provider issue data (normalized format)
 */
export interface ProviderIssue {
  id: string | number; // Provider-specific issue ID
  number: number; // Issue number (for display)
  title: string;
  body: string | null; // Issue description/body
  state: "open" | "closed";
  labels: Array<{
    name: string;
    color?: string;
  }>;
  assignees: Array<{
    login: string; // Username
    name?: string;
    email?: string;
  }>;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  htmlUrl: string; // URL to view issue in provider
  securityAdvisory?: boolean; // True if from security advisory
}

/**
 * Security advisory data (normalized format)
 */
export interface SecurityAdvisory {
  id: string | number;
  number?: number;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  state: "open" | "dismissed" | "fixed";
  dependency?: {
    package: string;
    ecosystem: string;
  };
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  htmlUrl: string; // URL to view advisory
}

/**
 * Duplicate match result
 */
export interface DuplicateMatch {
  matched: boolean;
  issueId?: string; // Local issue ID if matched
  matchType?: "externalId" | "titleAndRepository"; // How the match was made
}

/**
 * Rate limit information from provider API
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly rateLimitInfo?: RateLimitInfo,
    public readonly retryAfter?: number, // Seconds to wait before retry
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Provider API error
 */
export class ProviderApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly provider: ProviderType,
  ) {
    super(message);
    this.name = "ProviderApiError";
  }
}

/**
 * Zod validation schemas for sync operations
 */

/**
 * Sync type schema
 */
export const syncTypeSchema = z.enum(["full", "issuesOnly", "securityOnly"]);

/**
 * Sync request schema
 */
export const syncRequestSchema = z.object({
  syncType: syncTypeSchema.optional().default("full"),
  includeClosed: z.boolean().optional().default(false),
  confirmation: z.boolean().optional(),
}).refine(
  (data) => {
    // If includeClosed is true, confirmation must be provided
    if (data.includeClosed && !data.confirmation) {
      return false;
    }
    return true;
  },
  {
    message: "Confirmation is required when includeClosed is true",
    path: ["confirmation"],
  },
);

/**
 * External identifier schema
 */
export const externalIdSchema = z.string().max(500).regex(
  /^(github|gitlab|bitbucket):https?:\/\/.+/,
  "External ID must be in format '{provider}:{repositoryUrl}:{issueId}'",
);

/**
 * External sync metadata schema
 */
export const externalSyncMetadataSchema = z.object({
  providerType: z.enum(["GitHub", "GitLab", "Bitbucket"]),
  repositoryUrl: z.string().url(),
  issueNumber: z.number().optional(),
  syncedAt: z.string().datetime(),
  lastSyncedAt: z.string().datetime().optional(),
  securityAdvisory: z.boolean().optional(),
});

/**
 * Sync progress schema
 */
export const syncProgressSchema = z.object({
  current: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  processed: z.number().int().nonnegative(),
  stage: z.enum(["fetching", "matching", "creating", "updating"]),
});

/**
 * Sync results schema
 */
export const syncResultsSchema = z.object({
  created: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  securityAdvisories: z.object({
    created: z.number().int().nonnegative(),
    updated: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }).optional(),
  errors: z.array(
    z.object({
      issueId: z.string().uuid().optional(),
      error: z.string(),
    }),
  ).optional(),
});

/**
 * Sync operation status schema
 */
export const syncOperationStatusSchema = z.enum([
  "pending",
  "inProgress",
  "completed",
  "failed",
]);

/**
 * Sync operation status response schema
 */
export const syncOperationStatusResponseSchema = z.object({
  operationId: z.string().uuid(),
  status: syncOperationStatusSchema,
  progress: syncProgressSchema.optional(),
  results: syncResultsSchema.optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

/**
 * Sync result schema (for synchronous operations)
 */
export const syncResultSchema = z.object({
  status: z.literal("completed"),
  results: syncResultsSchema,
  duration: z.number().nonnegative(),
  repositoryUrl: z.string().url(),
  syncedAt: z.string().datetime(),
});

/**
 * Sync operation response schema (for async operations)
 */
export const syncOperationResponseSchema = z.object({
  operationId: z.string().uuid(),
  status: z.literal("pending"),
  location: z.string().url(),
});

/**
 * Manual link request schema
 */
export const manualLinkRequestSchema = z.object({
  externalId: externalIdSchema.optional(), // Optional - will be constructed from other fields if not provided
  providerType: z.enum(["GitHub", "GitLab", "Bitbucket"]),
  repositoryUrl: z.string().url(),
  issueNumber: z.number().int().positive(),
});

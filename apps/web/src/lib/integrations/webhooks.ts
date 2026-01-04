import {
  createGitHubWebhook,
  getGitHubRepository,
  parseGitHubRepositoryUrl,
  type GitHubOAuthConfig,
} from "./github";
import {
  createGitLabWebhook,
  getGitLabRepository,
  parseGitLabRepositoryUrl,
  type GitLabOAuthConfig,
} from "./gitlab";
import crypto from "crypto";

/**
 * Webhook registration utilities for Git services
 */

export interface WebhookRegistrationResult {
  webhookId: string;
  webhookSecret: string;
}

/**
 * Generate a secure webhook secret
 * @returns Random webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Register webhook for GitHub repository
 * @param repositoryUrl - GitHub repository URL
 * @param webhookUrl - Webhook endpoint URL
 * @param accessToken - GitHub access token
 * @param config - GitHub OAuth configuration
 * @returns Webhook registration result
 */
export async function registerGitHubWebhook(
  repositoryUrl: string,
  webhookUrl: string,
  accessToken: string,
  config?: GitHubOAuthConfig,
): Promise<WebhookRegistrationResult> {
  const parsed = parseGitHubRepositoryUrl(repositoryUrl);
  if (!parsed) {
    throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
  }

  // Get repository info to verify access
  await getGitHubRepository(parsed.owner, parsed.repo, accessToken);

  // Generate webhook secret
  const webhookSecret = generateWebhookSecret();

  // Create webhook
  const webhookId = await createGitHubWebhook(
    parsed.owner,
    parsed.repo,
    webhookUrl,
    webhookSecret,
    accessToken,
  );

  return {
    webhookId: webhookId.toString(),
    webhookSecret,
  };
}

/**
 * Register webhook for GitLab repository
 * @param repositoryUrl - GitLab repository URL
 * @param webhookUrl - Webhook endpoint URL
 * @param accessToken - GitLab access token
 * @param config - GitLab OAuth configuration
 * @returns Webhook registration result
 */
export async function registerGitLabWebhook(
  repositoryUrl: string,
  webhookUrl: string,
  accessToken: string,
  config?: GitLabOAuthConfig,
): Promise<WebhookRegistrationResult> {
  const projectPath = parseGitLabRepositoryUrl(repositoryUrl);
  if (!projectPath) {
    throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
  }

  const baseUrl = config?.baseUrl || "https://gitlab.com";

  // Get repository info to verify access and get project ID
  const repo = await getGitLabRepository(projectPath, accessToken, baseUrl);

  // Generate webhook secret
  const webhookSecret = generateWebhookSecret();

  // Create webhook
  const webhookId = await createGitLabWebhook(
    repo.id,
    webhookUrl,
    webhookSecret,
    accessToken,
    baseUrl,
  );

  return {
    webhookId: webhookId.toString(),
    webhookSecret,
  };
}

/**
 * Register webhook based on repository type
 * @param repositoryType - Type of repository (GitHub, GitLab, Bitbucket)
 * @param repositoryUrl - Repository URL
 * @param webhookUrl - Webhook endpoint URL
 * @param accessToken - Access token
 * @param config - Optional OAuth configuration
 * @returns Webhook registration result
 */
export async function registerWebhook(
  repositoryType: "GitHub" | "GitLab" | "Bitbucket",
  repositoryUrl: string,
  webhookUrl: string,
  accessToken: string,
  config?: GitHubOAuthConfig | GitLabOAuthConfig,
): Promise<WebhookRegistrationResult> {
  switch (repositoryType) {
    case "GitHub":
      return registerGitHubWebhook(
        repositoryUrl,
        webhookUrl,
        accessToken,
        config as GitHubOAuthConfig,
      );
    case "GitLab":
      return registerGitLabWebhook(
        repositoryUrl,
        webhookUrl,
        accessToken,
        config as GitLabOAuthConfig,
      );
    case "Bitbucket":
      // TODO: Implement Bitbucket webhook registration
      throw new Error("Bitbucket webhook registration not yet implemented");
    default:
      throw new Error(`Unsupported repository type: ${repositoryType}`);
  }
}


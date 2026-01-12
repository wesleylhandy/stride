import { resolveGitOAuthConfig, type ResolvedGitConfig } from "./infrastructure-precedence";

/**
 * Git OAuth configuration reader
 * Provides convenience functions to read Git OAuth config with precedence resolution
 */

/**
 * Get GitHub OAuth configuration
 * @returns GitHub OAuth config or null if not configured
 */
export async function getGitHubOAuthConfig(): Promise<{
  clientId: string;
  clientSecret: string;
  source: "environment" | "database" | "default";
} | null> {
  const resolved = await resolveGitOAuthConfig();
  return resolved.github || null;
}

/**
 * Get GitLab OAuth configuration
 * @returns GitLab OAuth config or null if not configured
 */
export async function getGitLabOAuthConfig(): Promise<{
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  source: "environment" | "database" | "default";
} | null> {
  const resolved = await resolveGitOAuthConfig();
  return resolved.gitlab || null;
}

/**
 * Get all Git OAuth configuration
 * @returns Resolved Git OAuth config
 */
export async function getGitOAuthConfig(): Promise<ResolvedGitConfig> {
  return resolveGitOAuthConfig();
}

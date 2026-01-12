import { z } from "zod";

/**
 * Git OAuth configuration validation schemas
 * Validates GitHub and GitLab OAuth credentials
 */

/**
 * GitHub OAuth configuration schema
 */
export const githubOAuthConfigSchema = z.object({
  clientId: z.string().min(1, "GitHub Client ID is required"),
  clientSecret: z.string().min(1, "GitHub Client Secret is required"),
});

/**
 * GitLab OAuth configuration schema
 */
export const gitLabOAuthConfigSchema = z.object({
  clientId: z.string().min(1, "GitLab Client ID is required"),
  clientSecret: z.string().min(1, "GitLab Client Secret is required"),
  baseUrl: z
    .string()
    .url("GitLab base URL must be a valid URL")
    .optional()
    .default("https://gitlab.com"),
});

/**
 * Git OAuth configuration schema (combines GitHub and GitLab)
 */
export const gitOAuthConfigSchema = z.object({
  github: githubOAuthConfigSchema.optional(),
  gitlab: gitLabOAuthConfigSchema.optional(),
});

/**
 * Type inference for Git OAuth configuration
 */
export type GitHubOAuthConfig = z.infer<typeof githubOAuthConfigSchema>;
export type GitLabOAuthConfig = z.infer<typeof gitLabOAuthConfigSchema>;
export type GitOAuthConfig = z.infer<typeof gitOAuthConfigSchema>;

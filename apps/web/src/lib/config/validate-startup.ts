import { validateGitOAuthConfig, validateAIGatewayConfig } from "./validate-infrastructure";

/**
 * Startup validation for infrastructure configuration
 * Validates environment variable configuration on application startup
 */

export interface StartupValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
}

/**
 * Validate environment variable configuration on startup
 * @returns Validation result with errors and warnings
 */
export function validateStartupConfig(): StartupValidationResult {
  const errors: Array<{ field: string; message: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];

  // Validate Git OAuth configuration if environment variables are set
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
  const gitlabClientId = process.env.GITLAB_CLIENT_ID;
  const gitlabClientSecret = process.env.GITLAB_CLIENT_SECRET;

  if (githubClientId || githubClientSecret) {
    const gitConfig = {
      github:
        githubClientId && githubClientSecret
          ? { clientId: githubClientId, clientSecret: githubClientSecret }
          : undefined,
    };

    const result = validateGitOAuthConfig(gitConfig);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        errors.push({
          field: `GITHUB_${err.path.join("_").toUpperCase()}`,
          message: err.message,
        });
      });
    }
  }

  if (gitlabClientId || gitlabClientSecret) {
    const gitConfig = {
      gitlab:
        gitlabClientId && gitlabClientSecret
          ? {
              clientId: gitlabClientId,
              clientSecret: gitlabClientSecret,
              baseUrl: process.env.GITLAB_BASE_URL,
            }
          : undefined,
    };

    const result = validateGitOAuthConfig(gitConfig);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        errors.push({
          field: `GITLAB_${err.path.join("_").toUpperCase()}`,
          message: err.message,
        });
      });
    }
  }

  // Validate AI Gateway configuration if environment variables are set
  const aiGatewayUrl = process.env.AI_GATEWAY_URL;
  const llmEndpoint = process.env.LLM_ENDPOINT;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const googleAiApiKey = process.env.GOOGLE_AI_API_KEY;

  if (aiGatewayUrl || llmEndpoint || openaiApiKey || anthropicApiKey || googleAiApiKey) {
    const aiConfig = {
      aiGatewayUrl,
      llmEndpoint,
      openaiApiKey,
      anthropicApiKey,
      googleAiApiKey,
    };

    const result = validateAIGatewayConfig(aiConfig);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        errors.push({
          field: err.path.join("_").toUpperCase(),
          message: err.message,
        });
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate startup configuration and log errors/warnings
 * Should be called on application startup
 */
export function validateAndLogStartupConfig(): void {
  const result = validateStartupConfig();

  if (result.errors.length > 0) {
    console.error("Infrastructure configuration validation errors:");
    result.errors.forEach((error) => {
      console.error(`  - ${error.field}: ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn("Infrastructure configuration warnings:");
    result.warnings.forEach((warning) => {
      console.warn(`  - ${warning.field}: ${warning.message}`);
    });
  }

  if (result.valid) {
    console.log("✅ Infrastructure configuration validation passed");
  }
}

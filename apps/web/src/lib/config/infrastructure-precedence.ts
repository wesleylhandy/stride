import { globalInfrastructureConfigRepository } from "@stride/database";
import { decrypt } from "../integrations/storage";

/**
 * Configuration precedence resolver
 * Resolves configuration with precedence: env vars → database → defaults
 * Per-provider precedence allows mixed sources (e.g., GitHub via env, GitLab via UI)
 */

export type ConfigSource = "environment" | "database" | "default";

export interface ResolvedGitConfig {
  github?: {
    clientId: string;
    clientSecret: string;
    source: ConfigSource;
  };
  gitlab?: {
    clientId: string;
    clientSecret: string;
    baseUrl?: string;
    source: ConfigSource;
  };
}

export interface ResolvedAIConfig {
  aiGatewayUrl?: string;
  llmEndpoint?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleAiApiKey?: string;
  openaiDefaultModel?: string;
  anthropicDefaultModel?: string;
  googleAiDefaultModel?: string;
  ollamaDefaultModel?: string;
  source: ConfigSource;
}

/**
 * Resolve Git OAuth configuration with precedence
 * Checks environment variables first, then database, per-provider
 */
export async function resolveGitOAuthConfig(): Promise<ResolvedGitConfig> {
  const resolved: ResolvedGitConfig = {};

  // Resolve GitHub config
  const githubEnvClientId = process.env.GITHUB_CLIENT_ID;
  const githubEnvClientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (githubEnvClientId && githubEnvClientSecret) {
    resolved.github = {
      clientId: githubEnvClientId,
      clientSecret: githubEnvClientSecret,
      source: "environment",
    };
  } else {
    // Check database
    const config = await globalInfrastructureConfigRepository.get();
    const githubConfig = config?.gitConfig as
      | { github?: { clientId: string; clientSecret: string } }
      | undefined;

    if (githubConfig?.github?.clientId && githubConfig.github.clientSecret) {
      try {
        resolved.github = {
          clientId: githubConfig.github.clientId,
          clientSecret: decrypt(githubConfig.github.clientSecret),
          source: "database",
        };
      } catch (error) {
        // If decryption fails, skip this config (might be corrupted or invalid format)
        console.error("Failed to decrypt GitHub config:", error);
      }
    }
  }

  // Resolve GitLab config
  const gitlabEnvClientId = process.env.GITLAB_CLIENT_ID;
  const gitlabEnvClientSecret = process.env.GITLAB_CLIENT_SECRET;
  const gitlabEnvBaseUrl = process.env.GITLAB_BASE_URL;

  if (gitlabEnvClientId && gitlabEnvClientSecret) {
    resolved.gitlab = {
      clientId: gitlabEnvClientId,
      clientSecret: gitlabEnvClientSecret,
      baseUrl: gitlabEnvBaseUrl,
      source: "environment",
    };
  } else {
    // Check database
    const config = await globalInfrastructureConfigRepository.get();
    const gitlabConfig = config?.gitConfig as
      | {
          gitlab?: {
            clientId: string;
            clientSecret: string;
            baseUrl?: string;
          };
        }
      | undefined;

    if (gitlabConfig?.gitlab?.clientId && gitlabConfig.gitlab.clientSecret) {
      try {
        resolved.gitlab = {
          clientId: gitlabConfig.gitlab.clientId,
          clientSecret: decrypt(gitlabConfig.gitlab.clientSecret),
          baseUrl: gitlabConfig.gitlab.baseUrl,
          source: "database",
        };
      } catch (error) {
        // If decryption fails, skip this config (might be corrupted or invalid format)
        console.error("Failed to decrypt GitLab config:", error);
      }
    }
  }

  return resolved;
}

/**
 * Resolve AI Gateway configuration with precedence
 * Checks environment variables first, then database
 */
export async function resolveAIGatewayConfig(): Promise<ResolvedAIConfig> {
  // Check environment variables first
  const envAiGatewayUrl = process.env.AI_GATEWAY_URL;
  const envLlmEndpoint = process.env.LLM_ENDPOINT;
  const envOpenAiApiKey = process.env.OPENAI_API_KEY;
  const envAnthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const envGoogleAiApiKey = process.env.GOOGLE_AI_API_KEY;

  if (
    envAiGatewayUrl ||
    envLlmEndpoint ||
    envOpenAiApiKey ||
    envAnthropicApiKey ||
    envGoogleAiApiKey
  ) {
    return {
      aiGatewayUrl: envAiGatewayUrl,
      llmEndpoint: envLlmEndpoint,
      openaiApiKey: envOpenAiApiKey,
      anthropicApiKey: envAnthropicApiKey,
      googleAiApiKey: envGoogleAiApiKey,
      source: "environment",
    };
  }

  // Check database
  const config = await globalInfrastructureConfigRepository.get();
  const aiConfig = config?.aiConfig as
    | {
        aiGatewayUrl?: string;
        llmEndpoint?: string;
        openaiApiKey?: string;
        anthropicApiKey?: string;
        googleAiApiKey?: string;
        openaiDefaultModel?: string;
        anthropicDefaultModel?: string;
        googleAiDefaultModel?: string;
        ollamaDefaultModel?: string;
      }
    | undefined;

  if (aiConfig) {
    const resolved: ResolvedAIConfig = {
      aiGatewayUrl: aiConfig.aiGatewayUrl,
      llmEndpoint: aiConfig.llmEndpoint,
      source: "database",
    };

    // Decrypt API keys with error handling
    if (aiConfig.openaiApiKey) {
      try {
        resolved.openaiApiKey = decrypt(aiConfig.openaiApiKey);
      } catch (error) {
        console.error("Failed to decrypt OpenAI API key:", error);
      }
    }
    if (aiConfig.anthropicApiKey) {
      try {
        resolved.anthropicApiKey = decrypt(aiConfig.anthropicApiKey);
      } catch (error) {
        console.error("Failed to decrypt Anthropic API key:", error);
      }
    }
    if (aiConfig.googleAiApiKey) {
      try {
        resolved.googleAiApiKey = decrypt(aiConfig.googleAiApiKey);
      } catch (error) {
        console.error("Failed to decrypt Google AI API key:", error);
      }
    }

    // Include default models (plain text, not encrypted)
    if (aiConfig.openaiDefaultModel) {
      resolved.openaiDefaultModel = aiConfig.openaiDefaultModel;
    }
    if (aiConfig.anthropicDefaultModel) {
      resolved.anthropicDefaultModel = aiConfig.anthropicDefaultModel;
    }
    if (aiConfig.googleAiDefaultModel) {
      resolved.googleAiDefaultModel = aiConfig.googleAiDefaultModel;
    }
    if (aiConfig.ollamaDefaultModel) {
      resolved.ollamaDefaultModel = aiConfig.ollamaDefaultModel;
    }

    return resolved;
  }

  // No configuration found
  return {
    source: "default",
  };
}

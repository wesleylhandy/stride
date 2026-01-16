import { encrypt } from "../integrations/storage";

/**
 * Encryption utilities for infrastructure configuration
 * Encrypts sensitive credentials before database storage
 */

/**
 * Encrypt Git OAuth credentials
 * @param gitConfig - Git OAuth configuration object
 * @returns Git config with encrypted secrets
 */
export function encryptGitConfig(gitConfig: {
  github?: { clientId: string; clientSecret: string };
  gitlab?: { clientId: string; clientSecret: string; baseUrl?: string };
}): {
  github?: { clientId: string; clientSecret: string };
  gitlab?: { clientId: string; clientSecret: string; baseUrl?: string };
} {
  const encrypted: typeof gitConfig = {};

  if (gitConfig.github) {
    encrypted.github = {
      clientId: gitConfig.github.clientId, // Client ID is not sensitive
      clientSecret: encrypt(gitConfig.github.clientSecret), // Encrypt secret
    };
  }

  if (gitConfig.gitlab) {
    encrypted.gitlab = {
      clientId: gitConfig.gitlab.clientId, // Client ID is not sensitive
      clientSecret: encrypt(gitConfig.gitlab.clientSecret), // Encrypt secret
      baseUrl: gitConfig.gitlab.baseUrl, // URL is not sensitive
    };
  }

  return encrypted;
}

/**
 * Encrypt AI Gateway credentials
 * @param aiConfig - AI Gateway configuration object
 * @returns AI config with encrypted API keys
 */
export function encryptAiConfig(aiConfig: {
  aiGatewayUrl?: string;
  llmEndpoint?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleAiApiKey?: string;
  openaiDefaultModel?: string;
  anthropicDefaultModel?: string;
  googleAiDefaultModel?: string;
  ollamaDefaultModel?: string;
}): typeof aiConfig {
  const encrypted: typeof aiConfig = {
    aiGatewayUrl: aiConfig.aiGatewayUrl, // URL is not sensitive
    llmEndpoint: aiConfig.llmEndpoint, // URL is not sensitive
  };

  if (aiConfig.openaiApiKey) {
    encrypted.openaiApiKey = encrypt(aiConfig.openaiApiKey);
  }

  if (aiConfig.anthropicApiKey) {
    encrypted.anthropicApiKey = encrypt(aiConfig.anthropicApiKey);
  }

  if (aiConfig.googleAiApiKey) {
    encrypted.googleAiApiKey = encrypt(aiConfig.googleAiApiKey);
  }

  // Default models are not sensitive, store as plain text
  if (aiConfig.openaiDefaultModel) {
    encrypted.openaiDefaultModel = aiConfig.openaiDefaultModel;
  }
  if (aiConfig.anthropicDefaultModel) {
    encrypted.anthropicDefaultModel = aiConfig.anthropicDefaultModel;
  }
  if (aiConfig.googleAiDefaultModel) {
    encrypted.googleAiDefaultModel = aiConfig.googleAiDefaultModel;
  }
  if (aiConfig.ollamaDefaultModel) {
    encrypted.ollamaDefaultModel = aiConfig.ollamaDefaultModel;
  }

  return encrypted;
}

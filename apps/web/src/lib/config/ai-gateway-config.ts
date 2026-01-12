import { resolveAIGatewayConfig, type ResolvedAIConfig } from "./infrastructure-precedence";

/**
 * AI Gateway configuration reader
 * Provides convenience functions to read AI Gateway config with precedence resolution
 */

/**
 * Get AI Gateway configuration
 * @returns Resolved AI Gateway config
 */
export async function getAIGatewayConfig(): Promise<ResolvedAIConfig> {
  return resolveAIGatewayConfig();
}

/**
 * Get AI Gateway URL
 * @returns AI Gateway URL or null if not configured
 */
export async function getAIGatewayUrl(): Promise<string | null> {
  const config = await resolveAIGatewayConfig();
  return config.aiGatewayUrl || null;
}

/**
 * Get LLM endpoint URL (Ollama)
 * @returns LLM endpoint URL or null if not configured
 */
export async function getLLMEndpoint(): Promise<string | null> {
  const config = await resolveAIGatewayConfig();
  return config.llmEndpoint || null;
}

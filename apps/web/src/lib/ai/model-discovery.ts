/**
 * Model Discovery Service
 * 
 * Reusable service for fetching available models from various AI providers.
 * Supports OpenAI, Anthropic, Google Gemini, and Ollama.
 */

export type ProviderType = "openai" | "anthropic" | "google-gemini" | "ollama";

export interface ModelDiscoveryConfig {
  providerType: ProviderType;
  apiKey?: string;
  endpointUrl?: string;
  authToken?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
}

/**
 * Discover available models from a provider
 */
export async function discoverModels(
  config: ModelDiscoveryConfig
): Promise<string[]> {
  switch (config.providerType) {
    case "openai":
      return discoverOpenAIModels(config.apiKey!);
    case "anthropic":
      return discoverAnthropicModels(config.apiKey!);
    case "google-gemini":
      return discoverGoogleGeminiModels(config.apiKey!);
    case "ollama":
      return discoverOllamaModels(config.endpointUrl!, config.authToken);
    default:
      throw new Error(`Unsupported provider type: ${config.providerType}`);
  }
}

/**
 * Discover OpenAI models
 * API: GET https://api.openai.com/v1/models
 */
async function discoverOpenAIModels(apiKey: string): Promise<string[]> {
  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  
  // OpenAI returns: { data: [{ id: "gpt-4", ... }, ...] }
  if (!data.data || !Array.isArray(data.data)) {
    return [];
  }

  // Filter for chat completion models (most relevant for our use case)
  // Common patterns: gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o, etc.
  const chatModels = data.data
    .filter((model: { id: string }) => {
      const id = model.id.toLowerCase();
      return (
        id.includes("gpt-3.5-turbo") ||
        id.includes("gpt-4") ||
        id.includes("o1")
      );
    })
    .map((model: { id: string }) => model.id)
    .sort();

  return chatModels;
}

/**
 * Discover Anthropic models
 * 
 * Note: Anthropic doesn't provide a public models list endpoint.
 * We use a curated list of documented models from their API documentation.
 * These are the current supported models as of 2024.
 */
async function discoverAnthropicModels(apiKey: string): Promise<string[]> {
  // Anthropic doesn't have a public models list endpoint
  // Return curated list of documented models
  // We could try to validate the API key by making a test request, but
  // for now we'll return the known models
  
  // These are the current Anthropic Claude models (as of 2024)
  const knownModels = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
  ];

  // Optional: Validate API key by making a test request
  // For now, we'll just return the known models
  // In the future, we could implement a validation check here
  
  return knownModels;
}

/**
 * Discover Google Gemini models
 * API: GET https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}
 */
async function discoverGoogleGeminiModels(apiKey: string): Promise<string[]> {
  const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(
      `Google Gemini API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Google Gemini returns: { models: [{ name: "models/gemini-pro", ... }, ...] }
  if (!data.models || !Array.isArray(data.models)) {
    return [];
  }

  // Extract model names (format: "models/gemini-pro" -> "gemini-pro")
  const models = data.models
    .map((model: { name: string }) => {
      // Remove "models/" prefix if present
      return model.name.replace(/^models\//, "");
    })
    .filter((name: string) => name.length > 0)
    .sort();

  return models;
}

/**
 * Discover Ollama models
 * API: GET {endpoint}/api/tags
 */
async function discoverOllamaModels(
  endpointUrl: string,
  authToken?: string
): Promise<string[]> {
  const ollamaUrl = new URL(endpointUrl);
  ollamaUrl.pathname = "/api/tags";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add auth token if provided
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(ollamaUrl.toString(), {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(
      `Ollama API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Ollama returns: { models: [{ name: "llama2:7b", ... }, ...] }
  if (!data.models || !Array.isArray(data.models)) {
    return [];
  }

  const models = data.models
    .map((model: { name: string }) => model.name)
    .filter((name: string) => name && name.length > 0)
    .sort();

  return models;
}

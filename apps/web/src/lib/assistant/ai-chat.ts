/**
 * AI chat helper for configuration assistant
 * Calls AI providers directly for chat completion
 * 
 * Note: For chat, we don't need JSON mode (unlike analyze-issue which needs structured output)
 * We use regular text completion with markdown support
 */

import { selectProviderForProject } from "@/lib/ai/provider-selector";
import type { SelectedProvider } from "@/lib/ai/provider-selector";
import { resolveAIGatewayConfig } from "@/lib/config/infrastructure-precedence";

export interface ChatRequest {
  systemPrompt: string;
  userMessage: string;
}

export interface ChatResponse {
  content: string;
}

/**
 * Select provider from infrastructure/global configuration
 * Used for infrastructure assistant context
 */
async function selectProviderFromInfrastructure(): Promise<SelectedProvider | null> {
  const config = await resolveAIGatewayConfig();

  // Prefer OpenAI if available
  if (config.openaiApiKey) {
    return {
      providerId: "infrastructure-openai",
      providerType: "openai",
      model: "gpt-3.5-turbo", // Default model for OpenAI
      apiKey: config.openaiApiKey,
    };
  }

  // Prefer Anthropic if available
  if (config.anthropicApiKey) {
    return {
      providerId: "infrastructure-anthropic",
      providerType: "anthropic",
      model: "claude-3-haiku-20240307", // Default model for Anthropic
      apiKey: config.anthropicApiKey,
    };
  }

  // Prefer Google Gemini if available
  if (config.googleAiApiKey) {
    return {
      providerId: "infrastructure-google-gemini",
      providerType: "google-gemini",
      model: "gemini-pro", // Default model for Google Gemini
      apiKey: config.googleAiApiKey,
    };
  }

  // Prefer Ollama if endpoint is available
  if (config.llmEndpoint) {
    return {
      providerId: "infrastructure-ollama",
      providerType: "ollama",
      model: "llama2", // Default model for Ollama
      endpointUrl: config.llmEndpoint,
    };
  }

  // No infrastructure provider configured
  return null;
}

/**
 * Call AI provider for chat completion
 * Uses project-specific provider selection, or infrastructure provider for infrastructure context
 */
export async function callAIChat(
  request: ChatRequest,
  projectId: string | "infrastructure"
): Promise<ChatResponse> {
  let selectedProvider: SelectedProvider | null;

  // For infrastructure context, use infrastructure provider directly
  if (projectId === "infrastructure") {
    selectedProvider = await selectProviderFromInfrastructure();
  } else {
    // Get provider from project config (with fallback to infrastructure/global)
    selectedProvider = await selectProviderForProject(projectId);
  }

  if (!selectedProvider) {
    throw new Error(
      "AI provider not configured. Please configure an AI provider in project settings or infrastructure settings."
    );
  }

  // Call provider directly
  const content = await callProviderForChat(selectedProvider, request);

  return { content };
}

/**
 * Call provider API directly for chat completion
 * Uses regular text completion (not JSON mode) for natural language responses
 */
async function callProviderForChat(
  provider: SelectedProvider,
  request: ChatRequest
): Promise<string> {
  switch (provider.providerType) {
    case "openai":
      return callOpenAI(provider, request);
    case "anthropic":
      return callAnthropic(provider, request);
    case "google-gemini":
      return callGoogleGemini(provider, request);
    case "ollama":
      return callOllama(provider, request);
    default:
      throw new Error(`Unsupported provider type: ${provider.providerType}`);
  }
}

/**
 * Call OpenAI API for chat completion
 */
async function callOpenAI(
  provider: SelectedProvider,
  request: ChatRequest
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error("OpenAI API key is required");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userMessage },
      ],
      temperature: 0.3,
      // Note: No response_format for chat (we want natural language, not JSON)
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `OpenAI API error: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI API returned empty response");
  }

  return content;
}

/**
 * Call Anthropic API for chat completion
 */
async function callAnthropic(
  provider: SelectedProvider,
  request: ChatRequest
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error("Anthropic API key is required");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 4096,
      system: request.systemPrompt,
      messages: [
        { role: "user", content: request.userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Anthropic API error: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    content?: Array<{
      text?: string;
    }>;
  };

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error("Anthropic API returned empty response");
  }

  return text;
}

/**
 * Call Google Gemini API for chat completion
 */
async function callGoogleGemini(
  provider: SelectedProvider,
  request: ChatRequest
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error("Google Gemini API key is required");
  }

  const model = provider.model || "gemini-pro";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${request.systemPrompt}\n\n${request.userMessage}` },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Google Gemini API error: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Google Gemini API returned empty response");
  }

  return text;
}

/**
 * Call Ollama API for chat completion
 */
async function callOllama(
  provider: SelectedProvider,
  request: ChatRequest
): Promise<string> {
  if (!provider.endpointUrl) {
    throw new Error("Ollama endpoint URL is required");
  }

  const normalizedEndpoint = provider.endpointUrl.replace(/\/$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (provider.authToken) {
    headers["Authorization"] = `Bearer ${provider.authToken}`;
  }

  const response = await fetch(`${normalizedEndpoint}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userMessage },
      ],
      stream: false,
      options: {
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Ollama API error: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    message?: {
      content?: string;
    };
  };

  const content = data.message?.content;
  if (!content) {
    throw new Error("Ollama API returned empty response");
  }

  return content;
}

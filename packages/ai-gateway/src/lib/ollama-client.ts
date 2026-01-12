// Ollama client implementation
// Direct fetch() to Ollama API with system and user messages
// Relies on schema + example in prompt (no structured output mode support)
import type { ProviderClient } from './provider-selector';

export interface OllamaConfig {
  endpointUrl: string;
  authToken?: string;
  model?: string;
}

/**
 * Creates an Ollama provider client
 * Uses direct fetch() to Ollama API
 * Relies on schema + example in prompt (Ollama doesn't support structured outputs)
 */
export function createOllamaClient(config: OllamaConfig): ProviderClient {
  const { endpointUrl, authToken, model = 'llama2' } = config;

  if (!endpointUrl) {
    throw new Error('Ollama endpoint URL is required');
  }

  // Normalize endpoint URL (remove trailing slash)
  const normalizedEndpoint = endpointUrl.replace(/\/$/, '');

  return {
    async createCompletion({ systemPrompt, userMessage, model: overrideModel }) {
      const selectedModel = overrideModel || model;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token if provided
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${normalizedEndpoint}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
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

      const data = await response.json() as {
        message?: {
          content?: string;
        };
      };

      const content = data.message?.content;
      if (!content) {
        throw new Error('Ollama API returned empty response');
      }

      return content;
    },
  };
}

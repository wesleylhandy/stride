// Anthropic client implementation
// Direct API calls using anthropic.messages.create() pattern with structured outputs
import type { ProviderClient } from './provider-selector';

export interface AnthropicConfig {
  apiKey: string;
  model?: string;
}

/**
 * Creates an Anthropic provider client
 * Uses direct fetch() to Anthropic API
 * Note: Structured outputs feature requires specific model versions
 */
export function createAnthropicClient(config: AnthropicConfig): ProviderClient {
  const { apiKey, model = 'claude-3-haiku-20240307' } = config;

  if (!apiKey) {
    throw new Error('Anthropic API key is required');
  }

  return {
    async createCompletion({ systemPrompt, userMessage, model: overrideModel }) {
      const selectedModel = overrideModel || model;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: selectedModel,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userMessage },
          ],
          max_tokens: 1024,
          temperature: 0.3,
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

      const data = await response.json() as {
        content?: Array<{
          type: string;
          text?: string;
        }>;
      };

      // Anthropic returns content as array of text blocks
      const textBlock = data.content?.find((block) => block.type === 'text');
      const content = textBlock?.text;

      if (!content) {
        throw new Error('Anthropic API returned empty response');
      }

      return content;
    },
  };
}

// OpenAI client implementation
// Direct API calls using openai.chat.completions.create() pattern with JSON mode
import type { ProviderClient } from './provider-selector';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

/**
 * Creates an OpenAI provider client
 * Uses direct fetch() to OpenAI API with JSON mode for structured outputs
 */
export function createOpenAIClient(config: OpenAIConfig): ProviderClient {
  const { apiKey, model = 'gpt-3.5-turbo' } = config;

  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  return {
    async createCompletion({ systemPrompt, userMessage, model: overrideModel }) {
      const selectedModel = overrideModel || model;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
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

      const data = await response.json() as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI API returned empty response');
      }

      return content;
    },
  };
}

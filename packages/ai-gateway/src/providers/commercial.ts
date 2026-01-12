// Commercial AI provider support (OpenAI, Anthropic)
import type { ProviderClient } from '../lib/provider-selector';

export type CommercialProviderType = 'openai' | 'anthropic';

export function createCommercialProvider(
  type: CommercialProviderType
): ProviderClient {
  if (type === 'openai') {
    return createOpenAIProvider();
  }

  if (type === 'anthropic') {
    return createAnthropicProvider();
  }

  throw new Error(`Unsupported commercial provider: ${type}`);
}

function createOpenAIProvider(): ProviderClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return {
    async createCompletion({ systemPrompt, userMessage, model = 'gpt-3.5-turbo' }) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    },
  };
}

function createAnthropicProvider(): ProviderClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  return {
    async createCompletion({ systemPrompt, userMessage, model = 'claude-3-haiku-20240307' }) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userMessage },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      // Anthropic returns content as array of text blocks
      const content = data.content?.find((block: { type: string }) => block.type === 'text');
      return content?.text || '';
    },
  };
}

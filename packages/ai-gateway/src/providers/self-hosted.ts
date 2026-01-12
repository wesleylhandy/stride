// Self-hosted LLM provider support (Ollama)
import type { ProviderClient } from '../lib/provider-selector';

export function createSelfHostedProvider(): ProviderClient {
  const endpoint = process.env.LLM_ENDPOINT || 'http://localhost:11434';

  return {
    async createCompletion({ systemPrompt, userMessage, model = 'llama2' }) {
      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
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
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.message?.content || '';
    },
  };
}

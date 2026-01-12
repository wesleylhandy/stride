// Google Gemini client implementation
// Direct fetch() to Google Gemini API with system and user messages
// Relies on schema + example in prompt (no structured output mode support)
import type { ProviderClient } from './provider-selector';

export interface GoogleGeminiConfig {
  apiKey: string;
  model?: string;
}

/**
 * Creates a Google Gemini provider client
 * Uses direct fetch() to Google Gemini API
 * Relies on schema + example in prompt (Gemini doesn't support structured outputs like OpenAI JSON mode)
 */
export function createGoogleGeminiClient(config: GoogleGeminiConfig): ProviderClient {
  const { apiKey, model = 'gemini-pro' } = config;

  if (!apiKey) {
    throw new Error('Google Gemini API key is required');
  }

  return {
    async createCompletion({ systemPrompt, userMessage, model: overrideModel }) {
      const selectedModel = overrideModel || model;

      // Google Gemini API endpoint
      // Note: System messages are handled differently in Gemini API
      // We include system prompt as the first user message with special formatting
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

      // Gemini API expects parts array, combine system prompt with user message
      // Format: system prompt as context, user message as the actual content
      const combinedContent = systemPrompt 
        ? `${systemPrompt}\n\nUser Request:\n${userMessage}`
        : userMessage;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: combinedContent,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
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

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const textPart = data.candidates?.[0]?.content?.parts?.[0];
      const content = textPart?.text;

      if (!content) {
        throw new Error('Google Gemini API returned empty response');
      }

      return content;
    },
  };
}

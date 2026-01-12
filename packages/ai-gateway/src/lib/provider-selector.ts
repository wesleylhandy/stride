// Provider selection logic
import type { ProviderConfig } from '../types';
import { createMockProvider } from '../providers/mock';
import { createOpenAIClient } from './openai-client';
import { createAnthropicClient } from './anthropic-client';
import { createOllamaClient } from './ollama-client';
import { createGoogleGeminiClient } from './google-gemini-client';
import { createCommercialProvider } from '../providers/commercial';
import { createSelfHostedProvider } from '../providers/self-hosted';

export interface ProviderClient {
  createCompletion(params: {
    systemPrompt: string;
    userMessage: string;
    model?: string;
  }): Promise<string>;
}

export interface SelectedProvider {
  client: ProviderClient;
  model?: string;
}

/**
 * Selects appropriate provider based on configuration or environment variables
 * 
 * @param config - Optional provider configuration (from request). If provided, uses this config.
 *                 If not provided, falls back to environment variables.
 * @returns Selected provider client and model
 */
export function selectProvider(config?: ProviderConfig): SelectedProvider {
  // If config is provided, use it to create the appropriate client
  if (config) {
    switch (config.type) {
      case 'openai':
        if (!config.apiKey) {
          throw new Error('OpenAI API key is required');
        }
        return {
          client: createOpenAIClient({
            apiKey: config.apiKey,
            model: config.model,
          }),
          model: config.model,
        };

      case 'anthropic':
        if (!config.apiKey) {
          throw new Error('Anthropic API key is required');
        }
        return {
          client: createAnthropicClient({
            apiKey: config.apiKey,
            model: config.model,
          }),
          model: config.model,
        };

      case 'google-gemini':
        if (!config.apiKey) {
          throw new Error('Google Gemini API key is required');
        }
        return {
          client: createGoogleGeminiClient({
            apiKey: config.apiKey,
            model: config.model,
          }),
          model: config.model,
        };

      case 'ollama':
        if (!config.endpointUrl) {
          throw new Error('Ollama endpoint URL is required');
        }
        return {
          client: createOllamaClient({
            endpointUrl: config.endpointUrl,
            authToken: config.authToken,
            model: config.model,
          }),
          model: config.model,
        };

      case 'mock':
        return {
          client: createMockProvider(),
        };

      default:
        throw new Error(`Unsupported provider type: ${config.type}`);
    }
  }

  // Fall back to environment variables (legacy behavior)
  const providerType = process.env.AI_PROVIDER_TYPE || 'mock';

  switch (providerType) {
    case 'openai':
      return {
        client: createCommercialProvider('openai'),
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      };

    case 'anthropic':
      return {
        client: createCommercialProvider('anthropic'),
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      };

    case 'ollama':
      return {
        client: createSelfHostedProvider(),
        model: process.env.OLLAMA_MODEL || 'llama2',
      };

    case 'mock':
    default:
      return {
        client: createMockProvider(),
      };
  }
}

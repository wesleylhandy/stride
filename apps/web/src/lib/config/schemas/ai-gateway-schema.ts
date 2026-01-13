import { z } from "zod";

/**
 * AI Gateway configuration validation schemas
 * Validates AI Gateway URL and provider API keys
 */

/**
 * API key format validators
 */
const openAiApiKeySchema = z
  .string()
  .regex(/^sk-[A-Za-z0-9]{32,}$/, "OpenAI API key must start with 'sk-' and be at least 32 characters");

const anthropicApiKeySchema = z
  .string()
  .regex(/^sk-ant-[A-Za-z0-9_-]+$/, "Anthropic API key must start with 'sk-ant-'");

const googleAiApiKeySchema = z
  .string()
  .regex(/^AIza[0-9A-Za-z-_]{35}$/, "Google AI API key must start with 'AIza' and be 39 characters");

/**
 * AI Gateway configuration schema
 */
export const aiGatewayConfigSchema = z.object({
  aiGatewayUrl: z
    .union([z.string().url("AI Gateway URL must be a valid URL"), z.literal("")])
    .optional(),
  llmEndpoint: z
    .union([z.string().url("LLM endpoint URL must be a valid URL"), z.literal("")])
    .optional(),
  openaiApiKey: z.union([openAiApiKeySchema, z.literal("")]).optional(),
  anthropicApiKey: z.union([anthropicApiKeySchema, z.literal("")]).optional(),
  googleAiApiKey: z.union([googleAiApiKeySchema, z.literal("")]).optional(),
});

/**
 * Type inference for AI Gateway configuration
 */
export type AIGatewayConfig = z.infer<typeof aiGatewayConfigSchema>;

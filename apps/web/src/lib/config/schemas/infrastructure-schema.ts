import { z } from "zod";
import { gitOAuthConfigSchema } from "./git-oauth-schema";
import { aiGatewayConfigSchema } from "./ai-gateway-schema";

/**
 * Combined infrastructure configuration schema
 * Combines Git OAuth and AI Gateway configuration schemas
 */
export const infrastructureConfigSchema = z.object({
  gitConfig: gitOAuthConfigSchema.default({}),
  aiConfig: aiGatewayConfigSchema.default({}),
});

/**
 * Type inference for infrastructure configuration
 */
export type InfrastructureConfig = z.infer<typeof infrastructureConfigSchema>;

/**
 * Re-export individual schemas for convenience
 */
export * from "./git-oauth-schema";
export * from "./ai-gateway-schema";

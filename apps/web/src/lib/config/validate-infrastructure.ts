import {
  infrastructureConfigSchema,
  gitOAuthConfigSchema,
  aiGatewayConfigSchema,
} from "./schemas/infrastructure-schema";
import type { z } from "zod";

/**
 * Validation utilities for infrastructure configuration
 * Uses Zod schemas for runtime validation
 */

/**
 * Validate infrastructure configuration
 * @param config - Configuration object to validate
 * @returns Validation result with data or errors
 */
export function validateInfrastructureConfig(
  config: unknown,
): z.SafeParseReturnType<
  z.infer<typeof infrastructureConfigSchema>,
  z.infer<typeof infrastructureConfigSchema>
> {
  return infrastructureConfigSchema.safeParse(config);
}

/**
 * Validate Git OAuth configuration
 * @param config - Git OAuth configuration object to validate
 * @returns Validation result with data or errors
 */
export function validateGitOAuthConfig(
  config: unknown,
): z.SafeParseReturnType<
  z.infer<typeof gitOAuthConfigSchema>,
  z.infer<typeof gitOAuthConfigSchema>
> {
  return gitOAuthConfigSchema.safeParse(config);
}

/**
 * Validate AI Gateway configuration
 * @param config - AI Gateway configuration object to validate
 * @returns Validation result with data or errors
 */
export function validateAIGatewayConfig(
  config: unknown,
): z.SafeParseReturnType<
  z.infer<typeof aiGatewayConfigSchema>,
  z.infer<typeof aiGatewayConfigSchema>
> {
  return aiGatewayConfigSchema.safeParse(config);
}

/**
 * Validate infrastructure configuration and throw on error
 * @param config - Configuration object to validate
 * @throws ZodError if validation fails
 * @returns Validated configuration
 */
export function validateInfrastructureConfigStrict(
  config: unknown,
): z.infer<typeof infrastructureConfigSchema> {
  return infrastructureConfigSchema.parse(config);
}

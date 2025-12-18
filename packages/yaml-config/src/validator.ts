// YAML configuration validator using Zod v4
// Reference: https://zod.dev/
import { z } from 'zod';
import { ProjectConfigSchema, type ProjectConfig } from './schema';

export interface ValidationError {
  message: string;
  path: (string | number)[];
  code: string;
}

export interface ValidationResult {
  success: boolean;
  data?: ProjectConfig;
  errors?: ValidationError[];
}

/**
 * Validates YAML configuration against the schema
 * @param config - Parsed configuration object
 * @returns Validation result with data or errors
 */
export function validateConfig(config: unknown): ValidationResult {
  try {
    const validated = ProjectConfigSchema.parse(config);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => ({
          message: err.message,
          path: err.path,
          code: err.code,
        })),
      };
    }
    return {
      success: false,
      errors: [
        {
          message: error instanceof Error ? error.message : 'Unknown validation error',
          path: [],
          code: 'UNKNOWN',
        },
      ],
    };
  }
}

/**
 * Safely validates configuration without throwing
 * @param config - Parsed configuration object
 * @returns Validation result with data or errors
 */
export function safeValidateConfig(config: unknown): ValidationResult {
  const result = ProjectConfigSchema.safeParse(config);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  return {
    success: false,
    errors: result.error.errors.map((err) => ({
      message: err.message,
      path: err.path,
      code: err.code,
    })),
  };
}


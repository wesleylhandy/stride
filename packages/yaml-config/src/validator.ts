// YAML configuration validator using Zod v4
// Reference: https://zod.dev/
import { z } from 'zod';
import { ProjectConfigSchema, type ProjectConfig } from './schema';

export interface ValidationError {
  message: string;
  path: (string | number)[];
  code: string;
  line?: number;
  column?: number;
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
      // Zod v4 uses 'issues' property for error details
      const zodIssues = error.issues || (error as unknown as { errors?: z.ZodIssue[] }).errors || [];
      return {
        success: false,
        errors: zodIssues.map((err) => ({
          message: err.message,
          path: err.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number'),
          code: err.code,
          // Line/column info is not directly available from Zod errors
          // This will be enhanced by the parser which has access to YAML source
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
  
  // Zod v4 uses 'issues' property for error details
  const zodIssues = result.error.issues || (result.error as unknown as { errors?: z.ZodIssue[] }).errors || [];
  return {
    success: false,
    errors: zodIssues.map((err) => ({
      message: err.message,
      path: err.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number'),
      code: err.code,
    })),
  };
}


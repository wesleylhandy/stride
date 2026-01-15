import { z } from "zod";
import { projectRepository } from "@stride/database";

/**
 * Project validation schemas and utilities
 */

/**
 * Project key validation schema
 * Must be 2-10 uppercase alphanumeric characters
 */
export const projectKeySchema = z
  .string()
  .min(2, "Project key must be at least 2 characters")
  .max(10, "Project key must be less than 10 characters")
  .regex(
    /^[A-Z0-9]+$/,
    "Project key must contain only uppercase letters and numbers",
  );

/**
 * Create project input schema
 */
export const createProjectSchema = z
  .object({
    key: projectKeySchema,
    name: z
      .string()
      .min(1, "Project name is required")
      .max(100, "Project name must be less than 100 characters"),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    repositoryUrl: z
      .string()
      .url("Invalid repository URL")
      .optional()
      .or(z.literal("")),
    repositoryType: z.enum(["GitHub", "GitLab", "Bitbucket"]).optional(),
  })
  .refine(
    (data) => {
      // If repositoryUrl is provided and not empty, repositoryType must be provided
      if (data.repositoryUrl && data.repositoryUrl.trim() !== "") {
        return !!data.repositoryType;
      }
      return true;
    },
    {
      message: "Repository type is required when repository URL is provided",
      path: ["repositoryType"],
    },
  )
  .refine(
    (data) => {
      // If repositoryType is provided, repositoryUrl must be provided and not empty
      if (data.repositoryType) {
        return !!data.repositoryUrl && data.repositoryUrl.trim() !== "";
      }
      return true;
    },
    {
      message: "Repository URL is required when repository type is provided",
      path: ["repositoryUrl"],
    },
  );

/**
 * Update project input schema
 */
export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  repositoryUrl: z.string().url("Invalid repository URL").optional().nullable().or(z.literal("")),
  repositoryType: z.enum(["GitHub", "GitLab", "Bitbucket"]).optional().nullable(),
});

/**
 * Validate project key format
 * @param key - Project key to validate
 * @returns Validation result with error message if invalid
 */
export function validateProjectKey(key: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    projectKeySchema.parse(key);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || "Invalid project key format",
      };
    }
    return { isValid: false, error: "Invalid project key format" };
  }
}

/**
 * Check if project key is unique
 * @param key - Project key to check
 * @param excludeId - Optional project ID to exclude from check (for updates)
 * @returns Promise<boolean> - True if key is unique or doesn't exist
 */
export async function isProjectKeyUnique(
  key: string,
  excludeId?: string,
): Promise<boolean> {
  const existing = await projectRepository.findByKey(key);

  if (!existing) {
    return true;
  }

  // If excludeId is provided and matches, key is considered unique (same project)
  if (excludeId && existing.id === excludeId) {
    return true;
  }

  return false;
}

/**
 * Validate project key and check uniqueness
 * @param key - Project key to validate
 * @param excludeId - Optional project ID to exclude from check
 * @returns Promise with validation result
 */
export async function validateProjectKeyUnique(
  key: string,
  excludeId?: string,
): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // First validate format
  const formatValidation = validateProjectKey(key);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // Then check uniqueness
  const isUnique = await isProjectKeyUnique(key, excludeId);
  if (!isUnique) {
    return {
      isValid: false,
      error: `Project key "${key}" already exists`,
    };
  }

  return { isValid: true };
}


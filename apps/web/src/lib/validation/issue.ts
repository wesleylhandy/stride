import { z } from "zod";
import { IssueType, Priority } from "@stride/types";

/**
 * Issue validation schemas and utilities
 */

/**
 * Issue type enum schema
 */
export const issueTypeSchema = z.nativeEnum(IssueType);

/**
 * Priority enum schema
 */
export const prioritySchema = z.nativeEnum(Priority).optional();

/**
 * Custom fields schema - accepts any JSON object
 */
export const customFieldsSchema = z.record(z.unknown()).optional();

/**
 * Create issue input schema
 */
export const createIssueSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .max(10000, "Description must be less than 10000 characters")
    .optional(),
  status: z.string().min(1, "Status is required").optional(),
  type: issueTypeSchema.optional(),
  priority: prioritySchema,
  assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  cycleId: z.string().uuid("Invalid cycle ID").optional().nullable(),
  customFields: customFieldsSchema,
  storyPoints: z
    .number()
    .int("Story points must be an integer")
    .min(0, "Story points must be non-negative")
    .max(100, "Story points must be less than 100")
    .optional(),
});

/**
 * Update issue input schema
 */
export const updateIssueSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .optional(),
  description: z
    .string()
    .max(10000, "Description must be less than 10000 characters")
    .optional()
    .nullable(),
  status: z.string().min(1, "Status is required").optional(),
  type: issueTypeSchema.optional(),
  priority: prioritySchema.nullable(),
  assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  cycleId: z.string().uuid("Invalid cycle ID").optional().nullable(),
  customFields: customFieldsSchema,
  storyPoints: z
    .number()
    .int("Story points must be an integer")
    .min(0, "Story points must be non-negative")
    .max(100, "Story points must be less than 100")
    .optional()
    .nullable(),
});

/**
 * Update issue status input schema
 */
export const updateIssueStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
});

/**
 * Issue filter schema for listing/searching
 */
export const issueFilterSchema = z.object({
  status: z.string().optional(),
  type: issueTypeSchema.optional(),
  priority: prioritySchema,
  assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  cycleId: z.string().uuid("Invalid cycle ID").optional().nullable(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * Validate create issue input
 * @param data - Data to validate
 * @returns Validation result with error message if invalid
 */
export function validateCreateIssue(data: unknown): {
  isValid: boolean;
  error?: string;
  details?: z.ZodError["errors"];
} {
  try {
    createIssueSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || "Validation failed",
        details: error.errors,
      };
    }
    return { isValid: false, error: "Validation failed" };
  }
}

/**
 * Validate update issue input
 * @param data - Data to validate
 * @returns Validation result with error message if invalid
 */
export function validateUpdateIssue(data: unknown): {
  isValid: boolean;
  error?: string;
  details?: z.ZodError["errors"];
} {
  try {
    updateIssueSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || "Validation failed",
        details: error.errors,
      };
    }
    return { isValid: false, error: "Validation failed" };
  }
}


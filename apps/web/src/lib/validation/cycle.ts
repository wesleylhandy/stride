import { z } from "zod";

/**
 * Cycle validation schemas and utilities
 */

/**
 * Create cycle input schema
 */
export const createCycleSchema = z
  .object({
    name: z
      .string()
      .min(1, "Cycle name is required")
      .max(100, "Cycle name must be less than 100 characters"),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    goal: z.string().max(500, "Goal must be less than 500 characters").optional(),
  })
  .refine(
    (data) => {
      const start = typeof data.startDate === "string" ? new Date(data.startDate) : data.startDate;
      const end = typeof data.endDate === "string" ? new Date(data.endDate) : data.endDate;
      return end >= start;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    },
  );

/**
 * Update cycle input schema
 */
export const updateCycleSchema = z
  .object({
    name: z
      .string()
      .min(1, "Cycle name is required")
      .max(100, "Cycle name must be less than 100 characters")
      .optional(),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional()
      .nullable(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    goal: z
      .string()
      .max(500, "Goal must be less than 500 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Only validate if both dates are provided
      if (!data.startDate || !data.endDate) {
        return true;
      }
      const start =
        typeof data.startDate === "string" ? new Date(data.startDate) : data.startDate;
      const end = typeof data.endDate === "string" ? new Date(data.endDate) : data.endDate;
      return end >= start;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    },
  );

/**
 * Assign issues to cycle schema
 */
export const assignIssuesToCycleSchema = z.object({
  issueIds: z
    .array(z.string().uuid("Invalid issue ID"))
    .min(1, "At least one issue ID is required"),
});


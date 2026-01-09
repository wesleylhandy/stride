import { z } from "zod";

/**
 * Client-safe user validation schemas
 * 
 * These schemas contain no database dependencies and can be safely
 * imported in client components for form validation.
 */

/**
 * Update user profile input schema
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .max(100, "Name must be less than 100 characters")
    .optional()
    .nullable(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens",
    )
    .optional(),
  avatarUrl: z
    .string()
    .url("Invalid avatar URL")
    .optional()
    .nullable(),
});

/**
 * Change password input schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Invite user input schema
 */
export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["Member", "Viewer"], {
    errorMap: () => ({ message: "Role must be Member or Viewer" }),
  }),
});

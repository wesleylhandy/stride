import { z } from "zod";
import { prisma } from "@stride/database";

/**
 * Server-side user validation schemas and utilities
 * 
 * This file contains schemas with database dependencies and should only
 * be imported in Server Components or API routes.
 * 
 * For client-safe schemas, import from './user-schemas' instead.
 */

// Re-export client-safe schemas for convenience in server-side code
export {
  updateProfileSchema,
  changePasswordSchema,
  inviteUserSchema,
} from "./user-schemas";

/**
 * Create user input schema
 * Role must be Member or Viewer (Admin not allowed for direct creation)
 */
export const createUserSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    name: z
      .string()
      .max(100, "Name must be less than 100 characters")
      .optional(),
    role: z.enum(["Member", "Viewer"], {
      errorMap: () => ({ message: "Role must be Member or Viewer" }),
    }),
  })
  .refine(
    async (data) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      return !existingUser;
    },
    {
      message: "Email already exists",
      path: ["email"],
    },
  )
  .refine(
    async (data) => {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });
      return !existingUser;
    },
    {
      message: "Username already exists",
      path: ["username"],
    },
  );

/**
 * Accept invitation input schema
 */
export const acceptInvitationSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    name: z
      .string()
      .max(100, "Name must be less than 100 characters")
      .optional(),
  })
  .refine(
    async (data) => {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });
      return !existingUser;
    },
    {
      message: "Username already exists",
      path: ["username"],
    },
  );

/**
 * Helper functions for uniqueness validation (for use in API routes)
 * These can be used when async refinements aren't suitable
 */

/**
 * Check if email is unique
 */
export async function isEmailUnique(email: string): Promise<boolean> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  return !existingUser;
}

/**
 * Check if username is unique
 */
export async function isUsernameUnique(username: string): Promise<boolean> {
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });
  return !existingUser;
}

/**
 * Check if there's a pending invitation for an email
 */
export async function hasPendingInvitation(email: string): Promise<boolean> {
  const invitation = await prisma.invitation.findFirst({
    where: {
      email,
      acceptedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
  return !!invitation;
}

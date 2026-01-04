import { prisma } from "@stride/database";
import { UserRole } from "@stride/types";

/**
 * First-run detection and admin account creation logic
 */

/**
 * Check if this is the first run (no users exist)
 * @returns Promise<boolean> - True if no users exist
 */
export async function isFirstRun(): Promise<boolean> {
  const userCount = await prisma.user.count();
  return userCount === 0;
}

/**
 * Check if an admin user exists
 * @returns Promise<boolean> - True if at least one admin exists
 */
export async function hasAdminUser(): Promise<boolean> {
  const adminCount = await prisma.user.count({
    where: {
      role: UserRole.Admin,
    },
  });
  return adminCount > 0;
}

/**
 * Prevent multiple admin creation
 * Throws error if admin already exists
 * @throws Error if admin user already exists
 */
export async function ensureNoAdminExists(): Promise<void> {
  const adminExists = await hasAdminUser();
  if (adminExists) {
    throw new Error("Admin user already exists. Cannot create another admin.");
  }
}

/**
 * Get the first user (for first-run scenarios)
 * @returns Promise<User | null> - First user or null if none exists
 */
export async function getFirstUser() {
  const firstUser = await prisma.user.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });
  return firstUser;
}


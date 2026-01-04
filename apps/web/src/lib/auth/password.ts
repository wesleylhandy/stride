import bcrypt from "bcryptjs";

/**
 * Password hashing and verification utilities
 * Uses bcrypt for secure password hashing
 */

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a password meets minimum requirements
 * @param password - Password to validate
 * @returns Object with isValid flag and optional error message
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: "Password must be less than 128 characters",
    };
  }

  // Optional: Add more complexity requirements
  // For now, we keep it simple per security best practices
  // (length is more important than complexity)

  return { isValid: true };
}


import { prisma } from "@stride/database";
import jwt from "jsonwebtoken";
import type { UserRole } from "@stride/types";

// Validate JWT_SECRET - fail fast if not set (security critical)
const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it to a secure random value (min 32 characters).",
  );
}
// After validation, we know JWT_SECRET_ENV is a string
const JWT_SECRET: string = JWT_SECRET_ENV;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SESSION_EXPIRES_IN_DAYS = 7;

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Create a new session for a user
 * @param userId - User ID
 * @param email - User email
 * @param role - User role
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent string
 * @returns Session token
 */
export async function createSession(
  userId: string,
  email: string,
  role: UserRole,
  ipAddress?: string,
  userAgent?: string,
): Promise<string> {
  // Create JWT token
  const payload: SessionPayload = {
    userId,
    email,
    role,
  };

  // Type assertion needed because jwt.sign has complex overloads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (jwt.sign as any)(
    payload,
    String(JWT_SECRET),
    {
      expiresIn: String(JWT_EXPIRES_IN),
    },
  ) as string;

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRES_IN_DAYS);

  // Store session in database
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return token;
}

/**
 * Verify and validate a session token
 * @param token - Session token
 * @returns Session payload or null if invalid
 */
export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    // Verify JWT
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;

    // Check if session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // Verify user still exists and is active
    if (!session.user) {
      return null;
    }

    return {
      userId: session.userId,
      email: session.user.email,
      role: session.user.role as UserRole,
    };
  } catch (error) {
    // JWT verification failed
    return null;
  }
}

/**
 * Delete a session by token
 * @param token - Session token to delete
 */
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  });
}

/**
 * Delete all sessions for a user
 * @param userId - User ID
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Clean up expired sessions
 * Runs periodically to remove expired sessions from database
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Get session token from Authorization header
 * For API routes that use Bearer token authentication
 * 
 * NOTE: Do NOT use this for cookie-based authentication in server components.
 * Use cookies() API from next/headers instead.
 * 
 * @param headers - Request headers
 * @returns Token string or null
 */
export function getTokenFromHeaders(headers: Headers): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}


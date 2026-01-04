import { prisma } from "@stride/database";
import jwt from "jsonwebtoken";
import type { UserRole } from "@stride/types";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
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

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

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
 * Get session from request headers
 * Looks for token in Authorization header or cookie
 * @param headers - Request headers
 * @returns Token string or null
 */
export function getTokenFromHeaders(headers: Headers): string | null {
  // Check Authorization header
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check cookie (for browser-based auth)
  const cookieHeader = headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("session="));
    if (sessionCookie) {
      return sessionCookie.substring(8);
    }
  }

  return null;
}


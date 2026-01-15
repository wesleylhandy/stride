/**
 * Repository for ConfigurationAssistantSession management
 * Handles finding, creating, and updating assistant sessions
 */

import { prisma } from "@stride/database";
import type {
  ConfigurationAssistantSession,
  Prisma,
} from "@stride/database";

export interface CreateSessionInput {
  userId: string;
  projectId?: string | null;
  contextType: "project" | "infrastructure";
}

export interface UpdateSessionInput {
  // Only updatedAt is auto-updated by Prisma
  // Add other fields here if needed in the future
}

export interface SessionWithMessageCount extends ConfigurationAssistantSession {
  _count?: {
    messages: number;
  };
}

/**
 * Find or create a session for a user/project/context combination
 * If no session exists, creates a new one
 * If multiple sessions exist, returns the most recently updated one
 */
export async function findOrCreateSession(
  input: CreateSessionInput
): Promise<ConfigurationAssistantSession> {
  // Validate contextType constraints
  if (input.contextType === "project" && !input.projectId) {
    throw new Error("projectId is required when contextType is 'project'");
  }
  if (input.contextType === "infrastructure" && input.projectId) {
    throw new Error("projectId must be null when contextType is 'infrastructure'");
  }

  // Try to find existing session
  const existing = await prisma.configurationAssistantSession.findFirst({
    where: {
      userId: input.userId,
      projectId: input.projectId ?? null,
      contextType: input.contextType,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    // Update the session's updatedAt timestamp
    return prisma.configurationAssistantSession.update({
      where: { id: existing.id },
      data: {}, // Empty update just triggers updatedAt
    });
  }

  // Create new session
  return prisma.configurationAssistantSession.create({
    data: {
      userId: input.userId,
      projectId: input.projectId ?? null,
      contextType: input.contextType,
    },
  });
}

/**
 * Find a session by ID
 */
export async function findSessionById(
  id: string
): Promise<ConfigurationAssistantSession | null> {
  return prisma.configurationAssistantSession.findUnique({
    where: { id },
  });
}

/**
 * Update a session
 * Currently only updates updatedAt timestamp (handled by Prisma)
 * Can be extended to update other fields if needed
 */
export async function updateSession(
  id: string,
  input: UpdateSessionInput
): Promise<ConfigurationAssistantSession> {
  // For now, just trigger updatedAt update
  return prisma.configurationAssistantSession.update({
    where: { id },
    data: {}, // Empty update triggers updatedAt
  });
}

/**
 * Find all sessions for a user, optionally filtered by context type
 */
export async function findSessionsByUser(
  userId: string,
  options?: {
    contextType?: "project" | "infrastructure";
    limit?: number;
    includeMessageCount?: boolean;
  }
): Promise<SessionWithMessageCount[]> {
  const where: Prisma.ConfigurationAssistantSessionWhereInput = {
    userId,
  };

  if (options?.contextType) {
    where.contextType = options.contextType;
  }

  const include = options?.includeMessageCount
    ? {
        _count: {
          select: { messages: true },
        },
      }
    : undefined;

  const sessions = await prisma.configurationAssistantSession.findMany({
    where,
    include,
    orderBy: { updatedAt: "desc" },
    take: options?.limit,
  });
  
  return sessions.map(session => ({
    ...session,
    _count: options?.includeMessageCount ? (session as any)._count : undefined,
  })) as SessionWithMessageCount[];
}

/**
 * Delete a session (cascades to messages via Prisma)
 */
export async function deleteSession(id: string): Promise<void> {
  await prisma.configurationAssistantSession.delete({
    where: { id },
  });
}

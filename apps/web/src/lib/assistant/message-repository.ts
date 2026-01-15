/**
 * Repository for AssistantMessage management
 * Handles creating messages and retrieving conversation history
 */

import { prisma } from "@stride/database";
import type { AssistantMessage, Prisma } from "@stride/database";

export interface CreateMessageInput {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Prisma.JsonValue;
}

export interface PaginatedMessagesResult {
  messages: AssistantMessage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Create a new message in a session
 */
export async function createMessage(
  input: CreateMessageInput
): Promise<AssistantMessage> {
  // Validate role
  if (input.role !== "user" && input.role !== "assistant") {
    throw new Error(`Invalid role: ${input.role}. Must be 'user' or 'assistant'`);
  }

  // Validate content is not empty
  if (!input.content || input.content.trim().length === 0) {
    throw new Error("Message content cannot be empty");
  }

  return prisma.assistantMessage.create({
    data: {
      sessionId: input.sessionId,
      role: input.role,
      content: input.content.trim(),
      metadata: input.metadata ?? undefined,
    },
  });
}

/**
 * Find all messages for a session, ordered chronologically
 */
export async function findMessagesBySession(
  sessionId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<AssistantMessage[]> {
  return prisma.assistantMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: options?.limit,
    skip: options?.offset,
  });
}

/**
 * Get paginated messages for a session
 */
export async function paginateMessages(
  sessionId: string,
  options?: {
    page?: number;
    pageSize?: number;
  }
): Promise<PaginatedMessagesResult> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const [messages, total] = await Promise.all([
    prisma.assistantMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.assistantMessage.count({
      where: { sessionId },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    messages,
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Get the most recent N messages for a session (for context window)
 * Ordered by createdAt descending (newest first)
 */
export async function findRecentMessages(
  sessionId: string,
  limit: number
): Promise<AssistantMessage[]> {
  return prisma.assistantMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Find a message by ID
 */
export async function findMessageById(
  id: string
): Promise<AssistantMessage | null> {
  return prisma.assistantMessage.findUnique({
    where: { id },
  });
}

/**
 * Get total message count for a session
 */
export async function countMessagesBySession(
  sessionId: string
): Promise<number> {
  return prisma.assistantMessage.count({
    where: { sessionId },
  });
}

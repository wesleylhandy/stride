/**
 * Context management for AI assistant conversations
 * Implements sliding window strategy to prevent context window overflow
 */

import type { AssistantMessage } from "@stride/database";
import { findRecentMessages } from "./message-repository";

/**
 * Default number of recent messages to include in context window
 * This is the maximum number of messages (user + assistant pairs)
 * to include before the current message
 */
const DEFAULT_MESSAGE_WINDOW = 20;

export interface ConversationContext {
  messages: AssistantMessage[];
  totalMessages: number;
  windowSize: number;
}

/**
 * Build conversation context using sliding window strategy
 * Includes the most recent N messages plus the system prompt
 * 
 * @param sessionId - Session ID to retrieve messages from
 * @param windowSize - Number of recent messages to include (default: 20)
 * @returns Conversation context with messages ordered chronologically
 */
export async function buildConversationContext(
  sessionId: string,
  windowSize: number = DEFAULT_MESSAGE_WINDOW
): Promise<ConversationContext> {
  // Get recent messages (ordered by createdAt DESC, newest first)
  const recentMessages = await findRecentMessages(sessionId, windowSize);

  // Reverse to chronological order (oldest first) for prompt building
  const messages = recentMessages.reverse();

  // Get total message count for reference
  const { countMessagesBySession } = await import("./message-repository");
  const totalMessages = await countMessagesBySession(sessionId);

  return {
    messages,
    totalMessages,
    windowSize,
  };
}

/**
 * Build conversation context from provided messages
 * Useful when messages are already loaded
 * 
 * @param messages - Array of messages (can be in any order)
 * @param windowSize - Maximum number of messages to include (default: 20)
 * @returns Conversation context with messages ordered chronologically
 */
export function buildConversationContextFromMessages(
  messages: AssistantMessage[],
  windowSize: number = DEFAULT_MESSAGE_WINDOW
): ConversationContext {
  // Sort by createdAt ascending (oldest first)
  const sortedMessages = [...messages].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  // Take the last N messages (most recent)
  const windowedMessages = sortedMessages.slice(-windowSize);

  return {
    messages: windowedMessages,
    totalMessages: messages.length,
    windowSize,
  };
}

/**
 * Check if conversation has more messages than the window size
 * This can be used to inform the user that older messages are not included
 */
export function hasMoreMessages(
  context: ConversationContext
): boolean {
  return context.totalMessages > context.messages.length;
}

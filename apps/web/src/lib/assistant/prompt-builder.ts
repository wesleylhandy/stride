/**
 * Prompt builder for AI configuration assistant
 * Constructs prompts with system prompt, conversation history, documentation, and project context
 */

import type { AssistantMessage } from "@stride/database";
import { loadConfigAssistantPrompt } from "./load-config-assistant-prompt";
import type { ConversationContext } from "./context-manager";
import {
  retrieveDocumentation,
  formatDocumentationForPrompt,
  type RetrievedDocumentation,
} from "./doc-retrieval";
import {
  validateAndFormat,
  type ValidationFinding,
} from "./config-validator";
import {
  getGitHubRepositoryUrl,
  getDefaultBranch,
} from "./doc-url-mapper";

export interface PromptContext {
  conversationContext: ConversationContext;
  userQuery: string;
  projectConfigYaml?: string;
  projectConfigDatabase?: unknown;
  documentation?: RetrievedDocumentation[];
  infrastructureConfig?: unknown;
  validationContext?: {
    isValid: boolean;
    summary: string;
    findings: ValidationFinding[];
    schemaErrors?: Array<{
      message: string;
      path: (string | number)[];
      code: string;
    }>;
  };
}

export interface BuiltPrompt {
  systemPrompt: string;
  userMessage: string;
}

/**
 * Build the complete prompt for the AI configuration assistant
 * Includes: system prompt, conversation history, documentation, project context
 * 
 * @param context - Prompt context with conversation, query, and configuration data
 * @returns Built prompt with system prompt and user message
 */
export async function buildAssistantPrompt(
  context: PromptContext
): Promise<BuiltPrompt> {
  // Get GitHub repository URL from environment variables
  // This ensures the LLM uses the correct repository URL, not guessed domains
  // Pass to loadConfigAssistantPrompt which will inject it into the system prompt template
  const githubRepositoryUrl = getGitHubRepositoryUrl();
  const defaultBranch = getDefaultBranch();

  // Load system prompt from AI Gateway package with GitHub URL injected
  // System prompt template is cached, but parameters are injected on each call
  // The wrapper function reads from env vars if not provided, but we pass explicitly for clarity
  const systemPrompt = await loadConfigAssistantPrompt({
    githubRepositoryUrl: githubRepositoryUrl || undefined,
    defaultBranch,
  });

  // Build user message with all dynamic context
  // Order: Query first (most important), then config, docs, history
  const userMessage = buildUserMessage(context);

  return {
    systemPrompt,
    userMessage,
  };
}

/**
 * Build user message with conversation history and current query
 * Formats messages in a conversational format for the LLM
 * 
 * Context ordering (by priority/importance):
 * 1. User query (most important - LLM attention focuses on early content)
 * 2. Current configuration (needed to understand context)
 * 3. Relevant documentation (reference material)
 * 4. Conversation history (background context)
 */
function buildUserMessage(context: PromptContext): string {
  const parts: string[] = [];

  // 1. User query FIRST (most important - should be prominent)
  parts.push("## User Query\n\n");
  parts.push(context.userQuery);
  parts.push("\n");

  // 2. Current project configuration context (needed for understanding current state)
  if (context.projectConfigYaml) {
    parts.push("## Current Project Configuration (YAML)\n\n");
    parts.push("```yaml\n");
    parts.push(context.projectConfigYaml);
    parts.push("\n```\n\n");
  }

  if (context.projectConfigDatabase) {
    parts.push("## Current Project Configuration (Database)\n\n");
    parts.push("```json\n");
    parts.push(JSON.stringify(context.projectConfigDatabase, null, 2));
    parts.push("\n```\n\n");
  }

  // 2a. Configuration validation context (if validation was performed)
  if (context.validationContext) {
    parts.push("## Configuration Validation Results\n\n");
    parts.push(`**Status**: ${context.validationContext.isValid ? "✅ Valid" : "❌ Invalid"}\n\n`);
    parts.push(`**Summary**: ${context.validationContext.summary}\n\n`);

    if (context.validationContext.schemaErrors && context.validationContext.schemaErrors.length > 0) {
      parts.push("### Schema Validation Errors\n\n");
      for (const error of context.validationContext.schemaErrors) {
        const pathStr = error.path.length > 0 ? ` at path: ${error.path.join(".")}` : "";
        parts.push(`- **${error.code}**: ${error.message}${pathStr}\n`);
      }
      parts.push("\n");
    }

    if (context.validationContext.findings.length > 0) {
      parts.push("### Validation Findings\n\n");
      for (const finding of context.validationContext.findings) {
        const severityIcon =
          finding.severity === "critical"
            ? "🔴"
            : finding.severity === "high"
            ? "🟠"
            : finding.severity === "medium"
            ? "🟡"
            : "🔵";
        const pathStr =
          finding.path.length > 0 ? ` (path: ${finding.path.join(".")})` : "";
        parts.push(
          `${severityIcon} **${finding.type.toUpperCase()}**${pathStr}: ${finding.message}\n`
        );
        if (finding.recommendation) {
          parts.push(`   → **Recommendation**: ${finding.recommendation}\n`);
        }
        if (finding.documentationLink) {
          parts.push(`   → **See**: ${finding.documentationLink}\n`);
        }
        parts.push("\n");
      }
    }
    parts.push("\n");
  }

  // Add infrastructure configuration context if available
  if (context.infrastructureConfig) {
    parts.push("## Infrastructure Configuration\n\n");
    parts.push("```json\n");
    parts.push(JSON.stringify(context.infrastructureConfig, null, 2));
    parts.push("\n```\n\n");
  }

  // 3. Relevant documentation (reference material for answering)
  // IMPORTANT: Always reference these documentation sections when providing answers
  if (context.documentation && context.documentation.length > 0) {
    parts.push(formatDocumentationForPrompt(context.documentation));
    parts.push("\n");
  }

  // 4. Conversation history (background context, least priority)
  if (context.conversationContext.messages.length > 0) {
    parts.push("## Conversation History\n\n");
    
    // Format messages as a conversation
    for (const message of context.conversationContext.messages) {
      const roleLabel = message.role === "user" ? "User" : "Assistant";
      parts.push(`**${roleLabel}**: ${message.content}\n\n`);
    }

    // Note if there are more messages not included
    if (context.conversationContext.totalMessages > context.conversationContext.messages.length) {
      const excluded = context.conversationContext.totalMessages - context.conversationContext.messages.length;
      parts.push(`_Note: ${excluded} earlier message(s) not included in context._\n\n`);
    }
  }

  return parts.join("");
}

/**
 * Retrieve relevant documentation for a query and build prompt context
 * This is a convenience function that combines doc retrieval with prompt building
 */
export async function buildPromptWithDocumentation(
  baseContext: Omit<PromptContext, "documentation">,
  query: string,
  docLimit: number = 5
): Promise<BuiltPrompt> {
  // Retrieve relevant documentation
  const documentation = await retrieveDocumentation(query, docLimit);

  // Build prompt with documentation included
  return buildAssistantPrompt({
    ...baseContext,
    documentation,
  });
}

/**
 * Format conversation messages for prompt inclusion
 * Alternative simpler format - just the conversation without extra structure
 */
export function formatMessagesForPrompt(
  messages: AssistantMessage[]
): string {
  return messages
    .map((msg) => {
      const roleLabel = msg.role === "user" ? "User" : "Assistant";
      return `${roleLabel}: ${msg.content}`;
    })
    .join("\n\n");
}

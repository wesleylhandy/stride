/**
 * Token budgeting and estimation utilities for prompt context management
 * 
 * Implements token counting and budgeting to prevent context window overflow
 * and ensure optimal token allocation across different context sections.
 */

/**
 * Token budget limits by context section (in tokens)
 * These are conservative estimates to leave room for response tokens
 * 
 * Note: Actual token counts vary by model/encoding. This uses approximation:
 * ~4 characters per token (English text average)
 */
export const TOKEN_BUDGET = {
  /** System prompt tokens (should be static/cacheable) */
  system: 2000,
  /** User query tokens (typically short) */
  userQuery: 1000,
  /** Conversation history tokens (sliding window) */
  conversationHistory: 8000,
  /** Documentation tokens (relevant docs only) */
  documentation: 10000,
  /** Configuration tokens (YAML + JSON) */
  configuration: 5000,
  /** Total context budget (conservative for 32K context models) */
  total: 25000,
} as const;

/**
 * Rough token estimation (approximate)
 * Uses character-based approximation: ~4 characters per token for English text
 * 
 * For more accuracy, would need to use actual tokenizer (tiktoken for OpenAI, etc.)
 * but that adds dependency. This approximation is sufficient for budgeting.
 * 
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }
  
  // Rough estimate: ~4 characters per token for English text
  // Adjust for code/markdown (slightly higher token density)
  const avgCharsPerToken = text.includes('```') || text.includes('`') 
    ? 3.5  // Code/markdown has higher token density
    : 4.0;
  
  return Math.ceil(text.length / avgCharsPerToken);
}

/**
 * Token budget breakdown for context sections
 */
export interface TokenBreakdown {
  system: number;
  userQuery: number;
  conversationHistory: number;
  documentation: number;
  configuration: number;
  total: number;
}

/**
 * Check token budget for context sections
 * 
 * @param sections - Context sections with their content
 * @returns Budget check result with breakdown
 */
export function checkTokenBudget(sections: {
  system?: string;
  userQuery?: string;
  conversationHistory?: string;
  documentation?: string;
  configuration?: string;
}): {
  withinBudget: boolean;
  total: number;
  breakdown: TokenBreakdown;
  violations: Array<{ section: string; actual: number; limit: number }>;
} {
  const breakdown: TokenBreakdown = {
    system: sections.system ? estimateTokens(sections.system) : 0,
    userQuery: sections.userQuery ? estimateTokens(sections.userQuery) : 0,
    conversationHistory: sections.conversationHistory
      ? estimateTokens(sections.conversationHistory)
      : 0,
    documentation: sections.documentation
      ? estimateTokens(sections.documentation)
      : 0,
    configuration: sections.configuration
      ? estimateTokens(sections.configuration)
      : 0,
    total: 0,
  };

  breakdown.total =
    breakdown.system +
    breakdown.userQuery +
    breakdown.conversationHistory +
    breakdown.documentation +
    breakdown.configuration;

  // Check for section-level violations
  const violations: Array<{ section: string; actual: number; limit: number }> = [];
  
  if (breakdown.system > TOKEN_BUDGET.system) {
    violations.push({
      section: "system",
      actual: breakdown.system,
      limit: TOKEN_BUDGET.system,
    });
  }
  
  if (breakdown.userQuery > TOKEN_BUDGET.userQuery) {
    violations.push({
      section: "userQuery",
      actual: breakdown.userQuery,
      limit: TOKEN_BUDGET.userQuery,
    });
  }
  
  if (breakdown.conversationHistory > TOKEN_BUDGET.conversationHistory) {
    violations.push({
      section: "conversationHistory",
      actual: breakdown.conversationHistory,
      limit: TOKEN_BUDGET.conversationHistory,
    });
  }
  
  if (breakdown.documentation > TOKEN_BUDGET.documentation) {
    violations.push({
      section: "documentation",
      actual: breakdown.documentation,
      limit: TOKEN_BUDGET.documentation,
    });
  }
  
  if (breakdown.configuration > TOKEN_BUDGET.configuration) {
    violations.push({
      section: "configuration",
      actual: breakdown.configuration,
      limit: TOKEN_BUDGET.configuration,
    });
  }

  const withinBudget =
    breakdown.total <= TOKEN_BUDGET.total && violations.length === 0;

  return {
    withinBudget,
    total: breakdown.total,
    breakdown,
    violations,
  };
}

/**
 * Truncate text to fit within token budget
 * 
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens allowed
 * @param preserveEnd - If true, preserves the end of text (for conversation history)
 * @returns Truncated text with ellipsis indicator
 */
export function truncateToTokenBudget(
  text: string,
  maxTokens: number,
  preserveEnd: boolean = false
): string {
  const estimatedTokens = estimateTokens(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }

  const maxChars = Math.floor(maxTokens * 4); // Rough conversion back to chars

  if (preserveEnd) {
    // For conversation history, keep the most recent messages
    // Truncate from the beginning
    const truncated = text.slice(-maxChars);
    return `... [earlier content truncated] ...\n\n${truncated}`;
  } else {
    // For other content, truncate from the end
    const truncated = text.slice(0, maxChars);
    return `${truncated}\n\n... [content truncated to fit token budget]`;
  }
}

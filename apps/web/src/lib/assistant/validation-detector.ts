/**
 * Detect if user query is requesting configuration validation
 */

/**
 * Check if user query is requesting configuration validation
 * @param query - User query string
 * @returns true if query appears to be requesting validation
 */
export function isValidationRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();

  // Common validation request patterns
  const validationKeywords = [
    "validate",
    "validation",
    "review",
    "check",
    "verify",
    "audit",
    "analyze",
    "examine",
    "inspect",
    "validate my",
    "review my",
    "check my",
    "is my config",
    "is my configuration",
    "does my config",
    "does my configuration",
    "what's wrong with",
    "what is wrong with",
    "issues with",
    "problems with",
    "errors in",
    "validate configuration",
    "review configuration",
    "check configuration",
  ];

  // Check if query contains validation keywords
  return validationKeywords.some((keyword) => lowerQuery.includes(keyword));
}

// Main issue analysis logic
import type { IssueContext, ProjectConfig, AnalyzeIssueResponse, ProviderConfig } from '../types';
import { buildUserMessage } from './build-user-message';
import { loadSystemPrompt } from './load-prompt';
import { selectProvider } from './provider-selector';
import { mapPriority } from '../mappers/priority';
import { parseResponse } from './response-parser';

/**
 * Analyzes an issue and returns AI-generated triage suggestions
 * 
 * @param issueContext - Issue context (title, description, status, etc.)
 * @param projectConfig - Optional project configuration (priority values, etc.)
 * @param providerConfig - Optional provider configuration (if not provided, falls back to environment variables)
 */
export async function analyzeIssue(
  issueContext: IssueContext,
  projectConfig?: ProjectConfig,
  providerConfig?: ProviderConfig
): Promise<AnalyzeIssueResponse> {
  // Load system prompt
  const systemPrompt = await loadSystemPrompt();

  // Build user message from issue context
  const userMessage = buildUserMessage(issueContext, projectConfig);

  // Select provider (use provided config or fall back to environment variables)
  const selectedProvider = selectProvider(providerConfig);

  // Call LLM provider
  const rawResponse = await selectedProvider.client.createCompletion({
    systemPrompt,
    userMessage,
    model: selectedProvider.model,
  });

  // Parse and validate response
  const parsedResponse = parseResponse(rawResponse);

  // Map priority to project config values if needed
  const priority = mapPriority(parsedResponse.priority, projectConfig?.priorityValues);

  return {
    summary: parsedResponse.summary,
    priority,
    suggestedAssignee: parsedResponse.suggestedAssignee,
  };
}

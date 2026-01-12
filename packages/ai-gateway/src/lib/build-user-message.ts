// User message builder for LLM requests
import type { IssueContext, ProjectConfig } from '../types';

/**
 * Constructs structured user message from issue context payload
 * Includes: title, description, status, customFields (JSON), errorTraces (if available),
 * recentComments (last 5-10), plus project-specific context injection:
 * - priorityValues
 * - workflowRules (if available)
 * - customFieldDefinitions (if available)
 */
export function buildUserMessage(
  issueContext: IssueContext,
  projectConfig?: ProjectConfig
): string {
  const parts: string[] = [];

  // Issue title and description
  parts.push(`Issue Title: ${issueContext.title}`);
  parts.push(`Description: ${issueContext.description}`);
  parts.push(`Current Status: ${issueContext.status}`);

  // Custom fields
  if (issueContext.customFields && Object.keys(issueContext.customFields).length > 0) {
    parts.push('\nCustom Fields:');
    for (const [key, value] of Object.entries(issueContext.customFields)) {
      parts.push(`- ${key}: ${JSON.stringify(value)}`);
    }
  }

  // Error traces if available
  if (issueContext.errorTraces) {
    parts.push('\nError Traces:');
    parts.push(issueContext.errorTraces);
  }

  // Recent comments (limit to last 5-10)
  if (issueContext.recentComments && issueContext.recentComments.length > 0) {
    // Limit to last 10 comments, ordered by timestamp (most recent first)
    const recentComments = issueContext.recentComments.slice(0, 10);
    parts.push('\nRecent Comments:');
    for (const comment of recentComments) {
      const author = comment.author ? ` (by ${comment.author})` : '';
      const timestamp = comment.timestamp ? ` [${comment.timestamp}]` : '';
      parts.push(`- ${comment.body}${author}${timestamp}`);
    }
  }

  // Project-specific context injection
  if (projectConfig) {
    // Priority values
    if (projectConfig.priorityValues && projectConfig.priorityValues.length > 0) {
      parts.push('\n---');
      parts.push('Project Priority Values:');
      parts.push(projectConfig.priorityValues.join(', '));
      parts.push('Please match the priority to one of these exact values.');
    }

    // Workflow rules (if provided)
    if (projectConfig.workflowRules) {
      parts.push('\n---');
      parts.push('Project Workflow Rules:');
      if (typeof projectConfig.workflowRules === 'string') {
        parts.push(projectConfig.workflowRules);
      } else {
        parts.push(JSON.stringify(projectConfig.workflowRules, null, 2));
      }
    }

    // Custom field definitions (if provided)
    if (projectConfig.customFieldDefinitions) {
      parts.push('\n---');
      parts.push('Project Custom Field Definitions:');
      if (typeof projectConfig.customFieldDefinitions === 'string') {
        parts.push(projectConfig.customFieldDefinitions);
      } else {
        parts.push(JSON.stringify(projectConfig.customFieldDefinitions, null, 2));
      }
      parts.push('Use these definitions to better understand custom field values.');
    }
  }

  return parts.join('\n');
}

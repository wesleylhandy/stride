// AI triage issue context payload builder and HTTP client
import type { ProjectConfig } from '@stride/types';
import { getPriorityValues } from '@stride/yaml-config';
import { getAIGatewayUrl } from '@/lib/ai/gateway-url';
import { prisma } from '@stride/database';

/**
 * Issue context for AI gateway
 * Matches the IssueContext interface in ai-gateway package
 */
export interface IssueContextPayload {
  title: string;
  description: string;
  status: string;
  customFields?: Record<string, unknown>;
  errorTraces?: string;
  recentComments?: Array<{
    body: string;
    author?: string;
    timestamp?: string;
  }>;
}

/**
 * Project config for AI gateway
 * Extracted from project configuration for AI context
 */
export interface ProjectConfigPayload {
  priorityValues?: string[];
  workflowRules?: string | Record<string, unknown>;
  customFieldDefinitions?: string | Record<string, unknown>;
}

/**
 * Provider configuration for AI Gateway
 */
export interface ProviderConfigPayload {
  type: 'openai' | 'anthropic' | 'google-gemini' | 'ollama';
  model?: string;
  apiKey?: string; // For cloud providers
  endpointUrl?: string; // For self-hosted providers
  authToken?: string; // Optional auth token for self-hosted providers
}

/**
 * AI Gateway request payload
 */
export interface AIGatewayRequest {
  issueContext: IssueContextPayload;
  projectConfig?: ProjectConfigPayload;
  providerConfig?: ProviderConfigPayload; // Optional provider configuration
}

/**
 * AI Gateway response
 */
export interface AIGatewayResponse {
  summary: string;
  priority: string;
  suggestedAssignee: string;
}

/**
 * Build issue context payload from Issue object
 * Extracts: title, description, status, customFields (JSON), errorTraces (if available),
 * recentComments (last 5-10 ordered by timestamp)
 */
export async function buildIssueContext(issue: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  customFields: unknown;
}): Promise<IssueContextPayload> {
  // Extract error traces from customFields or linked error webhook data
  // Error traces might be stored in customFields under keys like 'error_trace', 'stack_trace', etc.
  let errorTraces: string | undefined;
  
  // Convert customFields to Record if it's an object
  const customFieldsObj = issue.customFields && typeof issue.customFields === 'object' && !Array.isArray(issue.customFields)
    ? issue.customFields as Record<string, unknown>
    : null;
  
  if (customFieldsObj) {
    // Look for common error trace keys
    const errorKeys = ['error_trace', 'stack_trace', 'error_stack', 'exception', 'error_details'];
    for (const key of errorKeys) {
      if (customFieldsObj[key]) {
        const errorValue = customFieldsObj[key];
        if (typeof errorValue === 'string') {
          errorTraces = errorValue;
          break;
        } else if (typeof errorValue === 'object' && errorValue !== null) {
          errorTraces = JSON.stringify(errorValue, null, 2);
          break;
        }
      }
    }
  }

  // Fetch recent comments (last 5-10, ordered by timestamp descending)
  const comments = await prisma.comment.findMany({
    where: {
      issueId: issue.id,
      isSystem: false, // Exclude system comments
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10, // Get up to 10 most recent comments
  });

  // Map comments to expected format
  const recentComments = comments.map((comment) => ({
    body: comment.content,
    author: comment.user?.name || comment.user?.email || 'Unknown',
    timestamp: comment.createdAt.toISOString(),
  }));

  return {
    title: issue.title,
    description: issue.description || '',
    status: issue.status,
    customFields: customFieldsObj && Object.keys(customFieldsObj).length > 0 
      ? customFieldsObj 
      : undefined,
    errorTraces,
    recentComments: recentComments.length > 0 ? recentComments : undefined,
  };
}

/**
 * Extract priority values from project configuration
 * Uses priority-extractor to get custom priority values or standard defaults
 */
export function extractPriorityValuesFromConfig(config: ProjectConfig): string[] {
  try {
    return getPriorityValues(config);
  } catch (error) {
    console.error('Error extracting priority values from config:', error);
    // Fallback to standard priorities
    return ['low', 'medium', 'high'];
  }
}

/**
 * Build project config payload from ProjectConfig
 * Extracts priorityValues, workflowRules, customFieldDefinitions
 */
export function buildProjectConfigPayload(
  config: ProjectConfig
): ProjectConfigPayload {
  const priorityValues = extractPriorityValuesFromConfig(config);

  return {
    priorityValues: priorityValues.length > 0 ? priorityValues : undefined,
    // Include workflow rules if available (status transitions, etc.)
    workflowRules: config.workflow ? JSON.stringify(config.workflow, null, 2) : undefined,
    // Include custom field definitions for context (convert array to JSON string)
    customFieldDefinitions: config.custom_fields && config.custom_fields.length > 0
      ? JSON.stringify(config.custom_fields, null, 2)
      : undefined,
  };
}

/**
 * HTTP client for AI Gateway
 * Handles errors and timeout (30 seconds per SC-011)
 */
export async function callAIGateway(
  request: AIGatewayRequest
): Promise<AIGatewayResponse> {
  const gatewayUrl = await getAIGatewayUrl();

  if (!gatewayUrl) {
    throw new Error('AI Gateway is not configured. Please configure AI_GATEWAY_URL environment variable.');
  }

  const url = `${gatewayUrl}/analyze-issue`;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `AI Gateway error: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json() as AIGatewayResponse;

    // Validate response structure
    if (!data.summary || !data.priority || !data.suggestedAssignee) {
      throw new Error('Invalid AI Gateway response: missing required fields');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('AI Gateway request timed out after 30 seconds');
      }
      throw error;
    }

    throw new Error('Unknown error calling AI Gateway');
  }
}

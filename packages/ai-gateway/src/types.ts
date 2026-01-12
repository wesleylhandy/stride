// Type definitions for AI Gateway service

export interface IssueContext {
  title: string;
  description: string;
  status: string;
  customFields?: Record<string, unknown>;
  errorTraces?: string;
  recentComments?: Comment[];
}

export interface Comment {
  body: string;
  author?: string;
  timestamp?: string;
}

export interface ProjectConfig {
  priorityValues?: string[];
  workflowRules?: string | Record<string, unknown>;
  customFieldDefinitions?: string | Record<string, unknown>;
}

export interface AnalyzeIssueRequest {
  issueContext: IssueContext;
  projectConfig?: ProjectConfig;
  providerConfig?: ProviderConfig; // Optional provider configuration (if not provided, falls back to environment variables)
}

export interface AnalyzeIssueResponse {
  summary: string;
  priority: string;
  suggestedAssignee: string;
}

export type ProviderType = 'openai' | 'anthropic' | 'google-gemini' | 'ollama' | 'mock';

export interface ProviderConfig {
  type: ProviderType;
  model?: string;
  apiKey?: string; // For cloud providers (OpenAI, Anthropic, Google Gemini)
  endpointUrl?: string; // For self-hosted providers (Ollama)
  authToken?: string; // Optional auth token for self-hosted providers
}

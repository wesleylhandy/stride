// Configuration assistant system prompt loader
import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

let cachedPromptTemplate: string | null = null;

export interface PromptParameters {
  githubRepositoryUrl?: string;
  defaultBranch?: string;
}

/**
 * Loads configuration assistant system prompt from markdown file
 * Injects dynamic parameters (like GitHub repository URL) into the prompt template
 * Caches template in memory, but injects parameters on each call
 * Handles file read errors gracefully - logs error, falls back to default prompt
 * 
 * @param parameters - Optional parameters to inject into the prompt template
 * @returns System prompt with parameters injected
 */
export async function loadConfigAssistantPrompt(
  parameters?: PromptParameters
): Promise<string> {
  // Load and cache template (without parameters)
  if (!cachedPromptTemplate) {
    const promptPath = join(__dirname, '../../prompts/configuration-assistant-prompt.md');
    
    try {
      // Check if file exists
      if (!existsSync(promptPath)) {
        console.error(`Configuration assistant prompt file not found at: ${promptPath}`);
        console.error('Falling back to default prompt. Service will continue but prompt file should be present.');
        cachedPromptTemplate = getDefaultPromptTemplate();
      } else {
        // Read prompt template file
        cachedPromptTemplate = readFileSync(promptPath, 'utf-8');
        
        if (!cachedPromptTemplate || cachedPromptTemplate.trim().length === 0) {
          console.error('Configuration assistant prompt file is empty');
          console.error('Falling back to default prompt. Service will continue but prompt file should be populated.');
          cachedPromptTemplate = getDefaultPromptTemplate();
        } else {
          console.log('Configuration assistant prompt template loaded successfully from file');
        }
      }
    } catch (error) {
      console.error('Error loading configuration assistant prompt file:', error);
      console.error('Falling back to default prompt. Service will continue but prompt file should be accessible.');
      cachedPromptTemplate = getDefaultPromptTemplate();
    }
  }

  // Inject parameters into template
  let prompt = cachedPromptTemplate;
  
  if (parameters?.githubRepositoryUrl) {
    const branch = parameters.defaultBranch || 'main';
    const repoUrl = parameters.githubRepositoryUrl;
    
    // Replace placeholders in template
    prompt = prompt.replace(/\{\{GITHUB_REPOSITORY_URL\}\}/g, repoUrl);
    prompt = prompt.replace(/\{\{DEFAULT_BRANCH\}\}/g, branch);
    prompt = prompt.replace(/\{\{GITHUB_DOCS_BASE_URL\}\}/g, `${repoUrl}/tree/${branch}/docs`);
  } else {
    // If no GitHub URL provided, remove placeholder references or use fallback
    prompt = prompt.replace(/\{\{GITHUB_REPOSITORY_URL\}\}/g, '');
    prompt = prompt.replace(/\{\{DEFAULT_BRANCH\}\}/g, 'main');
    prompt = prompt.replace(/\{\{GITHUB_DOCS_BASE_URL\}\}/g, '');
  }

  return prompt;
}

/**
 * Default prompt template fallback if file cannot be loaded
 * This ensures service can start even if prompt file is missing
 */
function getDefaultPromptTemplate(): string {
  return `You are an AI configuration assistant for Stride, a project management and issue tracking system.

Your role is to help administrators configure projects, workflows, custom fields, automation rules, and infrastructure settings through conversational guidance.

Provide clear, actionable instructions for configuration tasks. Reference documentation when available. Validate configurations against schema requirements. Detect and warn about conflicts with existing configuration.

Respond in natural language (markdown supported) with clear explanations. When providing configuration suggestions, include the configuration snippet, explanation, documentation references, and any warnings or considerations.`;
}

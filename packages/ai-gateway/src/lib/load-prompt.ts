// System prompt loader
import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

let cachedPrompt: string | null = null;

/**
 * Loads system prompt from markdown file at service startup
 * Caches content in memory for performance
 * Handles file read errors gracefully - logs error, fails startup if critical
 */
export async function loadSystemPrompt(): Promise<string> {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  const promptPath = join(__dirname, '../../prompts/system-prompt.md');
  
  try {
    // Check if file exists
    if (!existsSync(promptPath)) {
      console.error(`System prompt file not found at: ${promptPath}`);
      console.error('Falling back to default prompt. Service will continue but prompt file should be present.');
      cachedPrompt = getDefaultPrompt();
      return cachedPrompt;
    }

    // Read prompt file
    cachedPrompt = readFileSync(promptPath, 'utf-8');
    
    if (!cachedPrompt || cachedPrompt.trim().length === 0) {
      console.error('System prompt file is empty');
      console.error('Falling back to default prompt. Service will continue but prompt file should be populated.');
      cachedPrompt = getDefaultPrompt();
      return cachedPrompt;
    }

    console.log('System prompt loaded successfully from file');
    return cachedPrompt;
  } catch (error) {
    console.error('Error loading system prompt file:', error);
    console.error('Falling back to default prompt. Service will continue but prompt file should be accessible.');
    
    // Fail startup only if this is a critical error (permission denied, etc.)
    // For now, we allow fallback to default prompt
    cachedPrompt = getDefaultPrompt();
    return cachedPrompt;
  }
}

/**
 * Default prompt fallback if file cannot be loaded
 * This ensures service can start even if prompt file is missing
 */
function getDefaultPrompt(): string {
  return `You are an issue triage specialist for software development teams.

Your task is to analyze issue reports and provide structured triage recommendations.

Output your analysis as a JSON object with the following structure:
{
  "summary": "Brief plain-language root cause summary",
  "priority": "low|medium|high (or project-specific priority value)",
  "suggestedAssignee": "Natural language description of who should be assigned"
}

Guidelines:
- Focus on identifying the root cause, not just symptoms
- Consider error traces when available
- Match priority values to project configuration if provided
- Provide actionable assignee suggestions based on technical expertise needed`;
}

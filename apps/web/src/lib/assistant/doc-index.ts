/**
 * Documentation index mapping topics to markdown file paths and sections
 * Used by the AI configuration assistant to retrieve relevant documentation
 */

export interface DocumentationReference {
  file: string;
  section?: string;
  topics: string[];
  description: string;
  webUrl?: string; // Optional web URL if doc is served via Next.js routes
}

/**
 * Documentation index mapping topics to file paths and sections
 * Topics are keywords that can be matched against user queries
 */
export const DOCUMENTATION_INDEX: DocumentationReference[] = [
  // Configuration documentation
  {
    file: 'docs/configuration/README.md',
    topics: ['configuration', 'config', 'yaml', 'setup', 'project setup', 'getting started'],
    description: 'Overview of Stride project configuration',
  },
  {
    file: 'docs/configuration/reference.md',
    section: 'overview',
    topics: [
      'schema',
      'reference',
      'configuration schema',
      'yaml schema',
      'project configuration',
    ],
    description: 'Configuration reference - Overview',
  },
  {
    file: 'docs/configuration/reference.md',
    section: 'project-configuration-schema',
    topics: [
      'project_key',
      'project_name',
      'project identifier',
      'issue key',
      'project setup',
    ],
    description: 'Configuration reference - Project configuration schema',
  },
  {
    file: 'docs/configuration/reference.md',
    section: 'workflow-configuration',
    topics: [
      'workflow',
      'status',
      'statuses',
      'default_status',
      'status types',
      'open status',
      'in_progress status',
      'closed status',
      'status configuration',
      'workflow statuses',
    ],
    description: 'Configuration reference - Workflow configuration',
  },
  {
    file: 'docs/configuration/reference.md',
    section: 'transitions',
    topics: [
      'transitions',
      'transition rules',
      'status transitions',
      'workflow rules',
      'status flow',
      'allowed transitions',
    ],
    description: 'Configuration reference - Status transitions',
  },
  {
    file: 'docs/configuration/reference.md',
    section: 'custom-fields',
    topics: [
      'custom fields',
      'field types',
      'dropdown',
      'select field',
      'text field',
      'number field',
      'date field',
      'boolean field',
      'required fields',
      'field validation',
      'field options',
    ],
    description: 'Configuration reference - Custom fields',
  },
  {
    file: 'docs/configuration/reference.md',
    section: 'automation',
    topics: [
      'automation',
      'automation rules',
      'webhooks',
      'auto-assignment',
      'workflow automation',
    ],
    description: 'Configuration reference - Automation rules',
  },
  {
    file: 'docs/configuration/examples.md',
    topics: [
      'examples',
      'templates',
      'kanban',
      'kanban workflow',
      'sprint',
      'sprint workflow',
      'bug tracking',
      'bug tracker',
      'sample config',
      'example workflow',
      'configuration template',
      'starter config',
    ],
    description: 'Validated configuration examples for common use cases',
  },
  {
    file: 'docs/configuration/troubleshooting.md',
    topics: [
      'troubleshooting',
      'errors',
      'validation errors',
      'common issues',
      'debugging',
      'fix',
      'configuration problems',
      'workflow errors',
      'field errors',
    ],
    description: 'Common configuration errors and how to resolve them',
  },
  {
    file: 'docs/board-status-configuration-guide.md',
    topics: [
      'board',
      'kanban board',
      'board configuration',
      'status configuration',
      'workflow board',
      'move issues',
      'drag and drop',
      'status blocks',
    ],
    description: 'Detailed guide for configuring Kanban board workflows',
  },
  {
    file: 'docs/board-status-configuration-guide.md',
    section: 'understanding-the-error',
    topics: [
      'invalid configuration error',
      'status not defined',
      'status key mismatch',
      'workflow error',
      'configuration error',
    ],
    description: 'Board configuration - Understanding configuration errors',
  },
  {
    file: 'docs/board-status-configuration-guide.md',
    section: 'required-configuration-structure',
    topics: [
      'required configuration',
      'workflow structure',
      'minimum configuration',
      'basic setup',
    ],
    description: 'Board configuration - Required configuration structure',
  },

  // Infrastructure documentation
  {
    file: 'docs/deployment/infrastructure-configuration.md',
    topics: [
      'infrastructure',
      'deployment',
      'environment variables',
      'server config',
      'system config',
      'global settings',
      'infrastructure settings',
      'precedence',
      'env vars override',
      'configuration precedence',
    ],
    description: 'Infrastructure and deployment configuration guide',
  },
  {
    file: 'docs/ENVIRONMENT_VARIABLES.md',
    topics: [
      'environment variables',
      'env vars',
      'configuration',
      'settings',
      'environment',
    ],
    description: 'Environment variable reference',
  },

  // Integration documentation
  {
    file: 'docs/integrations/ai-providers.md',
    topics: [
      'ai provider',
      'openai',
      'anthropic',
      'ollama',
      'llm',
      'ai gateway',
      'ai configuration',
      'api key',
      'ai gateway url',
      'llm endpoint',
      'provider setup',
      'configure ai',
    ],
    description: 'AI provider setup and configuration guide',
  },
  {
    file: 'docs/integrations/git-oauth.md',
    topics: [
      'oauth',
      'github',
      'gitlab',
      'bitbucket',
      'git integration',
      'repository',
      'oauth setup',
      'github oauth',
      'gitlab oauth',
      'oauth app',
      'client id',
      'client secret',
      'callback url',
      'redirect uri',
    ],
    description: 'Git OAuth provider setup guide',
  },
  {
    file: 'docs/integrations/monitoring-webhooks.md',
    topics: [
      'webhooks',
      'monitoring',
      'sentry',
      'datadog',
      'new relic',
      'error tracking',
    ],
    description: 'Monitoring webhook integration setup',
  },
  {
    file: 'docs/integrations/sentry.md',
    topics: ['sentry', 'error tracking', 'sentry integration'],
    description: 'Sentry integration details',
  },
  {
    file: 'docs/integrations/smtp.md',
    topics: ['smtp', 'email', 'email configuration', 'notifications'],
    description: 'SMTP email configuration',
  },

  // User documentation
  {
    file: 'docs/user/ai-triage.md',
    topics: [
      'ai triage',
      'triage',
      'issue triage',
      'ai assistant',
      'automated triage',
      'automatic triage',
      'issue labeling',
    ],
    description: 'AI triage feature documentation',
  },
  
  // Development documentation
  {
    file: 'docs/development/README.md',
    topics: [
      'development',
      'dev setup',
      'local development',
      'contributing',
      'developer guide',
    ],
    description: 'Development setup and contributing guide',
  },
  {
    file: 'docs/development/troubleshooting.md',
    topics: [
      'development troubleshooting',
      'dev issues',
      'local setup problems',
      'development errors',
    ],
    description: 'Development troubleshooting guide',
  },

  // Deployment documentation
  {
    file: 'docs/deployment/docker.md',
    topics: ['docker', 'container', 'deployment', 'docker compose'],
    description: 'Docker deployment guide',
  },
  {
    file: 'docs/install.md',
    topics: ['installation', 'install', 'setup', 'getting started'],
    description: 'Installation and setup guide',
  },
];

/**
 * Find documentation references matching query keywords
 * Enhanced to better match queries with multiple terms and synonyms
 * @param query - User query string
 * @returns Array of matching documentation references (sorted by relevance)
 */
export function findDocumentation(query: string): DocumentationReference[] {
  const queryLower = query.toLowerCase().trim();
  
  // Expand query with synonyms and common variations
  const synonyms: Record<string, string[]> = {
    'config': ['configuration', 'setup', 'settings'],
    'workflow': ['process', 'status', 'statuses', 'board'],
    'field': ['custom field', 'attribute', 'property'],
    'status': ['state', 'stage', 'phase'],
    'issue': ['ticket', 'task', 'bug', 'story'],
  };

  // Build expanded keywords list
  const keywords = queryLower.split(/\s+/);
  const expandedKeywords = new Set<string>(keywords);
  
  for (const keyword of keywords) {
    for (const [key, values] of Object.entries(synonyms)) {
      if (keyword.includes(key) || values.some(v => keyword.includes(v))) {
        expandedKeywords.add(key);
        values.forEach(v => expandedKeywords.add(v));
      }
    }
  }

  // Score and filter documentation references
  const scoredDocs = DOCUMENTATION_INDEX.map((doc) => {
    let score = 0;
    const docTopicsLower = doc.topics.map((t) => t.toLowerCase());
    const descriptionLower = doc.description.toLowerCase();

    for (const keyword of expandedKeywords) {
      // Exact topic match (highest score)
      if (docTopicsLower.some((topic) => topic === keyword)) {
        score += 10;
      }
      // Topic contains keyword or vice versa
      else if (docTopicsLower.some((topic) => topic.includes(keyword) || keyword.includes(topic))) {
        score += 5;
      }
      // Partial topic match (word boundary)
      else if (docTopicsLower.some((topic) => topic.split(/\s+/).includes(keyword))) {
        score += 3;
      }
      
      // Description match
      if (descriptionLower.includes(keyword)) {
        score += 1;
      }
    }

    return { doc, score };
  });

  // Filter out zero-score docs and sort by score (highest first)
  return scoredDocs
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.doc);
}

/**
 * Get documentation reference by file path
 * @param filePath - Documentation file path
 * @returns Documentation reference or undefined
 */
export function getDocumentationByPath(
  filePath: string
): DocumentationReference | undefined {
  return DOCUMENTATION_INDEX.find((doc) => doc.file === filePath);
}

/**
 * Get all documentation references
 * @returns All documentation references
 */
export function getAllDocumentation(): DocumentationReference[] {
  return DOCUMENTATION_INDEX;
}

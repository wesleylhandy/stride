// Default configuration generator
import type { ProjectConfig } from './schema';

/**
 * Generates a default project configuration
 * @param projectKey - Project key (e.g., "APP")
 * @param projectName - Project name
 * @returns Default configuration object
 */
export function generateDefaultConfig(
  projectKey: string,
  projectName: string
): ProjectConfig {
  return {
    project_key: projectKey,
    project_name: projectName,
    workflow: {
      default_status: 'todo',
      statuses: [
        {
          key: 'todo',
          name: 'To Do',
          type: 'open',
        },
        {
          key: 'in_progress',
          name: 'In Progress',
          type: 'in_progress',
        },
        {
          key: 'in_review',
          name: 'In Review',
          type: 'in_progress',
        },
        {
          key: 'done',
          name: 'Done',
          type: 'closed',
        },
      ],
    },
    custom_fields: [
      {
        key: 'priority',
        name: 'Priority',
        type: 'dropdown',
        options: ['Low', 'Medium', 'High', 'Critical'],
        required: false,
      },
    ],
    automation_rules: [],
  };
}


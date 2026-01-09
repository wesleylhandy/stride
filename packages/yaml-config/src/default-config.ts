// Default configuration generator
import type { ProjectConfig } from './schema';

/**
 * Generates a default project configuration
 * 
 * This configuration is designed to be maximally permissive, allowing teams
 * to get started immediately without configuration barriers. It includes:
 * - Common workflow statuses covering typical development patterns
 * - A "reopened" status to allow reopening closed issues
 * - No required custom fields that could block status transitions
 * - No explicit transition rules (all transitions allowed by default)
 * 
 * Teams can customize this configuration later to add restrictions:
 * - Add `transitions` arrays to status definitions to enforce workflow rules
 *   Example: Prevent moving from "To Do" to "Done" without review:
 *   ```yaml
 *   - key: todo
 *     transitions: [in_progress, in_review]  # Cannot skip to done
 *   ```
 * - Mark custom fields as required to enforce data collection
 * - Add automation rules for Git integration
 * 
 * @param projectKey - Project key (e.g., "APP")
 * @param projectName - Project name
 * @returns Default configuration object (permissive - all transitions allowed)
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
        {
          key: 'reopened',
          name: 'Reopened',
          type: 'in_progress',
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


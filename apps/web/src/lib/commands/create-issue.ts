import type { Command } from '@stride/ui';
import { commandRegistry } from './registry';

/**
 * Create issue command for command palette
 * Opens the issue creation form or navigates to create issue page
 */
export function createCreateIssueCommand(
  onAction: (projectId?: string) => void,
): Command {
  return {
    id: 'create-issue',
    label: 'Create Issue',
    description: 'Create a new issue',
    keywords: ['new', 'issue', 'create', 'add'],
    group: 'Issues',
    action: () => {
      onAction();
    },
  };
}

/**
 * Register create issue command
 */
export function registerCreateIssueCommand(
  onAction: (projectId?: string) => void,
): void {
  const command = createCreateIssueCommand(onAction);
  commandRegistry.register(command);
}

/**
 * Unregister create issue command
 */
export function unregisterCreateIssueCommand(): void {
  commandRegistry.unregister('create-issue');
}


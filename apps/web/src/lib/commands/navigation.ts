import type { Command } from '@stride/ui';
import { commandRegistry } from './registry';

/**
 * Navigation command for command palette
 */
export interface NavigationCommandOptions {
  onNavigate: (path: string) => void;
}

/**
 * Create navigation commands
 */
export function createNavigationCommands(
  options: NavigationCommandOptions,
): Command[] {
  return [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'Navigate to the dashboard',
      keywords: ['dashboard', 'home', 'main'],
      group: 'Navigation',
      action: () => {
        options.onNavigate('/');
      },
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      description: 'Navigate to projects list',
      keywords: ['projects', 'list'],
      group: 'Navigation',
      action: () => {
        options.onNavigate('/projects');
      },
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Navigate to settings',
      keywords: ['settings', 'config', 'preferences'],
      group: 'Navigation',
      action: () => {
        options.onNavigate('/settings');
      },
    },
  ];
}

/**
 * Register navigation commands
 */
export function registerNavigationCommands(
  options: NavigationCommandOptions,
): void {
  const commands = createNavigationCommands(options);
  commands.forEach((command) => {
    commandRegistry.register(command);
  });
}

/**
 * Unregister navigation commands
 */
export function unregisterNavigationCommands(): void {
  const commandIds = ['nav-dashboard', 'nav-projects', 'nav-settings'];
  commandIds.forEach((id) => {
    commandRegistry.unregister(id);
  });
}


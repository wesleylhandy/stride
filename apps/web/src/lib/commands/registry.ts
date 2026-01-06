import type { Command } from '@stride/ui';

/**
 * Command registry for managing available commands in the command palette
 */
class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private groups: Set<string> = new Set();

  /**
   * Register a new command
   */
  register(command: Command): void {
    this.commands.set(command.id, command);
    if (command.group) {
      this.groups.add(command.group);
    }
  }

  /**
   * Unregister a command
   */
  unregister(commandId: string): void {
    this.commands.delete(commandId);
  }

  /**
   * Get all registered commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by group
   */
  getByGroup(group: string): Command[] {
    return this.getAll().filter((cmd) => cmd.group === group);
  }

  /**
   * Get all groups
   */
  getGroups(): string[] {
    return Array.from(this.groups);
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
    this.groups.clear();
  }
}

// Export singleton instance
export const commandRegistry = new CommandRegistry();


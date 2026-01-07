'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CommandPalette } from '@stride/ui';
import { commandRegistry } from '@/lib/commands/registry';
import {
  registerNavigationCommands,
  unregisterNavigationCommands,
} from '@/lib/commands/navigation';
import {
  registerRecentItemsCommands,
  refreshRecentItemsCommands,
} from '@/lib/commands/recent';
import {
  registerCreateIssueCommand,
  unregisterCreateIssueCommand,
} from '@/lib/commands/create-issue';

/**
 * CommandPaletteProvider component
 * 
 * Manages command palette state and registers commands
 */
export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  // Handle navigation
  const handleNavigate = React.useCallback((path: string) => {
    router.push(path);
    setIsOpen(false);
  }, [router]);

  // Handle create issue
  const handleCreateIssue = React.useCallback(() => {
    // Navigate to create issue page or open modal
    // For now, navigate to projects page (can be enhanced later)
    router.push('/projects');
    setIsOpen(false);
  }, [router]);

  // Register commands on mount
  React.useEffect(() => {
    // Register navigation commands
    registerNavigationCommands({ onNavigate: handleNavigate });

    // Register create issue command
    registerCreateIssueCommand(handleCreateIssue);

    // Register recent items commands
    const unregisterRecent = registerRecentItemsCommands(handleNavigate);

    // Cleanup on unmount
    return () => {
      unregisterNavigationCommands();
      unregisterCreateIssueCommand();
      unregisterRecent();
    };
  }, [handleNavigate, handleCreateIssue]);

  // Refresh recent items when route changes
  React.useEffect(() => {
    const unregisterRecent = refreshRecentItemsCommands(handleNavigate);
    return unregisterRecent;
  }, [router, handleNavigate]);

  // Handle keyboard shortcut (Cmd/Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Get all commands from registry
  const commands = React.useMemo(() => {
    return commandRegistry.getAll();
  }, [isOpen]); // Refresh when palette opens

  return (
    <>
      {children}
      {isOpen && (
        <CommandPalette
          open={isOpen}
          onClose={() => setIsOpen(false)}
          commands={commands}
        />
      )}
    </>
  );
}


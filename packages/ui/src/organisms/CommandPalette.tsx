'use client';

import * as React from 'react';
import Fuse from 'fuse.js';
import { cn } from '../utils/cn';
import { Input } from '../atoms/Input';

export interface Command {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  icon?: React.ReactNode;
  action: () => void | Promise<void>;
  group?: string;
}

export interface CommandPaletteProps {
  /**
   * Whether the palette is open
   */
  open: boolean;
  /**
   * Callback when palette should close
   */
  onClose: () => void;
  /**
   * List of available commands
   */
  commands: Command[];
  /**
   * Placeholder text for search input
   */
  placeholder?: string;
}

/**
 * CommandPalette component
 * 
 * A command palette with fuzzy search functionality.
 * Opens with Cmd/Ctrl+K and allows searching through commands.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder = 'Type a command or search...',
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Setup fuzzy search
  const fuse = React.useMemo(
    () =>
      new Fuse(commands, {
        keys: ['label', 'description', 'keywords'],
        threshold: 0.3,
        includeScore: true,
      }),
    [commands]
  );

  // Filter commands based on search query
  const filteredCommands = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return commands;
    }
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, fuse, commands]);

  // Reset selected index when filtered commands change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Navigate with arrow keys
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      // Execute on Enter
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        command.action();
        onClose();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onClose]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  // Group commands
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      const group = cmd.group || 'Other';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <div
      className="fixed inset-0 z-modal-backdrop bg-black/50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[60vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
          />
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="overflow-y-auto scrollbar-thin flex-1 p-2"
        >
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="p-8 text-center text-foreground-secondary">
              <p className="text-sm">No commands found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([groupName, groupCommands]) => (
              <div key={groupName} className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  {groupName}
                </div>
                {groupCommands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      type="button"
                      onClick={() => {
                        command.action();
                        onClose();
                      }}
                      className={cn(
                        'w-full px-3 py-2 rounded-md text-left transition-colors',
                        'hover:bg-background-secondary focus:bg-background-secondary',
                        'focus-ring',
                        isSelected && 'bg-background-secondary'
                      )}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="flex items-center gap-3">
                        {command.icon && (
                          <div className="flex-shrink-0 text-foreground-secondary">
                            {command.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">
                            {command.label}
                          </div>
                          {command.description && (
                            <div className="text-xs text-foreground-secondary mt-0.5 truncate">
                              {command.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="px-4 py-2 border-t border-border bg-background-secondary flex items-center justify-between text-xs text-foreground-secondary">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                Enter
              </kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                Esc
              </kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


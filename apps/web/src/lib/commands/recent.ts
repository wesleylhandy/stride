import type { Command } from '@stride/ui';
import { commandRegistry } from './registry';

const RECENT_ITEMS_KEY = 'stride-recent-items';
const MAX_RECENT_ITEMS = 10;

export interface RecentItem {
  id: string;
  label: string;
  path: string;
  type: 'issue' | 'project' | 'cycle';
  timestamp: number;
}

/**
 * Get recent items from localStorage
 */
export function getRecentItems(): RecentItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as RecentItem[];
  } catch {
    return [];
  }
}

/**
 * Add item to recent items
 */
export function addRecentItem(item: Omit<RecentItem, 'timestamp'>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const recent = getRecentItems();
    
    // Remove existing item with same id
    const filtered = recent.filter((i) => i.id !== item.id);
    
    // Add new item at the beginning
    const updated: RecentItem[] = [
      { ...item, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS);

    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent item:', error);
  }
}

/**
 * Clear recent items
 */
export function clearRecentItems(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(RECENT_ITEMS_KEY);
  } catch (error) {
    console.error('Failed to clear recent items:', error);
  }
}

/**
 * Create recent items commands
 */
export function createRecentItemsCommands(
  onNavigate: (path: string) => void,
): Command[] {
  const recent = getRecentItems();

  if (recent.length === 0) {
    return [];
  }

  return recent.map((item) => ({
    id: `recent-${item.id}`,
    label: item.label,
    description: `Recently viewed ${item.type}`,
    keywords: [item.type, 'recent', item.label.toLowerCase()],
    group: 'Recent',
    action: () => {
      onNavigate(item.path);
      // Update timestamp when accessed
      addRecentItem(item);
    },
  }));
}

/**
 * Register recent items commands
 */
export function registerRecentItemsCommands(
  onNavigate: (path: string) => void,
): () => void {
  const commands = createRecentItemsCommands(onNavigate);
  commands.forEach((command) => {
    commandRegistry.register(command);
  });

  // Return unregister function
  return () => {
    commands.forEach((command) => {
      commandRegistry.unregister(command.id);
    });
  };
}

/**
 * Refresh recent items commands (call after adding new item)
 */
export function refreshRecentItemsCommands(
  onNavigate: (path: string) => void,
): () => void {
  // Unregister old commands
  const recent = getRecentItems();
  recent.forEach((item) => {
    commandRegistry.unregister(`recent-${item.id}`);
  });

  // Register new commands
  return registerRecentItemsCommands(onNavigate);
}


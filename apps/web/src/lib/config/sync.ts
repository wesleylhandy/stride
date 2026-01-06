/**
 * Configuration synchronization utilities
 * 
 * This module provides utilities for synchronizing configuration changes
 * across the application in real-time.
 * 
 * Currently provides a placeholder for future WebSocket or polling implementation.
 * Components should re-fetch config on mount or when config changes are detected.
 */

/**
 * Notify all components that configuration has changed
 * This is a placeholder for future WebSocket/EventSource implementation
 */
export function notifyConfigChange(projectId: string): void {
  // TODO: Implement WebSocket or Server-Sent Events for real-time updates
  // For now, components should poll or re-fetch on focus/mount
  console.log(`Config changed for project: ${projectId}`);
  
  // Dispatch a custom event that components can listen to
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('config-changed', { detail: { projectId } })
    );
  }
}

/**
 * Subscribe to configuration changes
 * Returns an unsubscribe function
 */
export function subscribeToConfigChanges(
  projectId: string,
  callback: (projectId: string) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ projectId: string }>;
    if (customEvent.detail?.projectId === projectId) {
      callback(projectId);
    }
  };

  window.addEventListener('config-changed', handler);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('config-changed', handler);
  };
}


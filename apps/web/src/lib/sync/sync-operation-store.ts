/**
 * In-memory store for sync operations
 * 
 * Tracks sync operation status and progress for async operations.
 * For MVP, uses in-memory storage. Can be replaced with database
 * persistence for production multi-instance deployments.
 */

import type {
  SyncOperationStatus,
  SyncProgress,
  SyncResults,
  SyncType,
} from "./types";

export interface SyncOperation {
  id: string;
  repositoryConnectionId: string;
  projectId: string;
  userId: string;
  status: SyncOperationStatus;
  syncType: SyncType;
  includeClosed: boolean;
  progress?: SyncProgress;
  results?: SyncResults;
  error?: string;
  startedAt?: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  abortController?: AbortController;
}

class SyncOperationStore {
  private operations = new Map<string, SyncOperation>();

  /**
   * Create a new sync operation
   */
  create(operation: Omit<SyncOperation, "createdAt" | "updatedAt">): SyncOperation {
    const now = new Date();
    const fullOperation: SyncOperation = {
      ...operation,
      createdAt: now,
      updatedAt: now,
    };
    this.operations.set(operation.id, fullOperation);
    return fullOperation;
  }

  /**
   * Get a sync operation by ID
   */
  get(id: string): SyncOperation | null {
    return this.operations.get(id) || null;
  }

  /**
   * Update a sync operation
   */
  update(
    id: string,
    updates: Partial<Pick<SyncOperation, "status" | "progress" | "results" | "error" | "startedAt" | "completedAt" | "abortController">>,
  ): SyncOperation | null {
    const operation = this.operations.get(id);
    if (!operation) {
      return null;
    }

    const updated: SyncOperation = {
      ...operation,
      ...updates,
      updatedAt: new Date(),
    };
    this.operations.set(id, updated);
    return updated;
  }

  /**
   * Delete a sync operation
   */
  delete(id: string): boolean {
    return this.operations.delete(id);
  }

  /**
   * Find active sync operations for a repository
   */
  findActiveByRepository(repositoryConnectionId: string): SyncOperation[] {
    return Array.from(this.operations.values()).filter(
      (op) =>
        op.repositoryConnectionId === repositoryConnectionId &&
        (op.status === "pending" || op.status === "inProgress"),
    );
  }

  /**
   * Cleanup old completed operations (older than specified hours)
   */
  cleanup(olderThanHours: number = 24): number {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    let cleaned = 0;
    for (const [id, operation] of this.operations.entries()) {
      if (
        (operation.status === "completed" || operation.status === "failed") &&
        operation.completedAt &&
        operation.completedAt < cutoff
      ) {
        this.operations.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// Singleton instance
export const syncOperationStore = new SyncOperationStore();

"use client";

/**
 * SessionList component
 * Displays recent assistant sessions with archive/delete functionality
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@stride/ui";
import { cn } from "@stride/ui";
import { getCsrfHeaders } from "@/lib/utils/csrf";

export interface Session {
  id: string;
  projectId: string | null;
  contextType: "project" | "infrastructure";
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

export interface SessionListProps {
  projectId?: string;
  contextType?: "project" | "infrastructure";
  onSelectSession?: (sessionId: string) => void;
  selectedSessionId?: string;
}

/**
 * SessionList component
 * Shows recent sessions (last 30 days) with management actions
 */
export function SessionList({
  projectId,
  contextType = "project",
  onSelectSession,
  selectedSessionId,
}: SessionListProps) {
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: [
      "assistant",
      "sessions",
      projectId || "infrastructure",
      contextType,
    ],
    queryFn: async () => {
      const apiRoute =
        contextType === "infrastructure"
          ? "/api/settings/infrastructure/assistant/sessions"
          : `/api/projects/${projectId}/assistant/sessions`;

      const response = await fetch(apiRoute, {
        headers: {
          ...getCsrfHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      return response.json();
    },
  });

  // Archive session mutation
  const archiveMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const apiRoute =
        contextType === "infrastructure"
          ? `/api/settings/infrastructure/assistant/sessions/${sessionId}`
          : `/api/projects/${projectId}/assistant/sessions/${sessionId}`;

      const response = await fetch(apiRoute, {
        method: "DELETE",
        headers: {
          ...getCsrfHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to archive session");
      }
    },
    onSuccess: () => {
      // Invalidate sessions query
      queryClient.invalidateQueries({
        queryKey: [
          "assistant",
          "sessions",
          projectId || "infrastructure",
          contextType,
        ],
      });
      setArchiveConfirmId(null);
    },
  });

  // Delete session mutation (same as archive for now, but could be separate in future)
  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const apiRoute =
        contextType === "infrastructure"
          ? `/api/settings/infrastructure/assistant/sessions/${sessionId}`
          : `/api/projects/${projectId}/assistant/sessions/${sessionId}`;

      const response = await fetch(apiRoute, {
        method: "DELETE",
        headers: {
          ...getCsrfHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete session");
      }
    },
    onSuccess: () => {
      // Invalidate sessions query
      queryClient.invalidateQueries({
        queryKey: [
          "assistant",
          "sessions",
          projectId || "infrastructure",
          contextType,
        ],
      });
      setDeleteConfirmId(null);
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
        <div className="flex items-center gap-2 text-foreground-secondary dark:text-foreground-dark-secondary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
          <span className="text-sm">Loading sessions...</span>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
          No recent sessions found
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
      <div className="p-4 border-b border-border dark:border-border-dark">
        <h3 className="text-sm font-semibold text-foreground dark:text-foreground-dark">
          Recent Sessions (Last 30 Days)
        </h3>
      </div>
      <div className="divide-y divide-border dark:divide-border-dark">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "p-4 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors",
              selectedSessionId === session.id &&
                "bg-accent/10 dark:bg-accent/10"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onSelectSession?.(session.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground-secondary dark:text-foreground-dark-secondary">
                    {formatDate(session.updatedAt)}
                  </span>
                  {session._count && (
                    <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                      • {session._count.messages} messages
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                  {contextType === "infrastructure"
                    ? "Infrastructure Configuration"
                    : "Project Configuration"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {archiveConfirmId === session.id ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setArchiveConfirmId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => archiveMutation.mutate(session.id)}
                      disabled={archiveMutation.isPending}
                    >
                      Confirm
                    </Button>
                  </div>
                ) : deleteConfirmId === session.id ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteMutation.mutate(session.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setArchiveConfirmId(session.id)}
                      title="Archive session"
                    >
                      Archive
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(session.id)}
                      title="Delete session"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ConfigurationAssistant - Wrapper Component
 * Fetches initial data and renders client component
 */

"use client";

import { useEffect, useState } from "react";
import { ConfigurationAssistantClient } from "./ConfigurationAssistantClient";
import type { AssistantMessageData } from "./ConfigurationAssistantClient";
import { getCsrfHeaders } from "@/lib/utils/csrf";

export interface ConfigurationAssistantProps {
  projectId: string;
}

/**
 * ConfigurationAssistant component
 * Fetches initial data client-side and renders client component
 */
export function ConfigurationAssistant({
  projectId,
}: ConfigurationAssistantProps) {
  const [initialData, setInitialData] = useState<{
    sessionId: string;
    messages: AssistantMessageData[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/projects/${projectId}/assistant/history?limit=50&offset=0`,
          {
            headers: {
              ...getCsrfHeaders(),
            },
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            setError("You do not have permission to use the assistant");
          } else {
            setError("Failed to load assistant data");
          }
          return;
        }

        const data = await response.json();
        setInitialData({
          sessionId: data.sessionId,
          messages: data.messages || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assistant");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading AI assistant...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          {error}
        </p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          Failed to initialize assistant
        </p>
      </div>
    );
  }

  return (
    <ConfigurationAssistantClient
      projectId={projectId}
      initialSessionId={initialData.sessionId}
      initialMessages={initialData.messages}
    />
  );
}

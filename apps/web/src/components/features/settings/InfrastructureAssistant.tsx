/**
 * InfrastructureAssistant - Server Component Wrapper
 * Wraps the client component for infrastructure context
 */

"use client";

import { ConfigurationAssistantClient } from "@/components/features/projects/ConfigurationAssistantClient";
import type { AssistantMessageData } from "@/components/features/projects/ConfigurationAssistantClient";
import { getCsrfHeaders } from "@/lib/utils/csrf";
import { useState, useEffect } from "react";

/**
 * InfrastructureAssistant component
 * Provides AI assistant for infrastructure configuration guidance
 * Uses infrastructure context (no projectId)
 */
export function InfrastructureAssistant() {
  const [messages, setMessages] = useState<AssistantMessageData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  // Load initial messages
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/settings/infrastructure/assistant/history?limit=50&offset=0`,
          {
            headers: {
              ...getCsrfHeaders(),
            },
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            setError("You do not have permission to use the assistant");
            return;
          }
          throw new Error("Failed to load assistant data");
        }

        const data = await response.json();
        const formattedMessages = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata,
          createdAt: msg.createdAt,
        }));
        setMessages(formattedMessages);
        
        // Store sessionId from response
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assistant");
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary p-6">
        <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
          Loading AI assistant...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary p-6">
        <p className="text-sm text-error dark:text-error">
          Failed to initialize assistant: {error}
        </p>
      </div>
    );
  }

  return (
    <ConfigurationAssistantClient
      projectId="infrastructure" // Special identifier for infrastructure context
      contextType="infrastructure"
      initialSessionId={sessionId}
      initialMessages={messages}
    />
  );
}

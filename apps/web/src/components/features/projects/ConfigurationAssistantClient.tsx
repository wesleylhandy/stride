"use client";

/**
 * ConfigurationAssistantClient - Client Component
 * Handles user input, message sending, and real-time updates
 */

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AssistantMessage } from "./AssistantMessage";
import { AssistantInput } from "./AssistantInput";
import { Button, Modal, useToast } from "@stride/ui";
import { cn } from "@stride/ui";
import { getCsrfHeaders } from "@/lib/utils/csrf";

export interface AssistantMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: unknown;
  createdAt: string;
}

export interface ConfigurationAssistantClientProps {
  projectId: string;
  contextType?: "project" | "infrastructure";
  initialSessionId?: string;
  initialMessages: AssistantMessageData[];
}

/**
 * ConfigurationAssistantClient component
 * Handles chat interface interactivity
 */
export function ConfigurationAssistantClient({
  projectId,
  contextType,
  initialSessionId,
  initialMessages,
}: ConfigurationAssistantClientProps) {
  const [messages, setMessages] = useState<AssistantMessageData[]>(initialMessages);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiProviderConfigured, setAiProviderConfigured] = useState<boolean | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<{ providerId: string; model: string } | null>(null);
  const [availableProviders, setAvailableProviders] = useState<Array<{ id: string; providerType: string; models: string[]; defaultModel: string | null }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  // Sync sessionId when initialSessionId changes
  useEffect(() => {
    setSessionId(initialSessionId);
  }, [initialSessionId]);

  // Scroll to bottom when new messages are added (not when loading older messages)
  // Use manual scrolling on the container to prevent page scroll
  useEffect(() => {
    if (!isLoadingMore && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Scroll to bottom of the container
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoadingMore]);

  // Check if AI provider is configured on mount and load available providers
  useEffect(() => {
    checkAiProviderConfigured();
    loadAvailableProviders();
  }, [projectId, contextType]);

  // Load available providers and models
  async function loadAvailableProviders() {
    try {
      if (contextType === "infrastructure") {
        // For infrastructure, fetch from global config and discover models
        const configResponse = await fetch("/api/admin/settings/infrastructure", {
          headers: {
            ...getCsrfHeaders(),
          },
        });

        if (!configResponse.ok) {
          return;
        }

        const configData = await configResponse.json();
        const aiConfig = configData.aiConfig || {};
        const allProviders: Array<{ id: string; providerType: string; models: string[]; defaultModel: string | null }> = [];
        
        // Helper to discover models with fallback
        const discoverModelsForProvider = async (providerType: "openai" | "anthropic" | "google-gemini" | "ollama"): Promise<string[]> => {
          try {
            const response = await fetch("/api/admin/settings/infrastructure/discover-models", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...getCsrfHeaders(),
              },
              body: JSON.stringify({ providerType }),
            });

            if (response.ok) {
              const data = await response.json();
              return data.models || [];
            }
          } catch (error) {
            console.error(`Failed to discover models for ${providerType}:`, error);
          }

          // Fallback to common models
          const fallbackModels: Record<string, string[]> = {
            openai: ["gpt-3.5-turbo", "gpt-4"],
            anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
            "google-gemini": ["gemini-pro", "gemini-pro-vision"],
            ollama: ["llama2", "mistral"],
          };
          return fallbackModels[providerType] || [];
        };
        
        // Discover models for each configured provider
        if (aiConfig.configuredApiKeys?.openaiApiKey) {
          const models = await discoverModelsForProvider("openai");
          allProviders.push({
            id: "infrastructure-openai",
            providerType: "openai",
            models,
            defaultModel: aiConfig.defaultModels?.openai || models[0] || null,
          });
        }
        
        if (aiConfig.configuredApiKeys?.anthropicApiKey) {
          const models = await discoverModelsForProvider("anthropic");
          allProviders.push({
            id: "infrastructure-anthropic",
            providerType: "anthropic",
            models,
            defaultModel: aiConfig.defaultModels?.anthropic || models[0] || null,
          });
        }
        
        if (aiConfig.configuredApiKeys?.googleAiApiKey) {
          const models = await discoverModelsForProvider("google-gemini");
          allProviders.push({
            id: "infrastructure-google-gemini",
            providerType: "google-gemini",
            models,
            defaultModel: aiConfig.defaultModels?.googleAi || models[0] || null,
          });
        }
        
        if (aiConfig.llmEndpoint) {
          const models = await discoverModelsForProvider("ollama");
          allProviders.push({
            id: "infrastructure-ollama",
            providerType: "ollama",
            models,
            defaultModel: aiConfig.defaultModels?.ollama || models[0] || null,
          });
        }
        
        setAvailableProviders(allProviders);
        
        // Auto-select first provider with available models if none selected
        if (!selectedProvider && allProviders.length > 0) {
          const firstProvider = allProviders[0];
          if (firstProvider && firstProvider.models.length > 0) {
            setSelectedProvider({
              providerId: firstProvider.id,
              model: firstProvider.defaultModel || firstProvider.models[0]!,
            });
          }
        }
        return;
      }

      // For project context, fetch from project API
      const response = await fetch(`/api/projects/${projectId}/ai-providers`, {
        headers: {
          ...getCsrfHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allProviders: Array<{ id: string; providerType: string; models: string[]; defaultModel: string | null }> = [];
        
        // Add project providers
        if (data.projectProviders && Array.isArray(data.projectProviders)) {
          data.projectProviders.forEach((p: any) => {
            allProviders.push({
              id: p.id,
              providerType: p.providerType,
              models: p.enabledModels || [],
              defaultModel: p.defaultModel,
            });
          });
        }
        
        // Add global providers
        if (data.globalProviders && Array.isArray(data.globalProviders)) {
          data.globalProviders.forEach((p: any) => {
            allProviders.push({
              id: p.id,
              providerType: p.providerType,
              models: p.enabledModels || [],
              defaultModel: p.defaultModel,
            });
          });
        }
        
        setAvailableProviders(allProviders);
        
        // Auto-select first provider with available models if none selected
        if (!selectedProvider && allProviders.length > 0) {
          const firstProvider = allProviders[0];
          if (firstProvider && firstProvider.models.length > 0) {
            setSelectedProvider({
              providerId: firstProvider.id,
              model: firstProvider.defaultModel || firstProvider.models[0]!,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load available providers:", error);
    }
  }

  async function checkAiProviderConfigured() {
    try {
      // For infrastructure context, provider is always checked server-side
      if (contextType === "infrastructure") {
        setAiProviderConfigured(null); // null = unknown, will be determined on first use
        return;
      }

      // Check project-specific providers first
      const projectResponse = await fetch(`/api/projects/${projectId}/ai-providers`, {
        headers: {
          ...getCsrfHeaders(),
        },
      });
      let hasProjectProvider = false;
      
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        // Handle both old format (array) and new format (object with projectProviders and globalProviders)
        if (Array.isArray(projectData)) {
          hasProjectProvider = projectData.length > 0;
        } else if (projectData.projectProviders) {
          hasProjectProvider = projectData.projectProviders.length > 0;
        }
      }

      // If project has provider, we're good
      if (hasProjectProvider) {
        setAiProviderConfigured(true);
        return;
      }

      // Check infrastructure/global config
      // Note: We can't directly check env vars from client, but we can check infrastructure status
      // The actual provider selection will fall back to infrastructure config server-side
      // So we'll be optimistic and set to null (unknown) - let the server-side check handle it
      setAiProviderConfigured(null); // null = unknown, will be determined on first use
    } catch {
      setAiProviderConfigured(false);
    }
  }

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Use different API route based on context type
      const apiRoute =
        contextType === "infrastructure"
          ? `/api/settings/infrastructure/assistant/chat`
          : `/api/projects/${projectId}/assistant/chat`;
      
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 503) {
          if (errorData.message?.includes("not configured")) {
            setAiProviderConfigured(false);
            throw new Error(
              "AI provider is not configured. Please configure an AI provider in project settings or infrastructure settings."
            );
          }
          throw new Error(errorData.message || "AI Gateway is temporarily unavailable");
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          throw new Error(
            `Rate limit exceeded. Please try again${retryAfter ? ` after ${retryAfter} seconds` : ""}.`
          );
        }

        if (response.status === 403) {
          const errorMessage = errorData.message || "You do not have permission to use the assistant";
          throw new Error(errorMessage);
        }

        throw new Error(errorData.message || "Failed to send message");
      }

      return response.json();
    },
    onMutate: async (message) => {
      // Optimistic update: add user message immediately
      const userMessage: AssistantMessageData = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      // Remove temporary user message
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
      
      // Update sessionId if provided
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Add real user message (if returned from API)
      if (data.userMessage) {
        const userMessage: AssistantMessageData = {
          id: data.userMessage.id,
          role: data.userMessage.role,
          content: data.userMessage.content,
          createdAt: data.userMessage.createdAt,
        };
        setMessages((prev) => [...prev, userMessage]);
      }
      
      // Add assistant response
      const assistantMessage: AssistantMessageData = {
        id: data.assistantMessage?.id || `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message || data.assistantMessage?.content || "",
        metadata: data.metadata || data.assistantMessage?.metadata,
        createdAt: data.assistantMessage?.createdAt || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      
      // Invalidate queries to refresh data
      // Invalidate history query based on context type
      const historyQueryKey =
        contextType === "infrastructure"
          ? ["assistant", "infrastructure", "history"]
          : ["assistant", projectId, "history"];
      queryClient.invalidateQueries({ queryKey: historyQueryKey });
    },
    onError: (error: Error) => {
      setIsLoading(false);
      setError(error.message);
      
      // Remove temporary user message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
    },
  });

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) {
      return;
    }

    await sendMessageMutation.mutateAsync(message);
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !sessionId) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const apiRoute =
        contextType === "infrastructure"
          ? `/api/settings/infrastructure/assistant/history`
          : `/api/projects/${projectId}/assistant/history`;

      // Fetch next batch of messages (offset = current count)
      // Messages come in ascending order (oldest first), so this gets newer messages
      const response = await fetch(
        `${apiRoute}?sessionId=${sessionId}&limit=50&offset=${messages.length}`,
        {
          headers: {
            ...getCsrfHeaders(),
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load more messages");
      }

      const data = await response.json();
      const newMessages: AssistantMessageData[] = (data.messages || []).map(
        (msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata,
          createdAt: msg.createdAt,
        })
      );

      // Filter out messages we already have (by ID)
      const existingIds = new Set(messages.map((m) => m.id));
      const uniqueNewMessages = newMessages.filter(
        (msg) => !existingIds.has(msg.id)
      );

      if (uniqueNewMessages.length === 0) {
        // No more messages to load
        setHasMoreMessages(false);
      } else {
        // Append newer messages (they come in ascending order from API)
        // Since messages are ordered oldest first, newer messages appear after current ones
        setMessages((prev) => [...prev, ...uniqueNewMessages]);
        
        // Check if we got fewer messages than requested (end of history)
        if (uniqueNewMessages.length < 50) {
          setHasMoreMessages(false);
        }
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
      setError(error instanceof Error ? error.message : "Failed to load more messages");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleClearConversation = async () => {
    if (!sessionId || isClearing) {
      return;
    }

    setIsClearing(true);
    try {
      const deleteRoute =
        contextType === "infrastructure"
          ? `/api/settings/infrastructure/assistant/sessions/${sessionId}`
          : `/api/projects/${projectId}/assistant/sessions/${sessionId}`;

      const response = await fetch(deleteRoute, {
        method: "DELETE",
        headers: {
          ...getCsrfHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clear conversation");
      }

      // Reset state
      setMessages([]);
      setSessionId(undefined);
      setHasMoreMessages(true);
      setError(null);
      setShowClearConfirm(false);

      // Invalidate queries
      const historyQueryKey =
        contextType === "infrastructure"
          ? ["assistant", "infrastructure", "history"]
          : ["assistant", projectId, "history"];
      queryClient.invalidateQueries({ queryKey: historyQueryKey });

      toast.success("Conversation cleared successfully");
    } catch (error) {
      console.error("Failed to clear conversation:", error);
      toast.error("Failed to clear conversation", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Show setup instructions if AI provider definitely not configured
  // If null (unknown), we'll let the first message attempt determine the actual state
  if (aiProviderConfigured === false) {
    return (
      <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            AI Assistant requires AI provider configuration
          </h3>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            To use the AI assistant, you need to configure at least one AI provider.
          </p>
          <div className="space-y-2">
            {contextType === "infrastructure" ? (
              <>
                <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
                  Configure AI Provider in Infrastructure Settings:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-foreground-secondary dark:text-foreground-dark-secondary ml-4">
                  <li>Navigate to Infrastructure Settings (admin only)</li>
                  <li>Configure AI Gateway URL or provider API keys</li>
                  <li>Set environment variables or use the UI form</li>
                  <li>Return here to use the assistant</li>
                </ol>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
                  Option 1: Configure for this project (recommended):
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-foreground-secondary dark:text-foreground-dark-secondary ml-4">
                  <li>Navigate to the Integrations tab in project settings</li>
                  <li>Click &quot;Add AI Provider&quot; or configure an existing provider</li>
                  <li>Select a provider (OpenAI, Anthropic, Google Gemini, or Ollama)</li>
                  <li>Enter your API credentials or endpoint URL</li>
                  <li>Return here to use the assistant</li>
                </ol>
                <p className="text-sm font-medium text-foreground dark:text-foreground-dark mt-4">
                  Option 2: Configure globally (applies to all projects):
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-foreground-secondary dark:text-foreground-dark-secondary ml-4">
                  <li>Navigate to Infrastructure Settings (admin only)</li>
                  <li>Configure AI Gateway and provider credentials</li>
                  <li>Return here to use the assistant</li>
                </ol>
              </>
            )}
          </div>
          <Button
            onClick={() => {
              if (contextType === "infrastructure") {
                window.location.href = `/settings/infrastructure`;
              } else {
                window.location.href = `/projects/${projectId}/settings/integrations`;
              }
            }}
          >
            {contextType === "infrastructure"
              ? "Go to Infrastructure Settings"
              : "Go to Integrations Settings"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-[600px] rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
      role="region"
      aria-label="AI Configuration Assistant"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            AI Configuration Assistant
          </h3>
          <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
            {contextType === "infrastructure"
              ? "Ask questions about configuring infrastructure settings"
              : "Ask questions about configuring your project"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Model/Provider Selector */}
          {availableProviders.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary whitespace-nowrap">
                Model:
              </label>
              <select
                value={selectedProvider ? `${selectedProvider.providerId}:${selectedProvider.model}` : ""}
                onChange={(e) => {
                  const [providerId, model] = e.target.value.split(":");
                  if (providerId && model) {
                    setSelectedProvider({ providerId, model });
                  }
                }}
                className="text-xs rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-2 py-1 text-foreground dark:text-foreground-dark focus:border-accent focus:outline-none focus:ring-accent"
                disabled={isLoading}
              >
                <option value="">Auto-select</option>
                {availableProviders.map((provider) =>
                  provider.models.map((model) => (
                    <option key={`${provider.id}:${model}`} value={`${provider.id}:${model}`}>
                      {provider.providerType} - {model}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
          {messages.length > 0 && sessionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark"
              aria-label="Clear conversation"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
        aria-atomic="false"
        tabIndex={0}
      >
        {/* Load more button */}
        {hasMoreMessages && messages.length > 0 && (
          <div className="flex justify-center" ref={messagesStartRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="text-xs"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-accent mr-2"></div>
                  Loading...
                </>
              ) : (
                "Load more messages"
              )}
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
                Start a conversation with the AI assistant
              </p>
              <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                {contextType === "infrastructure"
                  ? 'Ask questions like: "How do I configure GitHub OAuth?" or "How do I set up AI Gateway?"'
                  : 'Ask questions like: "How do I set up a Kanban workflow?"'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <AssistantMessage key={message.id} message={message} projectId={projectId} />
          ))
        )}
        
        {/* Loading indicator with typing animation */}
        {isLoading && (
          <div 
            className="flex items-center gap-2 text-foreground-secondary dark:text-foreground-dark-secondary"
            role="status"
            aria-live="polite"
            aria-label="Plotting the path"
          >
            <div className="flex gap-1" aria-hidden="true">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
            <span className="text-sm">Plotting the path...</span>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
              {error.includes("Rate limit") && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Please wait a moment before sending another message.
                </p>
              )}
              {error.includes("AI Gateway") && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  The AI service may be temporarily unavailable. Please try again in a few moments.
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              aria-label="Dismiss error"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border dark:border-border-dark">
        <AssistantInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder={
            contextType === "infrastructure"
              ? "Ask a question about infrastructure configuration..."
              : "Ask a question about project configuration..."
          }
        />
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Conversation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-foreground dark:text-foreground-dark">
            Are you sure you want to clear this conversation? This will delete all messages and start a fresh session.
          </p>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowClearConfirm(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleClearConversation}
              disabled={isClearing}
              loading={isClearing}
            >
              Clear Conversation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

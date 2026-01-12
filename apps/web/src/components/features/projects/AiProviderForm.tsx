"use client";

import { useState, useEffect } from "react";
import { Button, Input } from "@stride/ui";
import { FiEye, FiEyeOff, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import { z } from "zod";
import type { AiProvider } from "./AiProviderSettings";

export interface AiProviderFormProps {
  projectId: string;
  initialProvider?: AiProvider;
  onSubmit: (data: {
    providerType: "openai" | "anthropic" | "google-gemini" | "ollama";
    apiKey?: string;
    endpointUrl?: string;
    authToken?: string;
    enabledModels: string[];
    defaultModel?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * AiProviderForm Component
 *
 * Form component for configuring AI providers.
 * Supports OpenAI, Anthropic, Google Gemini, and Ollama providers.
 * Includes password-type fields for API keys/tokens.
 * Dynamically fetches available models from providers.
 */
export function AiProviderForm({
  projectId,
  initialProvider,
  onSubmit,
  onCancel,
  loading = false,
  error: externalError = null,
}: AiProviderFormProps) {
  const [providerType, setProviderType] = useState<
    "openai" | "anthropic" | "google-gemini" | "ollama" | ""
  >(initialProvider?.providerType || "");
  const [apiKey, setApiKey] = useState("");
  const [endpointUrl, setEndpointUrl] = useState(
    initialProvider?.endpointUrl || ""
  );
  const [authToken, setAuthToken] = useState("");
  const [enabledModels, setEnabledModels] = useState<string[]>(
    initialProvider?.enabledModels || []
  );
  const [defaultModel, setDefaultModel] = useState<string>(
    initialProvider?.defaultModel || ""
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  // Model selection state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isDiscoveringModels, setIsDiscoveringModels] = useState(false);
  const [modelDiscoveryError, setModelDiscoveryError] = useState<string | null>(
    null
  );
  const [manualModelEntry, setManualModelEntry] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Auto-discover models when provider type and credentials change
  useEffect(() => {
    const cloudProviders = ["openai", "anthropic", "google-gemini"];
    const isCloudProvider = cloudProviders.includes(providerType);
    const isOllama = providerType === "ollama";

    // For cloud providers: fetch models when API key is provided
    if (isCloudProvider && apiKey.trim() && !initialProvider) {
      const timeoutId = setTimeout(async () => {
        setIsDiscoveringModels(true);
        setModelDiscoveryError(null);

        try {
          const response = await fetch(
            `/api/projects/${projectId}/ai-providers/discover-models`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                providerType,
                apiKey: apiKey.trim(),
              }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to discover models");
          }

          const data = await response.json();
          setAvailableModels(data.models || []);
          setModelDiscoveryError(null);
        } catch (error) {
          console.error("Model discovery error:", error);
          setModelDiscoveryError(
            error instanceof Error ? error.message : "Failed to discover models"
          );
          setAvailableModels([]);
        } finally {
          setIsDiscoveringModels(false);
        }
      }, 500); // Debounce by 500ms

      return () => clearTimeout(timeoutId);
    }

    // For Ollama: fetch models when endpoint URL is provided
    if (isOllama && endpointUrl.trim() && !initialProvider) {
      const timeoutId = setTimeout(async () => {
        setIsDiscoveringModels(true);
        setModelDiscoveryError(null);

        try {
          const response = await fetch(
            `/api/projects/${projectId}/ai-providers/discover-models`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                providerType: "ollama",
                endpointUrl: endpointUrl.trim(),
                authToken: authToken.trim() || undefined,
              }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to discover models");
          }

          const data = await response.json();
          setAvailableModels(data.models || []);
          setModelDiscoveryError(null);
        } catch (error) {
          console.error("Model discovery error:", error);
          setModelDiscoveryError(
            error instanceof Error ? error.message : "Failed to discover models"
          );
          setAvailableModels([]);
        } finally {
          setIsDiscoveringModels(false);
        }
      }, 500); // Debounce by 500ms

      return () => clearTimeout(timeoutId);
    }

    // Reset models when provider type changes
    if (!providerType) {
      setAvailableModels([]);
      setModelDiscoveryError(null);
    }
  }, [
    apiKey,
    endpointUrl,
    providerType,
    projectId,
    authToken,
    initialProvider,
  ]);

  // Reset form when initialProvider changes (e.g., switching from edit to add)
  useEffect(() => {
    if (initialProvider) {
      setProviderType(initialProvider.providerType);
      setEndpointUrl(initialProvider.endpointUrl || "");
      setEnabledModels(initialProvider.enabledModels || []);
      setDefaultModel(initialProvider.defaultModel || "");
      // Don't populate API key/auth token - they're encrypted and can't be retrieved
      setApiKey("");
      setAuthToken("");
      // Set available models for existing providers (from enabled models)
      // Don't auto-discover for existing providers - user can manually refresh
      setAvailableModels(initialProvider.enabledModels || []);
    } else {
      // Reset form for new provider
      setProviderType("");
      setApiKey("");
      setEndpointUrl("");
      setAuthToken("");
      setEnabledModels([]);
      setDefaultModel("");
      setAvailableModels([]);
      setModelDiscoveryError(null);
      setManualModelEntry("");
      setConnectionTestResult(null);
    }
  }, [initialProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setValidationErrors({});

    // Validate required fields based on provider type
    if (!providerType) {
      setFormError("Please select a provider type");
      return;
    }

    // For cloud providers (OpenAI, Anthropic, Google Gemini), API key is required
    const cloudProviders = ["openai", "anthropic", "google-gemini"];
    if (cloudProviders.includes(providerType) && !apiKey.trim()) {
      setFormError("API key is required for cloud providers");
      return;
    }

    // For self-hosted (Ollama), endpoint URL is required
    if (providerType === "ollama" && !endpointUrl.trim()) {
      setFormError("Endpoint URL is required for self-hosted providers");
      return;
    }

    try {
      const data: {
        providerType: "openai" | "anthropic" | "google-gemini" | "ollama";
        apiKey?: string;
        endpointUrl?: string;
        authToken?: string;
        enabledModels: string[];
        defaultModel?: string;
      } = {
        providerType,
        enabledModels,
      };

      // Only include API key if provided (for cloud providers)
      if (apiKey.trim()) {
        data.apiKey = apiKey.trim();
      }

      // Only include endpoint URL if provided (for self-hosted)
      if (endpointUrl.trim()) {
        data.endpointUrl = endpointUrl.trim();
      }

      // Only include auth token if provided (optional for self-hosted)
      if (authToken.trim()) {
        data.authToken = authToken.trim();
      }

      // Only include default model if provided
      if (defaultModel.trim()) {
        data.defaultModel = defaultModel.trim();
      }

      await onSubmit(data);

      // Clear form on success (if not editing)
      if (!initialProvider) {
        setProviderType("");
        setApiKey("");
        setEndpointUrl("");
        setAuthToken("");
        setEnabledModels([]);
        setDefaultModel("");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setValidationErrors(errors);
      } else {
        setFormError(
          err instanceof Error ? err.message : "Failed to save provider"
        );
      }
    }
  };

  // Test connection handler
  const handleTestConnection = async () => {
    if (!endpointUrl.trim()) {
      setConnectionTestResult({
        success: false,
        message: "Please enter an endpoint URL first",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/ai-providers/test-connection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpointUrl: endpointUrl.trim(),
            authToken: authToken.trim() || undefined,
          }),
        }
      );

      const data = await response.json();
      setConnectionTestResult({
        success: data.success || false,
        message:
          data.message ||
          data.error ||
          (data.success
            ? "Connection test successful"
            : "Connection test failed"),
      });
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Connection test failed",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Toggle model selection
  const handleModelToggle = (model: string) => {
    if (enabledModels.includes(model)) {
      setEnabledModels(enabledModels.filter((m) => m !== model));
      // Clear default model if it was the deselected model
      if (defaultModel === model) {
        setDefaultModel("");
      }
    } else {
      setEnabledModels([...enabledModels, model]);
      // Auto-set as default if it's the first model
      if (enabledModels.length === 0) {
        setDefaultModel(model);
      }
    }
  };

  // Add manual model entry
  const handleAddManualModel = () => {
    if (
      manualModelEntry.trim() &&
      !availableModels.includes(manualModelEntry.trim())
    ) {
      setAvailableModels([...availableModels, manualModelEntry.trim()]);
      setManualModelEntry("");
    }
  };

  // Refresh models for any provider
  const handleRefreshModels = async () => {
    const cloudProviders = ["openai", "anthropic", "google-gemini"];
    const isCloudProvider = cloudProviders.includes(providerType);
    const isOllama = providerType === "ollama";

    if (isCloudProvider && !apiKey.trim()) {
      setModelDiscoveryError("Please enter an API key first");
      return;
    }

    if (isOllama && !endpointUrl.trim()) {
      setModelDiscoveryError("Please enter an endpoint URL first");
      return;
    }

    setIsDiscoveringModels(true);
    setModelDiscoveryError(null);

    try {
      const requestBody: {
        providerType: string;
        apiKey?: string;
        endpointUrl?: string;
        authToken?: string;
      } = {
        providerType,
      };

      if (isCloudProvider) {
        requestBody.apiKey = apiKey.trim();
      }

      if (isOllama) {
        requestBody.endpointUrl = endpointUrl.trim();
        if (authToken.trim()) {
          requestBody.authToken = authToken.trim();
        }
      }

      const response = await fetch(
        `/api/projects/${projectId}/ai-providers/discover-models`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to discover models");
      }

      const data = await response.json();
      setAvailableModels(data.models || []);
      setModelDiscoveryError(null);
    } catch (error) {
      console.error("Model discovery error:", error);
      setModelDiscoveryError(
        error instanceof Error ? error.message : "Failed to discover models"
      );
    } finally {
      setIsDiscoveringModels(false);
    }
  };

  const displayError = externalError || formError;
  const isSelfHosted = providerType === "ollama";
  const cloudProviders = ["openai", "anthropic", "google-gemini"];
  const isCloudProvider = cloudProviders.includes(providerType);
  const models = availableModels;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            {displayError}
          </p>
        </div>
      )}

      {/* Provider Type */}
      <div>
        <label
          htmlFor="providerType"
          className="block text-sm font-medium text-foreground dark:text-foreground-dark"
        >
          Provider Type
        </label>
        <select
          id="providerType"
          value={providerType}
          onChange={(e) =>
            setProviderType(
              e.target.value as "openai" | "anthropic" | "ollama" | ""
            )
          }
          className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark focus:border-accent focus:outline-none focus:ring-accent"
          required
          disabled={!!initialProvider} // Don't allow changing provider type when editing
        >
          <option value="">Select a provider type</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google-gemini">Google Gemini</option>
          <option value="ollama">Ollama (Self-hosted)</option>
        </select>
        {validationErrors.providerType && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {validationErrors.providerType}
          </p>
        )}
      </div>

      {/* API Key (for cloud providers) */}
      {isCloudProvider && (
        <div>
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-foreground dark:text-foreground-dark"
          >
            API Key{" "}
            {!initialProvider && <span className="text-red-500">*</span>}
          </label>
          <div className="relative mt-1">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                initialProvider
                  ? "Leave blank to keep existing"
                  : "Enter API key"
              }
              autoComplete="off"
              spellCheck={false}
              required={!initialProvider}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark"
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? (
                <FiEyeOff className="h-4 w-4" />
              ) : (
                <FiEye className="h-4 w-4" />
              )}
            </button>
          </div>
          {validationErrors.apiKey && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.apiKey}
            </p>
          )}
          <p className="mt-1.5 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
            {initialProvider
              ? "Leave blank to keep the existing API key. Enter a new key to update it."
              : "Your API key is encrypted and stored securely. It will never be displayed again."}
          </p>
        </div>
      )}

      {/* Endpoint URL (for self-hosted providers) */}
      {isSelfHosted && (
        <div>
          <label
            htmlFor="endpointUrl"
            className="block text-sm font-medium text-foreground dark:text-foreground-dark"
          >
            Endpoint URL{" "}
            {!initialProvider && <span className="text-red-500">*</span>}
          </label>
          <Input
            id="endpointUrl"
            type="url"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="http://localhost:11434"
            required={!initialProvider}
            className="mt-1"
          />
          {validationErrors.endpointUrl && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.endpointUrl}
            </p>
          )}
          <p className="mt-1.5 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
            Enter the base URL for your Ollama instance (e.g.,
            http://localhost:11434)
          </p>
        </div>
      )}

      {/* Auth Token (optional, for self-hosted with auth) */}
      {isSelfHosted && (
        <div>
          <label
            htmlFor="authToken"
            className="block text-sm font-medium text-foreground dark:text-foreground-dark"
          >
            Auth Token (Optional)
          </label>
          <div className="relative mt-1">
            <Input
              id="authToken"
              type={showAuthToken ? "text" : "password"}
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder={
                initialProvider
                  ? "Leave blank to keep existing"
                  : "Enter auth token (optional)"
              }
              autoComplete="off"
              spellCheck={false}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowAuthToken(!showAuthToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary dark:text-foreground-dark-secondary hover:text-foreground dark:hover:text-foreground-dark"
              aria-label={showAuthToken ? "Hide auth token" : "Show auth token"}
            >
              {showAuthToken ? (
                <FiEyeOff className="h-4 w-4" />
              ) : (
                <FiEye className="h-4 w-4" />
              )}
            </button>
          </div>
          {validationErrors.authToken && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.authToken}
            </p>
          )}
          <p className="mt-1.5 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
            {initialProvider
              ? "Leave blank to keep the existing auth token. Enter a new token to update it."
              : "Optional authentication token for protected Ollama instances."}
          </p>
        </div>
      )}

      {/* Model Selection */}
      {providerType && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-foreground dark:text-foreground-dark">
              Enabled Models
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefreshModels}
              disabled={
                isDiscoveringModels ||
                (isSelfHosted && !endpointUrl.trim()) ||
                (isCloudProvider && !apiKey.trim())
              }
              loading={isDiscoveringModels}
            >
              <FiRefreshCw className="h-4 w-4 mr-1" />
              Refresh Models
            </Button>
          </div>

          {/* Model discovery status */}
          {isDiscoveringModels && (
            <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Discovering models...
            </div>
          )}
          {modelDiscoveryError && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {modelDiscoveryError}
                {isSelfHosted
                  ? " You can enter models manually below."
                  : " Please check your API key and try again."}
              </p>
            </div>
          )}

          {/* Model checkboxes */}
          {models && models.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-border dark:border-border-dark rounded-md p-3">
              {models.map((model) => (
                <label
                  key={model}
                  className="flex items-center gap-2 cursor-pointer hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={enabledModels.includes(model)}
                    onChange={() => handleModelToggle(model)}
                    className="h-4 w-4 rounded border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-foreground dark:text-foreground-dark font-mono">
                    {model}
                  </span>
                  {defaultModel === model && (
                    <span className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                      (default)
                    </span>
                  )}
                </label>
              ))}
            </div>
          ) : isSelfHosted ? (
            <div className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              No models discovered. Enter endpoint URL and click &quot;Refresh
              Models&quot; or enter models manually below.
            </div>
          ) : null}

          {/* Manual model entry for Ollama */}
          {isSelfHosted && (
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1">
                Add Model Manually
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={manualModelEntry}
                  onChange={(e) => setManualModelEntry(e.target.value)}
                  placeholder="e.g., llama2:7b"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddManualModel();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddManualModel}
                  disabled={!manualModelEntry.trim()}
                >
                  Add
                </Button>
              </div>
              <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                Enter model name (e.g., llama2:7b, mistral, codellama) and click
                Add
              </p>
            </div>
          )}

          {/* Default model selection */}
          {enabledModels.length > 0 && (
            <div>
              <label
                htmlFor="defaultModel"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-1"
              >
                Default Model
              </label>
              <select
                id="defaultModel"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-foreground dark:text-foreground-dark focus:border-accent focus:outline-none focus:ring-accent"
              >
                <option value="">Select default model (optional)</option>
                {enabledModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                Select which model to use by default when multiple models are
                enabled
              </p>
            </div>
          )}
        </div>
      )}

      {/* Test Connection button for Ollama */}
      {isSelfHosted && (
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isTestingConnection || !endpointUrl.trim()}
            loading={isTestingConnection}
          >
            <FiCheckCircle className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          {connectionTestResult && (
            <div
              className={`mt-2 rounded-md p-3 ${
                connectionTestResult.success
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-yellow-50 dark:bg-yellow-900/20"
              }`}
            >
              <p
                className={`text-sm ${
                  connectionTestResult.success
                    ? "text-green-800 dark:text-green-200"
                    : "text-yellow-800 dark:text-yellow-200"
                }`}
              >
                {connectionTestResult.message}
              </p>
            </div>
          )}
          <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
            Optional: Test connectivity to Ollama endpoint. Form submission is
            not blocked if test fails.
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} disabled={!providerType}>
          {initialProvider ? "Update Provider" : "Add Provider"}
        </Button>
      </div>
    </form>
  );
}

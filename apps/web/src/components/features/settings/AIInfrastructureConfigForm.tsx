'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, useToast } from '@stride/ui';
import { aiGatewayConfigSchema, type AIGatewayConfig } from '@/lib/config/schemas/ai-gateway-schema';
import { cn } from '@stride/ui';
import { FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

/**
 * AI Infrastructure Configuration Form Props
 */
export interface AIInfrastructureConfigFormProps {
  /**
   * Initial configuration values
   */
  initialConfig?: {
    aiGatewayUrl?: string;
    llmEndpoint?: string;
    source: 'database' | 'environment' | 'default';
    configuredApiKeys?: {
      openaiApiKey?: boolean;
      anthropicApiKey?: boolean;
      googleAiApiKey?: boolean;
    };
    defaultModels?: {
      openai?: string;
      anthropic?: string;
      googleAi?: string;
      ollama?: string;
    };
  };
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: AIGatewayConfig) => Promise<void>;
  /**
   * Whether form is submitting
   */
  isSubmitting?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when test connection button is clicked
   */
  onTestConnection?: (service: 'ai-gateway' | 'ollama') => Promise<void>;
  /**
   * Whether test connection is loading
   */
  testConnectionLoading?: {
    'ai-gateway'?: boolean;
    ollama?: boolean;
  };
}

/**
 * AI Infrastructure Configuration Form Component
 * 
 * Allows admins to configure AI Gateway URL, Ollama endpoint, and provider API keys.
 * Shows read-only state when environment variables override UI settings.
 * 
 * Critical: Secrets (API keys) are never displayed in UI,
 * even in read-only mode.
 */
export function AIInfrastructureConfigForm({
  initialConfig,
  onSubmit,
  isSubmitting = false,
  className,
  onTestConnection,
  testConnectionLoading = {},
}: AIInfrastructureConfigFormProps) {
  const toast = useToast();
  
  // Determine read-only state (env vars override UI)
  const isReadOnly = initialConfig?.source === 'environment';

  // Track which API keys are configured (from initial config)
  const configuredApiKeys = initialConfig?.configuredApiKeys || {};

  // Track edit/delete state for each API key field
  const [editingFields, setEditingFields] = React.useState<Set<string>>(new Set());
  const [deletedFields, setDeletedFields] = React.useState<Set<string>>(new Set());

  // Form schema - make all fields optional since we're using partial config
  const formSchema = aiGatewayConfigSchema.partial();
  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aiGatewayUrl: initialConfig?.aiGatewayUrl || '',
      llmEndpoint: initialConfig?.llmEndpoint || '',
      openaiApiKey: '', // Never pre-fill secrets
      anthropicApiKey: '', // Never pre-fill secrets
      googleAiApiKey: '', // Never pre-fill secrets
      openaiDefaultModel: initialConfig?.defaultModels?.openai || '',
      anthropicDefaultModel: initialConfig?.defaultModels?.anthropic || '',
      googleAiDefaultModel: initialConfig?.defaultModels?.googleAi || '',
      ollamaDefaultModel: initialConfig?.defaultModels?.ollama || '',
    },
  });

  // Sync form values when initialConfig changes (e.g., after parent refetches)
  React.useEffect(() => {
    reset({
      aiGatewayUrl: initialConfig?.aiGatewayUrl || '',
      llmEndpoint: initialConfig?.llmEndpoint || '',
      openaiApiKey: '', // Never pre-fill secrets
      anthropicApiKey: '', // Never pre-fill secrets
      googleAiApiKey: '', // Never pre-fill secrets
    }, { keepValues: false });
    // Clear editing/deletion state when config updates from parent
    setEditingFields(new Set());
    setDeletedFields(new Set());
  }, [
    initialConfig?.aiGatewayUrl,
    initialConfig?.llmEndpoint,
    initialConfig?.configuredApiKeys?.openaiApiKey,
    initialConfig?.configuredApiKeys?.anthropicApiKey,
    initialConfig?.configuredApiKeys?.googleAiApiKey,
    reset,
  ]);

  // Watch all form values to compute custom dirty state
  const watchedValues = watch();
  
  // Custom dirty check: form is dirty if values differ from saved state
  // Empty fields with saved values are NOT dirty (user hasn't changed anything)
  // Fields in edit mode or marked for deletion ARE dirty
  const isDirty = React.useMemo(() => {
    // Check URL fields (they're always shown, so simple comparison)
    if (watchedValues.aiGatewayUrl !== (initialConfig?.aiGatewayUrl || '')) return true;
    if (watchedValues.llmEndpoint !== (initialConfig?.llmEndpoint || '')) return true;
    
    // For API keys: dirty if editing, deleted, or has a value (user is changing)
    const apiKeyFields = ['openaiApiKey', 'anthropicApiKey', 'googleAiApiKey'] as const;
    for (const field of apiKeyFields) {
      if (editingFields.has(field) || deletedFields.has(field) || watchedValues[field]) {
        return true;
      }
    }

    return false;
  }, [watchedValues, initialConfig, editingFields, deletedFields]);

  // Helper functions for edit/delete actions
  const handleEditField = (fieldName: string) => {
    setEditingFields((prev) => new Set(prev).add(fieldName));
    setDeletedFields((prev) => {
      const next = new Set(prev);
      next.delete(fieldName);
      return next;
    });
    setValue(fieldName as keyof FormData, '', { shouldValidate: false });
  };

  const handleDeleteField = (fieldName: string) => {
    setDeletedFields((prev) => new Set(prev).add(fieldName));
    setEditingFields((prev) => {
      const next = new Set(prev);
      next.delete(fieldName);
      return next;
    });
    setValue(fieldName as keyof FormData, '', { shouldValidate: false });
  };

  const handleCancelEdit = (fieldName: string) => {
    setEditingFields((prev) => {
      const next = new Set(prev);
      next.delete(fieldName);
      return next;
    });
    setValue(fieldName as keyof FormData, '', { shouldValidate: false });
  };

  // Handle form submission
  const onSubmitForm = async (data: FormData) => {
    try {
      // Idempotent save: only include fields that were actually changed
      const cleanedData: AIGatewayConfig = {};
      
      // URLs: always send (they're always visible)
      cleanedData.aiGatewayUrl = data.aiGatewayUrl?.trim() || '';
      cleanedData.llmEndpoint = data.llmEndpoint?.trim() || '';

      // API keys: only send if field is being edited/deleted OR is new (not saved yet)
      // Empty string = delete, has value = update/add
      if (editingFields.has('openaiApiKey') || deletedFields.has('openaiApiKey') || !configuredApiKeys.openaiApiKey) {
        cleanedData.openaiApiKey = data.openaiApiKey?.trim() || '';
      }
      if (editingFields.has('anthropicApiKey') || deletedFields.has('anthropicApiKey') || !configuredApiKeys.anthropicApiKey) {
        cleanedData.anthropicApiKey = data.anthropicApiKey?.trim() || '';
      }
      if (editingFields.has('googleAiApiKey') || deletedFields.has('googleAiApiKey') || !configuredApiKeys.googleAiApiKey) {
        cleanedData.googleAiApiKey = data.googleAiApiKey?.trim() || '';
      }
      
      await onSubmit(cleanedData);
      
      // Clear edit/delete state after successful save
      setEditingFields(new Set());
      setDeletedFields(new Set());
      
      toast.success('AI Gateway configuration has been updated successfully.');
    } catch (error) {
      console.error('Failed to save AI Gateway configuration:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to save configuration. Please try again.';
      toast.error('Failed to save configuration', {
        description: errorMessage,
      });
    }
  };

  // Handle clear all configuration
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all AI Gateway configuration? This will remove all URLs and API keys.')) {
      return;
    }

    try {
      // Submit empty object to delete all
      await onSubmit({});

      // Reset form to empty state
      reset({
        aiGatewayUrl: '',
        llmEndpoint: '',
        openaiApiKey: '',
        anthropicApiKey: '',
        googleAiApiKey: '',
      }, { keepValues: false });

      toast.success('AI Gateway configuration has been cleared.');
    } catch (error) {
      console.error('Failed to clear AI Gateway configuration:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to clear configuration. Please try again.';
      toast.error('Failed to clear configuration', {
        description: errorMessage,
      });
    }
  };

  // Handle test connection
  const handleTestConnection = async (service: 'ai-gateway' | 'ollama') => {
    if (!onTestConnection) {
      return;
    }

    try {
      await onTestConnection(service);
      toast.success(`${service === 'ai-gateway' ? 'AI Gateway' : 'Ollama endpoint'} connection is valid.`);
    } catch (error) {
      console.error(`Failed to test ${service} connection:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to test ${service === 'ai-gateway' ? 'AI Gateway' : 'Ollama'} connection.`;
      toast.error('Connection test failed', {
        description: errorMessage,
      });
    }
  };

  // Map provider type to state key
  const getProviderStateKey = (providerType: 'openai' | 'anthropic' | 'google-gemini' | 'ollama'): 'openai' | 'anthropic' | 'googleAi' | 'ollama' => {
    if (providerType === 'google-gemini') return 'googleAi';
    return providerType;
  };


  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className={cn('space-y-6', className)}>
      {/* AI Gateway URL Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
            AI Gateway URL
          </h4>
          {onTestConnection && !isReadOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleTestConnection('ai-gateway')}
              disabled={testConnectionLoading?.['ai-gateway'] || isSubmitting}
              loading={testConnectionLoading?.['ai-gateway']}
            >
              Test Connection
            </Button>
          )}
        </div>

        {isReadOnly ? (
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Configured via environment variables. Update{' '}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                AI_GATEWAY_URL
              </code>{' '}
              to change.
            </p>
            {initialConfig?.aiGatewayUrl && (
              <div className="mt-3">
                <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                  AI Gateway URL (read-only)
                </label>
                <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                  {initialConfig.aiGatewayUrl}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Input
            {...register('aiGatewayUrl')}
            id="ai-gateway-url"
            label="AI Gateway URL"
            placeholder="https://ai-gateway.example.com"
            error={errors.aiGatewayUrl?.message}
          />
        )}
      </div>

      {/* Ollama Endpoint Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
            Ollama Endpoint
          </h4>
          {onTestConnection && !isReadOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleTestConnection('ollama')}
              disabled={testConnectionLoading?.ollama || isSubmitting}
              loading={testConnectionLoading?.ollama}
            >
              Test Connection
            </Button>
          )}
        </div>

        {isReadOnly ? (
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Configured via environment variables. Update{' '}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                LLM_ENDPOINT
              </code>{' '}
              to change.
            </p>
            {initialConfig?.llmEndpoint && (
              <div className="mt-3">
                <label className="block text-xs text-foreground-secondary dark:text-foreground-dark-secondary mb-1">
                  Ollama Endpoint (read-only)
                </label>
                <div className="text-sm text-foreground dark:text-foreground-dark font-mono">
                  {initialConfig.llmEndpoint}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Input
            {...register('llmEndpoint')}
            id="ollama-endpoint"
            label="Ollama Endpoint URL"
            placeholder="http://localhost:11434"
            error={errors.llmEndpoint?.message}
          />
        )}
      </div>

      {/* Provider API Keys Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground dark:text-foreground-dark">
          Provider API Keys
        </h4>
        <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
          Configure default API keys for AI providers. These are used as global defaults
          and can be overridden per-project.
        </p>

        {isReadOnly ? (
          <div className="p-4 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              Configured via environment variables. Update{' '}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                OPENAI_API_KEY
              </code>
              ,{' '}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                ANTHROPIC_API_KEY
              </code>
              , or{' '}
              <code className="text-xs bg-surface dark:bg-surface-dark px-1 py-0.5 rounded">
                GOOGLE_AI_API_KEY
              </code>{' '}
              to change.
            </p>
            <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary mt-2">
              API keys are never displayed for security reasons.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* OpenAI API Key */}
            <div>
              {configuredApiKeys.openaiApiKey && !editingFields.has('openaiApiKey') && !deletedFields.has('openaiApiKey') ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground dark:text-foreground-dark">
                    OpenAI API Key
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
                    <div className="flex items-center gap-2">
                      <span className="text-success dark:text-success-dark">✓</span>
                      <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                        A value is saved (hidden for security)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField('openaiApiKey')}
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField('openaiApiKey')}
                      >
                        <FiTrash2 className="h-4 w-4 text-error" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    {...register('openaiApiKey')}
                    id="openai-api-key"
                    type="password"
                    label="OpenAI API Key"
                    placeholder="sk-..."
                    error={errors.openaiApiKey?.message}
                  />
                  {editingFields.has('openaiApiKey') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelEdit('openaiApiKey')}
                      className="mt-2"
                    >
                      <FiX className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Anthropic API Key */}
            <div>
              {configuredApiKeys.anthropicApiKey && !editingFields.has('anthropicApiKey') && !deletedFields.has('anthropicApiKey') ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground dark:text-foreground-dark">
                    Anthropic API Key
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
                    <div className="flex items-center gap-2">
                      <span className="text-success dark:text-success-dark">✓</span>
                      <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                        A value is saved (hidden for security)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField('anthropicApiKey')}
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField('anthropicApiKey')}
                      >
                        <FiTrash2 className="h-4 w-4 text-error" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    {...register('anthropicApiKey')}
                    id="anthropic-api-key"
                    type="password"
                    label="Anthropic API Key"
                    placeholder="sk-ant-..."
                    error={errors.anthropicApiKey?.message}
                  />
                  {editingFields.has('anthropicApiKey') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelEdit('anthropicApiKey')}
                      className="mt-2"
                    >
                      <FiX className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Google AI API Key */}
            <div>
              {configuredApiKeys.googleAiApiKey && !editingFields.has('googleAiApiKey') && !deletedFields.has('googleAiApiKey') ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground dark:text-foreground-dark">
                    Google AI API Key
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary">
                    <div className="flex items-center gap-2">
                      <span className="text-success dark:text-success-dark">✓</span>
                      <span className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
                        A value is saved (hidden for security)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField('googleAiApiKey')}
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField('googleAiApiKey')}
                      >
                        <FiTrash2 className="h-4 w-4 text-error" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    {...register('googleAiApiKey')}
                    id="google-ai-api-key"
                    type="password"
                    label="Google AI API Key"
                    placeholder="AIza..."
                    error={errors.googleAiApiKey?.message}
                  />
                  {editingFields.has('googleAiApiKey') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelEdit('googleAiApiKey')}
                      className="mt-2"
                    >
                      <FiX className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {!isReadOnly && (
        <div className="flex justify-between items-center gap-3">
          {/* Clear All Button - only show if there's existing config */}
          {(initialConfig?.aiGatewayUrl || initialConfig?.llmEndpoint) && (
            <Button
              type="button"
              variant="danger"
              onClick={handleClearAll}
              disabled={isSubmitting}
            >
              Clear Configuration
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              loading={isSubmitting}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

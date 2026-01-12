'use client';

import { useState, useEffect } from 'react';
import { Badge, Button } from '@stride/ui';
import { AiProviderForm } from './AiProviderForm';
import { FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';

export interface AiProvider {
  id: string;
  providerType: 'openai' | 'anthropic' | 'google-gemini' | 'ollama';
  endpointUrl: string | null;
  enabledModels: string[];
  defaultModel: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiProviderSettingsProps {
  projectId: string;
}

/**
 * AiProviderSettings Component
 * 
 * Main component for managing AI provider configurations in project settings.
 * Displays list of configured providers with add/edit/delete actions.
 */
export function AiProviderSettings({
  projectId,
}: AiProviderSettingsProps) {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch configured providers
  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/ai-providers`);

      if (!response.ok) {
        if (response.status === 404) {
          // No providers exist - this is fine
          setProviders([]);
          return;
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch providers');
      }

      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [projectId]);

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this AI provider configuration?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/ai-providers/${providerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete provider');
      }

      setSuccessMessage('AI provider deleted successfully');
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    }
  };

  const handleEdit = (provider: AiProvider) => {
    setEditingProvider(provider);
    setShowForm(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleAdd = () => {
    setEditingProvider(null);
    setShowForm(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProvider(null);
    setError(null);
  };

  const handleSubmit = async (data: {
    providerType: 'openai' | 'anthropic' | 'google-gemini' | 'ollama';
    apiKey?: string;
    endpointUrl?: string;
    authToken?: string;
    enabledModels: string[];
    defaultModel?: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (editingProvider) {
        // Update existing provider
        const response = await fetch(`/api/projects/${projectId}/ai-providers/${editingProvider.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update provider');
        }

        setSuccessMessage('AI provider updated successfully');
      } else {
        // Create new provider
        const response = await fetch(`/api/projects/${projectId}/ai-providers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create provider');
        }

        setSuccessMessage('AI provider added successfully');
      }

      setShowForm(false);
      setEditingProvider(null);
      await fetchProviders();
    } catch (err) {
      throw err; // Let form component handle display
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProviderDisplayName = (type: string) => {
    switch (type) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      case 'google-gemini':
        return 'Google Gemini';
      case 'ollama':
        return 'Ollama';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading AI providers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Providers List */}
      {providers.length > 0 && (
        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                      {getProviderDisplayName(provider.providerType)}
                    </h3>
                    <Badge variant={provider.isActive ? 'success' : 'warning'}>
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="space-y-2 mt-4">
                    {provider.endpointUrl && (
                      <div className="text-sm">
                        <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
                          Endpoint:{' '}
                        </span>
                        <span className="text-foreground dark:text-foreground-dark font-mono">
                          {provider.endpointUrl}
                        </span>
                      </div>
                    )}
                    {provider.enabledModels.length > 0 && (
                      <div className="text-sm">
                        <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
                          Enabled Models:{' '}
                        </span>
                        <span className="text-foreground dark:text-foreground-dark">
                          {provider.enabledModels.join(', ')}
                        </span>
                      </div>
                    )}
                    {provider.defaultModel && (
                      <div className="text-sm">
                        <span className="text-foreground-secondary dark:text-foreground-dark-secondary">
                          Default Model:{' '}
                        </span>
                        <span className="text-foreground dark:text-foreground-dark font-mono">
                          {provider.defaultModel}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                      Updated: {formatDate(provider.updatedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(provider)}
                    aria-label="Edit provider"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(provider.id)}
                    aria-label="Delete provider"
                  >
                    <FiTrash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {providers.length === 0 && !showForm && (
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <div className="flex items-center gap-3">
            <Badge variant="default">No Providers</Badge>
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              No AI providers configured for this project.
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm ? (
        <div className="rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-4">
            {editingProvider ? 'Edit AI Provider' : 'Add AI Provider'}
          </h2>
          <AiProviderForm
            projectId={projectId}
            initialProvider={editingProvider || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={isSubmitting}
            error={error}
          />
        </div>
      ) : (
        <div className="flex justify-start">
          <Button onClick={handleAdd} variant="primary">
            <FiPlus className="h-4 w-4 mr-2" />
            Add AI Provider
          </Button>
        </div>
      )}
    </div>
  );
}

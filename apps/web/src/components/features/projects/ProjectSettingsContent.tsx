'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ProjectConfig } from '@stride/yaml-config';
import { RepositoryConnectionSettings } from './RepositoryConnectionSettings';
import { AiProviderSettings } from './AiProviderSettings';
import { ConfigurationAssistant } from './ConfigurationAssistant';
import { Button } from '@stride/ui';
import { getCsrfHeaders } from '@/lib/utils/csrf';

// Dynamically import ConfigEditor to code-split the heavy CodeMirror editor
const ConfigEditor = dynamic(
  () => import('@stride/ui').then((mod) => ({ default: mod.ConfigEditor })),
  {
    ssr: false, // Disable SSR since CodeMirror is a client-side editor
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto" />
          <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading editor...
          </p>
        </div>
      </div>
    ),
  }
);

export type SettingsTab = 'config' | 'integrations';

export interface ProjectSettingsContentProps {
  activeTab: SettingsTab;
  projectId: string;
}

/**
 * ProjectSettingsContent component
 * 
 * Renders the content for the active settings tab.
 * Handles loading states and error states for each tab.
 */
export function ProjectSettingsContent({
  activeTab,
  projectId,
}: ProjectSettingsContentProps) {
  const [configYaml, setConfigYaml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(activeTab === 'config');
  const [error, setError] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [hasAssistantPermission, setHasAssistantPermission] = useState<boolean | null>(null);

  // Fetch configuration when config tab is active
  useEffect(() => {
    if (activeTab !== 'config') {
      setIsLoading(false);
      return;
    }

    async function fetchConfig() {
      try {
        setIsLoading(true);
        const csrfHeaders = getCsrfHeaders();
        
        const [configResponse, permissionResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}/config`, {
            headers: csrfHeaders,
          }),
          fetch(`/api/projects/${projectId}/assistant/permissions`, {
            headers: csrfHeaders,
          }),
        ]);

        // Handle permission check
        if (permissionResponse.ok) {
          const permissionData = await permissionResponse.json();
          setHasAssistantPermission(permissionData.hasPermission ?? false);
        } else {
          // If permission check fails, assume no permission
          setHasAssistantPermission(false);
        }

        // Handle config fetch
        if (!configResponse.ok) {
          if (configResponse.status === 403) {
            setError('You do not have permission to view this configuration');
          } else if (configResponse.status === 404) {
            setError('Project or configuration not found');
          } else {
            setError('Failed to load configuration');
          }
          return;
        }

        const data = await configResponse.json();
        setConfigYaml(data.configYaml || '');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load configuration'
        );
        setHasAssistantPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, [activeTab, projectId]);

  const handleSave = async (yaml: string, config: ProjectConfig) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          configYaml: yaml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      // Update local state
      setConfigYaml(yaml);
    } catch (err) {
      throw err; // Re-throw to let ConfigEditor handle it
    }
  };

  if (activeTab === 'config') {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-foreground-secondary dark:text-foreground-dark-secondary">
              Loading configuration...
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-error dark:text-error-dark text-xl mb-4">
              Error
            </div>
            <p className="text-foreground-secondary dark:text-foreground-dark-secondary">
              {error}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Assistant Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark">
              Configuration Editor
            </h2>
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
              Edit your project configuration YAML
            </p>
          </div>
          <div className="relative">
            <Button
              variant={showAssistant ? "secondary" : "primary"}
              onClick={() => setShowAssistant(!showAssistant)}
              disabled={hasAssistantPermission === false}
              className={showAssistant 
                ? "" 
                : "bg-accent hover:bg-accent-hover active:bg-accent-active text-white dark:bg-accent dark:hover:bg-accent-hover dark:active:bg-accent-active dark:text-white dark:shadow-[0_0_0_1px_rgba(0,212,170,0.3),0_4px_12px_rgba(0,212,170,0.2)] dark:hover:shadow-[0_0_0_1px_rgba(0,212,170,0.4),0_6px_16px_rgba(0,212,170,0.3)] shadow-md hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              }
              title={hasAssistantPermission === false ? "You do not have permission to use the AI assistant. Admin role required." : undefined}
            >
              {showAssistant ? "Hide AI Assistant" : "Ask AI Assistant"}
            </Button>
          </div>
        </div>

        {/* Assistant or Editor */}
        {showAssistant ? (
          <ConfigurationAssistant projectId={projectId} />
        ) : (
          <div className="h-[calc(100vh-16rem)]">
            <ConfigEditor
              initialValue={configYaml}
              onSave={handleSave}
              showPreview={true}
            />
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'integrations') {
    return (
      <div className="space-y-8">
        {/* Repository Connections Section */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground dark:text-foreground-dark">
            Repository Connections
          </h2>
          <RepositoryConnectionSettings projectId={projectId} />
        </div>

        {/* AI Provider Configuration Section */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground dark:text-foreground-dark">
            AI Providers
          </h2>
          <AiProviderSettings projectId={projectId} />
        </div>
      </div>
    );
  }

  return null;
}

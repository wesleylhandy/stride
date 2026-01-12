'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ProjectConfig } from '@stride/yaml-config';
import { RepositoryConnectionSettings } from './RepositoryConnectionSettings';
import { AiProviderSettings } from './AiProviderSettings';

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

  // Fetch configuration when config tab is active
  useEffect(() => {
    if (activeTab !== 'config') {
      setIsLoading(false);
      return;
    }

    async function fetchConfig() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/config`);

        if (!response.ok) {
          if (response.status === 403) {
            setError('You do not have permission to view this configuration');
          } else if (response.status === 404) {
            setError('Project or configuration not found');
          } else {
            setError('Failed to load configuration');
          }
          return;
        }

        const data = await response.json();
        setConfigYaml(data.configYaml || '');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load configuration'
        );
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
      <div className="h-[calc(100vh-16rem)]">
        <ConfigEditor
          initialValue={configYaml}
          onSave={handleSave}
          showPreview={true}
        />
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

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConfigEditor } from "@stride/ui";
import type { ProjectConfig } from "@stride/yaml-config";

/**
 * Project Configuration Settings Page
 * Admin-only access to edit project configuration
 */
export default function ProjectConfigPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [configYaml, setConfigYaml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current configuration
  useEffect(() => {
    async function fetchConfig() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/config`);
        
        if (!response.ok) {
          if (response.status === 403) {
            setError("You do not have permission to view this configuration");
          } else if (response.status === 404) {
            setError("Project or configuration not found");
          } else {
            setError("Failed to load configuration");
          }
          return;
        }

        const data = await response.json();
        setConfigYaml(data.configYaml || "");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load configuration"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId) {
      fetchConfig();
    }
  }, [projectId]);

  const handleSave = async (yaml: string, config: ProjectConfig) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          configYaml: yaml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save configuration");
      }

      // Update local state
      setConfigYaml(yaml);
    } catch (err) {
      throw err; // Re-throw to let ConfigEditor handle it
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading configuration...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">
            Error
          </div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Project Configuration
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Edit your project's workflow configuration, custom fields, and automation rules.
          Changes take effect immediately after saving.
        </p>
      </div>

      <div className="h-[calc(100vh-12rem)]">
        <ConfigEditor
          initialValue={configYaml}
          onSave={handleSave}
          showPreview={true}
        />
      </div>
    </div>
  );
}


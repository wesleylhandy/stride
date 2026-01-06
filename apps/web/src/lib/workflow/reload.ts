import { projectRepository } from "@stride/database";
import type { ProjectConfig } from "@stride/yaml-config";

/**
 * Reload workflow configuration from database
 * @param projectId - Project ID
 * @returns Parsed project configuration or null if not found
 */
export async function reloadWorkflowConfig(
  projectId: string
): Promise<ProjectConfig | null> {
  const config = await projectRepository.getConfig(projectId);
  if (!config || !config.config) {
    return null;
  }

  // The config is already parsed and stored as JSONB
  // We just need to cast it to ProjectConfig
  return config.config as ProjectConfig;
}

/**
 * Invalidate config cache for a project
 * This is a placeholder for future cache implementation
 * Currently, we always fetch fresh config from database
 */
export function invalidateConfigCache(projectId: string): void {
  // TODO: Implement cache invalidation when caching layer is added
  // For now, we always fetch fresh from database
  console.log(`Config cache invalidated for project: ${projectId}`);
}


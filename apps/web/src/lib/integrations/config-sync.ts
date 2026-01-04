import {
  getGitHubFileContent,
  getGitHubRepository,
  parseGitHubRepositoryUrl,
} from "./github";
import {
  getGitLabFileContent,
  getGitLabRepository,
  parseGitLabRepositoryUrl,
} from "./gitlab";
import { generateDefaultConfig } from "@stride/yaml-config";
import { parseYamlConfig, stringifyYamlConfig } from "@stride/yaml-config";

/**
 * Configuration file synchronization from Git repositories
 */

const CONFIG_FILE_PATH = ".stride/config.yaml";

/**
 * Clone configuration file from GitHub repository
 * @param repositoryUrl - GitHub repository URL
 * @param accessToken - GitHub access token
 * @param ref - Optional branch/ref (defaults to default branch)
 * @returns Configuration YAML string or null if file doesn't exist
 */
export async function cloneConfigFromGitHub(
  repositoryUrl: string,
  accessToken: string,
  ref?: string,
): Promise<string | null> {
  try {
    const parsed = parseGitHubRepositoryUrl(repositoryUrl);
    if (!parsed) {
      throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
    }

    // Get repository info to get default branch if ref not provided
    const repo = await getGitHubRepository(
      parsed.owner,
      parsed.repo,
      accessToken,
    );
    const branch = ref || repo.default_branch;

    // Try to get config file
    const configContent = await getGitHubFileContent(
      parsed.owner,
      parsed.repo,
      CONFIG_FILE_PATH,
      accessToken,
      branch,
    );

    return configContent;
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Clone configuration file from GitLab repository
 * @param repositoryUrl - GitLab repository URL
 * @param accessToken - GitLab access token
 * @param ref - Optional branch/ref (defaults to default branch)
 * @param baseUrl - Optional base URL for self-hosted instances
 * @returns Configuration YAML string or null if file doesn't exist
 */
export async function cloneConfigFromGitLab(
  repositoryUrl: string,
  accessToken: string,
  ref?: string,
  baseUrl?: string,
): Promise<string | null> {
  try {
    const projectPath = parseGitLabRepositoryUrl(repositoryUrl);
    if (!projectPath) {
      throw new Error(`Invalid GitLab repository URL: ${repositoryUrl}`);
    }

    // Get repository info to get default branch if ref not provided
    const repo = await getGitLabRepository(projectPath, accessToken, baseUrl);
    const branch = ref || repo.default_branch;

    // Try to get config file
    const configContent = await getGitLabFileContent(
      repo.id,
      CONFIG_FILE_PATH,
      accessToken,
      branch,
      baseUrl,
    );

    return configContent;
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Clone configuration file from repository or generate default
 * @param repositoryType - Type of repository
 * @param repositoryUrl - Repository URL
 * @param accessToken - Access token
 * @param projectKey - Project key for default config
 * @param projectName - Project name for default config
 * @param ref - Optional branch/ref
 * @param baseUrl - Optional base URL (for self-hosted GitLab)
 * @returns Object with configYaml and parsed config
 */
export async function syncConfigFromRepository(
  repositoryType: "GitHub" | "GitLab" | "Bitbucket",
  repositoryUrl: string,
  accessToken: string,
  projectKey: string,
  projectName: string,
  ref?: string,
  baseUrl?: string,
): Promise<{
  configYaml: string;
  config: unknown;
}> {
  let configYaml: string | null = null;

  // Try to clone config from repository
  try {
    switch (repositoryType) {
      case "GitHub":
        configYaml = await cloneConfigFromGitHub(
          repositoryUrl,
          accessToken,
          ref,
        );
        break;
      case "GitLab":
        configYaml = await cloneConfigFromGitLab(
          repositoryUrl,
          accessToken,
          ref,
          baseUrl,
        );
        break;
      case "Bitbucket":
        // TODO: Implement Bitbucket config cloning
        configYaml = null;
        break;
    }
  } catch (error) {
    console.error("Error cloning config from repository:", error);
    // Fall through to default config generation
  }

  // If config file doesn't exist, generate default
  if (!configYaml) {
    const defaultConfig = generateDefaultConfig(projectKey, projectName);
    configYaml = stringifyYamlConfig(defaultConfig);
  }

  // Parse and validate config
  const parseResult = parseYamlConfig(configYaml);

  if (!parseResult.success || !parseResult.data) {
    // If parsing fails, fall back to default config
    const defaultConfig = generateDefaultConfig(projectKey, projectName);
    configYaml = stringifyYamlConfig(defaultConfig);
    return {
      configYaml,
      config: defaultConfig,
    };
  }

  return {
    configYaml,
    config: parseResult.data,
  };
}


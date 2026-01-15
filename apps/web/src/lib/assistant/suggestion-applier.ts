/**
 * Configuration suggestion application service
 * Handles applying AI-suggested configurations with conflict detection
 */

import type { ProjectConfig } from "@stride/yaml-config";
import { parseYamlConfig, stringifyYamlConfig } from "@stride/yaml-config";
import { projectRepository } from "@stride/database";
import type { Prisma } from "@stride/database";
import { compareConfigurations, type ComparisonResult } from "./config-comparison";

export interface ConfigurationSuggestion {
  type: "workflow" | "custom_field" | "automation_rule" | "infrastructure" | "full";
  config: Record<string, unknown> | string; // Can be partial config or full YAML string
  explanation?: string;
}

export interface ConflictResolution {
  hasConflict: boolean;
  currentConfig: ProjectConfig;
  suggestedConfig: ProjectConfig;
  conflicts: ComparisonResult;
}

export interface ApplySuggestionResult {
  success: boolean;
  applied: boolean;
  conflictResolution?: ConflictResolution;
  error?: string;
}

/**
 * Validate and detect conflicts for a configuration suggestion
 * Compares suggested configuration to current database state
 * 
 * @param projectId - Project ID
 * @param suggestion - Configuration suggestion from AI
 * @returns Conflict resolution result
 */
export async function detectConflicts(
  projectId: string,
  suggestion: ConfigurationSuggestion
): Promise<ConflictResolution> {
  // Get current project configuration
  const projectConfig = await projectRepository.getConfig(projectId);
  if (!projectConfig) {
    throw new Error(`Project configuration not found for project ${projectId}`);
  }

  // Parse current YAML config
  const currentYamlResult = parseYamlConfig(projectConfig.configYaml);
  if (!currentYamlResult.success) {
    throw new Error(
      `Failed to parse current YAML config: ${currentYamlResult.errors?.map((e) => e.message).join(", ")}`
    );
  }
  const currentConfig = currentYamlResult.data as ProjectConfig;

  // Build suggested configuration
  const suggestedConfig = await buildSuggestedConfig(
    currentConfig,
    suggestion
  );

  // Convert suggested config to JSON for comparison
  const suggestedConfigJson = suggestedConfig as unknown as Record<string, unknown>;

  // Compare with database config
  const conflicts = compareConfigurations(
    suggestedConfig,
    projectConfig.config
  );

  return {
    hasConflict: conflicts.hasDifferences,
    currentConfig,
    suggestedConfig,
    conflicts,
  };
}

/**
 * Build complete suggested configuration from partial suggestion
 * Merges suggestion with current configuration
 */
async function buildSuggestedConfig(
  currentConfig: ProjectConfig,
  suggestion: ConfigurationSuggestion
): Promise<ProjectConfig> {
  // If suggestion is a full YAML string, parse it
  if (typeof suggestion.config === "string") {
    const parsed = parseYamlConfig(suggestion.config);
    if (!parsed.success) {
      throw new Error(
        `Failed to parse suggested YAML: ${parsed.errors?.map((e) => e.message).join(", ")}`
      );
    }
    return parsed.data as ProjectConfig;
  }

  // Otherwise, merge partial suggestion with current config
  const suggested = { ...currentConfig };

  switch (suggestion.type) {
    case "workflow":
      if (suggestion.config.workflow) {
        suggested.workflow = suggestion.config.workflow as ProjectConfig["workflow"];
      }
      break;

    case "custom_field":
      if (suggestion.config.custom_fields) {
        suggested.custom_fields = suggestion.config.custom_fields as ProjectConfig["custom_fields"];
      } else if (suggestion.config.custom_field) {
        // Single custom field to add
        const existingFields = suggested.custom_fields || [];
        suggested.custom_fields = [
          ...existingFields,
          suggestion.config.custom_field as ProjectConfig["custom_fields"][0],
        ];
      }
      break;

    case "automation_rule":
      if (suggestion.config.automation_rules) {
        suggested.automation_rules = suggestion.config.automation_rules as ProjectConfig["automation_rules"];
      } else if (suggestion.config.automation_rule) {
        // Single automation rule to add
        const existingRules = suggested.automation_rules || [];
        suggested.automation_rules = [
          ...existingRules,
          suggestion.config.automation_rule as ProjectConfig["automation_rules"][0],
        ];
      }
      break;

    case "full":
      // Full config replacement
      return suggestion.config as ProjectConfig;

    default:
      // Merge all provided fields
      Object.assign(suggested, suggestion.config);
  }

  return suggested;
}

/**
 * Apply configuration suggestion to project
 * Validates, detects conflicts, and applies if no conflicts (or user confirmed resolution)
 * 
 * @param projectId - Project ID
 * @param suggestion - Configuration suggestion
 * @param resolveConflicts - Conflict resolution strategy: 'keep_current', 'use_suggested', or 'manual'
 * @returns Apply result
 */
export async function applySuggestion(
  projectId: string,
  suggestion: ConfigurationSuggestion,
  resolveConflicts: "keep_current" | "use_suggested" | "manual" = "use_suggested"
): Promise<ApplySuggestionResult> {
  try {
    // Detect conflicts
    const conflictResolution = await detectConflicts(projectId, suggestion);

    // If there are conflicts and user wants to keep current, don't apply
    if (conflictResolution.hasConflict && resolveConflicts === "keep_current") {
      return {
        success: true,
        applied: false,
        conflictResolution,
      };
    }

    // If manual resolution required, return conflicts for user to resolve
    if (conflictResolution.hasConflict && resolveConflicts === "manual") {
      return {
        success: true,
        applied: false,
        conflictResolution,
      };
    }

    // Build suggested config
    const suggestedConfig = conflictResolution.suggestedConfig;

    // Validate suggested config
    // (parseYamlConfig already validates, but double-check)
    const validation = parseYamlConfig(stringifyYamlConfig(suggestedConfig));
    if (!validation.success) {
      return {
        success: false,
        applied: false,
        error: `Invalid configuration: ${validation.errors?.map((e) => e.message).join(", ")}`,
      };
    }

    // Apply configuration to database
    const yamlString = stringifyYamlConfig(suggestedConfig);
    await projectRepository.update(projectId, {
      configYaml: yamlString,
      config: suggestedConfig as Prisma.JsonValue,
    });

    return {
      success: true,
      applied: true,
      conflictResolution: conflictResolution.hasConflict
        ? conflictResolution
        : undefined,
    };
  } catch (error) {
    return {
      success: false,
      applied: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

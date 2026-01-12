// Priority values extraction helper for AI gateway
import type { ProjectConfig } from './schema';

/**
 * Extracts priority values from project configuration
 * 
 * Looks for a custom field with key 'priority' that has dropdown type.
 * Returns the options array if found, otherwise returns null.
 * 
 * @param config - Project configuration object
 * @returns Array of priority values if found, null otherwise
 */
export function extractPriorityValues(config: ProjectConfig): string[] | null {
  // Find priority custom field
  const priorityField = config.custom_fields?.find(
    (field) => field.key === 'priority' && field.type === 'dropdown'
  );

  if (priorityField?.options && priorityField.options.length > 0) {
    return priorityField.options;
  }

  // Return null if no priority field found or no options defined
  return null;
}

/**
 * Gets priority values or returns standard defaults
 * 
 * Extracts priority values from config, or returns standard
 * priority values (low, medium, high) if not configured.
 * 
 * @param config - Project configuration object
 * @returns Array of priority values (custom or standard)
 */
export function getPriorityValues(config: ProjectConfig): string[] {
  const customValues = extractPriorityValues(config);
  
  if (customValues) {
    return customValues;
  }

  // Return standard priority values as fallback
  return ['low', 'medium', 'high'];
}

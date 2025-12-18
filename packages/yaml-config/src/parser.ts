// YAML parser using js-yaml
import * as yaml from 'js-yaml';
import { validateConfig, type ValidationResult } from './validator';

export interface ParseResult extends ValidationResult {
  raw?: string;
  yaml?: unknown;
}

/**
 * Parses and validates YAML configuration
 * @param yamlContent - Raw YAML string
 * @returns Parse and validation result
 */
export function parseYamlConfig(yamlContent: string): ParseResult {
  try {
    // Parse YAML
    const parsed = yaml.load(yamlContent, {
      schema: yaml.DEFAULT_SAFE_SCHEMA,
      onWarning: (warning) => {
        console.warn('YAML parsing warning:', warning);
      },
    });

    // Validate against schema
    const validation = validateConfig(parsed);

    return {
      ...validation,
      raw: yamlContent,
      yaml: parsed,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          message: error instanceof Error ? error.message : 'Failed to parse YAML',
          path: [],
          code: 'PARSE_ERROR',
        },
      ],
      raw: yamlContent,
    };
  }
}

/**
 * Converts configuration object to YAML string
 * @param config - Configuration object
 * @returns YAML string
 */
export function stringifyYamlConfig(config: unknown): string {
  return yaml.dump(config, {
    indent: 2,
    lineWidth: 80,
    noRefs: true,
    sortKeys: false,
  });
}


// YAML parser using js-yaml
import * as yaml from 'js-yaml';
import { validateConfig, type ValidationResult } from './validator';

/**
 * Attempts to find the line number for a given path in YAML content
 * This is a heuristic approach and may not be 100% accurate
 */
function findLineNumberForPath(
  yamlContent: string,
  path: string
): number | undefined {
  try {
    const lines = yamlContent.split('\n');
    const pathParts = path.split('.');
    const searchKey = pathParts[pathParts.length - 1];
    
    // Search for the key in the YAML content
    for (let i = 0; i < lines.length; i++) {
      const lineContent = lines[i];
      if (!lineContent) continue; // Skip undefined entries
      // Look for key pattern (key: or "key":)
      if (lineContent.includes(`${searchKey}:`) || lineContent.includes(`"${searchKey}":`)) {
        return i + 1; // Convert to 1-based line number
      }
    }
  } catch {
    // If anything fails, return undefined
  }
  return undefined;
}

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
    // js-yaml 4.x uses safe parsing by default, schema option is optional
    const parsed = yaml.load(yamlContent, {
      onWarning: (warning) => {
        console.warn('YAML parsing warning:', warning);
      },
    });

    // Validate against schema
    const validation = validateConfig(parsed);
    
    // If validation failed, try to map Zod errors to YAML line numbers
    if (!validation.success && validation.errors) {
      const errorsWithLines = validation.errors.map((err) => {
        // Try to find line number by searching for the path in YAML source
        if (err.path.length > 0) {
          const pathStr = err.path.join('.');
          const lineNumber = findLineNumberForPath(yamlContent, pathStr);
          if (lineNumber !== undefined) {
            return { ...err, line: lineNumber };
          }
        }
        return err;
      });
      
      return {
        ...validation,
        errors: errorsWithLines,
        raw: yamlContent,
        yaml: parsed,
      };
    }

    return {
      ...validation,
      raw: yamlContent,
      yaml: parsed,
    };
  } catch (error) {
    // Extract line number from js-yaml error if available
    let line: number | undefined;
    let column: number | undefined;
    
    if (error instanceof Error && error.message) {
      // js-yaml errors often contain "at line X, column Y" information
      const lineMatch = error.message.match(/line (\d+)/i);
      const columnMatch = error.message.match(/column (\d+)/i);
      
      if (lineMatch && lineMatch[1]) {
        line = parseInt(lineMatch[1], 10);
      }
      if (columnMatch && columnMatch[1]) {
        column = parseInt(columnMatch[1], 10);
      }
      
      // If no line info in message, try to find it from the error mark property
      if ('mark' in error && error.mark && typeof error.mark === 'object') {
        const mark = error.mark as { line?: number; column?: number };
        if (mark.line !== undefined) {
          line = mark.line + 1; // js-yaml uses 0-based indexing, convert to 1-based
        }
        if (mark.column !== undefined) {
          column = mark.column + 1;
        }
      }
    }
    
    return {
      success: false,
      errors: [
        {
          message: error instanceof Error ? error.message : 'Failed to parse YAML',
          path: [],
          code: 'PARSE_ERROR',
          line,
          column,
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


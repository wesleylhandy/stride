/**
 * Configuration comparison utility
 * Compares YAML configuration to database state and identifies differences
 */

import type { ProjectConfig } from "@stride/yaml-config";
import type { Prisma } from "@stride/database";

export interface ConfigDifference {
  path: string;
  yamlValue: unknown;
  dbValue: unknown;
  type: "missing_in_db" | "missing_in_yaml" | "value_mismatch";
  description: string;
}

export interface ComparisonResult {
  differences: ConfigDifference[];
  hasDifferences: boolean;
  summary: string;
}

/**
 * Deep comparison of YAML config and database config
 * Identifies missing fields, value mismatches, and structural differences
 * 
 * @param yamlConfig - Parsed YAML configuration
 * @param dbConfig - Database configuration (JSONB)
 * @returns Comparison result with differences
 */
export function compareConfigurations(
  yamlConfig: ProjectConfig,
  dbConfig: Prisma.JsonValue
): ComparisonResult {
  const differences: ConfigDifference[] = [];

  // Convert dbConfig to object if it's not already
  const dbConfigObj =
    typeof dbConfig === "object" && dbConfig !== null
      ? (dbConfig as Record<string, unknown>)
      : {};

  // Compare top-level fields
  compareObjects(
    yamlConfig,
    dbConfigObj,
    "",
    differences
  );

  const hasDifferences = differences.length > 0;
  const summary = generateComparisonSummary(differences);

  return {
    differences,
    hasDifferences,
    summary,
  };
}

/**
 * Recursively compare two objects and collect differences
 */
function compareObjects(
  yaml: unknown,
  db: unknown,
  basePath: string,
  differences: ConfigDifference[]
): void {
  // Handle null/undefined cases
  if (yaml === null || yaml === undefined) {
    if (db !== null && db !== undefined) {
      differences.push({
        path: basePath || "root",
        yamlValue: yaml,
        dbValue: db,
        type: "missing_in_yaml",
        description: `Field exists in database but not in YAML`,
      });
    }
    return;
  }

  if (db === null || db === undefined) {
    if (yaml !== null && yaml !== undefined) {
      differences.push({
        path: basePath || "root",
        yamlValue: yaml,
        dbValue: db,
        type: "missing_in_db",
        description: `Field exists in YAML but not in database`,
      });
    }
    return;
  }

  // Handle primitive types
  if (
    typeof yaml !== "object" ||
    typeof db !== "object" ||
    Array.isArray(yaml) ||
    Array.isArray(db)
  ) {
    if (!deepEqual(yaml, db)) {
      differences.push({
        path: basePath || "root",
        yamlValue: yaml,
        dbValue: db,
        type: "value_mismatch",
        description: `Values differ: YAML has ${JSON.stringify(yaml)}, DB has ${JSON.stringify(db)}`,
      });
    }
    return;
  }

  // Both are objects - compare keys
  const yamlKeys = new Set(Object.keys(yaml as Record<string, unknown>));
  const dbKeys = new Set(Object.keys(db as Record<string, unknown>));

  // Check for keys in YAML but not in DB
  for (const key of yamlKeys) {
    if (!dbKeys.has(key)) {
      const path = basePath ? `${basePath}.${key}` : key;
      differences.push({
        path,
        yamlValue: (yaml as Record<string, unknown>)[key],
        dbValue: undefined,
        type: "missing_in_db",
        description: `Field '${key}' exists in YAML but not in database`,
      });
    }
  }

  // Check for keys in DB but not in YAML
  for (const key of dbKeys) {
    if (!yamlKeys.has(key)) {
      const path = basePath ? `${basePath}.${key}` : key;
      differences.push({
        path,
        yamlValue: undefined,
        dbValue: (db as Record<string, unknown>)[key],
        type: "missing_in_yaml",
        description: `Field '${key}' exists in database but not in YAML`,
      });
    }
  }

  // Recursively compare common keys
  for (const key of yamlKeys) {
    if (dbKeys.has(key)) {
      const path = basePath ? `${basePath}.${key}` : key;
      const yamlValue = (yaml as Record<string, unknown>)[key];
      const dbValue = (db as Record<string, unknown>)[key];
      compareObjects(yamlValue, dbValue, path, differences);
    }
  }
}

/**
 * Deep equality check for values
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (
    a === null ||
    b === null ||
    a === undefined ||
    b === undefined ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
      return false;
  }

  return true;
}

/**
 * Generate human-readable summary of comparison differences
 */
function generateComparisonSummary(differences: ConfigDifference[]): string {
  if (differences.length === 0) {
    return "YAML and database configurations are identical.";
  }

  const missingInDb = differences.filter((d) => d.type === "missing_in_db").length;
  const missingInYaml = differences.filter((d) => d.type === "missing_in_yaml").length;
  const mismatches = differences.filter((d) => d.type === "value_mismatch").length;

  const parts: string[] = [];
  parts.push(`Found ${differences.length} difference(s):`);

  if (missingInDb > 0) {
    parts.push(`${missingInDb} field(s) in YAML but not in database`);
  }
  if (missingInYaml > 0) {
    parts.push(`${missingInYaml} field(s) in database but not in YAML`);
  }
  if (mismatches > 0) {
    parts.push(`${mismatches} value mismatch(es)`);
  }

  return parts.join(", ") + ".";
}

/**
 * Format comparison results for display or inclusion in prompts
 */
export function formatComparisonResults(result: ComparisonResult): string {
  if (!result.hasDifferences) {
    return result.summary;
  }

  const sections: string[] = [];
  sections.push(result.summary);
  sections.push("\n## Differences\n");

  for (const diff of result.differences) {
    sections.push(`### ${diff.path}`);
    sections.push(`**Type**: ${diff.type}`);
    sections.push(`**Description**: ${diff.description}`);
    
    if (diff.yamlValue !== undefined) {
      sections.push(`**YAML Value**: \`${JSON.stringify(diff.yamlValue)}\``);
    }
    
    if (diff.dbValue !== undefined) {
      sections.push(`**Database Value**: \`${JSON.stringify(diff.dbValue)}\``);
    }
    
    sections.push("");
  }

  return sections.join("\n");
}

/**
 * Configuration validation service for AI assistant
 * Validates configurations against schema and best practices
 */

import { safeValidateConfig, type ValidationResult } from "@stride/yaml-config";
import type { ProjectConfig } from "@stride/yaml-config";

export interface ValidationFinding {
  type: "error" | "warning" | "info" | "best_practice";
  severity: "critical" | "high" | "medium" | "low";
  path: (string | number)[];
  message: string;
  recommendation?: string;
  documentationLink?: string;
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  schemaErrors: ValidationResult["errors"];
  findings: ValidationFinding[];
  config?: ProjectConfig;
}

/**
 * Best practices checks for project configuration
 * These are recommendations beyond schema validation
 */
interface BestPracticeCheck {
  name: string;
  check: (config: ProjectConfig) => ValidationFinding[];
  severity: ValidationFinding["severity"];
}

const bestPracticeChecks: BestPracticeCheck[] = [
  {
    name: "default_status_exists",
    severity: "critical",
    check: (config) => {
      const findings: ValidationFinding[] = [];
      const defaultStatusKey = config.workflow.default_status;
      const statusExists = config.workflow.statuses.some(
        (s) => s.key === defaultStatusKey
      );
      if (!statusExists) {
        findings.push({
          type: "error",
          severity: "critical",
          path: ["workflow", "default_status"],
          message: `Default status "${defaultStatusKey}" does not exist in statuses array`,
          recommendation: `Ensure the default_status matches one of the status keys: ${config.workflow.statuses.map((s) => s.key).join(", ")}`,
          documentationLink: "/docs/configuration/reference#default_status",
        });
      }
      return findings;
    },
  },
  {
    name: "status_names_are_descriptive",
    severity: "low",
    check: (config) => {
      const findings: ValidationFinding[] = [];
      for (const status of config.workflow.statuses) {
        if (status.name.length < 3) {
          findings.push({
            type: "best_practice",
            severity: "low",
            path: ["workflow", "statuses", status.key, "name"],
            message: `Status name "${status.name}" is very short. Consider using more descriptive names`,
            recommendation: "Use clear, user-friendly status names (e.g., 'In Progress' instead of 'IP')",
            documentationLink: "/docs/configuration/reference#status-configuration",
          });
        }
      }
      return findings;
    },
  },
  {
    name: "status_keys_are_short",
    severity: "low",
    check: (config) => {
      const findings: ValidationFinding[] = [];
      for (const status of config.workflow.statuses) {
        if (status.key.length > 20) {
          findings.push({
            type: "best_practice",
            severity: "low",
            path: ["workflow", "statuses", status.key, "key"],
            message: `Status key "${status.key}" is quite long. Shorter keys are recommended for API usage`,
            recommendation: "Keep status keys short and concise (used in API calls and database queries)",
            documentationLink: "/docs/configuration/reference#status-configuration",
          });
        }
      }
      return findings;
    },
  },
  {
    name: "has_closed_status",
    severity: "medium",
    check: (config) => {
      const findings: ValidationFinding[] = [];
      const hasClosedStatus = config.workflow.statuses.some(
        (s) => s.type === "closed"
      );
      if (!hasClosedStatus) {
        findings.push({
          type: "warning",
          severity: "medium",
          path: ["workflow", "statuses"],
          message: "No closed status found. Consider adding a status with type 'closed' for completed work",
          recommendation: "Add at least one status with type 'closed' to mark completed work",
          documentationLink: "/docs/configuration/reference#status-type",
        });
      }
      return findings;
    },
  },
  {
    name: "required_fields_are_reasonable",
    severity: "low",
    check: (config) => {
      const findings: ValidationFinding[] = [];
      const requiredFields = config.custom_fields.filter((f) => f.required);
      if (requiredFields.length > 5) {
        findings.push({
          type: "best_practice",
          severity: "low",
          path: ["custom_fields"],
          message: `Many required fields (${requiredFields.length}). Required fields block status transitions`,
          recommendation: "Only mark fields as required when necessary. Consider making optional fields with default values",
          documentationLink: "/docs/configuration/reference#custom-field-validation",
        });
      }
      return findings;
    },
  },
  {
    name: "dropdown_fields_have_options",
    severity: "high",
    check: (config) => {
      const findings: ValidationFinding[] = [];
      for (const field of config.custom_fields) {
        if (field.type === "dropdown" && (!field.options || field.options.length === 0)) {
          findings.push({
            type: "error",
            severity: "high",
            path: ["custom_fields", field.key, "options"],
            message: `Dropdown field "${field.key}" must have an options array`,
            recommendation: "Add an array of option strings for the dropdown field",
            documentationLink: "/docs/configuration/reference#custom-field-configuration",
          });
        }
      }
      return findings;
    },
  },
  {
    name: "transition_rules_are_logical",
    severity: "low",
    check: (config) => {
      const findings: ValidationFinding[] = [];
      for (const status of config.workflow.statuses) {
        if (status.transitions && status.transitions.length > 0) {
          // Check if transition targets exist
          for (const transitionKey of status.transitions) {
            const targetExists = config.workflow.statuses.some(
              (s) => s.key === transitionKey
            );
            if (!targetExists) {
              findings.push({
                type: "warning",
                severity: "high",
                path: ["workflow", "statuses", status.key, "transitions"],
                message: `Transition target "${transitionKey}" does not exist in statuses`,
                recommendation: `Remove invalid transition or add status with key "${transitionKey}"`,
                documentationLink: "/docs/configuration/reference#transition-rules",
              });
            }
          }
        }
      }
      return findings;
    },
  },
];

/**
 * Validate configuration against schema and best practices
 * @param config - Configuration object to validate (parsed YAML or database config)
 * @returns Validation result with schema errors and best practice findings
 */
export function validateConfiguration(
  config: unknown
): ConfigurationValidationResult {
  // First, validate against schema
  const schemaValidation = safeValidateConfig(config);

  // If schema validation fails, return early with schema errors only
  if (!schemaValidation.success) {
    return {
      isValid: false,
      schemaErrors: schemaValidation.errors,
      findings: [],
    };
  }

  // If schema validation passes, run best practice checks
  const validatedConfig = schemaValidation.data!;
  const findings: ValidationFinding[] = [];

  for (const check of bestPracticeChecks) {
    try {
      const checkFindings = check.check(validatedConfig);
      findings.push(...checkFindings);
    } catch (error) {
      // If a best practice check fails, log but don't fail validation
      console.warn(`Best practice check "${check.name}" failed:`, error);
    }
  }

  // Configuration is valid if schema passes (best practices are recommendations)
  return {
    isValid: true,
    schemaErrors: undefined,
    findings,
    config: validatedConfig,
  };
}

/**
 * Validate configuration and format findings for AI assistant response
 * @param config - Configuration object to validate
 * @returns Formatted validation results suitable for prompt context
 */
export function validateAndFormat(
  config: unknown
): {
  isValid: boolean;
  summary: string;
  findings: ValidationFinding[];
  schemaErrors?: ValidationResult["errors"];
} {
  const result = validateConfiguration(config);

  if (!result.isValid && result.schemaErrors) {
    return {
      isValid: false,
      summary: `Configuration has ${result.schemaErrors.length} schema validation error(s)`,
      findings: [],
      schemaErrors: result.schemaErrors,
    };
  }

  const criticalErrors = result.findings.filter((f) => f.severity === "critical");
  const highWarnings = result.findings.filter((f) => f.severity === "high");
  const mediumWarnings = result.findings.filter((f) => f.severity === "medium");
  const lowInfo = result.findings.filter((f) => f.severity === "low");

  const summary = criticalErrors.length > 0
    ? `Configuration has ${criticalErrors.length} critical issue(s) and ${highWarnings.length + mediumWarnings.length} warning(s)`
    : highWarnings.length > 0
    ? `Configuration has ${highWarnings.length} high-priority warning(s) and ${mediumWarnings.length + lowInfo.length} recommendation(s)`
    : mediumWarnings.length > 0
    ? `Configuration has ${mediumWarnings.length} warning(s) and ${lowInfo.length} best practice recommendation(s)`
    : lowInfo.length > 0
    ? `Configuration is valid. ${lowInfo.length} best practice recommendation(s) available`
    : "Configuration is valid with no issues or recommendations";

  return {
    isValid: result.isValid,
    summary,
    findings: result.findings,
  };
}

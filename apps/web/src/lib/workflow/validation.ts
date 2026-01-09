import type { ProjectConfig, StatusConfig, CustomFieldConfig } from '@stride/yaml-config';
import type { Issue } from '@stride/types';

export interface ValidationError {
  field?: string;
  message: string;
  helpUrl?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate status transition based on workflow rules
 * 
 * Rules are dynamically enforced based on the provided configuration:
 * - Explicit transition rules: If `transitions` array is defined on a status, only those transitions are allowed
 * - Built-in restrictions: Cannot transition from 'closed' to 'open' or 'in_progress' (except via "reopened" status)
 * - Permissive default: If no explicit rules are defined, all transitions are allowed
 * - Status existence: Status must exist in workflow configuration
 * 
 * This function reads rules from the config parameter - rules are not hardcoded.
 * Always pass the latest configuration from the database to ensure rule enforcement
 * is dynamic and responsive to configuration changes.
 * 
 * @param currentStatus - Current issue status
 * @param newStatus - Desired new status
 * @param config - Project configuration (must be latest from database for dynamic enforcement)
 * @returns Validation result
 */
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  config: ProjectConfig,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Find status configurations
  const currentStatusConfig = config.workflow.statuses.find(
    (s) => s.key === currentStatus,
  );
  const newStatusConfig = config.workflow.statuses.find(
    (s) => s.key === newStatus,
  );

  // Check if statuses exist in config
  if (!currentStatusConfig) {
    const availableStatuses = config.workflow.statuses.map(s => `"${s.name}" (${s.key})`).join(', ');
    errors.push({
      field: 'status',
      message: `Current status "${currentStatus}" is not defined in your project workflow configuration. Available statuses: ${availableStatuses}. Please update your project configuration to include this status.`,
      helpUrl: '/docs/configuration-troubleshooting#status-x-is-not-defined-in-workflow',
    });
  }

  if (!newStatusConfig) {
    const availableStatuses = config.workflow.statuses.map(s => `"${s.name}" (${s.key})`).join(', ');
    errors.push({
      field: 'status',
      message: `Target status "${newStatus}" is not defined in your project workflow configuration. Available statuses: ${availableStatuses}. Please update your project configuration to include this status.`,
      helpUrl: '/docs/configuration-troubleshooting#status-x-is-not-defined-in-workflow',
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // If statuses are the same, transition is valid (no-op)
  if (currentStatus === newStatus) {
    return { isValid: true, errors: [] };
  }

  // Validate transition based on status types and explicit transition rules
  // Permissive design: Allow all transitions except those explicitly blocked
  if (currentStatusConfig && newStatusConfig) {
    // First, check if explicit transition rules are defined for the current status
    // If transitions array is defined, only transitions to those statuses are allowed
    if (currentStatusConfig.transitions !== undefined && currentStatusConfig.transitions.length > 0) {
      if (!currentStatusConfig.transitions.includes(newStatus)) {
        const allowedStatusNames = currentStatusConfig.transitions
          .map(key => {
            const status = config.workflow.statuses.find(s => s.key === key);
            return status ? `"${status.name}" (${key})` : key;
          })
          .join(', ');
        
        errors.push({
          field: 'status',
          message: `Cannot move from "${currentStatusConfig.name}" to "${newStatusConfig.name}". Allowed transitions from "${currentStatusConfig.name}": ${allowedStatusNames}. See your project configuration for transition rules.`,
          helpUrl: '/docs/configuration-troubleshooting#status-transition-not-allowed',
        });
        return { isValid: false, errors };
      }
    }

    // Second, apply built-in type-based restrictions
    // Only restriction: Cannot transition from closed to open/in_progress (except via "reopened")
    // Exception: Can transition to "reopened" status (type: in_progress) if configured
    if (currentStatusConfig.type === 'closed') {
      if (newStatusConfig.type !== 'closed') {
        // Check if target is a "reopened" status (common pattern for reopening closed issues)
        const isReopenedStatus = newStatusConfig.key === 'reopened' || newStatusConfig.name.toLowerCase() === 'reopened';
        
        if (isReopenedStatus) {
          // This is allowed - reopening closed issues via "reopened" status
          // No error needed
        } else {
          // Suggest using "reopened" status if available, or adding it to config
          const hasReopenedStatus = config.workflow.statuses.some(
            s => s.key === 'reopened' || s.name.toLowerCase() === 'reopened'
          );
          
          if (hasReopenedStatus) {
            errors.push({
              field: 'status',
              message: `Cannot move from "${currentStatusConfig.name}" (closed status) to "${newStatusConfig.name}". To reopen closed issues, move to the "Reopened" status instead. See configuration troubleshooting guide for details.`,
              helpUrl: '/docs/configuration-troubleshooting#cannot-transition-from-closed-status',
            });
          } else {
            errors.push({
              field: 'status',
              message: `Cannot move from "${currentStatusConfig.name}" (closed status) to "${newStatusConfig.name}". Closed issues can only move to other closed statuses. To enable reopening, add a "reopened" status with type "in_progress" to your configuration. See configuration troubleshooting guide for details.`,
              helpUrl: '/docs/configuration-troubleshooting#cannot-transition-from-closed-status',
            });
          }
        }
      }
      // If target is also closed, allow the transition (closed → closed)
      // No error needed
    }

    // All other transitions are allowed in permissive design:
    // - open ↔ in_progress (any status, bidirectional)
    // - open → closed
    // - in_progress ↔ in_progress (any status, bidirectional)
    // - in_progress → closed
    // These are all allowed, so no additional validation needed
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check workflow rules from config
 * 
 * Validates that the status transition follows the workflow rules defined
 * in the project configuration.
 * 
 * @param currentStatus - Current issue status
 * @param newStatus - Desired new status
 * @param config - Project configuration
 * @returns Validation result
 */
export function checkWorkflowRules(
  currentStatus: string,
  newStatus: string,
  config: ProjectConfig,
): ValidationResult {
  return validateStatusTransition(currentStatus, newStatus, config);
}

/**
 * Validate required custom fields before status change
 * 
 * Checks if all required custom fields are present and valid before
 * allowing a status transition.
 * 
 * @param issue - Current issue data
 * @param newStatus - Desired new status
 * @param config - Project configuration
 * @returns Validation result
 */
export function validateRequiredCustomFields(
  issue: Issue,
  newStatus: string,
  config: ProjectConfig,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Find the new status configuration
  const newStatusConfig = config.workflow.statuses.find(
    (s) => s.key === newStatus,
  );

  if (!newStatusConfig) {
    // Status validation will be handled by validateStatusTransition
    return { isValid: true, errors: [] };
  }

  // Check required custom fields
  const requiredFields = config.custom_fields.filter((field) => field.required);

  for (const field of requiredFields) {
    const fieldValue = issue.customFields[field.key];

    // Check if field is missing or empty
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      errors.push({
        field: `customFields.${field.key}`,
        message: `Required field "${field.name}" must be set before changing status to "${newStatusConfig.name}". You can set this field in the issue details, or modify your configuration to make this field optional. See the [configuration troubleshooting guide](/docs/configuration-troubleshooting#required-field-x-must-be-set-before-changing-status) for details.`,
        helpUrl: '/docs/configuration-troubleshooting#required-field-x-must-be-set-before-changing-status',
      });
    }

    // Validate field type if value exists
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      const typeError = validateCustomFieldType(field, fieldValue);
      if (typeError) {
        errors.push({
          field: `customFields.${field.key}`,
          message: typeError,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate custom field value type
 */
function validateCustomFieldType(
  field: CustomFieldConfig,
  value: unknown,
): string | null {
  switch (field.type) {
    case 'text':
      if (typeof value !== 'string') {
        return `Field "${field.name}" must be a string`;
      }
      break;
    case 'number':
      if (typeof value !== 'number') {
        return `Field "${field.name}" must be a number`;
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return `Field "${field.name}" must be a boolean`;
      }
      break;
    case 'date':
      // Accept string dates or Date objects
      if (typeof value !== 'string' && !(value instanceof Date)) {
        return `Field "${field.name}" must be a date`;
      }
      break;
    case 'dropdown':
      if (typeof value !== 'string') {
        return `Field "${field.name}" must be a string`;
      }
      if (field.options && !field.options.includes(value)) {
        return `Field "${field.name}" must be one of: ${field.options.join(', ')}`;
      }
      break;
  }
  return null;
}

/**
 * Validate assignee requirements for status transitions
 * 
 * T428: Add assignee requirement validation for status transitions
 * Checks if assignee is required for the target status based on config
 * 
 * @param issue - Current issue data
 * @param newStatus - Desired new status
 * @param config - Project configuration
 * @returns Validation result
 */
export function validateAssigneeRequirements(
  issue: Issue,
  newStatus: string,
  config: ProjectConfig,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if assignee is required for this status
  const userAssignment = config.user_assignment;
  if (userAssignment) {
    const requireForStatuses = userAssignment.require_assignee_for_statuses || [];
    
    // If this status requires an assignee and issue doesn't have one
    if (requireForStatuses.includes(newStatus) && !issue.assigneeId) {
      const statusConfig = config.workflow.statuses.find(s => s.key === newStatus);
      errors.push({
        field: 'assigneeId',
        message: `Assignee is required before changing status to "${statusConfig?.name || newStatus}"`,
      });
    }

    // Global assignee requirement
    if (userAssignment.assignee_required && !issue.assigneeId) {
      errors.push({
        field: 'assigneeId',
        message: 'Assignee is required for this issue',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete status change (combines all validations)
 * 
 * @param issue - Current issue data
 * @param newStatus - Desired new status
 * @param config - Project configuration
 * @returns Validation result with all errors
 */
export function validateStatusChange(
  issue: Issue,
  newStatus: string,
  config: ProjectConfig,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate status transition
  const transitionResult = validateStatusTransition(
    issue.status,
    newStatus,
    config,
  );
  errors.push(...transitionResult.errors);

  // Validate required custom fields
  const fieldsResult = validateRequiredCustomFields(issue, newStatus, config);
  errors.push(...fieldsResult.errors);

  // T428: Validate assignee requirements
  const assigneeResult = validateAssigneeRequirements(issue, newStatus, config);
  errors.push(...assigneeResult.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}


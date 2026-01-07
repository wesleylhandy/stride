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
 * Rules:
 * - Can transition from 'open' to 'in_progress' or 'closed'
 * - Can transition from 'in_progress' to 'in_progress' (other statuses) or 'closed'
 * - Cannot transition from 'closed' to 'open' or 'in_progress' (closed is terminal)
 * - Status must exist in workflow configuration
 * 
 * @param currentStatus - Current issue status
 * @param newStatus - Desired new status
 * @param config - Project configuration
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
    errors.push({
      field: 'status',
      message: `Current status "${currentStatus}" is not defined in workflow`,
    });
  }

  if (!newStatusConfig) {
    errors.push({
      field: 'status',
      message: `Status "${newStatus}" is not defined in workflow`,
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // If statuses are the same, transition is valid (no-op)
  if (currentStatus === newStatus) {
    return { isValid: true, errors: [] };
  }

  // Validate transition based on status types
  if (currentStatusConfig && newStatusConfig) {
    // Cannot transition from closed to open or in_progress
    if (currentStatusConfig.type === 'closed') {
      if (newStatusConfig.type !== 'closed') {
        errors.push({
          field: 'status',
          message: 'Cannot transition from a closed status to an open or in-progress status',
        });
      }
    }

    // Can transition from open to in_progress or closed
    // Can transition from in_progress to in_progress (other) or closed
    // These are allowed, so no additional validation needed
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
        message: `Required field "${field.name}" must be set before changing status to "${newStatusConfig.name}"`,
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


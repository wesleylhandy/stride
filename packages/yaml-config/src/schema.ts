// Zod v4 schema for YAML configuration validation
// Reference: https://zod.dev/
import { z } from 'zod';

// Status type enum
const StatusTypeSchema = z.enum(['open', 'in_progress', 'closed']);

// Status configuration schema
export const StatusConfigSchema = z.strictObject({
  key: z.string().min(1),
  name: z.string().min(1),
  type: StatusTypeSchema,
  // Optional: List of allowed status keys that can be transitioned to from this status
  // If not defined or empty array, all transitions are allowed (permissive default)
  // If defined, only transitions to statuses in this list are allowed
  transitions: z.array(z.string()).optional(),
});

// Custom field type enum
const CustomFieldTypeSchema = z.enum(['text', 'number', 'dropdown', 'date', 'boolean']);

// Custom field configuration schema
export const CustomFieldConfigSchema = z.strictObject({
  key: z.string().min(1),
  name: z.string().min(1),
  type: CustomFieldTypeSchema,
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
});

// Workflow configuration schema
export const WorkflowConfigSchema = z.strictObject({
  default_status: z.string().min(1),
  statuses: z.array(StatusConfigSchema).min(1),
});

// Automation rule schema
export const AutomationRuleSchema = z.strictObject({
  trigger: z.string().min(1),
  action: z.string().min(1),
  conditions: z.record(z.string(), z.unknown()).optional(),
});

// User assignment configuration schema
export const UserAssignmentConfigSchema = z.strictObject({
  default_assignee: z.enum(['none', 'reporter']).default('none'),
  assignee_required: z.boolean().default(false),
  clone_preserve_assignee: z.boolean().default(true),
  require_assignee_for_statuses: z.array(z.string()).default([]),
}).default({
  default_assignee: 'none',
  assignee_required: false,
  clone_preserve_assignee: true,
  require_assignee_for_statuses: [],
});

// AI triage configuration schema
// Note: YAML config uses snake_case `ai_triage_permissions`, TypeScript schema property is `aiTriageConfig.permissions` (camelCase)
export const AiTriageConfigSchema = z.strictObject({
  permissions: z.array(z.enum(['admin', 'member', 'viewer'])).default(['admin']),
  enabled: z.boolean().default(true),
}).default({
  permissions: ['admin'],
  enabled: true,
});

// Project configuration schema
export const ProjectConfigSchema = z.strictObject({
  project_key: z.string().regex(/^[A-Z0-9]{2,10}$/, 'Project key must be 2-10 uppercase alphanumeric characters'),
  project_name: z.string().min(1),
  workflow: WorkflowConfigSchema,
  custom_fields: z.array(CustomFieldConfigSchema).default([]),
  automation_rules: z.array(AutomationRuleSchema).default([]),
  user_assignment: UserAssignmentConfigSchema.optional(),
  ai_triage_config: AiTriageConfigSchema.optional(),
});

// Export inferred types
export type StatusConfig = z.infer<typeof StatusConfigSchema>;
export type CustomFieldConfig = z.infer<typeof CustomFieldConfigSchema>;
export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
export type AutomationRule = z.infer<typeof AutomationRuleSchema>;
export type UserAssignmentConfig = z.infer<typeof UserAssignmentConfigSchema>;
export type AiTriageConfig = z.infer<typeof AiTriageConfigSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;


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

// Project configuration schema
export const ProjectConfigSchema = z.strictObject({
  project_key: z.string().regex(/^[A-Z0-9]{2,10}$/, 'Project key must be 2-10 uppercase alphanumeric characters'),
  project_name: z.string().min(1),
  workflow: WorkflowConfigSchema,
  custom_fields: z.array(CustomFieldConfigSchema).default([]),
  automation_rules: z.array(AutomationRuleSchema).default([]),
});

// Export inferred types
export type StatusConfig = z.infer<typeof StatusConfigSchema>;
export type CustomFieldConfig = z.infer<typeof CustomFieldConfigSchema>;
export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
export type AutomationRule = z.infer<typeof AutomationRuleSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;


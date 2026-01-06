'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateIssueInput, IssueType, Priority } from '@stride/types';
import type { CustomFieldConfig, ProjectConfig } from '@stride/yaml-config';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { MarkdownEditor } from '../molecules/MarkdownEditor';
import { cn } from '../utils/cn';

export interface IssueFormProps {
  /**
   * Project ID
   */
  projectId: string;
  /**
   * Project configuration (for custom fields and statuses)
   */
  projectConfig?: ProjectConfig;
  /**
   * Initial form values
   */
  initialValues?: Partial<CreateIssueInput>;
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: CreateIssueInput) => Promise<void>;
  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void;
  /**
   * Whether form is submitting
   */
  isSubmitting?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Create form schema based on project config
 */
function createFormSchema(projectConfig?: ProjectConfig) {
  const baseSchema = z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be less than 255 characters'),
    description: z
      .string()
      .max(10000, 'Description must be less than 10000 characters')
      .optional(),
    status: z.string().optional(),
    type: z.enum(['Bug', 'Feature', 'Task', 'Epic']).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
    cycleId: z.string().uuid('Invalid cycle ID').optional().nullable(),
    storyPoints: z
      .number()
      .int('Story points must be an integer')
      .min(0, 'Story points must be non-negative')
      .max(100, 'Story points must be less than 100')
      .optional(),
  });

  // Add custom fields validation
  if (projectConfig?.custom_fields) {
    const customFieldsSchema: Record<string, z.ZodTypeAny> = {};
    
    projectConfig.custom_fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;
      
      switch (field.type) {
        case 'text':
          fieldSchema = z.string();
          break;
        case 'number':
          fieldSchema = z.number();
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'date':
          fieldSchema = z.string().or(z.date());
          break;
        case 'dropdown':
          fieldSchema = field.options
            ? z.enum(field.options as [string, ...string[]])
            : z.string();
          break;
        default:
          fieldSchema = z.unknown();
      }
      
      if (field.required) {
        customFieldsSchema[field.key] = fieldSchema;
      } else {
        customFieldsSchema[field.key] = fieldSchema.optional();
      }
    });
    
    if (Object.keys(customFieldsSchema).length > 0) {
      return baseSchema.extend({
        customFields: z.object(customFieldsSchema).optional(),
      });
    }
  }

  return baseSchema.extend({
    customFields: z.record(z.unknown()).optional(),
  });
}

/**
 * Render custom field input based on field configuration
 */
function renderCustomFieldInput(
  field: CustomFieldConfig,
  value: unknown,
  onChange: (value: unknown) => void,
  error?: string,
) {
  const fieldId = `custom-field-${field.key}`;

  switch (field.type) {
    case 'text':
      return (
        <Input
          id={fieldId}
          label={field.name}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={field.required}
        />
      );

    case 'number':
      return (
        <Input
          id={fieldId}
          type="number"
          label={field.name}
          value={(value as number) || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          error={error}
          required={field.required}
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            id={fieldId}
            type="checkbox"
            checked={(value as boolean) || false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor={fieldId} className="text-sm font-medium">
            {field.name}
            {field.required && <span className="text-error">*</span>}
          </label>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
      );

    case 'date':
      return (
        <Input
          id={fieldId}
          type="date"
          label={field.name}
          value={
            value instanceof Date
              ? value.toISOString().split('T')[0]
              : (value as string) || ''
          }
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required={field.required}
        />
      );

    case 'dropdown':
      return (
        <div>
          <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
            {field.name}
            {field.required && <span className="text-error">*</span>}
          </label>
          <select
            id={fieldId}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
              'transition-colors focus-ring',
              error
                ? 'border-error focus-visible:ring-error'
                : 'border-border hover:border-border-hover focus-visible:border-border-focus'
            )}
            required={field.required}
          >
            <option value="">Select {field.name}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-sm text-error" role="alert">
              {error}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

/**
 * IssueForm component
 * 
 * Form for creating and editing issues with dynamic custom fields
 * based on project configuration.
 */
export function IssueForm({
  projectId,
  projectConfig,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: IssueFormProps) {
  const formSchema = React.useMemo(
    () => createFormSchema(projectConfig),
    [projectConfig],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateIssueInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId,
      ...initialValues,
      customFields: initialValues?.customFields || {},
    },
  });

  const customFields = watch('customFields') || {};

  const handleFormSubmit = async (data: CreateIssueInput) => {
    await onSubmit(data);
  };

  // Get available statuses from config
  const availableStatuses = projectConfig?.workflow.statuses || [];
  const defaultStatus =
    projectConfig?.workflow.default_status || availableStatuses[0]?.key;

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-6', className)}
    >
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title <span className="text-error">*</span>
        </label>
        <Input
          id="title"
          {...register('title')}
          error={errors.title?.message}
          placeholder="Enter issue title"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <MarkdownEditor
          value={watch('description') || ''}
          onChange={(value) => setValue('description', value)}
          error={errors.description?.message}
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">
          Type
        </label>
        <select
          id="type"
          {...register('type')}
          className={cn(
            'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
            'transition-colors focus-ring',
            errors.type
              ? 'border-error focus-visible:ring-error'
              : 'border-border hover:border-border-hover focus-visible:border-border-focus'
          )}
        >
          <option value="">Select type</option>
          <option value="Bug">Bug</option>
          <option value="Feature">Feature</option>
          <option value="Task">Task</option>
          <option value="Epic">Epic</option>
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-error" role="alert">
            {errors.type.message}
          </p>
        )}
      </div>

      {/* Status */}
      {availableStatuses.length > 0 && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            {...register('status')}
            defaultValue={defaultStatus}
            className={cn(
              'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
              'transition-colors focus-ring',
              errors.status
                ? 'border-error focus-visible:ring-error'
                : 'border-border hover:border-border-hover focus-visible:border-border-focus'
            )}
          >
            {availableStatuses.map((status) => (
              <option key={status.key} value={status.key}>
                {status.name}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-error" role="alert">
              {errors.status.message}
            </p>
          )}
        </div>
      )}

      {/* Priority */}
      <div>
        <label htmlFor="priority" className="block text-sm font-medium mb-1">
          Priority
        </label>
        <select
          id="priority"
          {...register('priority')}
          className={cn(
            'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
            'transition-colors focus-ring',
            errors.priority
              ? 'border-error focus-visible:ring-error'
              : 'border-border hover:border-border-hover focus-visible:border-border-focus'
          )}
        >
          <option value="">Select priority</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        {errors.priority && (
          <p className="mt-1 text-sm text-error" role="alert">
            {errors.priority.message}
          </p>
        )}
      </div>

      {/* Story Points */}
      <div>
        <label htmlFor="storyPoints" className="block text-sm font-medium mb-1">
          Story Points
        </label>
        <Input
          id="storyPoints"
          type="number"
          {...register('storyPoints', { valueAsNumber: true })}
          error={errors.storyPoints?.message}
          placeholder="0"
        />
      </div>

      {/* Custom Fields */}
      {projectConfig?.custom_fields && projectConfig.custom_fields.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Custom Fields</h3>
          {projectConfig.custom_fields.map((field) => {
            const fieldValue = customFields[field.key];
            const fieldError = errors.customFields?.[field.key]?.message as
              | string
              | undefined;

            return (
              <div key={field.key}>
                {renderCustomFieldInput(
                  field,
                  fieldValue,
                  (value) => {
                    setValue(`customFields.${field.key}`, value, {
                      shouldValidate: true,
                    });
                  },
                  fieldError,
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Issue'}
        </Button>
      </div>
    </form>
  );
}


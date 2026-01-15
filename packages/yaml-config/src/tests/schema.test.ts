import { describe, it, expect } from 'vitest';
import { CustomFieldConfigSchema, ProjectConfigSchema } from '../schema';

describe('CustomFieldConfigSchema', () => {
  describe('textarea type validation', () => {
    it('should accept textarea as valid custom field type', () => {
      const config = {
        key: 'notes',
        name: 'Notes',
        type: 'textarea' as const,
        required: false,
      };

      const result = CustomFieldConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('textarea');
      }
    });

    it('should validate textarea field with required: true', () => {
      const config = {
        key: 'description',
        name: 'Description',
        type: 'textarea' as const,
        required: true,
      };

      const result = CustomFieldConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('textarea');
        expect(result.data.required).toBe(true);
      }
    });

    it('should validate textarea field with required: false', () => {
      const config = {
        key: 'notes',
        name: 'Notes',
        type: 'textarea' as const,
        required: false,
      };

      const result = CustomFieldConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('textarea');
        expect(result.data.required).toBe(false);
      }
    });

    it('should ignore options field for textarea type', () => {
      const config = {
        key: 'notes',
        name: 'Notes',
        type: 'textarea' as const,
        options: ['option1', 'option2'], // Should be ignored for textarea
        required: false,
      };

      const result = CustomFieldConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('textarea');
        // Options may be present but are not used for textarea
      }
    });

    it('should validate textarea field in full project config', () => {
      const projectConfig = {
        project_key: 'TEST',
        project_name: 'Test Project',
        workflow: {
          default_status: 'todo',
          statuses: [
            {
              key: 'todo',
              name: 'To Do',
              type: 'open' as const,
            },
          ],
        },
        custom_fields: [
          {
            key: 'meeting_notes',
            name: 'Meeting Notes',
            type: 'textarea' as const,
            required: false,
          },
        ],
      };

      const result = ProjectConfigSchema.safeParse(projectConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        const textareaField = result.data.custom_fields.find(
          (f) => f.key === 'meeting_notes'
        );
        expect(textareaField).toBeDefined();
        expect(textareaField?.type).toBe('textarea');
      }
    });

    it('should reject invalid custom field type', () => {
      const config = {
        key: 'notes',
        name: 'Notes',
        type: 'invalid_type',
        required: false,
      };

      const result = CustomFieldConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { generateDefaultConfig } from '../default-config';
import { validateConfig } from '../validator';
import type { ProjectConfig } from '../schema';

describe('Default Configuration Generation', () => {
  describe('generateDefaultConfig', () => {
    it('should generate valid configuration with project key and name', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      expect(config.project_key).toBe('TEST');
      expect(config.project_name).toBe('Test Project');
    });

    it('should include reopened status in default configuration', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      const reopenedStatus = config.workflow.statuses.find(
        (s) => s.key === 'reopened'
      );

      expect(reopenedStatus).toBeDefined();
      expect(reopenedStatus?.name).toBe('Reopened');
      expect(reopenedStatus?.type).toBe('in_progress');
    });

    it('should include all required statuses in default configuration', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      const statusKeys = config.workflow.statuses.map((s) => s.key);
      
      expect(statusKeys).toContain('todo');
      expect(statusKeys).toContain('in_progress');
      expect(statusKeys).toContain('in_review');
      expect(statusKeys).toContain('done');
      expect(statusKeys).toContain('reopened');
    });

    it('should set default_status to todo', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      expect(config.workflow.default_status).toBe('todo');
    });

    it('should have no required custom fields', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      if (config.custom_fields && config.custom_fields.length > 0) {
        const requiredFields = config.custom_fields.filter(
          (f) => f.required === true
        );
        expect(requiredFields).toHaveLength(0);
      }
    });

    it('should have priority field with required: false', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      const priorityField = config.custom_fields?.find(
        (f) => f.key === 'priority'
      );

      expect(priorityField).toBeDefined();
      expect(priorityField?.required).toBe(false);
    });

    it('should not define explicit transition rules (permissive default)', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      // No status should have transitions array defined
      const statusesWithTransitions = config.workflow.statuses.filter(
        (s) => s.transitions !== undefined && s.transitions.length > 0
      );

      expect(statusesWithTransitions).toHaveLength(0);
    });

    it('should pass Zod validation', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');
      const result = validateConfig(config);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should generate different configs for different project keys', () => {
      const config1 = generateDefaultConfig('APP', 'Application');
      const config2 = generateDefaultConfig('WEB', 'Website');

      expect(config1.project_key).toBe('APP');
      expect(config2.project_key).toBe('WEB');
      expect(config1.project_name).toBe('Application');
      expect(config2.project_name).toBe('Website');
    });

    it('should have same workflow structure regardless of project key', () => {
      const config1 = generateDefaultConfig('APP', 'Application');
      const config2 = generateDefaultConfig('WEB', 'Website');

      expect(config1.workflow.statuses.length).toBe(
        config2.workflow.statuses.length
      );
      expect(config1.workflow.default_status).toBe(
        config2.workflow.default_status
      );

      // Status keys should match
      const keys1 = config1.workflow.statuses.map((s) => s.key).sort();
      const keys2 = config2.workflow.statuses.map((s) => s.key).sort();
      expect(keys1).toEqual(keys2);
    });
  });

  describe('Status Transitions Configuration', () => {
    it('should have reopened status with type in_progress (allows closed → reopened)', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');
      
      const doneStatus = config.workflow.statuses.find((s) => s.key === 'done');
      const reopenedStatus = config.workflow.statuses.find((s) => s.key === 'reopened');

      // done should be closed type
      expect(doneStatus?.type).toBe('closed');
      
      // reopened should be in_progress type (allows transition from closed)
      expect(reopenedStatus?.type).toBe('in_progress');
      
      // Both statuses should exist
      expect(doneStatus).toBeDefined();
      expect(reopenedStatus).toBeDefined();
    });

    it('should not have explicit transition rules (permissive - all transitions allowed)', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      // No status should have transitions array defined
      // This means all transitions are allowed (permissive default)
      for (const status of config.workflow.statuses) {
        expect(status.transitions).toBeUndefined();
      }
    });

    it('should include all necessary statuses for flexible workflow', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');
      const statusKeys = config.workflow.statuses.map((s) => s.key);

      // Should include all statuses needed for flexible transitions
      expect(statusKeys).toContain('todo'); // open type
      expect(statusKeys).toContain('in_progress'); // in_progress type
      expect(statusKeys).toContain('in_review'); // in_progress type
      expect(statusKeys).toContain('done'); // closed type
      expect(statusKeys).toContain('reopened'); // in_progress type (for reopening)
    });

    it('should allow closed → reopened transition (status types are compatible)', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');
      
      const doneStatus = config.workflow.statuses.find((s) => s.key === 'done');
      const reopenedStatus = config.workflow.statuses.find((s) => s.key === 'reopened');

      // done is closed, reopened is in_progress
      // The validation logic should allow this transition because reopened status exists
      expect(doneStatus?.type).toBe('closed');
      expect(reopenedStatus?.type).toBe('in_progress');
      
      // Since no explicit transitions are defined, and reopened exists,
      // the transition should be allowed by validation logic
    });
  });

  describe('Custom Fields', () => {
    it('should have no required custom fields in default config', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      const requiredFields = config.custom_fields?.filter(
        (f) => f.required === true
      ) || [];

      expect(requiredFields).toHaveLength(0);
    });

    it('should include priority field with required: false', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      const priorityField = config.custom_fields?.find(
        (f) => f.key === 'priority'
      );

      expect(priorityField).toBeDefined();
      expect(priorityField?.required).toBe(false);
      expect(priorityField?.type).toBe('dropdown');
      expect(priorityField?.options).toEqual([
        'Low',
        'Medium',
        'High',
        'Critical',
      ]);
    });

    it('should not require custom fields for any status transition', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      // All custom fields should be optional (required: false)
      const requiredFields = config.custom_fields?.filter(
        (f) => f.required === true
      ) || [];

      expect(requiredFields).toHaveLength(0);

      // This means transitions can happen without filling custom fields
      // The validation logic should not block transitions due to missing custom fields
    });
  });

  describe('Validation', () => {
    it('should generate config that passes Zod schema validation', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');
      const result = validateConfig(config);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should generate config with valid project key format', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      // Project key should match schema regex: /^[A-Z0-9]{2,10}$/
      expect(config.project_key).toMatch(/^[A-Z0-9]{2,10}$/);
    });

    it('should generate config with valid workflow structure', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      expect(config.workflow).toBeDefined();
      expect(config.workflow.default_status).toBeDefined();
      expect(config.workflow.statuses).toBeDefined();
      expect(config.workflow.statuses.length).toBeGreaterThan(0);

      // Default status should exist in statuses
      const defaultStatusExists = config.workflow.statuses.some(
        (s) => s.key === config.workflow.default_status
      );
      expect(defaultStatusExists).toBe(true);
    });

    it('should generate config with valid status types', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      const validTypes = ['open', 'in_progress', 'closed'];

      for (const status of config.workflow.statuses) {
        expect(validTypes).toContain(status.type);
      }
    });

    it('should generate config with valid custom field types', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      const validTypes = ['text', 'number', 'dropdown', 'date', 'boolean'];

      if (config.custom_fields) {
        for (const field of config.custom_fields) {
          expect(validTypes).toContain(field.type);
        }
      }
    });
  });

  describe('Permissive Design', () => {
    it('should not restrict any transitions by default', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      // All statuses should not have transitions array
      for (const status of config.workflow.statuses) {
        expect(status.transitions).toBeUndefined();
      }
    });

    it('should allow flexible workflow customization later', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      // Default config should be a good base for customization
      // Teams can add transition rules later
      expect(config.workflow.statuses.length).toBeGreaterThan(0);
      expect(config.custom_fields).toBeDefined();
    });

    it('should include common workflow patterns', () => {
      const config = generateDefaultConfig('TEST', 'Test Project');

      // Should include typical workflow statuses
      expect(config.workflow.statuses.some((s) => s.key === 'todo')).toBe(true);
      expect(config.workflow.statuses.some((s) => s.key === 'in_progress')).toBe(true);
      expect(config.workflow.statuses.some((s) => s.key === 'done')).toBe(true);
      expect(config.workflow.statuses.some((s) => s.key === 'reopened')).toBe(true);
    });
  });
});

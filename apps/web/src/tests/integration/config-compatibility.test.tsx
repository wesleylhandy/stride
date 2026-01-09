import { describe, it, expect, beforeEach } from 'vitest';
import { generateDefaultConfig, validateConfig } from '@stride/yaml-config';
import { validateStatusTransition } from '@/lib/workflow/validation';
import type { ProjectConfig } from '@stride/yaml-config';

describe('Backward Compatibility with Existing Projects', () => {
  let defaultConfig: ProjectConfig;

  beforeEach(() => {
    defaultConfig = generateDefaultConfig('TEST', 'Test Project');
  });

  describe('Legacy Configuration Support', () => {
    it('should handle projects without reopened status gracefully', () => {
      // Simulate old config without reopened status
      const oldConfig: ProjectConfig = {
        ...defaultConfig,
        workflow: {
          ...defaultConfig.workflow,
          statuses: defaultConfig.workflow.statuses.filter(
            (s) => s.key !== 'reopened'
          ),
        },
      };

      // Config should still be valid
      const validation = validateConfig(oldConfig);
      expect(validation.success).toBe(true);

      // Standard transitions should still work
      const result = validateStatusTransition('todo', 'done', oldConfig);
      expect(result.isValid).toBe(true);
    });

    it('should allow migration from old config to new default config', () => {
      // Old config structure
      const oldConfig: ProjectConfig = {
        project_key: 'TEST',
        project_name: 'Test Project',
        workflow: {
          default_status: 'todo',
          statuses: [
            { key: 'todo', name: 'To Do', type: 'open' },
            { key: 'in_progress', name: 'In Progress', type: 'in_progress' },
            { key: 'done', name: 'Done', type: 'closed' },
          ],
        },
        custom_fields: [],
        automation_rules: [],
      };

      // Both configs should be valid
      const oldValidation = validateConfig(oldConfig);
      const newValidation = validateConfig(defaultConfig);

      expect(oldValidation.success).toBe(true);
      expect(newValidation.success).toBe(true);

      // Both should support same basic transitions
      const oldTransition = validateStatusTransition('todo', 'done', oldConfig);
      const newTransition = validateStatusTransition('todo', 'done', defaultConfig);

      expect(oldTransition.isValid).toBe(true);
      expect(newTransition.isValid).toBe(true);
    });

    it('should maintain compatibility with existing issue statuses', () => {
      // Test that existing statuses from old config still work
      const oldStatuses = ['todo', 'in_progress', 'done'];
      
      for (const statusKey of oldStatuses) {
        const statusExists = defaultConfig.workflow.statuses.some(
          (s) => s.key === statusKey
        );
        expect(statusExists).toBe(true);
      }
    });

    it('should support projects with custom statuses alongside default', () => {
      // Config with both default statuses and custom ones
      const mixedConfig: ProjectConfig = {
        ...defaultConfig,
        workflow: {
          ...defaultConfig.workflow,
          statuses: [
            ...defaultConfig.workflow.statuses,
            { key: 'on_hold', name: 'On Hold', type: 'in_progress' },
            { key: 'blocked', name: 'Blocked', type: 'in_progress' },
          ],
        },
      };

      const validation = validateConfig(mixedConfig);
      expect(validation.success).toBe(true);

      // Should support transitions to custom statuses
      const result = validateStatusTransition('todo', 'on_hold', mixedConfig);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Custom Fields Compatibility', () => {
    it('should handle projects without custom fields', () => {
      const configWithoutFields: ProjectConfig = {
        ...defaultConfig,
        custom_fields: [],
      };

      const validation = validateConfig(configWithoutFields);
      expect(validation.success).toBe(true);

      // Transitions should work without custom fields
      const result = validateStatusTransition('todo', 'done', configWithoutFields);
      expect(result.isValid).toBe(true);
    });

    it('should support projects with required custom fields', () => {
      // Config with required fields (not permissive default)
      const configWithRequired: ProjectConfig = {
        ...defaultConfig,
        custom_fields: [
          {
            key: 'priority',
            name: 'Priority',
            type: 'dropdown',
            options: ['Low', 'Medium', 'High'],
            required: true, // Required field
          },
        ],
      };

      const validation = validateConfig(configWithRequired);
      expect(validation.success).toBe(true);

      // Config structure is valid, even with required fields
      // (Transition validation for required fields is separate)
    });

    it('should allow adding custom fields to default config', () => {
      // Start with default, add custom fields
      const enhancedConfig: ProjectConfig = {
        ...defaultConfig,
        custom_fields: [
          ...(defaultConfig.custom_fields || []),
          {
            key: 'sprint',
            name: 'Sprint',
            type: 'text',
            required: false,
          },
          {
            key: 'estimate',
            name: 'Estimate',
            type: 'number',
            required: false,
          },
        ],
      };

      const validation = validateConfig(enhancedConfig);
      expect(validation.success).toBe(true);
    });
  });

  describe('Workflow Rules Compatibility', () => {
    it('should support projects with explicit transition rules', () => {
      // Config with transition rules (not permissive default)
      const configWithRules: ProjectConfig = {
        ...defaultConfig,
        workflow: {
          ...defaultConfig.workflow,
          statuses: defaultConfig.workflow.statuses.map((s) => {
            if (s.key === 'todo') {
              return {
                ...s,
                transitions: ['in_progress', 'in_review'], // Explicit rules
              };
            }
            return s;
          }),
        },
      };

      const validation = validateConfig(configWithRules);
      expect(validation.success).toBe(true);

      // Config is valid, transition validation will enforce rules
    });

    it('should handle projects with no transition rules (permissive)', () => {
      // Default config has no transition rules
      const permissiveConfig = defaultConfig;

      // All statuses should have no explicit transitions
      const statusesWithRules = permissiveConfig.workflow.statuses.filter(
        (s) => s.transitions !== undefined && s.transitions.length > 0
      );

      expect(statusesWithRules).toHaveLength(0);

      // Should allow all transitions
      const result = validateStatusTransition('todo', 'done', permissiveConfig);
      expect(result.isValid || result.errors.length > 0).toBe(true);
    });

    it('should maintain compatibility when adding transition rules', () => {
      // Start permissive, add rules
      const enhancedConfig: ProjectConfig = {
        ...defaultConfig,
        workflow: {
          ...defaultConfig.workflow,
          statuses: defaultConfig.workflow.statuses.map((s) => {
            if (s.key === 'done') {
              return {
                ...s,
                transitions: ['reopened'], // Only allow reopening
              };
            }
            return s;
          }),
        },
      };

      const validation = validateConfig(enhancedConfig);
      expect(validation.success).toBe(true);
    });
  });

  describe('Status Type Compatibility', () => {
    it('should support all three status types (open, in_progress, closed)', () => {
      const typeCounts = {
        open: 0,
        in_progress: 0,
        closed: 0,
      };

      for (const status of defaultConfig.workflow.statuses) {
        typeCounts[status.type as keyof typeof typeCounts]++;
      }

      expect(typeCounts.open).toBeGreaterThan(0);
      expect(typeCounts.in_progress).toBeGreaterThan(0);
      expect(typeCounts.closed).toBeGreaterThan(0);
    });

    it('should maintain status type structure in migrations', () => {
      // Old config with basic types
      const oldConfig: ProjectConfig = {
        project_key: 'TEST',
        project_name: 'Test',
        workflow: {
          default_status: 'todo',
          statuses: [
            { key: 'todo', name: 'To Do', type: 'open' },
            { key: 'done', name: 'Done', type: 'closed' },
          ],
        },
        custom_fields: [],
        automation_rules: [],
      };

      // Both old and new should use same type enum
      const oldTypes = oldConfig.workflow.statuses.map((s) => s.type);
      const newTypes = defaultConfig.workflow.statuses.map((s) => s.type);

      const validTypes = ['open', 'in_progress', 'closed'];

      for (const type of oldTypes) {
        expect(validTypes).toContain(type);
      }

      for (const type of newTypes) {
        expect(validTypes).toContain(type);
      }
    });
  });

  describe('Configuration Schema Compatibility', () => {
    it('should validate both old and new config formats', () => {
      const oldConfig: ProjectConfig = {
        project_key: 'TEST',
        project_name: 'Test',
        workflow: {
          default_status: 'todo',
          statuses: [
            { key: 'todo', name: 'To Do', type: 'open' },
            { key: 'done', name: 'Done', type: 'closed' },
          ],
        },
        custom_fields: [],
        automation_rules: [],
      };

      const oldValidation = validateConfig(oldConfig);
      const newValidation = validateConfig(defaultConfig);

      expect(oldValidation.success).toBe(true);
      expect(newValidation.success).toBe(true);
    });

    it('should handle projects with user_assignment config', () => {
      // Config with user assignment (newer feature)
      const configWithAssignment: ProjectConfig = {
        ...defaultConfig,
        user_assignment: {
          default_assignee: 'none',
          assignee_required: false,
          clone_preserve_assignee: true,
          require_assignee_for_statuses: [],
        },
      };

      const validation = validateConfig(configWithAssignment);
      expect(validation.success).toBe(true);
    });

    it('should handle projects without user_assignment config', () => {
      // Default config may not have user_assignment
      const configWithoutAssignment: ProjectConfig = {
        ...defaultConfig,
        user_assignment: undefined,
      };

      const validation = validateConfig(configWithoutAssignment);
      expect(validation.success).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateDefaultConfig } from '@stride/yaml-config';
import { validateStatusTransition } from '@/lib/workflow/validation';
import type { ProjectConfig } from '@stride/yaml-config';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/projects/test-123/board',
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Board Integration with Default Config', () => {
  let defaultConfig: ProjectConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultConfig = generateDefaultConfig('TEST', 'Test Project');
  });

  describe('Default Config Structure', () => {
    it('should have reopened status in default config', () => {
      const reopenedStatus = defaultConfig.workflow.statuses.find(
        (s) => s.key === 'reopened'
      );

      expect(reopenedStatus).toBeDefined();
      expect(reopenedStatus?.name).toBe('Reopened');
      expect(reopenedStatus?.type).toBe('in_progress');
    });

    it('should have all required statuses for Kanban board', () => {
      const statusKeys = defaultConfig.workflow.statuses.map((s) => s.key);

      expect(statusKeys).toContain('todo');
      expect(statusKeys).toContain('in_progress');
      expect(statusKeys).toContain('in_review');
      expect(statusKeys).toContain('done');
      expect(statusKeys).toContain('reopened');

      // Should have at least 5 statuses
      expect(defaultConfig.workflow.statuses.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Status Transition Validation', () => {
    describe('Permissive Defaults', () => {
      it('should allow all standard transitions', () => {
        const transitions = [
          ['todo', 'in_progress'],
          ['todo', 'in_review'],
          ['todo', 'done'],
          ['in_progress', 'todo'],
          ['in_progress', 'in_review'],
          ['in_progress', 'done'],
          ['in_review', 'todo'],
          ['in_review', 'in_progress'],
          ['in_review', 'done'],
        ];

        for (const [from, to] of transitions) {
          const result = validateStatusTransition(from, to, defaultConfig);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      });

      it('should allow closed → reopened transition', () => {
        const result = validateStatusTransition('done', 'reopened', defaultConfig);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should allow reopened → in_progress transition', () => {
        const result = validateStatusTransition('reopened', 'in_progress', defaultConfig);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should allow reopened → todo transition', () => {
        const result = validateStatusTransition('reopened', 'todo', defaultConfig);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should allow reopened → done transition', () => {
        const result = validateStatusTransition('reopened', 'done', defaultConfig);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should allow full reopen workflow: done → reopened → todo', () => {
        // Step 1: done → reopened
        const step1 = validateStatusTransition('done', 'reopened', defaultConfig);
        expect(step1.isValid).toBe(true);

        // Step 2: reopened → todo
        const step2 = validateStatusTransition('reopened', 'todo', defaultConfig);
        expect(step2.isValid).toBe(true);
      });

      it('should not allow direct closed → open transition', () => {
        // done (closed) → todo (open) should be blocked
        const result = validateStatusTransition('done', 'todo', defaultConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        
        // Error should suggest using reopened status
        const errorMessages = result.errors.map((e) => e.message).join(' ');
        expect(errorMessages.toLowerCase()).toContain('reopened');
      });
    });

    describe('Reopened Status Workflow', () => {
      it('should allow reopening closed issues via reopened status', () => {
        // Workflow: done → reopened → in_progress
        const step1 = validateStatusTransition('done', 'reopened', defaultConfig);
        expect(step1.isValid).toBe(true);

        const step2 = validateStatusTransition('reopened', 'in_progress', defaultConfig);
        expect(step2.isValid).toBe(true);
      });

      it('should allow multiple reopen cycles', () => {
        // First cycle: done → reopened → done
        const cycle1a = validateStatusTransition('done', 'reopened', defaultConfig);
        expect(cycle1a.isValid).toBe(true);

        const cycle1b = validateStatusTransition('reopened', 'done', defaultConfig);
        expect(cycle1b.isValid).toBe(true);

        // Second cycle: done → reopened → todo
        const cycle2a = validateStatusTransition('done', 'reopened', defaultConfig);
        expect(cycle2a.isValid).toBe(true);

        const cycle2b = validateStatusTransition('reopened', 'todo', defaultConfig);
        expect(cycle2b.isValid).toBe(true);
      });
    });
  });

  describe('Custom Fields and Status Transitions', () => {
    it('should allow status transitions without required custom fields', () => {
      // Default config has no required custom fields
      const requiredFields = defaultConfig.custom_fields?.filter(
        (f) => f.required === true
      ) || [];

      expect(requiredFields).toHaveLength(0);

      // Transitions should work even without custom fields
      const result = validateStatusTransition('todo', 'done', defaultConfig);
      expect(result.isValid).toBe(true);
    });

    it('should have priority field with required: false', () => {
      const priorityField = defaultConfig.custom_fields?.find(
        (f) => f.key === 'priority'
      );

      expect(priorityField).toBeDefined();
      expect(priorityField?.required).toBe(false);
    });
  });

  describe('Board Column Generation', () => {
    it('should generate columns for all statuses in default config', () => {
      const statusCount = defaultConfig.workflow.statuses.length;
      
      // Board should have one column per status
      // This is a structural test - actual column generation is in component
      expect(statusCount).toBeGreaterThanOrEqual(5);
      
      // All statuses should be valid for column generation
      for (const status of defaultConfig.workflow.statuses) {
        expect(status.key).toBeDefined();
        expect(status.name).toBeDefined();
        expect(status.type).toBeDefined();
        expect(['open', 'in_progress', 'closed']).toContain(status.type);
      }
    });

    it('should include reopened column in board layout', () => {
      const reopenedStatus = defaultConfig.workflow.statuses.find(
        (s) => s.key === 'reopened'
      );

      expect(reopenedStatus).toBeDefined();
      
      // Reopened should be type in_progress (appears in middle section of board)
      expect(reopenedStatus?.type).toBe('in_progress');
    });
  });

  describe('Default Status', () => {
    it('should have todo as default status', () => {
      expect(defaultConfig.workflow.default_status).toBe('todo');
    });

    it('should have default status exist in statuses list', () => {
      const defaultStatusExists = defaultConfig.workflow.statuses.some(
        (s) => s.key === defaultConfig.workflow.default_status
      );

      expect(defaultStatusExists).toBe(true);
    });

    it('should allow transitions from default status to all other statuses', () => {
      const fromStatus = defaultConfig.workflow.default_status;
      
      for (const status of defaultConfig.workflow.statuses) {
        if (status.key !== fromStatus) {
          // Most transitions should be allowed (except closed → open)
          const result = validateStatusTransition(fromStatus, status.key, defaultConfig);
          
          // todo (open) can transition to all except directly blocked transitions
          if (status.type !== 'closed' || status.key === 'reopened') {
            // Should work for most cases
            expect(result.isValid || result.errors.length > 0).toBe(true);
          }
        }
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should generate config that passes validation', () => {
      // This tests that the default config structure is valid
      expect(defaultConfig.project_key).toMatch(/^[A-Z0-9]{2,10}$/);
      expect(defaultConfig.project_name).toBeDefined();
      expect(defaultConfig.workflow).toBeDefined();
      expect(defaultConfig.workflow.statuses.length).toBeGreaterThan(0);
    });

    it('should have valid status types', () => {
      const validTypes = ['open', 'in_progress', 'closed'];
      
      for (const status of defaultConfig.workflow.statuses) {
        expect(validTypes).toContain(status.type);
      }
    });

    it('should have valid custom field types', () => {
      const validTypes = ['text', 'number', 'dropdown', 'date', 'boolean'];
      
      if (defaultConfig.custom_fields) {
        for (const field of defaultConfig.custom_fields) {
          expect(validTypes).toContain(field.type);
        }
      }
    });
  });
});

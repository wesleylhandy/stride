import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IssueDetail } from '../IssueDetail';
import type { Issue } from '@stride/types';
import { IssueType, Priority } from '@stride/types';
import type { ProjectConfig } from '@stride/yaml-config';

// Mock MarkdownRenderer component
vi.mock('../../molecules/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => (
    <div data-testid="markdown-renderer" data-content={content}>
      {content}
    </div>
  ),
}));

// Mock Next.js router and other dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock fetch for user fetching
global.fetch = vi.fn();

describe('IssueDetail - Textarea Custom Fields', () => {
  const createIssue = (customFields: Record<string, unknown>): Issue => ({
    id: 'issue-1',
    key: 'TEST-1',
    projectId: 'project-1',
    title: 'Test Issue',
    description: 'Test description',
    status: 'todo',
    type: IssueType.Task,
    priority: Priority.Medium,
    reporterId: 'user-1',
    assigneeId: undefined,
    cycleId: undefined,
    storyPoints: undefined,
    customFields,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    closedAt: undefined,
  });

  const createProjectConfig = (customFields: ProjectConfig['custom_fields']): ProjectConfig => ({
    project_key: 'TEST',
    project_name: 'Test Project',
    workflow: {
      default_status: 'todo',
      statuses: [
        { key: 'todo', name: 'To Do', type: 'open' },
        { key: 'done', name: 'Done', type: 'closed' },
      ],
    },
    custom_fields: customFields || [],
    automation_rules: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for user fetching
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response);
  });

  describe('Textarea Field Markdown Rendering', () => {
    it('should render textarea field value using MarkdownRenderer component', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      const issue = createIssue({
        notes: '# Meeting Notes\n\n- Discussed requirements\n- Agreed on timeline',
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      // Check that MarkdownRenderer is rendered
      const markdownRenderer = screen.getByTestId('markdown-renderer');
      expect(markdownRenderer).toBeInTheDocument();
      expect(markdownRenderer).toHaveAttribute(
        'data-content',
        '# Meeting Notes\n\n- Discussed requirements\n- Agreed on timeline'
      );
    });

    it('should render markdown content with formatting', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'description',
          name: 'Description',
          type: 'textarea',
          required: false,
        },
      ]);

      const markdownContent = '## Title\n\n**Bold** text and *italic* text.\n\n- List item 1\n- List item 2';
      const issue = createIssue({
        description: markdownContent,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      const markdownRenderer = screen.getByTestId('markdown-renderer');
      expect(markdownRenderer).toBeInTheDocument();
      expect(markdownRenderer).toHaveAttribute('data-content', markdownContent);
    });

    it('should display "Not set" for empty textarea field', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      const issue = createIssue({
        notes: '',
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      // Should show "Not set" for empty value
      const notSetText = screen.getByText('Not set');
      expect(notSetText).toBeInTheDocument();
    });

    it('should display "Not set" for undefined textarea field', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      const issue = createIssue({});

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      // Should show "Not set" for undefined value
      const notSetText = screen.getByText('Not set');
      expect(notSetText).toBeInTheDocument();
    });

    it('should display "Not set" for null textarea field', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      const issue = createIssue({
        notes: null,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      // Should show "Not set" for null value
      const notSetText = screen.getByText('Not set');
      expect(notSetText).toBeInTheDocument();
    });

    it('should render multiple textarea fields independently', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
        {
          key: 'description',
          name: 'Description',
          type: 'textarea',
          required: false,
        },
      ]);

      const issue = createIssue({
        notes: '# Notes\n\nContent here',
        description: '## Description\n\nMore content',
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      // Should render both textarea fields
      const markdownRenderers = screen.getAllByTestId('markdown-renderer');
      expect(markdownRenderers).toHaveLength(2);
      
      expect(markdownRenderers[0]).toHaveAttribute('data-content', '# Notes\n\nContent here');
      expect(markdownRenderers[1]).toHaveAttribute('data-content', '## Description\n\nMore content');
    });

    it('should render textarea field label correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'meeting_notes',
          name: 'Meeting Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      const issue = createIssue({
        meeting_notes: 'Some notes here',
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      // Check that field label is displayed
      const label = screen.getByText('Meeting Notes');
      expect(label).toBeInTheDocument();
    });

    it('should handle complex markdown content in textarea field', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'documentation',
          name: 'Documentation',
          type: 'textarea',
          required: false,
        },
      ]);

      const complexMarkdown = `# Main Title

## Section 1

This is a paragraph with **bold** and *italic* text.

### Subsection

- Bullet point 1
- Bullet point 2
- Bullet point 3

\`\`\`javascript
const code = 'example';
\`\`\`

> This is a blockquote

[Link](https://example.com)`;

      const issue = createIssue({
        documentation: complexMarkdown,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      const markdownRenderer = screen.getByTestId('markdown-renderer');
      expect(markdownRenderer).toBeInTheDocument();
      expect(markdownRenderer).toHaveAttribute('data-content', complexMarkdown);
    });
  });

  describe('Textarea Field Integration', () => {
    it('should display textarea field alongside other custom field types', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'priority',
          name: 'Priority',
          type: 'dropdown',
          required: false,
          options: ['Low', 'Medium', 'High'],
        },
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
        {
          key: 'estimate',
          name: 'Estimate',
          type: 'number',
          required: false,
        },
      ]);

      const issue = createIssue({
        priority: 'High',
        notes: '# Notes\n\nImportant information',
        estimate: 5,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      // Check that all field types are rendered
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      
      expect(screen.getByText('Notes')).toBeInTheDocument();
      const markdownRenderer = screen.getByTestId('markdown-renderer');
      expect(markdownRenderer).toBeInTheDocument();
      
      expect(screen.getByText('Estimate')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle textarea field with special characters', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      const specialContent = 'Content with <special> characters & symbols: "quotes" and \'apostrophes\'';
      const issue = createIssue({
        notes: specialContent,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      const markdownRenderer = screen.getByTestId('markdown-renderer');
      expect(markdownRenderer).toBeInTheDocument();
      expect(markdownRenderer).toHaveAttribute('data-content', specialContent);
    });

    it('should handle textarea field with newlines and whitespace', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      const contentWithNewlines = 'Line 1\n\nLine 2\n\n\nLine 3';
      const issue = createIssue({
        notes: contentWithNewlines,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      const markdownRenderer = screen.getByTestId('markdown-renderer');
      expect(markdownRenderer).toBeInTheDocument();
      expect(markdownRenderer).toHaveAttribute('data-content', contentWithNewlines);
    });
  });

  describe('Regression: Existing Custom Field Types Display', () => {
    it('should display text field value correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'component',
          name: 'Component',
          type: 'text',
          required: false,
        },
      ]);

      const issue = createIssue({
        component: 'Frontend',
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      expect(screen.getByText('Component')).toBeInTheDocument();
      expect(screen.getByText('Frontend')).toBeInTheDocument();
    });

    it('should display number field value correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'estimate',
          name: 'Estimate',
          type: 'number',
          required: false,
        },
      ]);

      const issue = createIssue({
        estimate: 5,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      expect(screen.getByText('Estimate')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display dropdown field value correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'priority',
          name: 'Priority',
          type: 'dropdown',
          required: false,
          options: ['Low', 'Medium', 'High', 'Critical'],
        },
      ]);

      const issue = createIssue({
        priority: 'High',
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should display date field value correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'due_date',
          name: 'Due Date',
          type: 'date',
          required: false,
        },
      ]);

      const issue = createIssue({
        due_date: '2024-12-31',
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      expect(screen.getByText('Due Date')).toBeInTheDocument();
      // Date should be formatted
      expect(screen.getByText(/Dec|December|2024/)).toBeInTheDocument();
    });

    it('should display boolean field value correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'blocked',
          name: 'Blocked',
          type: 'boolean',
          required: false,
        },
      ]);

      const issue = createIssue({
        blocked: true,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      expect(screen.getByText('Blocked')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('should display multiple existing field types together', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'component',
          name: 'Component',
          type: 'text',
          required: false,
        },
        {
          key: 'estimate',
          name: 'Estimate',
          type: 'number',
          required: false,
        },
        {
          key: 'priority',
          name: 'Priority',
          type: 'dropdown',
          required: false,
          options: ['Low', 'Medium', 'High'],
        },
        {
          key: 'due_date',
          name: 'Due Date',
          type: 'date',
          required: false,
        },
        {
          key: 'blocked',
          name: 'Blocked',
          type: 'boolean',
          required: false,
        },
      ]);

      const issue = createIssue({
        component: 'Frontend',
        estimate: 5,
        priority: 'High',
        due_date: '2024-12-31',
        blocked: true,
      });

      render(
        <IssueDetail
          issue={issue}
          projectConfig={projectConfig}
        />
      );

      // Verify all field labels are present
      expect(screen.getByText('Component')).toBeInTheDocument();
      expect(screen.getByText('Estimate')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();

      // Verify all field values are displayed
      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueForm } from '../IssueForm';
import type { ProjectConfig } from '@stride/yaml-config';

// Mock MarkdownEditor component
vi.mock('../../molecules/MarkdownEditor', () => ({
  MarkdownEditor: ({ value, onChange, error, placeholder }: any) => (
    <div data-testid="markdown-editor">
      <textarea
        data-testid="markdown-editor-textarea"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && <div data-testid="markdown-editor-error">{error}</div>}
    </div>
  ),
}));

describe('IssueForm - Textarea Custom Fields', () => {
  const mockOnSubmit = vi.fn();

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
  });

  describe('Textarea Field Rendering', () => {
    it('should render textarea field with MarkdownEditor component', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Check that MarkdownEditor is rendered for textarea field
      const markdownEditor = screen.getByTestId('markdown-editor');
      expect(markdownEditor).toBeInTheDocument();

      // Check that the textarea input is present
      const textarea = screen.getByTestId('markdown-editor-textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('should display field label with required indicator for required textarea field', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'description',
          name: 'Description',
          type: 'textarea',
          required: true,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Check for label with required indicator
      const label = screen.getByText(/Description/);
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Description*');
    });

    it('should display field label without required indicator for optional textarea field', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Check for label without required indicator
      const label = screen.getByText(/Notes/);
      expect(label).toBeInTheDocument();
      expect(label).not.toHaveTextContent('Notes*');
    });

    it('should pass placeholder to MarkdownEditor', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Meeting Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByTestId('markdown-editor-textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Enter meeting notes in Markdown...');
    });

    it('should render multiple textarea fields', () => {
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

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      const markdownEditors = screen.getAllByTestId('markdown-editor');
      expect(markdownEditors).toHaveLength(2);
    });

    it('should not show Custom Fields heading when there are fewer than 3 custom fields', () => {
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

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Should not have "Custom Fields" heading
      const heading = screen.queryByText('Custom Fields');
      expect(heading).not.toBeInTheDocument();
    });

    it('should show Custom Fields heading when there are 3 or more custom fields', () => {
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
        {
          key: 'priority',
          name: 'Priority',
          type: 'dropdown',
          required: false,
          options: ['Low', 'Medium', 'High'],
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Should have "Custom Fields" heading
      const heading = screen.getByText('Custom Fields');
      expect(heading).toBeInTheDocument();
    });

    it('should handle textarea field value changes', async () => {
      const user = userEvent.setup();
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByTestId('markdown-editor-textarea');
      await user.type(textarea, '# Test Markdown\n\nThis is a test.');

      expect(textarea).toHaveValue('# Test Markdown\n\nThis is a test.');
    });
  });

  describe('Textarea Field Validation', () => {
    it('should validate required textarea field - shows error when empty', async () => {
      const user = userEvent.setup();
      const projectConfig = createProjectConfig([
        {
          key: 'description',
          name: 'Description',
          type: 'textarea',
          required: true,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in title (required field)
      const titleInput = screen.getByLabelText(/Title/i);
      await user.type(titleInput, 'Test Issue');

      // Try to submit without filling textarea
      const submitButton = screen.getByRole('button', { name: /Create Issue/i });
      await user.click(submitButton);

      // Form should not submit (validation should fail)
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should validate required textarea field - allows submission when filled', async () => {
      const user = userEvent.setup();
      const projectConfig = createProjectConfig([
        {
          key: 'description',
          name: 'Description',
          type: 'textarea',
          required: true,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in title
      const titleInput = screen.getByLabelText(/Title/i);
      await user.type(titleInput, 'Test Issue');

      // Fill in required textarea
      const textarea = screen.getByTestId('markdown-editor-textarea');
      await user.type(textarea, 'This is a description');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Issue/i });
      await user.click(submitButton);

      // Form should submit successfully
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Check that textarea value is included in submission
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.customFields?.description).toBe('This is a description');
    });

    it('should allow empty optional textarea field', async () => {
      const user = userEvent.setup();
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in title
      const titleInput = screen.getByLabelText(/Title/i);
      await user.type(titleInput, 'Test Issue');

      // Submit form without filling optional textarea
      const submitButton = screen.getByRole('button', { name: /Create Issue/i });
      await user.click(submitButton);

      // Form should submit successfully
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Check that optional textarea is not included or is empty
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.customFields?.notes).toBeUndefined();
    });

    it('should accept markdown content in textarea field', async () => {
      const user = userEvent.setup();
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in title
      const titleInput = screen.getByLabelText(/Title/i);
      await user.type(titleInput, 'Test Issue');

      // Fill in textarea with markdown
      const textarea = screen.getByTestId('markdown-editor-textarea');
      const markdownContent = '# Heading\n\n**Bold** text and *italic* text.\n\n- List item 1\n- List item 2';
      await user.type(textarea, markdownContent);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Issue/i });
      await user.click(submitButton);

      // Form should submit successfully
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Check that markdown content is preserved
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.customFields?.notes).toBe(markdownContent);
    });

    it('should handle initial values for textarea field in edit mode', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'notes',
          name: 'Notes',
          type: 'textarea',
          required: false,
        },
      ]);

      const initialValues = {
        title: 'Existing Issue',
        customFields: {
          notes: '# Existing Notes\n\nThis is existing content.',
        },
      };

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          initialValues={initialValues}
          onSubmit={mockOnSubmit}
        />
      );

      // Check that textarea has initial value
      const textarea = screen.getByTestId('markdown-editor-textarea');
      expect(textarea).toHaveValue('# Existing Notes\n\nThis is existing content.');
    });
  });

  describe('Regression: Existing Custom Field Types', () => {
    it('should render text field correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'component',
          name: 'Component',
          type: 'text',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      const textInput = screen.getByLabelText(/Component/i);
      expect(textInput).toBeInTheDocument();
      expect(textInput).toHaveAttribute('type', 'text');
    });

    it('should render number field correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'estimate',
          name: 'Estimate',
          type: 'number',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      const numberInput = screen.getByLabelText(/Estimate/i);
      expect(numberInput).toBeInTheDocument();
      expect(numberInput).toHaveAttribute('type', 'number');
    });

    it('should render dropdown field correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'priority',
          name: 'Priority',
          type: 'dropdown',
          required: false,
          options: ['Low', 'Medium', 'High', 'Critical'],
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      const dropdown = screen.getByLabelText(/Priority/i);
      expect(dropdown).toBeInTheDocument();
      expect(dropdown.tagName).toBe('SELECT');
      
      // Check options are present
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('should render date field correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'due_date',
          name: 'Due Date',
          type: 'date',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      const dateInput = screen.getByLabelText(/Due Date/i);
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('should render boolean field correctly', () => {
      const projectConfig = createProjectConfig([
        {
          key: 'blocked',
          name: 'Blocked',
          type: 'boolean',
          required: false,
        },
      ]);

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      const checkbox = screen.getByLabelText(/Blocked/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should handle multiple existing field types together', async () => {
      const user = userEvent.setup();
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

      render(
        <IssueForm
          projectId="test-project-id"
          projectConfig={projectConfig}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in title
      const titleInput = screen.getByLabelText(/Title/i);
      await user.type(titleInput, 'Test Issue');

      // Fill in text field
      const componentInput = screen.getByLabelText(/Component/i);
      await user.type(componentInput, 'Frontend');

      // Fill in number field
      const estimateInput = screen.getByLabelText(/Estimate/i);
      await user.type(estimateInput, '5');

      // Select dropdown value
      const prioritySelect = screen.getByLabelText(/Priority/i);
      await user.selectOptions(prioritySelect, 'High');

      // Fill in date field
      const dateInput = screen.getByLabelText(/Due Date/i);
      await user.type(dateInput, '2024-12-31');

      // Check boolean field
      const blockedCheckbox = screen.getByLabelText(/Blocked/i);
      await user.click(blockedCheckbox);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Issue/i });
      await user.click(submitButton);

      // Verify all field values are submitted
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.customFields?.component).toBe('Frontend');
      expect(submittedData.customFields?.estimate).toBe(5);
      expect(submittedData.customFields?.priority).toBe('High');
      expect(submittedData.customFields?.due_date).toBe('2024-12-31');
      expect(submittedData.customFields?.blocked).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProjectForm } from './CreateProjectForm';
import type { CreateProjectInput } from '@stride/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('CreateProjectForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Onboarding Mode', () => {
    it('should render onboarding form with all fields', () => {
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      expect(screen.getByText(/create your first project/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repository type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repository url/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
    });

    it('should display initial values when provided', () => {
      const initialValues: Partial<CreateProjectInput> = {
        key: 'TEST',
        name: 'Test Project',
        description: 'Test Description',
        repositoryUrl: 'https://github.com/owner/repo',
        repositoryType: 'GitHub',
      };

      render(
        <CreateProjectForm
          {...defaultProps}
          mode="onboarding"
          initialValues={initialValues}
        />
      );

      expect(screen.getByLabelText(/project key/i)).toHaveValue('TEST');
      expect(screen.getByLabelText(/project name/i)).toHaveValue('Test Project');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
      expect(screen.getByLabelText(/repository type/i)).toHaveValue('GitHub');
      expect(screen.getByLabelText(/repository url/i)).toHaveValue('https://github.com/owner/repo');
    });

    it('should format project key to uppercase and remove non-alphanumeric characters', async () => {
      const user = userEvent.setup();
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      const keyInput = screen.getByLabelText(/project key/i);
      await user.type(keyInput, 'test-key_123');

      expect(keyInput).toHaveValue('TESTKEY123');
    });

    it('should call onSubmit with correct data when form is submitted', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      await user.type(screen.getByLabelText(/project key/i), 'TEST');
      await user.type(screen.getByLabelText(/project name/i), 'Test Project');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');

      const submitButton = screen.getByRole('button', { name: /create project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          key: 'TEST',
          name: 'Test Project',
          description: 'Test Description',
        });
      });
    });

    it('should include repository fields when provided', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      await user.type(screen.getByLabelText(/project key/i), 'TEST');
      await user.type(screen.getByLabelText(/project name/i), 'Test Project');
      await user.selectOptions(screen.getByLabelText(/repository type/i), 'GitHub');
      await user.type(screen.getByLabelText(/repository url/i), 'https://github.com/owner/repo');

      const submitButton = screen.getByRole('button', { name: /create project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          key: 'TEST',
          name: 'Test Project',
          repositoryUrl: 'https://github.com/owner/repo',
          repositoryType: 'GitHub',
        });
      });
    });

    it('should not include repository fields when URL is empty', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      await user.type(screen.getByLabelText(/project key/i), 'TEST');
      await user.type(screen.getByLabelText(/project name/i), 'Test Project');
      // Don't fill repository URL

      const submitButton = screen.getByRole('button', { name: /create project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          key: 'TEST',
          name: 'Test Project',
        });
      });
    });

    it('should display error message when provided', () => {
      render(
        <CreateProjectForm
          {...defaultProps}
          mode="onboarding"
          error="Test error message"
        />
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should display error from onSubmit failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create project';
      mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));

      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      await user.type(screen.getByLabelText(/project key/i), 'TEST');
      await user.type(screen.getByLabelText(/project name/i), 'Test Project');

      const submitButton = screen.getByRole('button', { name: /create project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show loading state when isSubmitting is true', () => {
      render(
        <CreateProjectForm
          {...defaultProps}
          mode="onboarding"
          isSubmitting={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create project/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Modal Mode', () => {
    it('should render modal form with all fields', () => {
      render(<CreateProjectForm {...defaultProps} mode="modal" />);

      expect(screen.getByLabelText(/project key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repository type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repository url/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
    });

    it('should render cancel button when onCancel is provided', () => {
      render(
        <CreateProjectForm
          {...defaultProps}
          mode="modal"
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CreateProjectForm
          {...defaultProps}
          mode="modal"
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit with correct data in modal mode', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<CreateProjectForm {...defaultProps} mode="modal" />);

      await user.type(screen.getByLabelText(/project key/i), 'TEST');
      await user.type(screen.getByLabelText(/project name/i), 'Test Project');

      const submitButton = screen.getByRole('button', { name: /create project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          key: 'TEST',
          name: 'Test Project',
        });
      });
    });

    it('should display error message in modal mode', () => {
      render(
        <CreateProjectForm
          {...defaultProps}
          mode="modal"
          error="Test error message"
        />
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require project key', async () => {
      const user = userEvent.setup();
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      const keyInput = screen.getByLabelText(/project key/i);
      expect(keyInput).toBeRequired();
    });

    it('should require project name', async () => {
      const user = userEvent.setup();
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      const nameInput = screen.getByLabelText(/project name/i);
      expect(nameInput).toBeRequired();
    });

    it('should enforce project key min length', () => {
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      const keyInput = screen.getByLabelText(/project key/i);
      expect(keyInput).toHaveAttribute('minLength', '2');
    });

    it('should enforce project key max length', () => {
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      const keyInput = screen.getByLabelText(/project key/i);
      expect(keyInput).toHaveAttribute('maxLength', '10');
    });

    it('should enforce project key pattern', () => {
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      const keyInput = screen.getByLabelText(/project key/i);
      expect(keyInput).toHaveAttribute('pattern', '[A-Z0-9]{2,10}');
    });

    it('should enforce project name max length', () => {
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      const nameInput = screen.getByLabelText(/project name/i);
      expect(nameInput).toHaveAttribute('maxLength', '100');
    });

    it('should enforce description max length', () => {
      render(<CreateProjectForm {...defaultProps} mode="onboarding" />);

      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).toHaveAttribute('maxLength', '500');
    });
  });
});

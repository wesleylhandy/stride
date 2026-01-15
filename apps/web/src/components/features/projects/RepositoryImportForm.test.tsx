import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepositoryImportForm } from './RepositoryImportForm';
import type { RepositoryInfo } from '@/app/api/repositories/list/route';

describe('RepositoryImportForm', () => {
  const mockRepository: RepositoryInfo = {
    id: '1',
    name: 'my-awesome-repo',
    fullName: 'owner/my-awesome-repo',
    url: 'https://github.com/owner/my-awesome-repo',
    description: 'An awesome repository',
    private: false,
    defaultBranch: 'main',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const defaultProps = {
    repository: mockRepository,
    providerType: 'GitHub' as const,
    accessToken: 'test-token',
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render repository information', () => {
      render(<RepositoryImportForm {...defaultProps} />);

      expect(screen.getByText(/confirm import settings/i)).toBeInTheDocument();
      expect(screen.getByText('my-awesome-repo')).toBeInTheDocument();
      expect(screen.getByText('An awesome repository')).toBeInTheDocument();
      expect(screen.getByText('https://github.com/owner/my-awesome-repo')).toBeInTheDocument();
    });

    it('should render form fields with auto-generated values', () => {
      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      const nameInput = screen.getByLabelText(/project name/i);

      expect(keyInput).toHaveValue('MYAWESOMER');
      expect(nameInput).toHaveValue('my-awesome-repo');
    });

    it('should render cancel and import buttons', () => {
      render(<RepositoryImportForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import project/i })).toBeInTheDocument();
    });

    it('should not display description section when repository has no description', () => {
      const repoWithoutDescription = {
        ...mockRepository,
        description: null,
      };

      render(<RepositoryImportForm {...defaultProps} repository={repoWithoutDescription} />);

      expect(screen.queryByText(/description:/i)).not.toBeInTheDocument();
    });
  });

  describe('Project Key Generation', () => {
    it('should generate project key from repository name', () => {
      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      expect(keyInput).toHaveValue('MYAWESOMER');
    });

    it('should handle repository names with special characters', () => {
      const repoWithSpecialChars = {
        ...mockRepository,
        name: 'my_repo-2024',
      };

      render(<RepositoryImportForm {...defaultProps} repository={repoWithSpecialChars} />);

      const keyInput = screen.getByLabelText(/project key/i);
      expect(keyInput).toHaveValue('MYREPO2024');
    });

    it('should format project key input to uppercase and remove non-alphanumeric', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      await user.clear(keyInput);
      await user.type(keyInput, 'test-key_123');

      expect(keyInput).toHaveValue('TESTKEY123');
    });

    it('should handle single character repository names', () => {
      const singleCharRepo = {
        ...mockRepository,
        name: 'a',
      };

      render(<RepositoryImportForm {...defaultProps} repository={singleCharRepo} />);

      const keyInput = screen.getByLabelText(/project key/i);
      expect(keyInput).toHaveValue('A0');
    });
  });

  describe('Form Validation', () => {
    it('should validate project key format', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      await user.clear(keyInput);
      await user.type(keyInput, 'a'); // Too short

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/project key must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate project key max length', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      await user.clear(keyInput);
      await user.type(keyInput, 'VERYLONGKEY'); // Too long

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/project key must be less than 10 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate project key contains only uppercase letters and numbers', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      await user.clear(keyInput);
      await user.type(keyInput, 'test-key'); // Contains lowercase and special chars

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/project key must contain only uppercase letters and numbers/i)).toBeInTheDocument();
      });
    });

    it('should validate project name is required', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/project name/i);
      await user.clear(nameInput);

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate project name max length', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/project name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'a'.repeat(101)); // Too long

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/project name must be less than 100 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<RepositoryImportForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          repositoryUrl: 'https://github.com/owner/my-awesome-repo',
          repositoryType: 'GitHub',
          accessToken: 'test-token',
          projectKey: 'MYAWESOMER',
          projectName: 'my-awesome-repo',
        });
      });
    });

    it('should call onSubmit with edited project key and name', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      const nameInput = screen.getByLabelText(/project name/i);

      await user.clear(keyInput);
      await user.type(keyInput, 'CUSTOM');
      await user.clear(nameInput);
      await user.type(nameInput, 'Custom Project Name');

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          repositoryUrl: 'https://github.com/owner/my-awesome-repo',
          repositoryType: 'GitHub',
          accessToken: 'test-token',
          projectKey: 'CUSTOM',
          projectName: 'Custom Project Name',
        });
      });
    });

    it('should trim project name before submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<RepositoryImportForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/project name/i);
      await user.clear(nameInput);
      await user.type(nameInput, '  Trimmed Name  ');

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            projectName: 'Trimmed Name',
          })
        );
      });
    });

    it('should convert project key to uppercase before submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      await user.clear(keyInput);
      await user.type(keyInput, 'lowercase');

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            projectKey: 'LOWERCASE',
          })
        );
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to import project';
      mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));

      render(<RepositoryImportForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should clear validation errors on resubmission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(<RepositoryImportForm {...defaultProps} />);

      // First submission with invalid key
      const keyInput = screen.getByLabelText(/project key/i);
      await user.clear(keyInput);
      await user.type(keyInput, 'a');

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/project key must be at least 2 characters/i)).toBeInTheDocument();
      });

      // Fix and resubmit
      await user.clear(keyInput);
      await user.type(keyInput, 'VALID');

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/project key must be at least 2 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should disable form fields when loading', () => {
      render(<RepositoryImportForm {...defaultProps} loading={true} />);

      const keyInput = screen.getByLabelText(/project key/i);
      const nameInput = screen.getByLabelText(/project name/i);
      const submitButton = screen.getByRole('button', { name: /import project/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(keyInput).toBeDisabled();
      expect(nameInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading text on submit button when loading', () => {
      render(<RepositoryImportForm {...defaultProps} loading={true} />);

      expect(screen.getByRole('button', { name: /importing.../i })).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display external error message', () => {
      render(<RepositoryImportForm {...defaultProps} error="External error" />);

      expect(screen.getByText('External error')).toBeInTheDocument();
    });

    it('should display validation errors inline', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      await user.clear(keyInput);
      await user.type(keyInput, 'a');

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText(/project key must be at least 2 characters/i);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('should have proper ARIA attributes for error messages', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const keyInput = screen.getByLabelText(/project key/i);
      await user.clear(keyInput);
      await user.type(keyInput, 'a');

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(keyInput).toHaveAttribute('aria-invalid', 'true');
        expect(keyInput).toHaveAttribute('aria-describedby', 'projectKey-error');
      });
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<RepositoryImportForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('GitLab Provider', () => {
    it('should work with GitLab provider', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      const gitlabRepo: RepositoryInfo = {
        ...mockRepository,
        url: 'https://gitlab.com/owner/my-awesome-repo',
      };

      render(
        <RepositoryImportForm
          {...defaultProps}
          repository={gitlabRepo}
          providerType="GitLab"
        />
      );

      const submitButton = screen.getByRole('button', { name: /import project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            repositoryType: 'GitLab',
            repositoryUrl: 'https://gitlab.com/owner/my-awesome-repo',
          })
        );
      });
    });
  });
});

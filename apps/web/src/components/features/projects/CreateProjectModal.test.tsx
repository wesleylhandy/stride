import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProjectModal } from './CreateProjectModal';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock @stride/ui
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};
vi.mock('@stride/ui', async () => {
  const actual = await vi.importActual('@stride/ui');
  return {
    ...actual,
    useToast: () => mockToast,
    Modal: ({ open, onClose, title, children }: any) => {
      if (!open) return null;
      return (
        <div data-testid="modal">
          <div data-testid="modal-title">{title}</div>
          <button data-testid="modal-close" onClick={onClose}>
            Close
          </button>
          {children}
        </div>
      );
    },
  };
});

// Mock CreateProjectForm
vi.mock('./CreateProjectForm', () => ({
  CreateProjectForm: ({ onSubmit, onCancel, isSubmitting }: any) => (
    <div data-testid="create-project-form">
      <input data-testid="project-key" placeholder="Project Key" />
      <input data-testid="project-name" placeholder="Project Name" />
      <button
        data-testid="submit-button"
        onClick={() => onSubmit({ key: 'TEST', name: 'Test Project' })}
        disabled={isSubmitting}
      >
        Create Project
      </button>
      <button data-testid="cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

describe('CreateProjectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should not render when open is false', () => {
    render(<CreateProjectModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(<CreateProjectModal open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create New Project');
    expect(screen.getByTestId('create-project-form')).toBeInTheDocument();
  });

  it('should call onClose when modal close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render(<CreateProjectModal open={true} onClose={mockOnClose} />);

    const closeButton = screen.getByTestId('modal-close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render(<CreateProjectModal open={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should submit form and create project successfully', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockProject = { id: 'project-1', key: 'TEST', name: 'Test Project' };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProject,
    } as Response);

    render(<CreateProjectModal open={true} onClose={mockOnClose} />);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: 'TEST', name: 'Test Project' }),
      });
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Project created successfully');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle validation errors', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const validationError = {
      error: 'Validation failed',
      details: [{ message: 'Project key already exists' }],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => validationError,
    } as Response);

    render(<CreateProjectModal open={true} onClose={mockOnClose} />);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create project', {
        description: 'Project key already exists',
      });
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle generic API errors', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const apiError = { error: 'Internal server error' };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => apiError,
    } as Response);

    render(<CreateProjectModal open={true} onClose={mockOnClose} />);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create project', {
        description: 'Internal server error',
      });
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<CreateProjectModal open={true} onClose={mockOnClose} />);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create project', {
        description: 'Network error',
      });
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle errors with array details', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const validationError = {
      error: 'Validation failed',
      details: [
        { message: 'Project key already exists' },
        { message: 'Project name is required' },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => validationError,
    } as Response);

    render(<CreateProjectModal open={true} onClose={mockOnClose} />);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create project', {
        description: 'Project key already exists, Project name is required',
      });
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

    render(<CreateProjectModal open={true} onClose={mockOnClose} />);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();

    // Resolve the fetch
    resolveFetch!({
      ok: true,
      json: async () => ({ id: 'project-1' }),
    } as Response);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});

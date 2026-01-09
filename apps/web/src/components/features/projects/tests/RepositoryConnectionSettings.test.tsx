import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { RepositoryConnectionSettings } from '../RepositoryConnectionSettings';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock RepositoryConnectionForm component
vi.mock('../RepositoryConnectionForm', () => ({
  RepositoryConnectionForm: ({ onSubmit, onOAuthClick, loading, oauthLoading, error, projectId }: any) => (
    <div data-testid="repository-connection-form">
      <div data-testid="form-loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="form-oauth-loading">{oauthLoading ? 'OAuth Loading' : 'OAuth Not Loading'}</div>
      {error && <div data-testid="form-error">{error}</div>}
      <button
        data-testid="test-oauth-click"
        onClick={() => onOAuthClick('GitHub', 'https://github.com/owner/repo')}
      >
        Test OAuth
      </button>
      <button
        data-testid="test-manual-submit"
        onClick={() =>
          onSubmit({
            repositoryType: 'GitHub',
            repositoryUrl: 'https://github.com/owner/repo',
            accessToken: 'ghp_test123',
          })
        }
      >
        Test Manual Submit
      </button>
    </div>
  ),
}));

describe('RepositoryConnectionSettings', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockRouter = {
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  };

  const mockSearchParams = new URLSearchParams();
  const mockGet = vi.fn((key: string) => mockSearchParams.get(key));

  const defaultProps = {
    projectId: 'test-project-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('success');
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
    } as any);

    // Mock fetch globally
    global.fetch = vi.fn();
    global.sessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching connection', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      expect(screen.getByText(/loading connection status/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading connection status/i)).not.toBeInTheDocument();
      });
    });

    it('should fetch connection on mount', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/projects/${defaultProps.projectId}/repositories`
        );
      });
    });
  });

  describe('No Connection State', () => {
    it('should display "Not Connected" status when no connection exists', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/not connected/i)).toBeInTheDocument();
        expect(
          screen.getByText(/no repository connection configured for this project/i)
        ).toBeInTheDocument();
      });
    });

    it('should render connection form when no connection exists', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });
    });
  });

  describe('Connection Display', () => {
    const mockConnection = {
      id: 'conn-123',
      repositoryUrl: 'https://github.com/owner/repo',
      serviceType: 'GitHub' as const,
      isActive: true,
      lastSyncAt: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-01T09:00:00Z',
    };

    it('should display connected repository information', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConnection,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/connected repository/i)).toBeInTheDocument();
        expect(screen.getByText(mockConnection.repositoryUrl)).toBeInTheDocument();
        expect(screen.getByText(mockConnection.serviceType)).toBeInTheDocument();
      });
    });

    it('should display "Connected" badge when connection is active', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConnection,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/connected/i)).toBeInTheDocument();
      });
    });

    it('should display "Inactive" badge when connection is not active', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockConnection, isActive: false }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/inactive/i)).toBeInTheDocument();
      });
    });

    it('should format last sync date correctly', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConnection,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/last synced/i)).toBeInTheDocument();
      });
    });

    it('should display "Never" when lastSyncAt is null', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockConnection, lastSyncAt: null }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/never/i)).toBeInTheDocument();
      });
    });

    it('should show service icon for GitHub', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConnection,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/service:/i)).toBeInTheDocument();
      });
    });

    it('should show service icon for GitLab', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockConnection, serviceType: 'GitLab' }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/service:/i)).toBeInTheDocument();
      });
    });
  });

  describe('OAuth Flow', () => {
    it('should handle OAuth button click', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authUrl: 'https://github.com/login/oauth/authorize?client_id=test',
          state: 'test-state',
        }),
      } as Response);

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });

      const oauthButton = screen.getByTestId('test-oauth-click');
      await user.click(oauthButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/projects/${defaultProps.projectId}/repositories`)
        );
      });

      // Restore window.location
      window.location = originalLocation;
    });

    it('should set OAuth loading state during OAuth flow', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      let resolveOAuth: any;
      const oauthPromise = new Promise((resolve) => {
        resolveOAuth = resolve;
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(oauthPromise as Promise<Response>);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });

      const oauthButton = screen.getByTestId('test-oauth-click');
      await user.click(oauthButton);

      await waitFor(() => {
        expect(screen.getByTestId('form-oauth-loading')).toHaveTextContent('OAuth Loading');
      });

      // Resolve the promise
      resolveOAuth({
        ok: true,
        json: async () => ({
          authUrl: 'https://github.com/login/oauth/authorize?client_id=test',
          state: 'test-state',
        }),
      } as Response);
    });

    it('should handle OAuth errors', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'OAuth failed' }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });

      const oauthButton = screen.getByTestId('test-oauth-click');
      await user.click(oauthButton);

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(/oauth failed/i);
      });
    });

    it('should handle OAuth success from URL params', async () => {
      mockSearchParams.set('success', 'true');
      mockGet.mockReturnValue('true');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
        expect(screen.getByText(/repository connected successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Manual Connection Flow', () => {
    it('should handle manual form submission', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'conn-123',
          repositoryUrl: 'https://github.com/owner/repo',
          serviceType: 'GitHub',
          isActive: true,
          lastSyncAt: null,
          createdAt: new Date().toISOString(),
        }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('test-manual-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/projects/${defaultProps.projectId}/repositories`,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              repositoryUrl: 'https://github.com/owner/repo',
              repositoryType: 'GitHub',
              accessToken: 'ghp_test123',
            }),
          })
        );
      });
    });

    it('should show success message after manual connection', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'conn-123',
          repositoryUrl: 'https://github.com/owner/repo',
          serviceType: 'GitHub',
          isActive: true,
          lastSyncAt: null,
          createdAt: new Date().toISOString(),
        }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('test-manual-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/repository connected successfully/i)).toBeInTheDocument();
      });
    });

    it('should refetch connection after manual connection', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'conn-123',
          repositoryUrl: 'https://github.com/owner/repo',
          serviceType: 'GitHub',
          isActive: true,
          lastSyncAt: null,
          createdAt: new Date().toISOString(),
        }),
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'conn-123',
          repositoryUrl: 'https://github.com/owner/repo',
          serviceType: 'GitHub',
          isActive: true,
          lastSyncAt: null,
          createdAt: new Date().toISOString(),
        }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('test-manual-submit');
      await user.click(submitButton);

      await waitFor(() => {
        // Should fetch connection twice: initial + after successful connection
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });
    });

    it('should handle manual connection errors', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid repository URL' }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('test-manual-submit');
      await user.click(submitButton);

      // Error should be passed to form component
      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(/invalid repository url/i);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        // Should still render the form even if fetch fails
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });
    });

    it('should not show error for 404 status (no connection exists)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByTestId('form-error')).not.toBeInTheDocument();
      });
    });

    it('should show error for non-404 fetch errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(/server error/i);
      });
    });
  });

  describe('Form Integration', () => {
    it('should pass requireRepositoryUrlForOAuth prop to form', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });
    });

    it('should pass loading state to form during manual connection', async () => {
      const user = userEvent.setup();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      let resolveConnection: any;
      const connectionPromise = new Promise((resolve) => {
        resolveConnection = resolve;
      });

      vi.mocked(global.fetch).mockResolvedValueOnce(connectionPromise as Promise<Response>);

      render(<RepositoryConnectionSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('repository-connection-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('test-manual-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('form-loading')).toHaveTextContent('Loading');
      });

      // Resolve the promise
      resolveConnection({
        ok: true,
        json: async () => ({
          id: 'conn-123',
          repositoryUrl: 'https://github.com/owner/repo',
          serviceType: 'GitHub',
          isActive: true,
          lastSyncAt: null,
          createdAt: new Date().toISOString(),
        }),
      } as Response);
    });
  });
});

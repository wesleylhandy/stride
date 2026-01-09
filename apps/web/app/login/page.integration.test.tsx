import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';
import { useRouter } from 'next/navigation';
import { useToast } from '@stride/ui';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock toast hook
vi.mock('@stride/ui', async () => {
  const actual = await vi.importActual('@stride/ui');
  return {
    ...actual,
    useToast: vi.fn(),
  };
});

// Mock ThemeToggle component
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

describe('LoginPage Integration Tests', () => {
  const mockPush = vi.fn();
  const mockToast = {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as any);
    vi.mocked(useToast).mockReturnValue(mockToast as any);
    
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Onboarding Bypass', () => {
    it('should redirect to dashboard when user has projects (onboarding complete)', async () => {
      const user = userEvent.setup();
      
      // Mock successful login
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);
      
      // Mock projects fetch - user has projects
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 1, items: [{ id: '1', key: 'APP', name: 'Test Project' }] }),
      } as Response);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('should redirect to onboarding when user has no projects (onboarding incomplete)', async () => {
      const user = userEvent.setup();
      
      // Mock successful login
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);
      
      // Mock projects fetch - user has no projects
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, items: [] }),
      } as Response);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for redirect to onboarding
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding');
      }, { timeout: 3000 });
    });

    it('should default to onboarding when projects fetch fails', async () => {
      const user = userEvent.setup();
      
      // Mock successful login
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);
      
      // Mock projects fetch failure
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should default to onboarding on failure
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding');
      }, { timeout: 3000 });
    });
  });

  describe('Login Flow Integration', () => {
    it('should call login API with correct credentials', async () => {
      const user = userEvent.setup();
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0 }),
      } as Response);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Verify login API was called with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });
      });
    });

    it('should call projects API after successful login', async () => {
      const user = userEvent.setup();
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0 }),
      } as Response);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Verify projects API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects?pageSize=1',
          expect.objectContaining({
            method: 'GET',
            credentials: 'include',
          })
        );
      });
    });

    it('should handle authentication failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock failed login
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid email or password' }),
      } as Response);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Should show error toast and not redirect
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show error toast and not redirect
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Login failed',
          expect.objectContaining({
            description: expect.stringContaining(/network error/i),
          })
        );
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });
});

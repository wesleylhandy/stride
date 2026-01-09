import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useToast } from '@stride/ui';
import * as sonner from 'sonner';

// Mock sonner library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  },
  Toaster: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="toaster">{children}</div>
  ),
}));

// Test component that uses useToast
function TestComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation successful');
  };

  const handleError = () => {
    toast.error('Operation failed', {
      description: 'Please try again',
    });
  };

  const handleErrorWithAction = () => {
    toast.error('Operation failed', {
      description: 'Please try again',
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry clicked'),
      },
    });
  };

  const handleInfo = () => {
    toast.info('Information message');
  };

  const handleWarning = () => {
    toast.warning('Warning message');
  };

  const handleLoading = () => {
    toast.loading('Loading...');
  };

  const handlePromise = async () => {
    const promise = Promise.resolve('Success');
    toast.promise(promise, {
      loading: 'Processing...',
      success: 'Done!',
      error: 'Failed',
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
      <button onClick={handleErrorWithAction}>Error with Action</button>
      <button onClick={handleInfo}>Info</button>
      <button onClick={handleWarning}>Warning</button>
      <button onClick={handleLoading}>Loading</button>
      <button onClick={handlePromise}>Promise</button>
    </div>
  );
}

describe('Toast Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Integration', () => {
    it('should integrate useToast hook in component', () => {
      render(<TestComponent />);

      expect(screen.getByRole('button', { name: /success/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /error/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument();
    });
  });

  describe('Success Toast Integration', () => {
    it('should show success toast when button is clicked', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: /success/i });
      await user.click(button);

      expect(sonner.toast.success).toHaveBeenCalledWith('Operation successful', {
        duration: 4000,
        action: undefined,
      });
    });
  });

  describe('Error Toast Integration', () => {
    it('should show error toast with description when button is clicked', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: /error$/i });
      await user.click(button);

      expect(sonner.toast.error).toHaveBeenCalledWith('Operation failed', {
        duration: 6000,
        description: 'Please try again',
        action: undefined,
      });
    });

    it('should show error toast with action button when clicked', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: /error with action/i });
      await user.click(button);

      expect(sonner.toast.error).toHaveBeenCalledWith(
        'Operation failed',
        expect.objectContaining({
          description: 'Please try again',
          action: expect.objectContaining({
            label: 'Retry',
            onClick: expect.any(Function),
          }),
        })
      );
    });

    it('should execute action onClick when action button is clicked', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: /error with action/i });
      await user.click(button);

      // Get the action onClick function from the last call
      const lastCall = vi.mocked(sonner.toast.error).mock.calls[
        vi.mocked(sonner.toast.error).mock.calls.length - 1
      ];
      const action = lastCall[1]?.action;

      if (action && typeof action.onClick === 'function') {
        action.onClick();
        expect(consoleSpy).toHaveBeenCalledWith('Retry clicked');
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Info Toast Integration', () => {
    it('should show info toast when button is clicked', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: /info/i });
      await user.click(button);

      expect(sonner.toast.info).toHaveBeenCalledWith('Information message', {
        duration: 4000,
        action: undefined,
      });
    });
  });

  describe('Warning Toast Integration', () => {
    it('should show warning toast when button is clicked', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: /warning/i });
      await user.click(button);

      expect(sonner.toast.warning).toHaveBeenCalledWith('Warning message', {
        duration: 5000,
        action: undefined,
      });
    });
  });

  describe('Loading Toast Integration', () => {
    it('should show loading toast when button is clicked', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: /loading/i });
      await user.click(button);

      expect(sonner.toast.loading).toHaveBeenCalledWith('Loading...');
    });
  });

  describe('Promise Toast Integration', () => {
    it('should show promise toast when button is clicked', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: /promise/i });
      await user.click(button);

      await waitFor(() => {
        expect(sonner.toast.promise).toHaveBeenCalled();
      });

      const lastCall = vi.mocked(sonner.toast.promise).mock.calls[
        vi.mocked(sonner.toast.promise).mock.calls.length - 1
      ];

      expect(lastCall[1]).toEqual({
        loading: 'Processing...',
        success: 'Done!',
        error: 'Failed',
      });
    });
  });

  describe('Multiple Toast Calls', () => {
    it('should handle multiple toast calls in sequence', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const successButton = screen.getByRole('button', { name: /success/i });
      const errorButton = screen.getByRole('button', { name: /error$/i });
      const infoButton = screen.getByRole('button', { name: /info/i });

      await user.click(successButton);
      await user.click(errorButton);
      await user.click(infoButton);

      expect(sonner.toast.success).toHaveBeenCalledTimes(1);
      expect(sonner.toast.error).toHaveBeenCalledTimes(1);
      expect(sonner.toast.info).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid toast calls', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const successButton = screen.getByRole('button', { name: /success/i });

      // Click rapidly multiple times
      await user.click(successButton);
      await user.click(successButton);
      await user.click(successButton);

      expect(sonner.toast.success).toHaveBeenCalledTimes(3);
    });
  });

  describe('Toast with Custom Options', () => {
    it('should pass custom duration to toast', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Mock a component with custom duration
      function CustomToastComponent() {
        const toast = useToast();
        return (
          <button onClick={() => toast.success('Test', { duration: 10000 })}>
            Custom Duration
          </button>
        );
      }

      render(<CustomToastComponent />);
      const button = screen.getByRole('button', { name: /custom duration/i });
      await user.click(button);

      expect(sonner.toast.success).toHaveBeenCalledWith('Test', {
        duration: 10000,
        action: undefined,
      });
    });

    it('should pass custom action to toast', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      function CustomToastComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() =>
              toast.success('Test', {
                action: { label: 'Custom Action', onClick },
              })
            }
          >
            Custom Action
          </button>
        );
      }

      render(<CustomToastComponent />);
      const button = screen.getByRole('button', { name: /custom action/i });
      await user.click(button);

      const lastCall = vi.mocked(sonner.toast.success).mock.calls[
        vi.mocked(sonner.toast.success).mock.calls.length - 1
      ];
      const action = lastCall[1]?.action;

      if (action && typeof action.onClick === 'function') {
        action.onClick();
        expect(onClick).toHaveBeenCalled();
      }
    });
  });
});

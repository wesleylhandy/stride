import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToast } from '../useToast';
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
}));

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should return all toast methods', () => {
      const toast = useToast();

      expect(toast).toHaveProperty('success');
      expect(toast).toHaveProperty('error');
      expect(toast).toHaveProperty('info');
      expect(toast).toHaveProperty('warning');
      expect(toast).toHaveProperty('loading');
      expect(toast).toHaveProperty('dismiss');
      expect(toast).toHaveProperty('promise');
    });
  });

  describe('Success Toast', () => {
    it('should call sonner.success with message', () => {
      const toast = useToast();
      toast.success('Operation successful');

      expect(sonner.toast.success).toHaveBeenCalledWith('Operation successful', {
        duration: 4000,
        action: undefined,
      });
    });

    it('should call sonner.success with custom duration', () => {
      const toast = useToast();
      toast.success('Operation successful', { duration: 5000 });

      expect(sonner.toast.success).toHaveBeenCalledWith('Operation successful', {
        duration: 5000,
        action: undefined,
      });
    });

    it('should call sonner.success with action button', () => {
      const toast = useToast();
      const action = {
        label: 'Undo',
        onClick: vi.fn(),
      };
      toast.success('Operation successful', { action });

      expect(sonner.toast.success).toHaveBeenCalledWith('Operation successful', {
        duration: 4000,
        action,
      });
    });

    it('should return toast ID from sonner', () => {
      const mockToastId = 'toast-123';
      vi.mocked(sonner.toast.success).mockReturnValue(mockToastId as any);

      const toast = useToast();
      const result = toast.success('Operation successful');

      expect(result).toBe(mockToastId);
    });
  });

  describe('Error Toast', () => {
    it('should call sonner.error with message', () => {
      const toast = useToast();
      toast.error('Operation failed');

      expect(sonner.toast.error).toHaveBeenCalledWith('Operation failed', {
        duration: 6000,
        description: undefined,
        action: undefined,
      });
    });

    it('should call sonner.error with custom duration', () => {
      const toast = useToast();
      toast.error('Operation failed', { duration: 8000 });

      expect(sonner.toast.error).toHaveBeenCalledWith('Operation failed', {
        duration: 8000,
        description: undefined,
        action: undefined,
      });
    });

    it('should call sonner.error with description', () => {
      const toast = useToast();
      toast.error('Operation failed', {
        description: 'Please check your connection and try again.',
      });

      expect(sonner.toast.error).toHaveBeenCalledWith('Operation failed', {
        duration: 6000,
        description: 'Please check your connection and try again.',
        action: undefined,
      });
    });

    it('should call sonner.error with action button', () => {
      const toast = useToast();
      const action = {
        label: 'Retry',
        onClick: vi.fn(),
      };
      toast.error('Operation failed', { action });

      expect(sonner.toast.error).toHaveBeenCalledWith('Operation failed', {
        duration: 6000,
        description: undefined,
        action,
      });
    });

    it('should call sonner.error with description and action', () => {
      const toast = useToast();
      const action = {
        label: 'View Help',
        onClick: vi.fn(),
      };
      toast.error('Operation failed', {
        description: 'Please check your connection and try again.',
        action,
      });

      expect(sonner.toast.error).toHaveBeenCalledWith('Operation failed', {
        duration: 6000,
        description: 'Please check your connection and try again.',
        action,
      });
    });

    it('should return toast ID from sonner', () => {
      const mockToastId = 'toast-456';
      vi.mocked(sonner.toast.error).mockReturnValue(mockToastId as any);

      const toast = useToast();
      const result = toast.error('Operation failed');

      expect(result).toBe(mockToastId);
    });
  });

  describe('Info Toast', () => {
    it('should call sonner.info with message', () => {
      const toast = useToast();
      toast.info('Information message');

      expect(sonner.toast.info).toHaveBeenCalledWith('Information message', {
        duration: 4000,
        action: undefined,
      });
    });

    it('should call sonner.info with custom duration', () => {
      const toast = useToast();
      toast.info('Information message', { duration: 5000 });

      expect(sonner.toast.info).toHaveBeenCalledWith('Information message', {
        duration: 5000,
        action: undefined,
      });
    });

    it('should call sonner.info with action button', () => {
      const toast = useToast();
      const action = {
        label: 'Learn More',
        onClick: vi.fn(),
      };
      toast.info('Information message', { action });

      expect(sonner.toast.info).toHaveBeenCalledWith('Information message', {
        duration: 4000,
        action,
      });
    });

    it('should return toast ID from sonner', () => {
      const mockToastId = 'toast-789';
      vi.mocked(sonner.toast.info).mockReturnValue(mockToastId as any);

      const toast = useToast();
      const result = toast.info('Information message');

      expect(result).toBe(mockToastId);
    });
  });

  describe('Warning Toast', () => {
    it('should call sonner.warning with message', () => {
      const toast = useToast();
      toast.warning('Warning message');

      expect(sonner.toast.warning).toHaveBeenCalledWith('Warning message', {
        duration: 5000,
        action: undefined,
      });
    });

    it('should call sonner.warning with custom duration', () => {
      const toast = useToast();
      toast.warning('Warning message', { duration: 7000 });

      expect(sonner.toast.warning).toHaveBeenCalledWith('Warning message', {
        duration: 7000,
        action: undefined,
      });
    });

    it('should call sonner.warning with action button', () => {
      const toast = useToast();
      const action = {
        label: 'Dismiss',
        onClick: vi.fn(),
      };
      toast.warning('Warning message', { action });

      expect(sonner.toast.warning).toHaveBeenCalledWith('Warning message', {
        duration: 5000,
        action,
      });
    });

    it('should return toast ID from sonner', () => {
      const mockToastId = 'toast-warn-123';
      vi.mocked(sonner.toast.warning).mockReturnValue(mockToastId as any);

      const toast = useToast();
      const result = toast.warning('Warning message');

      expect(result).toBe(mockToastId);
    });
  });

  describe('Loading Toast', () => {
    it('should call sonner.loading with message', () => {
      const toast = useToast();
      toast.loading('Loading...');

      expect(sonner.toast.loading).toHaveBeenCalledWith('Loading...');
    });

    it('should return toast ID from sonner', () => {
      const mockToastId = 'toast-loading-123';
      vi.mocked(sonner.toast.loading).mockReturnValue(mockToastId as any);

      const toast = useToast();
      const result = toast.loading('Loading...');

      expect(result).toBe(mockToastId);
    });
  });

  describe('Dismiss Toast', () => {
    it('should call sonner.dismiss with toast ID', () => {
      const toast = useToast();
      toast.dismiss('toast-123');

      expect(sonner.toast.dismiss).toHaveBeenCalledWith('toast-123');
    });

    it('should call sonner.dismiss with numeric toast ID', () => {
      const toast = useToast();
      toast.dismiss(123);

      expect(sonner.toast.dismiss).toHaveBeenCalledWith(123);
    });
  });

  describe('Promise Toast', () => {
    it('should call sonner.promise with promise and messages', async () => {
      const toast = useToast();
      const promise = Promise.resolve('Success');
      const messages = {
        loading: 'Processing...',
        success: 'Done!',
        error: 'Failed',
      };

      toast.promise(promise, messages);

      expect(sonner.toast.promise).toHaveBeenCalledWith(promise, messages);
    });

    it('should call sonner.promise with function-based messages', async () => {
      const toast = useToast();
      const promise = Promise.resolve({ id: 123, name: 'Test' });
      const messages = {
        loading: 'Processing...',
        success: (data: { id: number; name: string }) => `Created ${data.name}`,
        error: (error: unknown) => `Error: ${String(error)}`,
      };

      toast.promise(promise, messages);

      expect(sonner.toast.promise).toHaveBeenCalledWith(promise, messages);
    });

    it('should return promise result from sonner', async () => {
      const mockPromise = Promise.resolve('Success');
      const mockPromiseResult = Promise.resolve('toast-promise-123');
      vi.mocked(sonner.toast.promise).mockReturnValue(mockPromiseResult as any);

      const toast = useToast();
      const result = toast.promise(mockPromise, {
        loading: 'Processing...',
        success: 'Done!',
        error: 'Failed',
      });

      expect(result).toBe(mockPromiseResult);
    });
  });

  describe('Default Durations', () => {
    it('should use default duration for success toast', () => {
      const toast = useToast();
      toast.success('Test');

      expect(sonner.toast.success).toHaveBeenCalledWith('Test', {
        duration: 4000,
        action: undefined,
      });
    });

    it('should use default duration for error toast', () => {
      const toast = useToast();
      toast.error('Test');

      expect(sonner.toast.error).toHaveBeenCalledWith('Test', {
        duration: 6000,
        description: undefined,
        action: undefined,
      });
    });

    it('should use default duration for info toast', () => {
      const toast = useToast();
      toast.info('Test');

      expect(sonner.toast.info).toHaveBeenCalledWith('Test', {
        duration: 4000,
        action: undefined,
      });
    });

    it('should use default duration for warning toast', () => {
      const toast = useToast();
      toast.warning('Test');

      expect(sonner.toast.warning).toHaveBeenCalledWith('Test', {
        duration: 5000,
        action: undefined,
      });
    });
  });
});

'use client';

import { toast as sonnerToast } from 'sonner';

/**
 * Toast notification hook
 * 
 * Wrapper around sonner toast library for consistent toast notifications
 * throughout the application.
 */
export function useToast() {
  return {
    /**
     * Show a success toast
     */
    success: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return sonnerToast.success(message, {
        duration: options?.duration ?? 4000,
        action: options?.action,
      });
    },
    /**
     * Show an error toast
     */
    error: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void }; description?: string }) => {
      return sonnerToast.error(message, {
        duration: options?.duration ?? 6000,
        description: options?.description,
        action: options?.action,
      });
    },
    /**
     * Show an info toast
     */
    info: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return sonnerToast.info(message, {
        duration: options?.duration ?? 4000,
        action: options?.action,
      });
    },
    /**
     * Show a warning toast
     */
    warning: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return sonnerToast.warning(message, {
        duration: options?.duration ?? 5000,
        action: options?.action,
      });
    },
    /**
     * Show a loading toast (returns a function to update/dismiss)
     */
    loading: (message: string) => {
      return sonnerToast.loading(message);
    },
    /**
     * Dismiss a toast by ID
     */
    dismiss: (toastId: string | number) => {
      sonnerToast.dismiss(toastId);
    },
    /**
     * Promise toast - shows loading, then success/error based on promise result
     */
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }
    ) => {
      return sonnerToast.promise(promise, messages);
    },
  };
}


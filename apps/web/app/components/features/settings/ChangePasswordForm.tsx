'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@stride/ui';
import { changePasswordSchema } from '@/lib/validation/user-schemas';

type PasswordFormData = z.infer<typeof changePasswordSchema>;

export interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

/**
 * ChangePasswordForm Component
 * 
 * Form for changing user password.
 */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      setSuccess(true);
      reset(); // Clear form

      if (onSuccess) {
        onSuccess();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark">
          Change Password
        </h2>

        {error && (
          <div
            className="rounded-md bg-error/10 border border-error/20 p-3 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="rounded-md bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400"
            role="alert"
          >
            Password changed successfully
          </div>
        )}

        <Input
          id="currentPassword"
          label="Current Password"
          type="password"
          {...register('currentPassword')}
          error={errors.currentPassword?.message}
          placeholder="Enter current password"
          autoComplete="current-password"
        />

        <Input
          id="newPassword"
          label="New Password"
          type="password"
          {...register('newPassword')}
          error={errors.newPassword?.message}
          placeholder="Enter new password"
          autoComplete="new-password"
        />

        <Input
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          loading={isSubmitting}
        >
          Change Password
        </Button>
      </div>
    </form>
  );
}


'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@stride/ui';
import { updateProfileSchema } from '@/lib/validation/user-schemas';
import type { User } from '@stride/types';

const profileFormSchema = updateProfileSchema;

type ProfileFormData = z.infer<typeof profileFormSchema>;

export interface UserProfileFormProps {
  user: User;
  onSuccess?: () => void;
}

/**
 * UserProfileForm Component
 * 
 * Form for updating user profile information (name, username, avatar URL).
 */
export function UserProfileForm({ user, onSuccess }: UserProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema as any),
    defaultValues: {
      name: user.name || '',
      username: user.username,
      avatarUrl: user.avatarUrl || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setSuccess(true);
      reset(data); // Update form with new values
      
      if (onSuccess) {
        onSuccess();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground dark:text-foreground-dark">
          Profile Information
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
            Profile updated successfully
          </div>
        )}

        <div>
          <Input
            id="email"
            label="Email"
            type="email"
            value={user.email}
            disabled
            className="bg-background-secondary dark:bg-background-dark-secondary"
          />
          <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
            Email cannot be changed
          </p>
        </div>

        <Input
          id="username"
          label="Username"
          {...register('username')}
          error={errors.username?.message}
          placeholder="Enter username"
        />

        <Input
          id="name"
          label="Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Enter your name"
        />

        <Input
          id="avatarUrl"
          label="Avatar URL"
          type="url"
          {...register('avatarUrl')}
          error={errors.avatarUrl?.message}
          placeholder="https://example.com/avatar.jpg"
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
          Save Changes
        </Button>
      </div>
    </form>
  );
}


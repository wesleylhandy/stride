'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, useToast } from '@stride/ui';
import { cn } from '@stride/ui';

// Client-safe schema without async refinements (uniqueness checked by API)
const formSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
    name: z.string().max(100, 'Name must be less than 100 characters').optional(),
    role: z.enum(['Member', 'Viewer'], {
      errorMap: () => ({ message: 'Role must be Member or Viewer' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type CreateUserFormData = z.infer<typeof formSchema>;

export interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * CreateUserForm component
 * 
 * Form for creating new users (admin only).
 * Includes email, username, password, confirmPassword, name, and role fields.
 */
export function CreateUserForm({
  onSuccess,
  onCancel,
  className,
}: CreateUserFormProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setError,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'Member',
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
          name: data.name || undefined,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors from API
        if (response.status === 400 && result.details) {
          // Set field-specific errors
          if (result.details.email) {
            setError('email', {
              type: 'server',
              message: Array.isArray(result.details.email) 
                ? result.details.email[0] 
                : result.details.email,
            });
          }
          if (result.details.username) {
            setError('username', {
              type: 'server',
              message: Array.isArray(result.details.username)
                ? result.details.username[0]
                : result.details.username,
            });
          }
          throw new Error(result.error || 'Validation failed');
        }
        
        // Handle conflict errors (409)
        if (response.status === 409) {
          if (result.error?.toLowerCase().includes('email')) {
            setError('email', {
              type: 'server',
              message: 'This email is already in use',
            });
          }
          if (result.error?.toLowerCase().includes('username')) {
            setError('username', {
              type: 'server',
              message: 'This username is already taken',
            });
          }
        }
        
        throw new Error(result.error || 'Failed to create user');
      }

      toast.success('User created successfully');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create user. Please try again.';

      toast.error('Failed to create user', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      <div className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="user@example.com"
          required
          disabled={isSubmitting}
        />

        <Input
          id="username"
          label="Username"
          {...register('username')}
          error={errors.username?.message}
          placeholder="username"
          required
          disabled={isSubmitting}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="Enter password"
          required
          disabled={isSubmitting}
        />

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          placeholder="Confirm password"
          required
          disabled={isSubmitting}
        />

        <Input
          id="name"
          label="Name (Optional)"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Full name"
          disabled={isSubmitting}
        />

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium mb-1 text-foreground dark:text-foreground-dark"
          >
            Role
            <span className="text-error dark:text-error-dark" aria-label="required">*</span>
          </label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <select
                id="role"
                {...field}
                className={cn(
                  'flex h-10 w-full rounded-md border bg-background dark:bg-background-dark px-3 py-2 text-sm',
                  'transition-colors focus-ring',
                  errors.role
                    ? 'border-error dark:border-error-dark focus-visible:ring-error dark:focus-visible:ring-error-dark'
                    : 'border-border dark:border-border-dark hover:border-border-hover dark:hover:border-border-dark-hover focus-visible:border-border-focus dark:focus-visible:border-border-dark-focus',
                  'text-foreground dark:text-foreground-dark',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                disabled={isSubmitting}
                required
              >
                <option value="Member">Member</option>
                <option value="Viewer">Viewer</option>
              </select>
            )}
          />
          {errors.role && (
            <p className="mt-1 text-sm text-error dark:text-error-dark" role="alert">
              {errors.role.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
        >
          Create User
        </Button>
      </div>
    </form>
  );
}

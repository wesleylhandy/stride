'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Badge, useToast } from '@stride/ui';
import { cn } from '@stride/ui';
import { useRouter } from 'next/navigation';

// Client-safe schema without async refinements (uniqueness checked by API)
const formSchema = z
  .object({
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type InviteAcceptFormData = z.infer<typeof formSchema>;

export interface InvitationDetails {
  id: string;
  email: string;
  role: 'Admin' | 'Member' | 'Viewer';
  expiresAt: string;
  invitedBy: string | null;
}

export interface InviteAcceptFormProps {
  token: string;
  invitation?: InvitationDetails;
  className?: string;
}

/**
 * InviteAcceptForm component
 * 
 * Form for accepting an invitation and creating a user account (public, no auth required).
 * Displays invitation details and allows user to set username, password, and name.
 * Auto-logs in user after successful acceptance.
 */
export function InviteAcceptForm({
  token,
  invitation: initialInvitation,
  className,
}: InviteAcceptFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingInvitation, setIsLoadingInvitation] = React.useState(!initialInvitation);
  const [invitation, setInvitation] = React.useState<InvitationDetails | null>(initialInvitation || null);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<InviteAcceptFormData>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
  });

  // Fetch invitation details if not provided
  React.useEffect(() => {
    if (initialInvitation) {
      setInvitation(initialInvitation);
      setIsLoadingInvitation(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/users/invite/${token}`);
        const result = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError('Invitation not found');
          } else if (response.status === 410) {
            setError(result.error || 'This invitation has expired or already been accepted');
          } else {
            setError(result.error || 'Failed to load invitation');
          }
          return;
        }

        setInvitation(result.invitation);
      } catch (error) {
        console.error('Failed to fetch invitation:', error);
        setError('Failed to load invitation. Please try again.');
      } finally {
        setIsLoadingInvitation(false);
      }
    };

    fetchInvitation();
  }, [token, initialInvitation]);

  const onSubmit = async (data: InviteAcceptFormData) => {
    if (!invitation) {
      setError('Invalid invitation');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/invite/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          name: data.name || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && result.details) {
          if (result.details.username) {
            setFormError('username', {
              type: 'server',
              message: Array.isArray(result.details.username)
                ? result.details.username[0]
                : result.details.username,
            });
          }
          throw new Error(result.error || 'Validation failed');
        }

        // Handle conflict errors
        if (response.status === 409) {
          if (result.error?.toLowerCase().includes('username')) {
            setFormError('username', {
              type: 'server',
              message: 'This username is already taken',
            });
          }
          throw new Error(result.error || 'Username already taken');
        }

        if (response.status === 404) {
          throw new Error('Invitation not found');
        }

        if (response.status === 410) {
          throw new Error('This invitation has expired or already been accepted');
        }

        throw new Error(result.error || 'Failed to accept invitation');
      }

      toast.success(result.message || 'Account created successfully. You are now logged in.');

      // Redirect to dashboard after successful account creation
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to accept invitation. Please try again.';

      setError(errorMessage);
      toast.error('Failed to accept invitation', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInvitation) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className={cn('rounded-md bg-error-bg border border-error/20 p-4', className)}>
        <p className="text-sm font-medium text-error">{error}</p>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const [timeRemaining, setTimeRemaining] = React.useState<string>('');
  const [isExpired, setIsExpired] = React.useState(false);

  // Calculate and update time remaining until expiration
  React.useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = new Date(invitation.expiresAt);
      const diffMs = expiresAt.getTime() - now.getTime();

      if (diffMs <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      setIsExpired(false);

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`${seconds} second${seconds !== 1 ? 's' : ''}`);
      }
    };

    // Update immediately
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [invitation.expiresAt]);

  const roleColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    Admin: 'error',
    Member: 'success',
    Viewer: 'info',
  } as const;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Invitation Details */}
      <div className="rounded-md bg-background-secondary dark:bg-background-dark-secondary border border-border dark:border-border-dark p-4 space-y-3">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          Invitation Details
        </h2>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary dark:text-foreground-dark-secondary">Email:</span>
            <span className="font-medium text-foreground dark:text-foreground-dark">
              {invitation.email}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary dark:text-foreground-dark-secondary">Role:</span>
            <Badge variant={roleColors[invitation.role] || 'default'}>
              {invitation.role}
            </Badge>
          </div>
          
          {invitation.invitedBy && (
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary dark:text-foreground-dark-secondary">Invited by:</span>
              <span className="font-medium text-foreground dark:text-foreground-dark">
                {invitation.invitedBy}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary dark:text-foreground-dark-secondary">Expires:</span>
            <div className="flex flex-col items-end">
              <span className={cn(
                'font-medium text-sm',
                isExpired
                  ? 'text-error dark:text-error-dark'
                  : 'text-foreground dark:text-foreground-dark'
              )}>
                {isExpired ? 'Expired' : `Expires in ${timeRemaining}`}
              </span>
              <span className="text-xs text-foreground-muted dark:text-foreground-dark-muted mt-0.5">
                {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {isExpired && (
          <div className="rounded-md bg-error-bg border border-error/20 p-3">
            <p className="text-sm text-error">
              This invitation has expired. Please contact an administrator for a new invitation.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-error-bg border border-error/20 p-4">
          <p className="text-sm font-medium text-error">{error}</p>
        </div>
      )}

      {/* Form */}
      {!isExpired && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="username"
            label="Username"
            {...register('username')}
            error={errors.username?.message}
            placeholder="Choose a username"
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

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="w-full"
          >
            Create Account
          </Button>
        </form>
      )}
    </div>
  );
}

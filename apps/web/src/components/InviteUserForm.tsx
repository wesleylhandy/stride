'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, useToast } from '@stride/ui';
import { inviteUserSchema } from '@/lib/validation/user-schemas';
import { cn } from '@stride/ui';

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

export interface InviteUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * InviteUserForm component
 * 
 * Form for inviting new users via email invitation (admin only).
 * Includes email and role fields. Shows invitation token/URL for manual sharing
 * if email service is unavailable.
 */
export function InviteUserForm({
  onSuccess,
  onCancel,
  className,
}: InviteUserFormProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [invitationResult, setInvitationResult] = React.useState<{
    inviteUrl: string;
    emailSent: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role: 'Member',
    },
  });

  const onSubmit = async (data: InviteUserFormData) => {
    setIsSubmitting(true);
    setInvitationResult(null);

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && result.details) {
          throw new Error(result.details[0]?.message || result.error || 'Validation failed');
        }
        
        // Handle conflict errors
        if (response.status === 409) {
          throw new Error(result.error || 'A pending invitation or user already exists for this email');
        }
        
        throw new Error(result.error || 'Failed to create invitation');
      }

      // Store invitation result for display
      setInvitationResult({
        inviteUrl: result.inviteUrl,
        emailSent: result.emailSent,
      });

      if (result.emailSent) {
        toast.success('Invitation sent successfully');
      } else {
        toast.info(result.message || 'Invitation created. Email service not configured.');
      }

      // Reset form if email was sent
      if (result.emailSent && onSuccess) {
        setTimeout(() => {
          reset();
          setInvitationResult(null);
          onSuccess();
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to create invitation:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create invitation. Please try again.';

      toast.error('Failed to create invitation', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        {invitationResult && !invitationResult.emailSent && (
          <div className="rounded-md bg-warning-bg border border-warning/20 p-4 space-y-3">
            <p className="text-sm font-medium text-warning">
              Email service not configured
            </p>
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              See{' '}
              <a
                href="/docs/deployment/smtp-configuration"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                SMTP Configuration documentation
              </a>
              {' '}to enable email invitations. Invitation link will be shown below for manual sharing.
            </p>
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-2">
              Share this invitation link manually:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={invitationResult.inviteUrl}
                className="flex-1 h-10 rounded-md border border-border dark:border-border-dark bg-background-secondary dark:bg-background-dark-secondary px-3 py-2 text-sm font-mono text-foreground dark:text-foreground-dark"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(invitationResult.inviteUrl);
                  toast.success('Invitation link copied to clipboard');
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
              See{' '}
              <a
                href="/docs/deployment/smtp-configuration"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                SMTP Configuration documentation
              </a>{' '}
              to enable email invitations.
            </p>
          </div>
        )}

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
            Send Invitation
          </Button>
        </div>
      </form>
    </div>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, useToast, Button, Input } from '@stride/ui';
import { createCycleSchema } from '@/lib/validation/cycle';
import { getCsrfHeaders } from '@/lib/utils/csrf';

export interface CreateCycleModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Project ID
   */
  projectId: string;
}

type CreateCycleFormData = {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  goal?: string;
};

/**
 * CreateCycleModal component
 * 
 * Modal for creating new sprints (cycles) with form validation.
 * After creation, redirects to sprint planning page for the new sprint.
 */
export function CreateCycleModal({
  open,
  onClose,
  projectId,
}: CreateCycleModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCycleFormData>({
    resolver: zodResolver(createCycleSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      goal: '',
    },
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateCycleFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/cycles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          startDate: data.startDate,
          endDate: data.endDate,
          goal: data.goal || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sprint');
      }

      const result = await response.json();
      const cycle = result.data;

      // Show success toast
      toast.success('Sprint created successfully');

      // Close modal
      onClose();

      // Redirect to sprint planning page for the new sprint
      router.push(`/projects/${projectId}/sprints/new?cycleId=${cycle.id}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to create sprint:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create sprint. Please try again.';

      toast.error('Failed to create sprint', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Sprint"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="name"
          label="Sprint Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Sprint 1"
          required
          disabled={isSubmitting}
        />

        <Input
          id="startDate"
          label="Start Date"
          type="date"
          {...register('startDate')}
          error={errors.startDate?.message}
          required
          disabled={isSubmitting}
        />

        <Input
          id="endDate"
          label="End Date"
          type="date"
          {...register('endDate')}
          error={errors.endDate?.message}
          required
          disabled={isSubmitting}
        />

        <Input
          id="description"
          label="Description (Optional)"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Sprint description"
          disabled={isSubmitting}
        />

        <Input
          id="goal"
          label="Sprint Goal (Optional)"
          {...register('goal')}
          error={errors.goal?.message}
          placeholder="What do we want to achieve in this sprint?"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Sprint'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

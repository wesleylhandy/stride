'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, useToast } from '@stride/ui';
import type { CreateProjectInput } from '@stride/types';
import { CreateProjectForm } from './CreateProjectForm';

export interface CreateProjectModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
}

/**
 * CreateProjectModal component
 *
 * Modal for creating new projects with CreateProjectForm.
 * Follows the same pattern as CreateIssueModal and CreateCycleModal.
 */
export function CreateProjectModal({
  open,
  onClose,
}: CreateProjectModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: CreateProjectInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle validation errors
        if (response.status === 400 && error.details) {
          const errorMessage = Array.isArray(error.details)
            ? error.details.map((err: { message: string }) => err.message).join(', ')
            : error.error || 'Validation failed';
          throw new Error(errorMessage);
        }
        
        throw new Error(error.error || 'Failed to create project');
      }

      const project = await response.json();

      // Show success toast
      toast.success('Project created successfully');

      // Close modal
      onClose();

      // Refresh the page to show the new project
      router.refresh();
    } catch (error) {
      console.error('Failed to create project:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create project. Please try again.';

      toast.error('Failed to create project', {
        description: errorMessage,
      });
      
      // Re-throw to let form handle the error display
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Project"
      size="lg"
    >
      <CreateProjectForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        mode="modal"
      />
    </Modal>
  );
}

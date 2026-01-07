'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, IssueForm, useToast } from '@stride/ui';
import type { CreateIssueInput } from '@stride/types';
import type { ProjectConfig } from '@stride/yaml-config';

export interface CreateIssueModalProps {
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
  /**
   * Project configuration
   */
  projectConfig?: ProjectConfig;
}

/**
 * CreateIssueModal component
 * 
 * Modal for creating new issues with IssueForm.
 */
export function CreateIssueModal({
  open,
  onClose,
  projectId,
  projectConfig,
}: CreateIssueModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: CreateIssueInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create issue');
      }

      const issue = await response.json();

      // Show success toast
      toast.success('Issue created successfully');

      // Close modal
      onClose();

      // Refresh the page to show the new issue
      router.refresh();
    } catch (error) {
      console.error('Failed to create issue:', error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create issue. Please try again.';

      toast.error('Failed to create issue', {
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
      title="Create New Issue"
      size="lg"
    >
      <IssueForm
        projectId={projectId}
        projectConfig={projectConfig}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}


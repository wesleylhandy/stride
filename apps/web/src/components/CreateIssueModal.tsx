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
  /**
   * Initial values for prefilling the form (for clone functionality)
   */
  initialValues?: Partial<CreateIssueInput>;
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
  initialValues,
}: CreateIssueModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // T408: Add user fetching in CreateIssueModal component
  const [users, setUsers] = React.useState<Array<{
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    role?: string;
  }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);

  // Fetch users when modal opens
  React.useEffect(() => {
    if (open) {
      setIsLoadingUsers(true);
      fetch('/api/users')
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch users');
          }
          return res.json();
        })
        .then((data) => {
          setUsers(data.users || []);
        })
        .catch((error) => {
          console.error('Failed to fetch users:', error);
          // Don't show error toast - assignment field just won't appear
        })
        .finally(() => {
          setIsLoadingUsers(false);
        });
    }
  }, [open]);

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
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        users={users}
      />
    </Modal>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, useToast } from '@stride/ui';
import { getCsrfHeaders } from '@/lib/utils/csrf';

export interface ManualLinkModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  issueKey: string;
  onSuccess?: () => void;
}

interface RepositoryConnection {
  id: string;
  repositoryUrl: string;
  serviceType: 'GitHub' | 'GitLab' | 'Bitbucket';
}

/**
 * ManualLinkModal component
 * 
 * Modal dialog for manually linking an issue to an external repository issue.
 * Allows users to select a repository connection and enter an issue number.
 */
export function ManualLinkModal({
  open,
  onClose,
  projectId,
  issueKey,
  onSuccess,
}: ManualLinkModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [connections, setConnections] = useState<RepositoryConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [issueNumber, setIssueNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch repository connections when modal opens
  useEffect(() => {
    if (open) {
      fetchConnections();
    } else {
      // Reset form when closing
      setSelectedConnection('');
      setIssueNumber('');
      setError(null);
    }
  }, [open, projectId]);

  const fetchConnections = async () => {
    setIsLoadingConnections(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/repositories`);
      
      if (response.status === 404) {
        // No connections found - that's okay, just empty list
        setConnections([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch repository connections');
      }

      const data = await response.json();
      // Handle both single connection and array response
      const conns = Array.isArray(data) ? data : [data];
      setConnections(conns);
      
      // Auto-select if only one connection
      if (conns.length === 1) {
        setSelectedConnection(conns[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      toast.error('Failed to load repository connections', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedConnection) {
      setError('Please select a repository');
      return;
    }

    const issueNum = parseInt(issueNumber, 10);
    if (!issueNumber || isNaN(issueNum) || issueNum <= 0) {
      setError('Please enter a valid issue number');
      return;
    }

    const connection = connections.find((c) => c.id === selectedConnection);
    if (!connection) {
      setError('Selected repository not found');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/issues/${issueKey}/link-external`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders(),
          },
          body: JSON.stringify({
            providerType: connection.serviceType,
            repositoryUrl: connection.repositoryUrl,
            issueNumber: issueNum,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link issue');
      }

      toast.success('Issue linked successfully');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Link error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to link issue. Please try again.';
      setError(errorMessage);
      toast.error('Failed to link issue', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Link to External Repository Issue"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-md">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {isLoadingConnections ? (
          <div className="py-4 text-center text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
            Loading repository connections...
          </div>
        ) : connections.length === 0 ? (
          <div className="p-4 bg-background-secondary dark:bg-background-dark-secondary rounded-md">
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              No repository connections found. Please connect a repository in project settings first.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label
                htmlFor="repository"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-2"
              >
                Repository
              </label>
              <select
                id="repository"
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a repository...</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.serviceType}: {conn.repositoryUrl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="issueNumber"
                className="block text-sm font-medium text-foreground dark:text-foreground-dark mb-2"
              >
                Issue Number
              </label>
              <Input
                id="issueNumber"
                type="number"
                min="1"
                value={issueNumber}
                onChange={(e) => setIssueNumber(e.target.value)}
                disabled={isLoading}
                required
                placeholder="Enter issue number (e.g., 123)"
                aria-label="Issue number"
              />
              <p className="mt-1 text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                Enter the issue number from the repository (e.g., #123 for GitHub/GitLab)
              </p>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {connections.length > 0 && (
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !selectedConnection || !issueNumber}
            >
              {isLoading ? 'Linking...' : 'Link Issue'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

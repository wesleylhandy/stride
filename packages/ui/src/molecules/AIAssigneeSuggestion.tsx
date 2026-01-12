'use client';

import * as React from 'react';
import { Button } from '../atoms/Button';
import { cn } from '../utils/cn';
import { Modal } from './Modal';

export interface User {
  id: string;
  name: string | null;
  username: string;
  avatarUrl?: string | null;
}

export interface AIAssigneeSuggestionProps {
  /**
   * Natural language description of suggested assignee from AI
   */
  suggestedAssignee: string;
  /**
   * List of project members available for assignment
   */
  projectMembers?: User[];
  /**
   * Callback when assignee is selected
   */
  onSelectAssignee?: (userId: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * AIAssigneeSuggestion component
 * Displays natural language assignee description with "Select Assignee" button
 * that opens project members selector
 */
export function AIAssigneeSuggestion({
  suggestedAssignee,
  projectMembers = [],
  onSelectAssignee,
  className,
}: AIAssigneeSuggestionProps) {
  const [isSelectorOpen, setIsSelectorOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  const handleSelectAssignee = (userId: string) => {
    setSelectedUserId(userId);
    if (onSelectAssignee) {
      onSelectAssignee(userId);
    }
    setIsSelectorOpen(false);
  };

  const selectedMember = projectMembers.find((m) => m.id === selectedUserId);

  return (
    <>
      <div
        className={cn(
          'p-4 bg-background-secondary dark:bg-background-dark-secondary',
          'rounded-lg border border-border dark:border-border-dark',
          className
        )}
      >
        <h3 className="text-sm font-semibold mb-2 text-foreground dark:text-foreground-dark">
          Suggested Assignee
        </h3>
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mb-3 leading-relaxed">
          {suggestedAssignee}
        </p>
        {selectedMember ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {selectedMember.avatarUrl && (
                <img
                  src={selectedMember.avatarUrl}
                  alt={selectedMember.name || selectedMember.username}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-foreground dark:text-foreground-dark">
                {selectedMember.name || selectedMember.username}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSelectorOpen(true)}
            >
              Change
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsSelectorOpen(true)}
            disabled={projectMembers.length === 0}
          >
            Select Assignee
          </Button>
        )}
      </div>

      <Modal
        open={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        title="Select Assignee"
        size="md"
      >
        <div className="space-y-2">
          {projectMembers.length === 0 ? (
            <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              No project members available.
            </p>
          ) : (
            projectMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelectAssignee(member.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg',
                  'text-left transition-colors',
                  'hover:bg-background-secondary dark:hover:bg-background-dark-secondary',
                  'border border-transparent hover:border-border dark:hover:border-border-dark',
                  selectedUserId === member.id && 'bg-accent/10 border-accent'
                )}
              >
                {member.avatarUrl && (
                  <img
                    src={member.avatarUrl}
                    alt={member.name || member.username}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground dark:text-foreground-dark">
                    {member.name || member.username}
                  </div>
                  {member.name && (
                    <div className="text-xs text-foreground-secondary dark:text-foreground-dark-secondary">
                      {member.username}
                    </div>
                  )}
                </div>
                {selectedUserId === member.id && (
                  <svg
                    className="w-5 h-5 text-accent flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}

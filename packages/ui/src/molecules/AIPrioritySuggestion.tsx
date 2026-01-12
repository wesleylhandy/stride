'use client';

import * as React from 'react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { cn } from '../utils/cn';

export interface AIPrioritySuggestionProps {
  /**
   * Suggested priority from AI (matches project config or standard format)
   */
  priority: string;
  /**
   * Available priority values from project config
   */
  availablePriorities?: string[];
  /**
   * Callback when priority is accepted
   */
  onAccept?: (priority: string) => void;
  /**
   * Callback when priority is modified
   */
  onModify?: (priority: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get priority variant for badge
 */
function getPriorityVariant(priority: string): 'success' | 'warning' | 'error' | 'info' {
  const normalized = priority.toLowerCase();
  if (normalized.includes('critical') || normalized.includes('urgent') || normalized.includes('high')) {
    return 'error';
  }
  if (normalized.includes('medium') || normalized.includes('normal')) {
    return 'warning';
  }
  if (normalized.includes('low') || normalized.includes('minor')) {
    return 'success';
  }
  return 'info';
}

/**
 * AIPrioritySuggestion component
 * Displays priority suggestion with accept/modify buttons
 */
export function AIPrioritySuggestion({
  priority,
  availablePriorities,
  onAccept,
  onModify,
  className,
}: AIPrioritySuggestionProps) {
  const [selectedPriority, setSelectedPriority] = React.useState(priority);
  const [isModifying, setIsModifying] = React.useState(false);

  const handleModify = () => {
    setIsModifying(true);
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(selectedPriority);
    }
  };

  const handlePriorityChange = (newPriority: string) => {
    setSelectedPriority(newPriority);
    if (onModify) {
      onModify(newPriority);
    }
    setIsModifying(false);
  };

  return (
    <div
      className={cn(
        'p-4 bg-background-secondary dark:bg-background-dark-secondary',
        'rounded-lg border border-border dark:border-border-dark',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-2 text-foreground dark:text-foreground-dark">
            Suggested Priority
          </h3>
          {isModifying && availablePriorities && availablePriorities.length > 0 ? (
            <div className="space-y-2">
              <select
                value={selectedPriority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className={cn(
                  'flex h-10 rounded-md border bg-background dark:bg-background-dark px-3 py-2 text-sm',
                  'text-foreground dark:text-foreground-dark',
                  'transition-colors focus-ring',
                  'border-border dark:border-border-dark hover:border-border-hover dark:hover:border-border-dark-hover focus-visible:border-border-focus'
                )}
              >
                {availablePriorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleAccept}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsModifying(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Badge variant={getPriorityVariant(priority)}>
                {priority}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleAccept}
                >
                  Accept
                </Button>
                {availablePriorities && availablePriorities.length > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleModify}
                  >
                    Modify
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { cn } from '@stride/ui';

export interface ProjectHeaderProps {
  projectKey: string;
  projectName: string;
  projectId: string;
  className?: string;
}

/**
 * ProjectHeader component
 * 
 * Displays project name, key, and settings link.
 * Used in ProjectLayout for project-specific pages.
 */
export function ProjectHeader({
  projectKey,
  projectName,
  projectId,
  className,
}: ProjectHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-4 px-4 sm:px-6 lg:px-8',
        'border-b border-border dark:border-border-dark',
        'bg-surface dark:bg-surface-dark',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          {projectName}
        </h1>
        <p className="text-sm text-foreground-secondary dark:text-foreground-dark-secondary mt-1">
          {projectKey}
        </p>
      </div>
    </div>
  );
}

